import axios from "axios";
import * as cheerio from "cheerio";
import { chromium } from "playwright";

export interface AuctionLot {
  source: string;
  source_lot_id?: string;
  title?: string;
  lot_url?: string;
  image_url?: string;
  auction_start_at?: string | null;
  auction_end_at?: string | null;
  raw?: any;
}

type SourceDef = {
  id: string;
  name: string;
  url: string;
  requires?: string;
};

async function axiosExtract(source: SourceDef): Promise<AuctionLot[]> {
  const res = await axios.get(source.url, { timeout: 30_000 });
  const html = res.data;
  const $ = cheerio.load(html);

  const results: AuctionLot[] = [];

  // tentativa genérica: coletar links que pareçam apontar para lotes
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const hrefLower = href.toLowerCase();
    if (hrefLower.includes("lote") || hrefLower.includes("leil") || hrefLower.includes("lot") || text.toLowerCase().includes("lote") || text.toLowerCase().includes("leil")) {
      const lotUrl = href.startsWith("http") ? href : new URL(href, source.url).toString();
      results.push({ source: source.id, title: text || undefined, lot_url: lotUrl, raw: { href } });
    }
    if (results.length >= 10) return false; // limitar para prova de conceito
  });

  return results;
}

async function playwrightExtract(source: SourceDef): Promise<AuctionLot[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(source.url, { waitUntil: "networkidle", timeout: 45_000 });
  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const results: AuctionLot[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    const hrefLower = href.toLowerCase();
    if (hrefLower.includes("lote") || hrefLower.includes("leil") || hrefLower.includes("lot") || text.toLowerCase().includes("lote") || text.toLowerCase().includes("leil")) {
      const lotUrl = href.startsWith("http") ? href : new URL(href, source.url).toString();
      results.push({ source: source.id, title: text || undefined, lot_url: lotUrl, raw: { href } });
    }
    if (results.length >= 10) return false;
  });

  return results;
}

export async function scrapeSource(source: SourceDef): Promise<AuctionLot[]> {
  try {
    if (source.requires && source.requires.toLowerCase().includes("playwright")) {
      return await playwrightExtract(source);
    }
    // fallback para axios/cheerio
    return await axiosExtract(source);
  } catch (err) {
    console.error(`Erro ao raspar ${source.id}:`, (err as any).message || err);
    return [];
  }
}

export default {
  scrapeSource,
};
