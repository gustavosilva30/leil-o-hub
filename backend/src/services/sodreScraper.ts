import axios from "axios";
import { chromium } from "playwright";
import config from "@/config/index";
import type { AuctionLot } from "@/services/leiloesScraper";
import { mapearTipoSucata } from "@/utils/validadorSucata";

const SEARCH_URL = "https://www.sodresantoro.com.br/api/search-lots";

const payloadBusca = {
  indices: ["sucatas"],
  query: {
    bool: {
      filter: [
        {
          bool: {
            should: [
              { bool: { must: [{ term: { auction_status: "online" } }] } },
              {
                bool: {
                  must: [{ term: { auction_status: "aberto" } }],
                  must_not: [{ terms: { lot_status_id: [5, 7] } }],
                },
              },
              {
                bool: {
                  must: [{ term: { auction_status: "encerrado" } }, { terms: { lot_status_id: [6] } }],
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
        {
          bool: {
            should: [
              { bool: { must_not: { term: { lot_status_id: 6 } } } },
              { bool: { must: [{ term: { lot_status_id: 6 } }, { term: { segment_id: 1 } }] } },
            ],
            minimum_should_match: 1,
          },
        },
        {
          bool: {
            should: [{ bool: { must_not: [{ term: { lot_test: true } }] } }],
            minimum_should_match: 1,
          },
        },
      ],
    },
  },
  from: 0,
  size: 100,
  sort: [
    { lot_status_id_order: { order: "asc" } },
    { auction_date_init: { order: "asc" } },
  ],
};

const formatarData = (valor: any): string | null => {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data.toISOString();
};

export const extrairDadosSodre = async (): Promise<AuctionLot[]> => {
  console.log("🔱 [Sodre] Iniciando Arrastão Dourados AP...");
  const veiculosEncontrados: AuctionLot[] = [];
  let browser: any;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      locale: "pt-BR",
    });
    const page = await context.newPage();

    console.log("[Sodre] Carregando página para obter cookies e sessão...");
    await page.goto("https://www.sodresantoro.com.br/sucatas/lotes", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const data = await page.evaluate(async (bodyData) => {
      const resposta = await fetch(bodyData.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyData.payload),
      });
      return resposta.json();
    }, { url: SEARCH_URL, payload: payloadBusca });

    if (!data || !Array.isArray(data.results)) {
      console.warn("[Sodre] Resposta inesperada da API do Sodré", data);
    } else {
      console.log(`📡 [Sodre] ${data.results.length} lotes brutos encontrados.`);
      for (const carro of data.results) {
        if (carro.lot_is_scrap !== true) continue;

        const tituloBase = carro.lot_title || "Sodré";
        const titulo = `SUCATA - ${tituloBase}`;
        const foto = carro.lot_pictures && carro.lot_pictures.length > 0 ? carro.lot_pictures[0] : "";

        const numeroLoteBruto = carro.lot_number !== "Indef." ? carro.lot_number : carro.lot_inspection_number;
        const numeroLote = numeroLoteBruto ? `${numeroLoteBruto}-${carro.lot_id}` : String(carro.lot_id);
        const link = `https://www.sodresantoro.com.br/leilao/${carro.auction_id}/lote/${carro.lot_id}/`;

        if (!numeroLote || !foto) continue;

        veiculosEncontrados.push({
          numero_lote: String(numeroLote),
          veiculo_origem: titulo.slice(0, 120),
          link_leilao: link,
          tipo_sucata: mapearTipoSucata(titulo),
          image_url: foto,
          auction_start_at: formatarData(carro.auction_date_init),
          auction_end_at: formatarData(carro.auction_date_limit || carro.auction_date_end),
          fonte: "Sodré Santoro",
        });
      }
    }
  } catch (error: any) {
    console.error("[Sodre] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    try {
      await axios.post(config.WEBHOOK_N8N_SODRE, { lotes: veiculosEncontrados });
      console.log(`🚀 [Sodre] ${veiculosEncontrados.length} lotes enviados para o N8N!`);
    } catch (err: any) {
      console.error("[Sodre] Erro ao enviar para o N8N:", err?.message || err);
    }
  } else {
    console.log("[Sodre] Nenhum lote novo encontrado.");
  }

  return veiculosEncontrados;
};