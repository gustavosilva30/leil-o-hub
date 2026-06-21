import axios from "axios";

const WEBHOOK_COPART =
  process.env.WEBHOOK_COPART_URL ||
  "https://n8n.douradosap.com.br/webhook/receber-copart";

const SEARCH_URL = "https://www.copart.com.br/public/lots/search";

/** Mesmo conjunto do link oficial (Leilão + 7 categorias + Irrecuperável) */
export const COPART_CATEGORIAS_VEICULO = [
  "Automóveis",
  "Picapes Pequenas",
  "Picapes Grandes",
  "SUV Pequenos",
  "SUV Grandes",
  "Utilitários Pequenos",
  "Utilitários Grandes",
] as const;

const CATEGORIAS_SET = new Set<string>(COPART_CATEGORIAS_VEICULO);

/**
 * Payload da busca Copart BR — **somente** Leilão (não "Compre Agora"), Irrecuperável e as 7 categorias.
 * `freeFormSearch: false` evita que a API misture critérios soltos com o formulário livre.
 */
export function buildSearchCriteriaLeilaoIrrecuperavel() {
  return {
    query: ["*"] as string[],
    filter: {
      /** Somente venda em leilão (exclui "Compre Agora" no facet tipovenda) */
      MISC: ["tipovenda:Leilão"],
      categoria: [
        'categoria:"Automóveis"',
        'categoria:"Picapes Pequenas"',
        'categoria:"Picapes Grandes"',
        'categoria:"SUV Pequenos"',
        'categoria:"SUV Grandes"',
        'categoria:"Utilitários Pequenos"',
        'categoria:"Utilitários Grandes"',
      ],
      tipodocumento: ['tipodocumento:"Irrecuperável"'],
    },
    sort: ["auction_date_utc asc", "brazil_default_sort asc"] as string[],
    watchListOnly: false,
    searchName: "",
    freeFormSearch: false,
  };
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
  Referer: "https://www.copart.com.br/search/leil%C3%A3o/",
  Origin: "https://www.copart.com.br",
};

export type CopartLoteMapeado = {
  codigo: string;
  numero_lote: string;
  ano_modelo: string;
  marca: string;
  modelo: string;
  /** Texto exibido na coluna Documento (pode ser "Aguardando Classificação") */
  documento_status: string;
  /** Filtro aplicado na busca */
  documento_tipo_filtro: "Irrecuperável";
  categoria: string;
  condicao: string;
  valor_fipe_num: number;
  valor_fipe_moeda: string;
  patio_veiculo: string;
  data_leilao: string;
  hora_leilao: string;
  patio_leilao: string;
  lote_vaga: string;
  lance_atual_num: number;
  lance_atual_str: string;
  image_url: string;
  link_leilao: string;
  descricao_linha: string;
  tipo_venda: string;
  vehicle_type_raw: string;
};

function thumbnailParaImagemFull(url: string): string {
  if (!url) return "";
  if (url.includes("imageType=thumbnail")) {
    return url.replace("imageType=thumbnail", "imageType=full");
  }
  return url;
}

function parseNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Textos que nunca são datas válidas para PostgreSQL (timestamp) */
const TEXTO_LIXO_DATA =
  /compre\s*agora|aguardando\s*classificação|aguardando|não\s*preenchido|n[ãa]o\s+preenchido|indispon[ií]vel|inv[aá]lido|tbd|n\/a\b|sem\s+data/i;

/** Só aceita data “de calendário” (evita lixo em coluna timestamp) */
function sanitizarDataLeilao(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (TEXTO_LIXO_DATA.test(s)) return "";
  // DD.MM.YYYY ou DD/MM/YYYY (comum na Copart BR)
  const m1 = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m1) {
    const d = parseInt(m1[1], 10);
    const mo = parseInt(m1[2], 10);
    const yStr = m1[3];
    const y = yStr.length === 2 ? 2000 + parseInt(yStr, 10) : parseInt(yStr, 10);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100) {
      return `${String(d).padStart(2, "0")}.${String(mo).padStart(2, "0")}.${y}`;
    }
    return "";
  }
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.slice(0, 10));
    if (!Number.isNaN(d.getTime())) return s.slice(0, 10);
  }
  return "";
}

/** Hora válida (evita “COMPRE AGORA” em campo de hora) */
function sanitizarHoraLeilao(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (TEXTO_LIXO_DATA.test(s)) return "";
  // Letras soltas (exceto abreviações de fuso curtas) → rejeita
  const semFuso = s.replace(/\b(AMT|BRT|UTC|GMT|BRST?)\b/gi, "").trim();
  if (/[A-Za-z]{4,}/.test(semFuso)) return "";
  // HH:MM ou H:MM
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return "";
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return "";
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Garante que o lote não seja “Compre Agora” (API às vezes mistura) */
function lotEhVendaLeilao(lot: Record<string, unknown>): boolean {
  const st = String(lot.saleType ?? lot.st ?? "")
    .trim()
    .toLowerCase();
  if (!st) return true;
  if (st.includes("compre agora")) return false;
  if (st.includes("compre")) return false;
  return st.includes("leilão") || st.includes("leilao");
}

/** Mapeia um item de `data.results.content` da API pública */
export function mapLotParaRegistro(lot: Record<string, unknown>): CopartLoteMapeado {
  const ln = lot.ln ?? lot.lotNumberStr;
  const codigo = String(lot.lotNumberStr ?? ln ?? "");
  const tims = String(lot.tims ?? "");
  const hb = lot.hb;
  const ahb = lot.ahb;

  const lanceNum =
    typeof hb === "number" && hb > 0
      ? hb
      : parseNum(ahb);

  return {
    codigo,
    numero_lote: codigo,
    ano_modelo: String(lot.lcy ?? lot.manufactureYear ?? ""),
    marca: String(lot.mkn ?? ""),
    modelo: String(lot.lm ?? ""),
    documento_status: String(lot.td ?? ""),
    documento_tipo_filtro: "Irrecuperável",
    categoria: String(lot.vehicleType ?? ""),
    condicao: String(lot.dd ?? lot.lossType ?? ""),
    valor_fipe_num: typeof lot.orr === "number" ? lot.orr : parseNum(lot.orr),
    valor_fipe_moeda: String(lot.cuc ?? "BRL"),
    patio_veiculo: String(lot.yn ?? ""),
    data_leilao: sanitizarDataLeilao(lot.ad),
    hora_leilao: sanitizarHoraLeilao(lot.at),
    patio_leilao: String(lot.syn ?? ""),
    lote_vaga: String(lot.gr ?? ""),
    lance_atual_num: lanceNum,
    lance_atual_str:
      typeof ahb === "string" && ahb
        ? ahb
        : typeof hb === "number"
          ? String(hb)
          : "0",
    image_url: thumbnailParaImagemFull(tims),
    link_leilao: `https://www.copart.com.br/lot/${ln}`,
    descricao_linha: String(lot.ld ?? ""),
    tipo_venda: String(lot.saleType ?? "Leilão"),
    vehicle_type_raw: String(lot.vehicleType ?? ""),
  };
}

function lotPermitidoPorCategoria(lot: Record<string, unknown>): boolean {
  const vt = String(lot.vehicleType ?? "").trim();
  return CATEGORIAS_SET.has(vt);
}

/** Só lotes com documento já classificado como Irrecuperável (não “Aguardando…”) */
function lotDocumentoIrrecuperavelExplicito(lot: Record<string, unknown>): boolean {
  const td = String(lot.td ?? "").trim().toLowerCase();
  if (!td) return false;
  if (td.includes("aguardando")) return false;
  return td.includes("irrecuper");
}

export type ExtrairCopartOptions = {
  /** Padrão 100 (máx. prático por página) */
  pageSize?: number;
  /** Limite de páginas (segurança). Padrão 200 (~20k linhas) */
  maxPages?: number;
  /**
   * A API pública às vezes devolve outras categorias no mesmo lote;
   * se true (padrão), mantém só as 7 categorias do filtro.
   */
  filtrarSomenteCategoriasEscolhidas?: boolean;
  /**
   * Se true, descarta linhas com documento "Aguardando Classificação" (só Irrecuperável explícito).
   * Padrão: **true** — evita enviar lixo ao webhook/PostgreSQL.
   */
  apenasDocumentoClassificadoIrrecuperavel?: boolean;
  enviarWebhook?: boolean;
  delayEntrePaginasMs?: number;
};

/**
 * Busca lotes no Copart BR com o mesmo critério do link oficial (Leilão + 7 categorias + Irrecuperável).
 * Filtra em memória por categoria de veículo, pois a API pública pode misturar tipos.
 */
export async function extrairDadosCopart(
  options: ExtrairCopartOptions = {}
): Promise<CopartLoteMapeado[]> {
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 100));
  const maxPages = options.maxPages ?? 200;
  const filtrarCats = options.filtrarSomenteCategoriasEscolhidas !== false;
  const apenasIrrecClass = options.apenasDocumentoClassificadoIrrecuperavel !== false;
  const enviarWebhook = options.enviarWebhook !== false;
  const delayMs = options.delayEntrePaginasMs ?? 600;

  const criteria = buildSearchCriteriaLeilaoIrrecuperavel();
  const veiculos: CopartLoteMapeado[] = [];
  const idsVistos = new Set<string>();

  console.log(
    "[Copart] Busca estrita Leilão + Irrecuperável + 7 categorias | filtro categoria:",
    filtrarCats,
    "| só documento Irrecuperável classificado:",
    apenasIrrecClass
  );

  try {
    for (let page = 0; page < maxPages; page++) {
      const url = `${SEARCH_URL}?page=${page}&size=${pageSize}`;
      const { data } = await axios.post(url, criteria, { headers: HEADERS, timeout: 120_000 });

      const rawList: Record<string, unknown>[] =
        data?.data?.results?.content ?? data?.results?.content ?? [];

      if (!Array.isArray(rawList) || rawList.length === 0) {
        console.log(`[Copart] Fim da lista na página ${page}.`);
        break;
      }

      let aceitosPagina = 0;
      for (const lot of rawList) {
        if (!lotEhVendaLeilao(lot)) continue;
        if (filtrarCats && !lotPermitidoPorCategoria(lot)) continue;
        if (apenasIrrecClass && !lotDocumentoIrrecuperavelExplicito(lot)) continue;

        const idUnico = String(lot.lotNumberStr ?? lot.ln ?? "");
        if (!idUnico || idsVistos.has(idUnico)) continue;
        idsVistos.add(idUnico);

        veiculos.push(mapLotParaRegistro(lot));
        aceitosPagina++;
      }

      console.log(
        `[Copart] Página ${page + 1}: brutos=${rawList.length}, aceitos=${aceitosPagina}, total=${veiculos.length}`
      );

      if (rawList.length < pageSize) break;

      await new Promise((r) => setTimeout(r, delayMs));
    }

    console.log(`[Copart] Concluído: ${veiculos.length} lotes mapeados.`);

    if (enviarWebhook && veiculos.length > 0) {
      await axios.post(WEBHOOK_COPART, { lotes: veiculos }, { timeout: 60_000 });
      console.log("[Copart] Webhook enviado.");
    }

    return veiculos;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Copart] Erro:", msg);
    throw err;
  }
}
