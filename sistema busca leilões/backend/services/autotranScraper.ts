import axios from "axios";
import * as cheerio from "cheerio";
import { isSucataVeicularValida, mapearTipoSucata } from "../utils/validadorSucata";

const BASE = "https://autotranleiloes.org";

const WEBHOOK_AUTOTRAN =
  process.env.WEBHOOK_AUTOTRAN_URL ||
  "https://n8n.douradosap.com.br/webhook/receber-autotran";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Normaliza para comparação (minúsculas, sem acentos) */
function normalizeKey(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Inclui apenas lotes classificados no site como **irrecuperáveis** ou **sucatas**,
 * excluindo **Sinistrados** e demais categorias (Automóveis, Motos, etc.).
 * No HTML, o tipo aparece em `<h2 class="ai-title">...</h2>`.
 */
export function categoriaEhIrrecuperavelOuSucata(aiTitle: string): boolean {
  const t = normalizeKey(aiTitle);
  if (!t) return false;

  const hasIrrecuper = t.includes("irrecuper");
  const hasSucata = t.includes("sucata");

  // Sinistrados puro (sem menção a sucata/irrecuperável no título)
  if (t.includes("sinistr") && !hasIrrecuper && !hasSucata) return false;

  return hasIrrecuper || hasSucata;
}

function toAbs(href: string): string {
  if (!href || href.startsWith("javascript:") || href === "#") return "";
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return "https:" + href;
  if (href.startsWith("/")) return BASE + href;
  return BASE + "/" + href;
}

/** Parse "06/03/2026 às 09:00h" → ISO local */
function parseDataAutotranBr(val: string): string | null {
  const m = val.match(
    /(\d{2})\/(\d{2})\/(\d{4})\s+às\s+(\d{2}):(\d{2})h/i
  );
  if (!m) return null;
  const [, dia, mes, ano, hh, mm] = m;
  return `${ano}-${mes}-${dia}T${hh}:${mm}:00`;
}

function textoPlano(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

export interface AutotranLot {
  numero_lote: string;
  veiculo_origem: string;
  link_leilao: string;
  tipo_sucata: string;
  image_url: string;
  auction_start_at: string | null;
  auction_end_at: string | null;
  fonte: string;
  /** Categoria exibida no site (ex.: Sinistrados, Irrecuperáveis) */
  categoria_autotran?: string;
}

/**
 * Extrai URL da miniatura na listagem (proxy PHP `/PHPs/...`).
 */
function extrairImagemListagem($: cheerio.CheerioAPI, linkEl: any): string {
  const $link = $(linkEl);
  let img = $link.find("img").first().attr("src") || "";
  if (!img) {
    img = $link.closest("div, li, article, tr, td").find("img").first().attr("src") || "";
  }
  if (!img) {
    img = $link.parent().find("img").first().attr("src") || "";
  }
  return img ? toAbs(img) : "";
}

/**
 * Coleta URLs únicas de lotes e melhor imagem disponível na listagem.
 */
async function coletarLotesDaListagem(): Promise<Map<string, string>> {
  const urlToImg = new Map<string, string>();
  let pag = 1;
  let semNovos = 0;

  while (pag <= 40 && semNovos < 2) {
    const listUrl = `${BASE}/lotes/?pag=${pag}`;
    const { data: html } = await axios.get<string>(listUrl, {
      headers: HEADERS,
      timeout: 45_000,
      validateStatus: (s) => s === 200,
    });
    const $ = cheerio.load(html);
    const antes = urlToImg.size;

    $('a[href^="/lote/"]').each((_, el) => {
      const href = $(el).attr("href")?.trim() || "";
      if (!href || href.includes("#")) return;
      const url = toAbs(href);
      if (!urlToImg.has(url)) {
        const img = extrairImagemListagem($, el);
        urlToImg.set(url, img);
      } else if (!urlToImg.get(url)) {
        const img = extrairImagemListagem($, el);
        if (img) urlToImg.set(url, img);
      }
    });

    if (urlToImg.size === antes) semNovos++;
    else semNovos = 0;

    pag++;
    await sleep(450);
  }

  return urlToImg;
}

function tituloDoSlug(url: string): string {
  const parts = url.split("/").filter(Boolean);
  const slug = parts.length >= 2 ? parts[parts.length - 2] : "";
  return slug.replace(/-/g, " ").toUpperCase();
}

function extrairNumeroLote(url: string): string {
  const parts = url.split("/").filter(Boolean);
  const id = parts[parts.length - 1] || "";
  const slug = parts.length >= 2 ? parts[parts.length - 2] : "";
  const shortSlug = slug.slice(0, 24).replace(/[^a-zA-Z0-9]/g, "");
  return `${id}-${shortSlug}`.slice(0, 50);
}

export const extrairDadosAutotran = async (): Promise<void> => {
  console.log("🚗 [AutoTran] Iniciando scraping (sucatas / irrecuperáveis apenas)…");

  try {
    const urlToImg = await coletarLotesDaListagem();
    console.log(`📡 [AutoTran] ${urlToImg.size} URL(s) de lote na listagem.`);

    const veiculosEncontrados: AutotranLot[] = [];
    let analisados = 0;
    let ignoradosCategoria = 0;

    for (const [linkCompleto, imageUrlLista] of urlToImg) {
      analisados++;
      await sleep(500);

      let html = "";
      try {
        const { data } = await axios.get<string>(linkCompleto, {
          headers: HEADERS,
          timeout: 45_000,
        });
        html = data;
      } catch (e) {
        console.error(`❌ [AutoTran] Falha ao abrir lote: ${linkCompleto}`);
        continue;
      }

      const $ = cheerio.load(html);
      const aiTitle = $(".ai-title").first().text().trim() || "";

      if (!categoriaEhIrrecuperavelOuSucata(aiTitle)) {
        ignoradosCategoria++;
        continue;
      }

      const textoPagina = textoPlano(html);
      const tituloBase = tituloDoSlug(linkCompleto);
      const tituloLimpo = `SUCATA - ${tituloBase}`.slice(0, 120);

      const textoParaValidacao = `${tituloBase} ${aiTitle} ${textoPagina.slice(0, 1200)}`;
      if (!isSucataVeicularValida(textoParaValidacao)) {
        continue;
      }

      const labels: Record<string, string> = {};
      $(".ai-item").each((_, el) => {
        const label = $(el).find(".ai-label").first().text().trim();
        const val = $(el).find(".ai-val").first().text().trim();
        if (label) labels[label] = val;
      });

      let dataInicio: string | null = null;
      let dataFim: string | null = null;
      for (const [k, v] of Object.entries(labels)) {
        const nk = normalizeKey(k);
        if (nk.includes("abertura") && nk.includes("lance")) {
          dataInicio = parseDataAutotranBr(v) || dataInicio;
        }
        if (nk.includes("fechamento") || nk.includes("encerramento")) {
          dataFim = parseDataAutotranBr(v) || dataFim;
        }
      }

      let imageUrl = imageUrlLista;
      if (!imageUrl) {
        const fromOg = $('meta[property="og:image"]').attr("content");
        if (fromOg) imageUrl = toAbs(fromOg);
      }
      if (!imageUrl) {
        $("img").each((_, el) => {
          const src = $(el).attr("src") || "";
          if (src.includes("/PHPs/") || src.includes("/web/fotos/")) {
            imageUrl = toAbs(src);
            return false;
          }
          return undefined;
        });
      }

      const numeroLote = extrairNumeroLote(linkCompleto);

      veiculosEncontrados.push({
        numero_lote: numeroLote,
        veiculo_origem: tituloLimpo,
        link_leilao: linkCompleto,
        tipo_sucata: mapearTipoSucata(textoParaValidacao),
        image_url: imageUrl || "",
        auction_start_at: dataInicio,
        auction_end_at: dataFim,
        fonte: "AutoTran Leilões",
        categoria_autotran: aiTitle,
      });
    }

    console.log(
      `📊 [AutoTran] Analisados: ${analisados} | Ignorados (não irrec/sucata): ${ignoradosCategoria} | Válidos: ${veiculosEncontrados.length}`
    );

    if (veiculosEncontrados.length > 0) {
      await axios.post(
        WEBHOOK_AUTOTRAN,
        { lotes: veiculosEncontrados },
        { timeout: 60_000 }
      );
      console.log(`🚀 [AutoTran] ${veiculosEncontrados.length} lote(s) enviado(s) ao CRM.`);
    } else {
      console.log(
        "⚠️ [AutoTran] Nenhum lote irrecuperável/sucata no momento (ou filtros excluíram todos)."
      );
    }
  } catch (error) {
    console.error("🚨 [AutoTran] Erro fatal:", error);
  }
};
