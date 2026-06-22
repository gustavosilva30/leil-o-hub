import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";

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

const BASE_URL = "https://autotranleiloes.org";

function parseDataBr(texto: string): string | null {
  try {
    const match = texto.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(?:às\s+)?(\d{2}:\d{2})/);
    if (!match) return null;
    const [_, dia, mes, ano, hora] = match;
    return `${ano}-${mes}-${dia}T${hora}:00`;
  } catch (e) {
    return null;
  }
}

export async function extrairDadosAutoTran(): Promise<AuctionLot[]> {
  console.log("🔱 [AutoTran] Iniciando Arrastão...");
  const veiculosEncontrados: AuctionLot[] = [];
  let browser: any;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      locale: "pt-BR",
    });

    const page = await context.newPage();
    const linksDeLotes = new Set<string>();

    // Carrega a listagem principal
    console.log("[AutoTran] Acessando listagem de lotes...");
    await page.goto(`${BASE_URL}/lotes/?&cate[]=3/`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });

    const content = await page.content();
    const $ = cheerio.load(content);

    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/lote/") && !href.includes("#")) {
        const fullUrl = href.startsWith("http") ? href : new URL(href, BASE_URL).toString();
        linksDeLotes.add(fullUrl);
      }
    });

    console.log(`📡 [AutoTran] ${linksDeLotes.size} links de lotes identificados.`);

    let limit = 0;
    for (const link of linksDeLotes) {
      if (limit >= 30) break; // Limitar para evitar lentidão extrema

      try {
        console.log(`[AutoTran] Coletando lote: ${link}`);
        await page.goto(link, { waitUntil: "networkidle", timeout: 20000 });
        const lotContent = await page.content();
        const $lot = cheerio.load(lotContent);

        const title = $lot("h1").first().text().trim();
        const category = $lot("h2").first().text().trim();

        // Ignorar se não for automóvel/veículo/moto
        const catUpper = category.toUpperCase();
        const isVeiculo = catUpper.includes("AUTOMÓVEIS") || 
                          catUpper.includes("AUTOMOVEIS") || 
                          catUpper.includes("MOTOS") || 
                          catUpper.includes("VEÍCULOS") || 
                          catUpper.includes("VEICULOS");

        if (!isVeiculo && category) {
          console.log(`[AutoTran] Ignorando categoria não-veicular: ${category}`);
          continue;
        }

        const images: string[] = [];
        $lot("img").each((_, el) => {
          const src = $lot(el).attr("src") || "";
          if (src.includes("/PHPs/")) {
            const absSrc = src.startsWith("http") ? src : new URL(src, BASE_URL).toString();
            if (!images.includes(absSrc)) {
              images.push(absSrc);
            }
          }
        });
        const imageUrl = images[0] || "";

        const bodyText = $lot("body").text().replace(/\s+/g, ' ');

        const matchAbertura = bodyText.match(/Abertura\s+para\s+Lances\s+(\d{2}\/\d{2}\/\d{4}\s+às\s+\d{2}:\d{2}h?)/i) || 
                              bodyText.match(/Abertura[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
        const matchFechamento = bodyText.match(/Fechamento\s+a\s+partir\s+de\s+(\d{2}\/\d{2}\/\d{4}\s+às\s+\d{2}:\d{2}h?)/i) ||
                                bodyText.match(/Fechamento[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i) ||
                                bodyText.match(/Encerramento[:\s]+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);

        const dateStart = matchAbertura ? parseDataBr(matchAbertura[1]) : null;
        const dateEnd = matchFechamento ? parseDataBr(matchFechamento[1]) : null;

        const lotNumber = link.split("/").filter(Boolean).pop() || `AT-${Math.floor(1000 + Math.random() * 9000)}`;

        const lotData: AuctionLot = {
          source: "autotran",
          source_lot_id: lotNumber,
          numero_lote: lotNumber,
          veiculo_origem: title,
          link_leilao: link,
          tipo_sucata: mapearTipoSucata(title + " " + bodyText),
          image_url: imageUrl,
          auction_start_at: dateStart,
          auction_end_at: dateEnd,
          fonte: "AutoTran Leilões",
          raw: {
            title,
            category,
            url: link,
            lot_pictures: images
          }
        };

        veiculosEncontrados.push(lotData);
        limit++;
      } catch (e: any) {
        console.error(`[AutoTran] Erro ao carregar detalhes do link ${link}:`, e.message);
      }
    }

  } catch (error: any) {
    console.error("🚨 [AutoTran] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [AutoTran] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
