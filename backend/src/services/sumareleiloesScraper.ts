import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import { isSucataVeicularValida, mapearTipoSucata } from '@/utils/validadorSucata';
import config from '@/config/index';

const PREFIXO     = "https://www.sumareleiloes.com.br";
const HEADERS     = { 
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
};
const AGENT = new https.Agent({ rejectUnauthorized: false });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const mesesMap: { [key: string]: string } = {
    'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04', 'MAI': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12'
};

function parseSumareData(texto: string): string | null {
    try {
        const match = texto.match(/(\d{2})\s+([A-Z]{3})\s+(\d{4}),\s+(\d{2}:\d{2})/);
        if (!match) return null;
        const [_, dia, mesNome, ano, hora] = match;
        const mes = mesesMap[mesNome.toUpperCase()] || '01';
        return `${ano}-${mes}-${dia}T${hora}:00`;
    } catch (e) {
        return null;
    }
}

function toAbs(href: string): string {
    if (!href || href.startsWith("javascript:") || href === "#") return "";
    if (href.startsWith("http://") || href.startsWith("https://")) return href;
    if (href.startsWith("//")) return "https:" + href;
    if (href.startsWith("/")) return PREFIXO + href;
    return PREFIXO + "/" + href;
}

function extrairTodasImagens(html: string): string[] {
    const $ = cheerio.load(html);
    const images: string[] = [];
    
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && (ogImage.includes(".jpg") || ogImage.includes(".jpeg") || ogImage.includes(".png"))) {
        const absOg = toAbs(ogImage);
        if (absOg) images.push(absOg);
    }
    
    $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        const srcLower = src.toLowerCase();
        if (
            (srcLower.includes(".jpg") || srcLower.includes(".jpeg") || srcLower.includes(".png")) &&
            !srcLower.includes("logo") &&
            !srcLower.includes("banner")
        ) {
            const absSrc = toAbs(src);
            if (absSrc && !images.includes(absSrc)) {
                images.push(absSrc);
            }
        }
    });
    return images;
}

function textoPlano(html: string): string {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

export interface AuctionLot {
    source?: string;
    source_lot_id?: string;
    numero_lote: string;
    veiculo_origem: string;
    link_leilao: string;
    tipo_sucata: string;
    image_url: string;
    auction_start_at: string | null;
    auction_end_at: string | null;
    fonte: string;
    marca?: string | null;
    modelo?: string | null;
    ano?: string | null;
    placa?: string | null;
    raw?: any;
}

export const extrairDadosSumareLeiloes = async (): Promise<AuctionLot[]> => {
    console.log("🔱 [SumareLeiloes] Iniciando busca de lotes...");
    const veiculosEncontrados: AuctionLot[] = [];
    const linksDeLotes = new Map<string, { titulo: string; numLote: string; imgFallback: string }>();

    try {
        const urlBusca = `${PREFIXO}/todos-lotes?searchLotsString=sucata`;
        const { data: buscaHtml } = await axios.get(urlBusca, { headers: HEADERS, httpsAgent: AGENT, timeout: 15000 });
        const $ = cheerio.load(buscaHtml as string);

        $('a[href*="/lotes/"]').each((_, el) => {
            const href = $(el).attr('href')?.trim() || "";
            if (!href) return;

            const linkAbs = toAbs(href);
            // No Sumare, o href pode ser a própria página do lote ou o link principal
            if (linkAbs.split('/').filter(Boolean).length < 4) return; // ignora '/todos-lotes' ou home

            const titulo = $(el).find('.card-title').first().text().trim();
            const numLoteText = $(el).find('.lot-id span.font-bold').first().text().trim() || "LOTE 000";
            const numLote = numLoteText.replace(/LOTE/i, "").trim();

            const imgFallback = $(el).find('img.card-img').first().attr('src') || "";

            if (linkAbs) {
                linksDeLotes.set(linkAbs, { titulo, numLote, imgFallback: toAbs(imgFallback) });
            }
        });

        console.log(`📡 [SumareLeiloes] ${linksDeLotes.size} links de lotes identificados.`);

        for (const [linkCompleto, info] of linksDeLotes.entries()) {
            const partes = linkCompleto.split("/").filter(Boolean);
            const idUnicoURL = partes[partes.length - 1] || "000";
            const numeroLoteBlindado = `${info.numLote}-${idUnicoURL}`.slice(0, 50);

            let imagens: string[] = [];
            let dataInicio: string | null = null;
            let dataFim: string | null = null;
            let textoPagina = "";

            try {
                await sleep(600);
                const { data } = await axios.get(linkCompleto, { headers: HEADERS, httpsAgent: AGENT, timeout: 15000 });
                const $lote = cheerio.load(data as string);
                
                imagens = extrairTodasImagens(data as string);
                if (imagens.length === 0 && info.imgFallback) {
                    imagens.push(info.imgFallback);
                }
                textoPagina = textoPlano(data as string);

                const sectionDatas = $lote("body").text().toUpperCase();
                
                const regexAbertura = /ABERTURA[:\s\-\,]+[A-Z\-ÁÂÃÉÈÍÕÓÔÚÇ\s]+\,\s*(\d{2}\s+[A-Z]{3}\s+\d{4}\,\s+\d{2}:\d{2})/i;
                const regexFechamento = /FECHAMENTO[:\s\-\,]+[A-Z\-ÁÂÃÉÈÍÕÓÔÚÇ\s]+\,\s*(\d{2}\s+[A-Z]{3}\s+\d{4}\,\s+\d{2}:\d{2})/i;

                const matchAbertura = sectionDatas.match(regexAbertura);
                const matchFechamento = sectionDatas.match(regexFechamento);

                dataInicio = matchAbertura ? parseSumareData(matchAbertura[1]) : null;
                dataFim = matchFechamento ? parseSumareData(matchFechamento[1]) : null;

            } catch (err: any) {
                console.error(`❌ [SumareLeiloes] Erro no lote ${info.numLote}: ${linkCompleto} - ${err.message}`);
            }

            const tituloOriginal = info.titulo.toUpperCase();
            const tituloLimpo = tituloOriginal.includes("SUCATA") ? tituloOriginal : `SUCATA - ${tituloOriginal}`;

            const textoParaValidacao = `${tituloOriginal} ${textoPagina.slice(0, 800)}`;
            if (!isSucataVeicularValida(textoParaValidacao)) continue;

            veiculosEncontrados.push({
                source: "sumare-leiloes",
                source_lot_id: numeroLoteBlindado,
                numero_lote: numeroLoteBlindado,
                veiculo_origem: tituloLimpo.slice(0, 120),
                link_leilao: linkCompleto,
                tipo_sucata: mapearTipoSucata(textoParaValidacao), 
                image_url: imagens[0] || info.imgFallback || "",
                auction_start_at: dataInicio,
                auction_end_at: dataFim,
                fonte: "Sumaré Leilões",
                raw: {
                    title: info.titulo,
                    link: linkCompleto,
                    lot_pictures: imagens
                },
            });
        }

        if (veiculosEncontrados.length > 0) {
            console.log(`🚀 [SumareLeiloes] ${veiculosEncontrados.length} lotes novos encontrados.`);
        } else {
            console.log("⚠️ [SumareLeiloes] Nenhum lote novo processado.");
        }
    } catch (error) {
        console.error("🚨 [SumareLeiloes] Erro fatal no Scraper:", error);
    }
    
    return veiculosEncontrados;
};
