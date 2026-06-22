import { chromium } from "playwright";
import axios from "axios";
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";
import config from "@/config/index";

export interface AuctionLot {
  source: string;
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
  chassi?: string | null;
  raw?: any;
}

const SEARCH_API_URL = "https://www.copart.com.br/public/lots/search";

export async function extrairDadosCopart(): Promise<AuctionLot[]> {
  console.log("🔱 [Copart] Iniciando Arrastão...");
  const veiculosEncontrados: AuctionLot[] = [];
  let browser: any;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      locale: "pt-BR",
    });

    const page = await context.newPage();
    
    // Visita a página inicial primeiro para pegar os cookies de sessão
    console.log("[Copart] Obtendo sessão e cookies...");
    await page.goto("https://www.copart.com.br/lotSearchResults/?free=true&query=sucata", {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    // Executa a requisição do buscador por XHR dentro do navegador
    console.log("[Copart] Buscando lotes da API...");
    const rawResult = await page.evaluate(async (apiUrl) => {
      // Corpo do POST formatado como url-encoded
      const body = new URLSearchParams({
        draw: "1",
        start: "0",
        length: "50",
        query: "sucata",
        watchListOnly: "false",
        freeFormSearch: "true",
        page: "0",
        size: "50"
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01"
        },
        body: body.toString()
      });

      return response.json();
    }, SEARCH_API_URL);

    if (rawResult && rawResult.data && rawResult.data.results && Array.isArray(rawResult.data.results.content)) {
      const contentList = rawResult.data.results.content;
      console.log(`📡 [Copart] ${contentList.length} lotes brutos encontrados.`);

      for (const item of contentList) {
        const marca = (item.mkn || "").trim();
        const modelo = (item.lm || "").trim();
        const ano = (item.lcy || "").trim();
        const docInfo = (item.td || item.stt || "").toUpperCase();
        
        // Se possuir tipo de veículo, consideramos válido
        const isVehicle = !!item.vehicleType;

        if (!isVehicle) {
          continue;
        }

        const tituloVeiculo = `SUCATA - ${marca} ${modelo} ${ano}`;
        const imageUrl = item.tims ? item.tims.replace("imageType=thumbnail", "imageType=normal") : "";
        const link = `https://www.copart.com.br/lot/${item.ln}`;

        const parseDateBr = (dStr: string) => {
          if (!dStr) return null;
          return dStr.replace(" ", "T");
        };

        const lotData: AuctionLot = {
          source: "copart",
          source_lot_id: item.ln ? String(item.ln) : undefined,
          numero_lote: item.lotNumberStr || String(item.ln),
          veiculo_origem: tituloVeiculo,
          link_leilao: link,
          tipo_sucata: mapearTipoSucata(docInfo),
          image_url: imageUrl,
          auction_start_at: parseDateBr(item.ad),
          auction_end_at: parseDateBr(item.ad),
          fonte: "Copart Brasil",
          marca: marca || null,
          modelo: modelo || null,
          ano: ano || null,
          placa: null, // Omitido publicamente
          chassi: item.fv || null, // VIN
          raw: item
        };

        veiculosEncontrados.push(lotData);
      }
    } else {
      console.warn("[Copart] Resposta inesperada da API da Copart:", rawResult);
    }

  } catch (error: any) {
    console.error("🚨 [Copart] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [Copart] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
