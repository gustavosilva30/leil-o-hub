import axios from 'axios';
import * as cheerio from 'cheerio';
import { isSucataVeicularValida, mapearTipoSucata } from '@/utils/validadorSucata';
import config from '@/config/index';

const PREFIXO     = "https://www.ricoleiloes.com.br";
const HEADERS     = { 
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Função para converter "25/03/2026 14:00" em ISO 8601
function parseDataBr(texto: string): string | null {
    try {
        const match = texto.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/);
        if (!match) return null;
        const [_, dia, mes, ano, hora] = match;
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

export const extrairDadosRicoLeiloes = async (): Promise<AuctionLot[]> => {
    console.log("🔱 [RicoLeiloes] Iniciando busca de lotes...");
    const veiculosEncontrados: AuctionLot[] = [];
    const linksDeLotes = new Map<string, { titulo: string; numLote: string; imgFallback: string }>();

    try {
        // Scannear as primeiras 5 páginas de resultados
        for (let page = 1; page <= 5; page++) {
            const urlBusca = `${PREFIXO}/lotes/search?search=sucata&page=${page}`;
            console.log(`📡 [RicoLeiloes] Buscando página ${page}...`);
            try {
                const { data: buscaHtml } = await axios.get(urlBusca, { headers: HEADERS, timeout: 15000 });
                const $ = cheerio.load(buscaHtml as string);

                const cards = $('.card');
                if (cards.length === 0) {
                    console.log(`📡 [RicoLeiloes] Sem lotes encontrados na página ${page}, interrompendo paginação.`);
                    break;
                }

                cards.each((_, el) => {
                    const anchorLink = $(el).find('a[href*="/item/"]').first();
                    const href = anchorLink.attr('href')?.trim() || "";
                    if (!href) return;

                    const linkAbs = toAbs(href);
                    const titulo = $(el).find('h5').first().text().trim();
                    const numLote = $(el).find('h4').first().text().trim() || "000";

                    // Extrair imagem do background-image / background inline style do link de imagem
                    const styleAttr = $(el).find('a.rounded[style]').attr('style') || "";
                    const imgMatch = styleAttr.match(/url\(['"]?([^'"]+)['"]?\)/);
                    const imgFallback = imgMatch ? toAbs(imgMatch[1]) : "";

                    if (linkAbs) {
                        linksDeLotes.set(linkAbs, { titulo, numLote, imgFallback });
                    }
                });

                await sleep(500);
            } catch (err: any) {
                console.error(`❌ [RicoLeiloes] Erro ao buscar página ${page}:`, err.message);
                break;
            }
        }

        console.log(`📡 [RicoLeiloes] ${linksDeLotes.size} links de lotes identificados.`);

        for (const [linkCompleto, info] of linksDeLotes.entries()) {
            const partes = linkCompleto.split("/").filter(Boolean);
            const idUnicoURL = partes.find(p => p.match(/^\d+$/)) || partes[partes.length - 1] || "000";
            const numeroLoteBlindado = `${info.numLote.replace(/\s+/g, "")}-${idUnicoURL}`.slice(0, 50);

            let imagens: string[] = [];
            let dataInicio: string | null = null;
            let dataFim: string | null = null;
            let textoPagina = "";

            try {
                await sleep(600);
                const { data } = await axios.get(linkCompleto, { headers: HEADERS, timeout: 15000 });
                const $lote = cheerio.load(data as string);
                
                imagens = extrairTodasImagens(data as string);
                if (imagens.length === 0 && info.imgFallback) {
                    imagens.push(info.imgFallback);
                }
                textoPagina = textoPlano(data as string);

                const sectionDatas = $lote("body").text().toUpperCase();
                
                const regexEncerramento = /ENCERRAMENTO:\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/;
                const matchFim = sectionDatas.match(regexEncerramento);

                dataFim = matchFim ? parseDataBr(matchFim[1]) : null;

            } catch (err: any) {
                console.error(`❌ [RicoLeiloes] Erro no lote ${info.numLote}: ${linkCompleto} - ${err.message}`);
            }

            const tituloOriginal = info.titulo.toUpperCase();
            const tituloLimpo = tituloOriginal.includes("SUCATA") ? tituloOriginal : `SUCATA - ${tituloOriginal}`;

            const textoParaValidacao = `${tituloOriginal} ${textoPagina.slice(0, 800)}`;
            if (!isSucataVeicularValida(textoParaValidacao)) continue;

            veiculosEncontrados.push({
                source: "rico-leiloes",
                source_lot_id: numeroLoteBlindado,
                numero_lote: numeroLoteBlindado,
                veiculo_origem: tituloLimpo.slice(0, 120),
                link_leilao: linkCompleto,
                tipo_sucata: mapearTipoSucata(textoParaValidacao), 
                image_url: imagens[0] || info.imgFallback || "",
                auction_start_at: dataInicio,
                auction_end_at: dataFim,
                fonte: "Rico Leilões",
                raw: {
                    title: info.titulo,
                    link: linkCompleto,
                    lot_pictures: imagens
                },
            });
        }

        if (veiculosEncontrados.length > 0) {
            console.log(`🚀 [RicoLeiloes] ${veiculosEncontrados.length} lotes novos encontrados.`);
        } else {
            console.log("⚠️ [RicoLeiloes] Nenhum lote novo processado.");
        }
    } catch (error) {
        console.error("🚨 [RicoLeiloes] Erro fatal no Scraper:", error);
    }
    
    return veiculosEncontrados;
};
