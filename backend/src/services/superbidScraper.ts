import { chromium } from "playwright";
import axios from "axios";
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";
import config from "@/config/index";
import * as cheerio from "cheerio";

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
  raw?: any;
}

const BASE_URL = "https://www.superbid.net";

function parseSuperbidDate(texto: string): string | null {
  try {
    const match = texto.match(/(\d{2})\/(\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (!match) return null;
    const [_, dia, mes, hora] = match;
    const ano = new Date().getFullYear(); // Usará o ano corrente (2026)
    return `${ano}-${mes}-${dia}T${hora}:00`;
  } catch (e) {
    return null;
  }
}

export async function extrairDadosSuperbid(): Promise<AuctionLot[]> {
  console.log("🔱 [Superbid] Iniciando Arrastão...");
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
    
    console.log("[Superbid] Carregando página de sinistrados...");
    await page.goto(`${BASE_URL}/categorias/carros-motos/veiculos-sinistrados?searchType=opened&pageNumber=1&pageSize=30`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    
    const cards = $("a[id^='offer-card-']");
    console.log(`📡 [Superbid] ${cards.length} cards brutos encontrados.`);

    cards.each((_, el) => {
      try {
        const idAttr = $(el).attr("id") || "";
        const source_lot_id = idAttr.replace("offer-card-", "");
        const href = $(el).attr("href") || "";
        const link = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        
        // Extrai imagens e limpa parâmetros de tamanho para obter a original
        let imgUrl = $(el).find("img").first().attr("src") || $(el).find("img").first().attr("data-src") || "";
        if (imgUrl) {
          imgUrl = imgUrl.split("?")[0];
        }

        // Mapeia os textos de parágrafo no card
        const paragraphs: string[] = [];
        $(el).find("p").each((_, pEl) => {
          paragraphs.push($(pEl).text().trim());
        });

        // Procurando os valores conhecidos com base no dump da estrutura:
        // P0: Data/Hora (ex: "02/07 - 09:00" ou "2 praças | 22/07 - 14:03")
        // P1: Lote (ex: "Lote 1")
        // P2: Título (ex: "VW FOX 1.6 PRIME GII SUCATA.")
        // P3: Cidade/Estado (ex: "Belo Horizonte - MG")
        // P4: Ano (ex: "Ano 10/11")
        const dateText = paragraphs[0] || "";
        const lotLabel = paragraphs[1] || "";
        const titleText = paragraphs[2] || "";
        const locationText = paragraphs[3] || "";
        const yearText = paragraphs[4] || "";

        if (!titleText) return; // ignora se não houver título

        const numeroLote = lotLabel.replace(/lote\s+/i, "") || source_lot_id;
        const veiculoNome = titleText.replace(/\.$/, "").trim();

        // Extrai ano
        const anoMatch = yearText.match(/ano\s*(\d{2}\/\d{2}|\d{4})/i);
        const anoVal = anoMatch ? anoMatch[1] : null;

        // Extrai data
        const dataFim = parseSuperbidDate(dateText);

        const lotData: AuctionLot = {
          source: "superbid",
          source_lot_id,
          numero_lote: numeroLote,
          veiculo_origem: `SUCATA - ${veiculoNome}`,
          link_leilao: link,
          veiculosEncontrados: undefined, // propriedade de segurança
          tipo_sucata: veiculoNome.toUpperCase().includes("INSERVÍVEL") || veiculoNome.toUpperCase().includes("IRRECUPERÁVEL") ? "inservivel" : "aproveitavel",
          image_url: imgUrl,
          auction_start_at: null,
          auction_end_at: dataFim,
          fonte: "Superbid Exchange",
          ano: anoVal,
          placa: null,
          raw: {
            paragraphs,
            rawId: idAttr
          }
        } as any;

        veiculosEncontrados.push(lotData);
      } catch (err: any) {
        console.error("[Superbid] Erro ao parsear card:", err.message);
      }
    });

  } catch (error: any) {
    console.error("🚨 [Superbid] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [Superbid] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
