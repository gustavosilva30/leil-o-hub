import axios from "axios";
import { mapearTipoSucata } from "../utils/validadorSucata";

const WEBHOOK_SUPERBID = "https://n8n.douradosap.com.br/webhook/receber-superbid";
const BASE_URL =
    "https://exchange.superbid.net/categorias/carros-motos/carros/sucata-de-carros?searchType=opened&pageNumber=";
const PAGE_SIZE = 100;
const PREFIXO = "https://exchange.superbid.net";
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Referer": "https://www.google.com/",
};

// Interface 100% mapeada com as possíveis datas do Superbid
interface SuperbidOffer {
    id: number;
    lotNumber?: string | number;
    dateEnd?: string | number;
    endDate?: string | number;
    closingDate?: string | number;
    startDate?: string | number;
    openingDate?: string | number;
    offerDetail?: { 
        id: number;
        dateEnd?: string | number;
        endDate?: string | number;
        closingDate?: string | number;
        dateStart?: string | number;
        startDate?: string | number;
        openingDate?: string | number;
    };
    product?: {
        shortDesc?: string;
        galleryJson?: Array<{ link?: string; thumbnailUrl?: string }>;
        urlSlug?: string;
    };
}

function slugify(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function extrairDoNextData(html: string): SuperbidOffer[] {
    const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return [];
    try {
        const json = JSON.parse(match[1]);
        const offersList = json?.props?.pageProps?.offersList;
        const offers = offersList?.offers;
        return Array.isArray(offers) ? offers : [];
    } catch {
        return [];
    }
}

/**
 * Texto da página individual da oferta (JSON __NEXT_DATA__).
 * O listing só traz `shortDesc` — "Status: SUCATA INSERVÍVEL" e a descrição vêm na página do lote.
 */
function extrairTextoPaginaOfertaSuperbid(html: string): string {
    const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return "";
    try {
        const json = JSON.parse(match[1]);
        const pp = json?.props?.pageProps;
        if (!pp) return "";
        // Limita tamanho para o matcher (suficiente para status + descrição + atributos)
        return JSON.stringify(pp).slice(0, 200_000);
    } catch {
        return "";
    }
}

// Função para garantir que a data vai para o banco no formato ISO
const formatarData = (d: string | number | null | undefined): string | null => {
    if (!d) return null;
    try {
        return new Date(d).toISOString();
    } catch {
        return null;
    }
};

export const extrairDadosSuperbid = async () => {
    console.log("🔱 [Superbid] Iniciando extração de Sucata de Carros para Produção...");
    const veiculosEncontrados: any[] = [];
    const idsVistos = new Set<number>();

    try {
        let pageNumber = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `${BASE_URL}${pageNumber}&pageSize=${PAGE_SIZE}&orderBy=score:desc`;
            const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
            console.log(`📡 [Superbid] Lendo Página ${pageNumber} - HTTP ${status}`);

            const offers = extrairDoNextData(data as string);

            if (offers.length === 0) {
                hasMore = false;
                break;
            }

            for (const offer of offers) {
                const tituloOriginal = (offer.product?.shortDesc || "").trim();
                if (!tituloOriginal) continue;

                // Padronização do título para o CRM
                const titulo = tituloOriginal.toUpperCase().includes("SUCATA") 
                    ? tituloOriginal 
                    : `SUCATA - ${tituloOriginal}`;

                const offerId = offer.offerDetail?.id ?? offer.id;
                if (idsVistos.has(offerId)) continue;
                idsVistos.add(offerId);

                const slug = (offer.product as { urlSlug?: string })?.urlSlug ?? slugify(tituloOriginal);
                const linkLeilao = `${PREFIXO}/oferta/${slug}-${offerId}`;
                
                const gallery = offer.product?.galleryJson;
                const imageUrl = gallery?.[0]?.link || gallery?.[0]?.thumbnailUrl || "";
                
                // Pula apenas se não tiver imagem (essencial para o CRM)
                if (!imageUrl) continue;

                const numeroLote = offer.lotNumber ? `${offer.lotNumber}-${offerId}` : offerId.toString();

                // --- CAPTURA INTELIGENTE DE DATAS (ATUALIZADA) ---
                const dataFim = offer.closingDate || offer.offerDetail?.closingDate || offer.endDate || offer.offerDetail?.endDate || offer.offerDetail?.dateEnd || offer.dateEnd || null;
                const dataInicio = offer.openingDate || offer.offerDetail?.openingDate || offer.startDate || offer.offerDetail?.startDate || offer.offerDetail?.dateStart || null;

                // Classificação aproveitável x inservível: o título do listing costuma não ter "inservível".
                // 1) Usa o JSON do card + título; 2) Se ainda parecer aproveitável, abre a página do lote (Status / Descrição).
                let textoParaTipo = `${titulo} ${JSON.stringify(offer)}`;
                if (mapearTipoSucata(textoParaTipo) === "aproveitavel") {
                    try {
                        const { data: htmlOferta } = await axios.get<string>(linkLeilao, {
                            headers: HEADERS,
                            timeout: 18000,
                        });
                        textoParaTipo += ` ${extrairTextoPaginaOfertaSuperbid(htmlOferta)}`;
                    } catch {
                        /* mantém só listing */
                    }
                    await new Promise((r) => setTimeout(r, 350));
                }

                veiculosEncontrados.push({
                    numero_lote: String(numeroLote),
                    veiculo_origem: titulo.slice(0, 120),
                    link_leilao: linkLeilao,
                    tipo_sucata: mapearTipoSucata(textoParaTipo),
                    image_url: imageUrl,
                    auction_start_at: formatarData(dataInicio),
                    auction_end_at: formatarData(dataFim),
                    fonte: "superbid" 
                });
            }

            if (offers.length < PAGE_SIZE) hasMore = false;
            else pageNumber++;
            
            // Pausa super rápida entre páginas só para não estressar o servidor deles
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`🏆 [Superbid] Extração concluída. ${veiculosEncontrados.length} lotes preparados.`);

        if (veiculosEncontrados.length > 0) {
            const payload = { lotes: veiculosEncontrados };
            const { status } = await axios.post(WEBHOOK_SUPERBID, payload, { timeout: 30000 });
            console.log(`🚀 [Superbid] Sucesso! ${payload.lotes.length} lotes enviados ao n8n (HTTP ${status}).`);
        } else {
            console.log("⚠️ [Superbid] Nenhum lote novo encontrado hoje.");
        }

    } catch (error: any) {
        console.error(`❌ [Superbid] Erro fatal na extração:`, error.message);
        await axios.post(WEBHOOK_SUPERBID, { lotes: [] }).catch(() => {});
    }
};