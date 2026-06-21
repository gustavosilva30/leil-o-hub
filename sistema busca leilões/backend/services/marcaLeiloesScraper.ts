import axios from "axios";
import * as cheerio from "cheerio";
import { isSucataVeicularValida, mapearTipoSucata } from "../utils/validadorSucata";

/** Produção: path alinhado ao Webhook n8n `receber-marca-leiloes`. Override: WEBHOOK_MARCA_LEILOES_URL. */
const WEBHOOK_MARCA_LEILOES =
  process.env.WEBHOOK_MARCA_LEILOES_URL ||
  "https://n8n.douradosap.com.br/webhook/receber-marca-leiloes";

const BASE = "https://www.marcaleiloes.com.br";
const URL_HOME = `${BASE}/`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Converte data do JSON do site (ex.: 2026-03-30 14:00:00.000000) para ISO local. */
function parseSqlDateTime(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2}):/);
  if (!m) return null;
  return `${m[1]}T${m[2]}:${m[3]}:00`;
}

function extrairJsonVarLote(html: string): Record<string, unknown> | null {
  const marker = "var lote = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  while (i < html.length && html[i] !== "{") i++;
  if (html[i] !== "{") return null;
  let depth = 0;
  const j0 = i;
  for (; i < html.length; i++) {
    const c = html[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(j0, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function datasDoLoteJson(lote: Record<string, unknown>): {
  auction_start_at: string | null;
  auction_end_at: string | null;
} {
  const leilao = (lote.leilao || {}) as Record<string, unknown>;
  const df = (lote.dataFechamento || {}) as { date?: string };
  const end =
    parseSqlDateTime(df?.date) ||
    parseSqlDateTime((leilao.dataFimPraca1 as { date?: string } | undefined)?.date) ||
    parseSqlDateTime((leilao.data1 as { date?: string } | undefined)?.date) ||
    null;
  const start =
    parseSqlDateTime((leilao.dataAbertura as { date?: string } | undefined)?.date) ||
    parseSqlDateTime((leilao.dataAbertura1 as { date?: string } | undefined)?.date) ||
    null;
  return { auction_start_at: start, auction_end_at: end };
}

/**
 * Só URLs com id numérico do leilão (ex.: /eventos/leilao/264/slug).
 * Links só com slug não resolvem listagem 404.
 */
function normalizeToListingUrl(href: string): string | null {
  if (!href || href.startsWith("javascript:")) return null;
  let pathname = href;
  try {
    if (href.startsWith("http")) pathname = new URL(href).pathname;
  } catch {
    return null;
  }
  pathname = pathname.split("?")[0];
  const parts = pathname.split("/").filter(Boolean);
  const li = parts.indexOf("leilao");
  if (li < 0 || !parts[li + 1]) return null;
  const idOrSlug = parts[li + 1];
  if (!/^\d+$/.test(idOrSlug)) return null;
  const leilaoId = idOrSlug;
  const rest = parts.slice(li + 2);
  const slugParts: string[] = [];
  for (const seg of rest) {
    if (seg === "lote") break;
    slugParts.push(seg);
  }
  if (slugParts.length === 0) return null;
  return `${BASE}/eventos/leilao/${leilaoId}/${slugParts.join("/")}`;
}

function extractLotePathId(lotUrl: string): string {
  const m = lotUrl.match(/\/lote\/(\d+)\/lote/);
  return m ? m[1] : "0";
}

function absolutize(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return "https:" + href;
  return BASE + (href.startsWith("/") ? href : `/${href}`);
}

interface ParsedLoteRow {
  lotUrl: string;
  cod: string;
  loteLabel: string;
  h3: string;
  desc: string;
  city: string;
  imageUrl: string;
}

/** Título do leilão na página de listagem (ex.: DETRAN - MS | SUCATAS APROVEITÁVEIS) — enriquece validação dos cartões só com marca/modelo. */
function extractTituloLeilaoListagem(html: string): string {
  const $ = cheerio.load(html);
  const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
  if (h1.length > 2) return h1;
  return $("title").first().text().replace(/\s+/g, " ").trim();
}

function parseListingPage(html: string): ParsedLoteRow[] {
  const $ = cheerio.load(html);
  const rows: ParsedLoteRow[] = [];
  $("article.lote-main").each((_, art) => {
    const $art = $(art);
    let href =
      $art.find("a.link-img[href*='/lote/']").first().attr("href") ||
      $art.find("a[href*='/lote/']").first().attr("href") ||
      "";
    href = href.trim();
    if (!href) return;
    const lotUrl = absolutize(href);
    const cod = $art.find("strong.strong-cod").first().text().replace(/\s+/g, " ").trim();
    const loteLabel = $art.find(".item-numeroLote span").first().text().replace(/\s+/g, " ").trim();
    const h3 = $art.find("h3").first().text().trim();
    const desc = $art.find("p").first().text().replace(/\s+/g, " ").trim();
    const city = $art.find(".r2 span").first().text().trim();
    const img = $art.find("img.img-evento").first().attr("src") || "";
    rows.push({ lotUrl, cod, loteLabel, h3, desc, city, imageUrl: img.trim() });
  });
  return rows;
}

async function fetchAllListingRows(
  listingUrl: string
): Promise<{ rows: ParsedLoteRow[]; tituloLeilao: string }> {
  const all: ParsedLoteRow[] = [];
  let tituloLeilao = "";
  const sep = listingUrl.includes("?") ? "&" : "?";
  for (let page = 1; page <= 400; page++) {
    const url = page === 1 ? listingUrl : `${listingUrl}${sep}page=${page}`;
    await sleep(400);
    const { data } = await axios.get<string>(url, { headers: HEADERS, timeout: 45_000 });
    const html = String(data);
    if (page === 1) tituloLeilao = extractTituloLeilaoListagem(html);
    const rows = parseListingPage(html);
    if (rows.length === 0) break;
    all.push(...rows);
  }
  return { rows: all, tituloLeilao };
}

const cacheDatasLeilao = new Map<string, { auction_start_at: string | null; auction_end_at: string | null }>();

async function obterDatasLeilao(sampleLotUrl: string, cacheKey: string): Promise<{
  auction_start_at: string | null;
  auction_end_at: string | null;
}> {
  if (cacheDatasLeilao.has(cacheKey)) return cacheDatasLeilao.get(cacheKey)!;
  await sleep(500);
  try {
    const { data } = await axios.get<string>(sampleLotUrl, { headers: HEADERS, timeout: 45_000 });
    const lote = extrairJsonVarLote(String(data));
    const d = lote ? datasDoLoteJson(lote) : { auction_start_at: null, auction_end_at: null };
    cacheDatasLeilao.set(cacheKey, d);
    return d;
  } catch {
    const empty = { auction_start_at: null, auction_end_at: null };
    cacheDatasLeilao.set(cacheKey, empty);
    return empty;
  }
}

/**
 * Coleta leilões de veículo/sucata em [Marca Leilões](https://www.marcaleiloes.com.br):
 * home → URLs de listagem → páginas de lotes (com paginação) → opcionalmente 1 página de lote/leilão para datas.
 */
export const extrairDadosMarcaLeiloes = async (): Promise<void> => {
  console.log("🏷️ [Marca Leilões] Iniciando varredura…");
  cacheDatasLeilao.clear();
  try {
    await sleep(300);
    const { data: homeHtml } = await axios.get<string>(URL_HOME, { headers: HEADERS, timeout: 45_000 });
    const $home = cheerio.load(homeHtml);
    const listingUrls = new Set<string>();
    $home('a[href*="/eventos/leilao/"]').each((_, el) => {
      const href = $home(el).attr("href")?.trim() || "";
      const u = normalizeToListingUrl(href);
      if (u) listingUrls.add(u);
    });

    const urls = [...listingUrls];
    console.log(`📡 [Marca Leilões] ${urls.length} listagens de leilão na home.`);

    const veiculosEncontrados: Array<{
      numero_lote: string;
      veiculo_origem: string;
      link_leilao: string;
      tipo_sucata: string;
      image_url: string;
      auction_start_at: string | null;
      auction_end_at: string | null;
      fonte: string;
      cidade: string;
    }> = [];

    for (const listingUrl of urls) {
      const m = listingUrl.match(/\/eventos\/leilao\/(\d+)\//);
      const leilaoId = m ? m[1] : "0";

      let rows: ParsedLoteRow[] = [];
      let tituloLeilao = "";
      try {
        const fetched = await fetchAllListingRows(listingUrl);
        rows = fetched.rows;
        tituloLeilao = fetched.tituloLeilao;
      } catch (e) {
        console.warn(`⚠️ [Marca Leilões] Listagem falhou: ${listingUrl}`, e);
        continue;
      }
      if (rows.length === 0) continue;

      const sampleUrl = rows[0].lotUrl;
      const datas = await obterDatasLeilao(sampleUrl, listingUrl);

      for (const row of rows) {
        const textoCartao = `${row.h3} ${row.desc} ${row.cod}`.trim();
        const texto = `${tituloLeilao} ${textoCartao}`.trim();
        if (!isSucataVeicularValida(texto)) continue;

        const pathId = extractLotePathId(row.lotUrl);
        const numeroLote = `${leilaoId}-${pathId}`.slice(0, 80);
        const titulo = `${row.h3}${row.desc ? " — " + row.desc : ""}`.slice(0, 120);
        const tituloLimpo = titulo.toUpperCase().includes("SUCATA") ? titulo : `SUCATA - ${titulo}`;

        veiculosEncontrados.push({
          numero_lote: numeroLote,
          veiculo_origem: tituloLimpo,
          link_leilao: row.lotUrl,
          tipo_sucata: mapearTipoSucata(texto),
          image_url: row.imageUrl || "",
          auction_start_at: datas.auction_start_at,
          auction_end_at: datas.auction_end_at,
          fonte: "Marca Leilões",
          cidade: row.city || "",
        });
      }
    }

    if (veiculosEncontrados.length > 0) {
      await axios.post(WEBHOOK_MARCA_LEILOES, { lotes: veiculosEncontrados }, { timeout: 120_000 });
      console.log(`🚀 [Marca Leilões] ${veiculosEncontrados.length} lote(s) enviado(s) ao n8n/CRM.`);
    } else {
      console.log("⚠️ [Marca Leilões] Nenhum lote de sucata/veículo elegível no momento.");
    }
  } catch (error) {
    console.error("🚨 [Marca Leilões] Erro fatal:", error);
  }
};
