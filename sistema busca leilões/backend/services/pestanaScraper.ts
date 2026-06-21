import axios from "axios";
import { isSucataVeicularValida, mapearTipoSucata } from "../utils/validadorSucata";

const WEBHOOK_PESTANA =
  process.env.WEBHOOK_PESTANA_URL ||
  "https://n8n.douradosap.com.br/webhook/receber-pestana";

const BASE_SITE = "https://www.pestanaleiloes.com.br";

/** Listagem de veículos — inclui JSON hidratado com todos os lotes públicos */
const URL_VEICULOS = `${BASE_SITE}/leilao-de-veiculos`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

/** Lote vindo do script __hydrateLotes / __hydrateLotesPrivados */
interface PestanaBem {
  descricao?: string;
  observacao?: string | null;
  origem?: string;
  imagens?: Array<{ media?: string; pequena?: string; original?: string }>;
  videos?: Array<{ urlVideo?: string }>;
}

interface PestanaLote {
  id: number;
  leilao: number;
  numero?: string;
  descricao?: string;
  status?: string;
  bens?: PestanaBem[];
}

interface PestanaLeilao {
  id: number;
  nome?: string;
  data?: string;
}

/**
 * Extrai JSON de `<script type="javascript/json" id="...">...</script>`.
 * Se o primeiro `</script>` aparecer dentro de uma string JSON (raro), tenta o próximo.
 */
function extrairJsonDoScript(html: string, scriptId: string): string | null {
  const marker = `id="${scriptId}">`;
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const contentStart = start + marker.length;
  let searchFrom = contentStart;
  while (searchFrom < html.length) {
    const end = html.indexOf("</script>", searchFrom);
    if (end < 0) return null;
    const raw = html.slice(contentStart, end).trim();
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      searchFrom = end + 1;
    }
  }
  return null;
}

const sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

function montarMapaLeiloes(leiloes: PestanaLeilao[]): Map<number, PestanaLeilao> {
  const m = new Map<number, PestanaLeilao>();
  for (const l of leiloes) m.set(l.id, l);
  return m;
}

/** Normaliza para comparação simples */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Inclui lotes de veículos sucata:
 * - Leilão cujo nome menciona sucata (ex.: "Leilão de Veículos Sucatas"); ou
 * - Texto do lote/bem contém "sucata" (ex.: "- Sucata Toyota..." em leilão de sinistrados).
 *
 * Assim não ficam de fora sucatas listadas em leilões "Sinistrados" quando o título traz "Sucata".
 */
export function loteEhVeiculoSucata(lot: PestanaLote, nomeLeilao: string): boolean {
  const nomeL = norm(nomeLeilao || "");
  if (nomeL.includes("sucata")) return true;

  const trechos: string[] = [lot.descricao || ""];
  for (const b of lot.bens || []) {
    trechos.push(b.descricao || "", b.observacao || "");
  }
  const texto = norm(trechos.join(" "));
  if (texto.includes("sucata")) return true;

  return false;
}

function textoParaTipoELote(lot: PestanaLote, nomeLeilao: string): string {
  const partes = [nomeLeilao, lot.descricao || ""];
  for (const b of lot.bens || []) {
    partes.push(b.descricao || "", b.observacao || "");
  }
  return partes.filter(Boolean).join(" ");
}

/** Melhor URL de mídia disponível (vídeo vistoria costuma responder 200; fotos são só nomes de arquivo no JSON) */
function extrairImagemUrl(lot: PestanaLote): string {
  const b0 = lot.bens?.[0];
  const vid = b0?.videos?.[0]?.urlVideo;
  if (vid && /^https?:\/\//i.test(vid)) return vid;
  const img = b0?.imagens?.[0];
  if (img?.media || img?.pequena || img?.original) {
    const file = img.media || img.pequena || img.original;
    if (file && /^https?:\/\//i.test(file)) return file;
  }
  return "";
}

/**
 * Link para o catálogo com parâmetros — SPA abre o lote correspondente no site.
 * (O front da Pestana usa histórico interno; estes params são usados por vários leilões SPA.)
 */
function montarLinkLote(leilaoId: number, loteId: number): string {
  return `${BASE_SITE}/leilao-de-veiculos?leilao=${leilaoId}&lote=${loteId}`;
}

function parseDataLeilaoIso(data: string | undefined): string | null {
  if (!data) return null;
  try {
    return new Date(data).toISOString();
  } catch {
    return null;
  }
}

export const extrairDadosPestana = async (): Promise<void> => {
  console.log("🏛️ [Pestana] Baixando listagem de veículos (HTML hidratado)…");

  try {
    let html = "";
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const { data: raw } = await axios.get(URL_VEICULOS, {
        headers: HEADERS,
        timeout: 120_000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
        responseType: "text",
      });
      html =
        typeof raw === "string"
          ? raw
          : Buffer.isBuffer(raw)
            ? raw.toString("utf8")
            : String(raw);

      if (html.length > 500_000 && html.includes(`id="__hydrateLotes">`)) break;
      console.warn(
        `⚠️ [Pestana] Resposta incompleta ou sem dados (${html.length} bytes). Tentativa ${tentativa}/3…`
      );
      await sleepMs(1500 * tentativa);
    }

    const jsonLeiloes = extrairJsonDoScript(html, "__hydrateLeilao");
    const jsonLotes = extrairJsonDoScript(html, "__hydrateLotes");
    const jsonLotesPriv = extrairJsonDoScript(html, "__hydrateLotesPrivados");

    if (!jsonLotes) {
      console.error("❌ [Pestana] Não foi possível localizar __hydrateLotes no HTML.");
      return;
    }

    const leiloesArr: PestanaLeilao[] = jsonLeiloes ? JSON.parse(jsonLeiloes) : [];
    const mapaLeiloes = montarMapaLeiloes(leiloesArr);

    const lotesPub: PestanaLote[] = JSON.parse(jsonLotes);
    const lotesPriv: PestanaLote[] = jsonLotesPriv ? JSON.parse(jsonLotesPriv) : [];

    const vistos = new Set<number>();
    const todosLotes: PestanaLote[] = [];
    for (const l of lotesPub) {
      if (!vistos.has(l.id)) {
        vistos.add(l.id);
        todosLotes.push(l);
      }
    }
    for (const l of lotesPriv) {
      if (!vistos.has(l.id)) {
        vistos.add(l.id);
        todosLotes.push(l);
      }
    }

    console.log(
      `📡 [Pestana] ${todosLotes.length} lote(s) únicos (${lotesPub.length} públicos + ${lotesPriv.length} privados no HTML).`
    );

    const veiculos: Array<{
      numero_lote: string;
      veiculo_origem: string;
      link_leilao: string;
      tipo_sucata: ReturnType<typeof mapearTipoSucata>;
      image_url: string;
      auction_start_at: string | null;
      auction_end_at: string | null;
      fonte: string;
    }> = [];

    for (const lot of todosLotes) {
      const info = mapaLeiloes.get(lot.leilao);
      const nomeLeilao = info?.nome || "";

      if (!loteEhVeiculoSucata(lot, nomeLeilao)) continue;

      const textoVal = textoParaTipoELote(lot, nomeLeilao);
      if (!isSucataVeicularValida(textoVal)) continue;

      const tituloBase = (lot.descricao || lot.bens?.[0]?.descricao || "LOTE")
        .replace(/^\s*-\s*/, "")
        .trim();
      const titulo = tituloBase.toUpperCase().includes("SUCATA")
        ? tituloBase.slice(0, 120)
        : `SUCATA - ${tituloBase}`.slice(0, 120);

      const imageUrl = extrairImagemUrl(lot);
      const dataFim = parseDataLeilaoIso(info?.data);

      veiculos.push({
        numero_lote: `${lot.leilao}-${lot.id}`.slice(0, 50),
        veiculo_origem: titulo,
        link_leilao: montarLinkLote(lot.leilao, lot.id),
        tipo_sucata: mapearTipoSucata(textoVal),
        image_url: imageUrl,
        auction_start_at: null,
        auction_end_at: dataFim,
        fonte: "Pestana Leilões",
      });
    }

    console.log(`✅ [Pestana] ${veiculos.length} sucata(s) de veículo após filtros.`);

    if (veiculos.length > 0) {
      try {
        await axios.post(WEBHOOK_PESTANA, { lotes: veiculos }, { timeout: 60_000 });
        console.log(`🚀 [Pestana] ${veiculos.length} lote(s) enviado(s) ao n8n.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `⚠️ [Pestana] Extração OK (${veiculos.length} lotes), mas webhook falhou: ${msg}`
        );
      }
    } else {
      console.log("⚠️ [Pestana] Nenhum lote sucata elegível no momento.");
    }
  } catch (e) {
    console.error("🚨 [Pestana] Erro:", e);
  }
};
