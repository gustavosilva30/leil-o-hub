import axios from 'axios';
import * as cheerio from 'cheerio';
import { isSucataVeicularValida, mapearTipoSucata } from '@/utils/validadorSucata';
import config from '@/config/index';

const URL_BUSCA   = "https://www.leiloesonlinems.com.br/busca.aspx?p=sucata";
const PREFIXO     = "https://www.leiloesonlinems.com.br";
const HEADERS     = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Função para converter "25/03/2026 14:00" em ISO 8601
function parseDataBr(texto: string): string | null {
    try {
        const match = texto.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/);
        if (!match) return null;
        const [_, dia, mes, ano, hora] = match;
        // Criamos no formato YYYY-MM-DDTHH:mm:00
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

function extrairPrimeiraImagem(html: string): string {
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && (ogImage.includes(".jpg") || ogImage.includes(".jpeg") || ogImage.includes(".png"))) {
        return toAbs(ogImage);
    }
    let imageSrc = "";
    $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        const srcLower = src.toLowerCase();
        if (
            (srcLower.includes(".jpg") || srcLower.includes(".jpeg") || srcLower.includes(".png")) &&
            !srcLower.includes("logo") &&
            !srcLower.includes("leilovia")
        ) {
            imageSrc = src;
            return false;
        }
    });
    return imageSrc ? toAbs(imageSrc) : "";
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

export const extrairDadosLeiloesMS = async (): Promise<AuctionLot[]> => {
    console.log("🔱 [LeiloesMS] Iniciando Arrastão Dourados AP...");
    const veiculosEncontrados: AuctionLot[] = [];
    
    try {
        const { data: buscaHtml } = await axios.get(URL_BUSCA, { headers: HEADERS });
        const $ = cheerio.load(buscaHtml as string);

        const linksDeLotes = new Set<string>();
        $("a[href]").each((_, el) => {
            const href = $(el).attr("href")?.trim() || "";
            if (href.toLowerCase().includes("/lote/")) {
                const hrefAbs = toAbs(href);
                if (hrefAbs) linksDeLotes.add(hrefAbs);
            }
        });

        console.log(`📡 [LeiloesMS] ${linksDeLotes.size} links de lotes identificados.`);

        for (const linkCompleto of linksDeLotes) {
            const partes = linkCompleto.split("/").filter(Boolean);
            if (partes.length < 2) continue;

            const tituloOriginal = (partes[partes.length - 2] || "").replace(/-/g, " ").toUpperCase();
            const tituloLimpo = tituloOriginal.includes("SUCATA") ? tituloOriginal : `SUCATA - ${tituloOriginal}`;

            const strLote = partes.find(p => p.toLowerCase().startsWith("lote-")) || partes[partes.length - 3] || "";
            const numeroLoteBruto = strLote.includes("lote-") ? strLote.replace(/lote-/i, "") : (strLote.match(/\d+/)?.[0] || "000");
            const idUnicoURL = partes[partes.length - 1]; 
            const numeroLoteBlindado = `${numeroLoteBruto}-${idUnicoURL}`.slice(0, 50);

            let imageUrl = "";
            let dataInicio: string | null = null;
            let dataFim: string | null = null;
            let textoPagina = "";

            try {
                await sleep(600);
                const { data } = await axios.get(linkCompleto, { headers: HEADERS });
                const $lote = cheerio.load(data as string);
                
                imageUrl = extrairPrimeiraImagem(data as string);
                textoPagina = textoPlano(data as string);

                const sectionDatas = $lote(".infos-leilao, .datas-leilao, body").text().toUpperCase();
                
                const regexAbertura = /ABERTURA[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/;
                const regexFim = /ENCERRAMENTO[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/;

                const matchAbertura = sectionDatas.match(regexAbertura);
                const matchFim = sectionDatas.match(regexFim);

                dataInicio = matchAbertura ? parseDataBr(matchAbertura[1]) : null;
                dataFim = matchFim ? parseDataBr(matchFim[1]) : null;

            } catch (err) {
                console.error(`❌ [LeiloesMS] Erro no lote ${numeroLoteBruto}: ${linkCompleto}`);
            }

            const textoParaValidacao = `${tituloOriginal} ${textoPagina.slice(0, 800)}`;
            if (!isSucataVeicularValida(textoParaValidacao)) continue;

            veiculosEncontrados.push({
                source: "leiloes-ms",
                source_lot_id: numeroLoteBlindado,
                numero_lote: numeroLoteBlindado,
                veiculo_origem: tituloLimpo.slice(0, 120),
                link_leilao: linkCompleto,
                tipo_sucata: mapearTipoSucata(textoParaValidacao), 
                image_url: imageUrl,
                auction_start_at: dataInicio,
                auction_end_at: dataFim,
                fonte: "Leilões MS",
                raw: {
                    title: tituloOriginal,
                    link: linkCompleto,
                },
            });
        }

        if (veiculosEncontrados.length > 0) {
            try {
                await axios.post(config.WEBHOOK_N8N_LEILOES_MS, { lotes: veiculosEncontrados });
                console.log(`🚀 [LeiloesMS] ${veiculosEncontrados.length} lotes enviados para o N8N!`);
            } catch (err) {
                console.error("[LeiloesMS] Erro ao enviar para o N8N:", err);
            }
        } else {
            console.log("⚠️ [LeiloesMS] Nenhum lote novo processado.");
        }
    } catch (error) {
        console.error("🚨 [LeiloesMS] Erro fatal no Scraper:", error);
    }
    
    return veiculosEncontrados;
};
