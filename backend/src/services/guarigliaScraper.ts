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

const BASE_URL = "https://www.guariglialeiloes.com.br";

function parseDataBr(dataStr: string, horaStr: string): string | null {
  try {
    const dataMatch = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const horaMatch = horaStr.match(/(\d{2}):(\d{2})/);
    if (!dataMatch || !horaMatch) return null;
    const [_, dia, mes, ano] = dataMatch;
    const [__, hora, minuto] = horaMatch;
    return `${ano}-${mes}-${dia}T${hora}:${minuto}:00`;
  } catch (e) {
    return null;
  }
}

export async function extrairDadosGuariglia(): Promise<AuctionLot[]> {
  console.log("🔱 [Guariglia] Iniciando Arrastão...");
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

    // Bloquear scripts de terceiros/analytics para evitar timeouts
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (
        url.includes("analytics") ||
        url.includes("google-optimize") ||
        url.includes("facebook") ||
        url.includes("sentry") ||
        url.includes("googletagmanager") ||
        url.includes("facebook.net")
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const searchUrl = `${BASE_URL}/lotes/search?search=sucata`;
    console.log(`[Guariglia] Acessando busca: ${searchUrl}`);
    
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Esperar um curto período para carregamento do HTML dinâmico, se aplicável
    await page.waitForSelector(".lote.rounded", { timeout: 10000 }).catch(() => {});

    const content = await page.content();
    const $ = cheerio.load(content);
    const linksDeLotes = new Set<string>();

    $(".lote.rounded a").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/item/") && href.includes("/detalhes")) {
        const fullUrl = href.startsWith("http") ? href : new URL(href, BASE_URL).toString();
        linksDeLotes.add(fullUrl);
      }
    });

    console.log(`📡 [Guariglia] ${linksDeLotes.size} links de lotes identificados.`);

    let limit = 0;
    for (const link of linksDeLotes) {
      if (limit >= 30) break; // Evita sobrecarga de rede/tempo

      try {
        console.log(`[Guariglia] Coletando lote: ${link}`);
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 15000 });
        // Pequena pausa para garantir renderização local das imagens
        await page.waitForTimeout(500).catch(() => {});
        const lotContent = await page.content();
        const $lot = cheerio.load(lotContent);

        // Extrai ID do item do link (ex: https://www.guariglialeiloes.com.br/item/99863/detalhes...)
        const urlObj = new URL(link);
        const parts = urlObj.pathname.split("/");
        const itemId = parts[parts.indexOf("item") + 1] || `GU-${Math.floor(10000 + Math.random() * 90000)}`;

        // Informações básicas da descrição (Normalmente h4 do lote)
        const headerText = $lot("h4").first().text().trim(); // Ex: CHEVROLET/CELTA 3 PORTAS - D*****9 - 2004 - 2004 - Sucata
        
        let title = headerText || "Veículo Sem Título";
        let marca: string | null = null;
        let modelo: string | null = null;
        let placa: string | null = null;
        let ano: string | null = null;

        // Se o h4 for no formato completo, faz o parse fino
        if (headerText.includes(" - ")) {
          const partsText = headerText.split(" - ");
          const marcaModelo = partsText[0] || "";
          placa = partsText[1] || null;
          ano = partsText[2] || null;

          if (marcaModelo.includes("/")) {
            const mmParts = marcaModelo.split("/");
            marca = mmParts[0].trim();
            modelo = mmParts[1].trim();
            title = marcaModelo;
          } else {
            marca = null;
            modelo = marcaModelo.trim();
            title = marcaModelo;
          }
        } else {
          // Fallback a partir de seletores da página
          const bodyText = $lot("body").text();
          const matchMarcaModelo = bodyText.match(/Marca\/Modelo:\s*([^\n<]+)/i);
          if (matchMarcaModelo) {
            const mm = matchMarcaModelo[1].trim();
            title = mm;
            if (mm.includes("/")) {
              const mmParts = mm.split("/");
              marca = mmParts[0].trim();
              modelo = mmParts[1].trim();
            }
          }
          const matchPlaca = bodyText.match(/Placa:\s*([A-Z0-9*-]+)/i);
          if (matchPlaca) placa = matchPlaca[1].trim();

          const matchAno = bodyText.match(/Ano\/Modelo:\s*([0-9/]+)/i);
          if (matchAno) ano = matchAno[1].trim().split("/")[0];
        }

        // Valida se é sucata veicular
        const textoValidacao = `${title} ${headerText}`.toUpperCase();
        if (!isSucataVeicularValida(textoValidacao)) {
          console.log(`[Guariglia] Ignorando lote não-veicular ou inválido: ${title}`);
          continue;
        }

        // Fotos do lote
        const images: string[] = [];
        $lot("img").each((_, el) => {
          const src = $lot(el).attr("src") || "";
          if (src.includes("/watermark/bens/")) {
            const absSrc = src.startsWith("http") ? src : new URL(src, BASE_URL).toString();
            if (!images.includes(absSrc)) {
              images.push(absSrc);
            }
          }
        });

        const imageUrl = images[0] || "";

        // Datas
        const bodyText = $lot("body").text().replace(/\s+/g, ' ');
        const dateMatch = bodyText.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})/i);
        const timeMatch = bodyText.match(/Horário:\s*(\d{2}:\d{2})/i);

        let dateStart: string | null = null;
        if (dateMatch && timeMatch) {
          dateStart = parseDataBr(dateMatch[1], timeMatch[1]);
        }

        const lotData: AuctionLot = {
          source: "guariglia",
          source_lot_id: itemId,
          numero_lote: itemId,
          veiculo_origem: title,
          link_leilao: link,
          tipo_sucata: mapearTipoSucata(textoValidacao),
          image_url: imageUrl,
          auction_start_at: dateStart,
          auction_end_at: dateStart, // Geralmente leilão único de batida
          fonte: "Guariglia Leilões",
          marca,
          modelo,
          ano,
          placa,
          raw: {
            itemId,
            fullHeader: headerText,
            lot_pictures: images
          }
        };

        veiculosEncontrados.push(lotData);
        limit++;
      } catch (e: any) {
        console.error(`[Guariglia] Erro ao carregar detalhes do link ${link}:`, e.message);
      }
    }

  } catch (error: any) {
    console.error("🚨 [Guariglia] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [Guariglia] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
