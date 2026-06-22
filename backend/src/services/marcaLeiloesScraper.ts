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
  cor?: string | null;
  raw?: any;
}

const BASE_URL = "https://www.marcaleiloes.com.br";

function extrairModeloVeiculo(desc: string, defaultTitle: string): string {
  // Tenta extrair padrões da descrição
  const m1 = desc.match(/Ve\u00edculo\s*:\s*([^\r\n|]+)/i);
  if (m1 && m1[1].trim()) return m1[1].trim();

  const m2 = desc.match(/marca\/modelo\s*,\s*([^,.\r\n|]+)/i);
  if (m2 && m2[1].trim()) return m2[1].trim();

  const m3 = desc.match(/marca\/modelo\s*:\s*([^,.\r\n|]+)/i);
  if (m3 && m3[1].trim()) return m3[1].trim();

  if (desc && desc.length > 5) {
    const firstLine = desc.split(/[\r\n]+/)[0].trim();
    if (firstLine.length > 5 && firstLine.length < 100) {
      return firstLine;
    }
  }
  return defaultTitle;
}

export async function extrairDadosMarcaLeiloes(): Promise<AuctionLot[]> {
  console.log("🔱 [MarcaLeiloes] Iniciando Arrastão...");
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
    const linksDeLotes = new Set<string>();
    const termos = ["veiculo", "moto", "carro", "caminhao", "sucata"];
    
    for (const termo of termos) {
      console.log(`[MarcaLeiloes] Buscando por termo: ${termo}`);
      try {
        await page.goto(`${BASE_URL}/buscador?busca=${termo}`, {
          waitUntil: "networkidle",
          timeout: 45000,
        });

        const content = await page.content();
        const $ = cheerio.load(content);
        
        $("a").each((_, el) => {
          const href = $(el).attr("href") || "";
          if (href.includes("/lote/") && !href.includes("whatsapp") && !href.includes("facebook") && !href.includes("twitter") && !href.includes("mailto")) {
            const fullUrl = href.startsWith("http") ? href : new URL(href, BASE_URL).toString();
            linksDeLotes.add(fullUrl);
          }
        });
      } catch (e: any) {
        console.error(`[MarcaLeiloes] Erro ao buscar termo "${termo}":`, e.message);
      }
    }

    console.log(`📡 [MarcaLeiloes] ${linksDeLotes.size} links únicos de lotes identificados.`);

    let limit = 0;
    for (const link of linksDeLotes) {
      if (limit >= 30) break;
      
      try {
        console.log(`[MarcaLeiloes] Coletando lote: ${link}`);
        await page.goto(link, { waitUntil: "networkidle", timeout: 20000 });
        const lotContent = await page.content();
        const $lot = cheerio.load(lotContent);

        // Extrai o objeto window.lote
        const loteObj = await page.evaluate(() => {
          return (window as any).lote;
        }).catch(() => null);

        // Ignorar imóveis
        const isImovel = loteObj?.leilao?.stats?.lote?.bem?.imovel !== null && loteObj?.leilao?.stats?.lote?.bem?.imovel !== undefined;
        if (isImovel) {
          console.log(`[MarcaLeiloes] Ignorando imóvel: ${link}`);
          continue;
        }

        // Tenta extrair a descrição da página
        let descText = "";
        const descHeading = $lot("h6").filter((_, el) => $lot(el).text().trim().toLowerCase().includes("descri"));
        if (descHeading.length) {
          descText = descHeading.parent().text().replace(descHeading.text(), "").trim();
        } else {
          descText = $lot(".descricao, [class*='descricao']").text().trim();
        }

        const titleText = (loteObj?.descricao || loteObj?.leilao?.stats?.lote?.bem?.siteTitulo || $lot("h1").first().text() || "").trim();
        
        // Coleta atributos das listas (li)
        let placa = "";
        let ano = "";
        let cor = "";
        let renavam = "";
        let chassi = "";
        let marca = "";
        let modelo = "";

        $lot("li").each((_, el) => {
          const strong = $lot(el).find("strong").text().trim().toLowerCase();
          const p = $lot(el).find("p").text().trim();
          if (strong && p) {
            if (strong.includes("placa")) placa = p;
            else if (strong.includes("ano")) ano = p;
            else if (strong.includes("cor")) cor = p;
            else if (strong.includes("renavam")) renavam = p;
            else if (strong.includes("chassi")) chassi = p;
            else if (strong.includes("marca")) marca = p;
            else if (strong.includes("modelo")) modelo = p;
          }
        });

        // Valida se o lote é do tipo sucata/veículo
        const textoValidacao = `${titleText} ${descText} ${placa} ${chassi}`.toUpperCase();
        if (!isSucataVeicularValida(textoValidacao) && !textoValidacao.includes("VEÍCULO") && !textoValidacao.includes("VEICULO")) {
          console.log(`[MarcaLeiloes] Lote ignorado por validação de veículo: ${titleText}`);
          continue;
        }

        const veiculoNome = extrairModeloVeiculo(descText, titleText);
        const numeroLote = loteObj?.numero ? String(loteObj.numero) : (link.match(/lote\/(\d+)/i)?.[1] || `ML-${Math.floor(1000 + Math.random() * 9000)}`);
        
        let imageUrl = loteObj?.leilao?.stats?.lote?.bem?.image?.full?.url || loteObj?.leilao?.stats?.lote?.bem?.image?.min?.url || "";
        if (!imageUrl) {
          $lot("img").each((_, imgEl) => {
            const src = $lot(imgEl).attr("src") || "";
            if (src && (src.includes(".jpg") || src.includes(".png") || src.includes(".jpeg")) && !src.includes("logo")) {
              imageUrl = src.startsWith("http") ? src : new URL(src, BASE_URL).toString();
              return false; 
            }
          });
        }

        const parseDate = (dObj: any) => {
          if (!dObj || !dObj.date) return null;
          return dObj.date.replace(" ", "T");
        };

        const lotData: AuctionLot = {
          source: "marca-leiloes",
          source_lot_id: loteObj?.id ? String(loteObj.id) : undefined,
          numero_lote: numeroLote,
          veiculo_origem: veiculoNome,
          link_leilao: link,
          tipo_sucata: mapearTipoSucata(textoValidacao),
          image_url: imageUrl,
          auction_start_at: parseDate(loteObj?.leilao?.dataAbertura || loteObj?.leilao?.data1),
          auction_end_at: parseDate(loteObj?.dataFechamento || loteObj?.leilao?.dataProximoLeilao),
          fonte: "Marca Leilões",
          placa: placa || null,
          ano: ano || null,
          cor: cor || null,
          marca: marca || null,
          modelo: modelo || null,
          raw: loteObj || {
            title: titleText,
            url: link,
            description: descText
          }
        };

        veiculosEncontrados.push(lotData);
        limit++;
      } catch (e: any) {
        console.error(`[MarcaLeiloes] Erro ao carregar detalhes do link ${link}:`, e.message);
      }
    }

  } catch (error: any) {
    console.error("🚨 [MarcaLeiloes] Erro no Scraper:", error?.message || error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [MarcaLeiloes] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
