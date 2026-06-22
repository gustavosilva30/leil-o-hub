import axios from "axios";
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";
import type { AuctionLot } from "@/services/leiloesScraper";

const BASE_API = "https://siteback.milanleiloes.com.br";
const BASE_SITE = "https://milanleiloes.com.br";

// Categorias de veículos que nos interessam
const CATEGORIAS_VEICULO = [
  "veículos", "veiculos", "caminhões", "caminhoes",
  "carros", "automóveis", "automoveis",
];

// Escanear lotes de 1 até MAX, em batches paralelos
const LOTE_MAX = 350;
const BATCH_SIZE = 30;
// Lotes no Milan Leilões podem começar em números altos (ex: 100+).
// Para não parar antes de atingir o range válido, usamos um valor alto de misses.
// Com LOTE_MAX=350 e BATCH_SIZE=30, temos no máximo ~12 batches (muito rápido em paralelo).
// Por isso, desabilitamos o early-stop e sempre varremos o range completo.
const MAX_MISSES_CONSECUTIVOS = 999; // efetivamente desabilitado; usa LOTE_MAX como limite


// Janela de tempo: leilões com início a até 7 dias atrás (ou no futuro)
const JANELA_DIAS = 7;

const HTTP_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
  Origin: BASE_SITE,
  Referer: `${BASE_SITE}/`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
};

interface MilanAgendaItem {
  codLeilao: number;
  dataInicio: string;
  dataFim: string;
  categorias: string;
  tituloLeilao: string | null;
  tipoLeilao: number;
  localFotos: string | null;
}

interface MilanLote {
  lote: string;
  titulo: string;
  descricao: string;
  minimo: number;
  estadoLote: number;
  comitente?: { nome: string };
  fotos?: Array<{ arquivoFoto: string }>;
}

function isVehicleAuction(categorias: string): boolean {
  const lower = categorias.toLowerCase();
  return CATEGORIAS_VEICULO.some((c) => lower.includes(c));
}

function extrairMarcaModeloAno(titulo: string): {
  marca: string | null;
  modelo: string | null;
  ano: string | null;
} {
  // Título típico: "FORD FIESTA HATCH 1.6 (SUCATA) FLEX 4P ANO 2009/2009"
  const anoMatch = titulo.match(/ANO\s+(\d{4}\/\d{4}|\d{4})/i);
  const ano = anoMatch ? anoMatch[1] : null;

  const partes = titulo
    .replace(/\(.*?\)/g, "")
    .replace(/ANO\s+\d{4}(\/\d{4})?/gi, "")
    .trim()
    .split(/\s+/);

  const marca = partes[0] || null;
  const modelo = partes
    .slice(1)
    .join(" ")
    .replace(/\d+P\s*$/i, "")
    .replace(/\s*(FLEX|DIESEL|GASOLINA|GNV|ELÉTRICO)\s*/gi, " ")
    .trim() || null;

  return { marca, modelo, ano };
}

async function fetchAgenda(): Promise<MilanAgendaItem[]> {
  try {
    const res = await axios.get<MilanAgendaItem[]>(`${BASE_API}/leiloes/agenda`, {
      headers: HTTP_HEADERS,
      timeout: 15000,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: any) {
    console.error("[Milan] Erro ao buscar agenda:", err.message);
    return [];
  }
}

async function fetchLote(auctionId: number, loteNum: number): Promise<MilanLote | null> {
  try {
    const res = await axios.get<MilanLote>(
      `${BASE_API}/leiloes/${auctionId}/lotes/${loteNum}`,
      { headers: HTTP_HEADERS, timeout: 10000 }
    );
    if (res.status === 200 && res.data) return res.data;
    return null;
  } catch {
    return null;
  }
}

async function fetchLoteBatch(
  auctionId: number,
  startNum: number,
  batchSize: number
): Promise<Array<{ num: number; data: MilanLote | null }>> {
  const promises = Array.from({ length: batchSize }, (_, i) => {
    const n = startNum + i;
    return fetchLote(auctionId, n).then((data) => ({ num: n, data }));
  });
  return Promise.all(promises);
}

export async function extrairDadosMilanLeiloes(): Promise<AuctionLot[]> {
  console.log("🔱 [Milan] Iniciando Arrastão...");
  const veiculosEncontrados: AuctionLot[] = [];

  try {
    // ─── 1. Buscar agenda de leilões ───────────────────────────────────────
    const agenda = await fetchAgenda();

    const agora = new Date();
    const janela = new Date(agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000);

    const leiloesVeiculo = agenda.filter((l) => {
      if (!isVehicleAuction(l.categorias || "")) return false;
      const dataInicio = l.dataInicio ? new Date(l.dataInicio) : null;
      if (!dataInicio) return false;
      return dataInicio >= janela; // recentes ou futuros
    });

    console.log(
      `[Milan] ${leiloesVeiculo.length} leilão(ões) de veículos: ${leiloesVeiculo.map((l) => `#${l.codLeilao}`).join(", ")}`
    );

    if (leiloesVeiculo.length === 0) {
      console.log("[Milan] Nenhum leilão de veículo ativo encontrado.");
      return [];
    }

    // ─── 2. Para cada leilão, escanear lotes em batches paralelos ──────────
    for (const leilao of leiloesVeiculo) {
      const { codLeilao, dataInicio, dataFim, localFotos, tituloLeilao } = leilao;
      console.log(
        `\n[Milan] Escaneando leilão #${codLeilao} "${tituloLeilao?.trim() || leilao.categorias?.trim()}"...`
      );

      let loteNum = 1;
      let consecutiveMisses = 0;

      while (consecutiveMisses < MAX_MISSES_CONSECUTIVOS && loteNum <= LOTE_MAX) {
        const batchResults = await fetchLoteBatch(codLeilao, loteNum, BATCH_SIZE);

        for (const { num, data } of batchResults) {
          if (!data) {
            consecutiveMisses++;
          } else {
            consecutiveMisses = 0; // reset ao encontrar um lote válido

            const titulo = data.titulo || "";

            // Filtra apenas sucatas de veículos
            if (!isSucataVeicularValida(titulo)) {
              continue;
            }

            // Extrai tipo com base no título + descrição (sem tags HTML)
            const descricaoLimpa = (data.descricao || "")
              .replace(/<[^>]+>/g, " ")
              .trim();
            const textoClassificacao = `${titulo} ${descricaoLimpa}`;

            // URL da imagem — o endpoint siteback requer auth, mas a URL é válida para o browser
            const primeiraFoto = data.fotos?.[0]?.arquivoFoto;
            const folder = localFotos || String(codLeilao);
            const imageUrl = primeiraFoto
              ? `${BASE_API}/fotos/${folder}/${primeiraFoto}`
              : "";

            const { marca, modelo, ano } = extrairMarcaModeloAno(titulo);

            const lot: AuctionLot = {
              source: "milan",
              source_lot_id: String(num),
              numero_lote: data.lote || String(num),
              veiculo_origem: `SUCATA - ${titulo}`.slice(0, 120),
              link_leilao: `${BASE_SITE}/leilao/${codLeilao}/lote/${data.lote || num}`,
              tipo_sucata: mapearTipoSucata(textoClassificacao),
              image_url: imageUrl,
              auction_start_at: dataInicio || null,
              auction_end_at: dataFim || dataInicio || null,
              fonte: "Milan Leilões",
              marca,
              modelo,
              ano,
              placa: null,
              chassi: null,
              raw: data,
            } as unknown as AuctionLot;

            veiculosEncontrados.push(lot);
            console.log(
              `  ✅ Lote ${num}: ${titulo.slice(0, 70)} [${lot.tipo_sucata}]`
            );
          }
        }

        loteNum += BATCH_SIZE;
      }

      console.log(`[Milan] Leilão #${codLeilao} concluído.`);
    }
  } catch (error: any) {
    console.error("🚨 [Milan] Erro no Scraper:", error?.message || error);
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`\n🚀 [Milan] ${veiculosEncontrados.length} lote(s) de sucata encontrado(s).`);
  } else {
    console.log("[Milan] Nenhum lote de sucata encontrado.");
  }

  return veiculosEncontrados;
}
