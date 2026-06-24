import { Router, Request, Response } from "express";
import { extrairDadosLeiloesMS, AuctionLot } from "@/services/leiloesScraper";
import { extrairDadosReginaAude } from "@/services/reginaAudeScraper";
import { extrairDadosAutoTran } from "@/services/autotranScraper";
import { extrairDadosLeilo } from "@/services/leiloScraper";
import { extrairDadosSodre } from "@/services/sodreScraper";
import { extrairDadosMarcaLeiloes } from "@/services/marcaLeiloesScraper";
import { extrairDadosCopart } from "@/services/copartScraper";
import { extrairDadosSuperbid } from "@/services/superbidScraper";
import { extrairDadosMilanLeiloes } from "@/services/milanLeiloesScraper";
import { extrairDadosGuariglia } from "@/services/guarigliaScraper";
import { extrairDadosCasaDeLeiloes } from "@/services/casaDeLeiloesScraper";
import { extrairDadosRicoLeiloes } from "@/services/ricoLeiloesScraper";
import { ensureAuctionLotsTable, insertAuctionLots, fetchAuctionLots, fetchAuctionLotById, deleteExpiredAuctionLots } from "@/db/auctions";

const router = Router();

// POST /api/auctions/sync/:source
router.post("/sync/:source", async (req: Request, res: Response) => {
  const { source } = req.params;

  try {
    await ensureAuctionLotsTable();
    await deleteExpiredAuctionLots();

    console.log(`🔄 Iniciando sync: ${source}`);
    
    let lotes: AuctionLot[] = [];

    switch (source.toLowerCase()) {
      case "rico-leiloes":
        lotes = await extrairDadosRicoLeiloes();
        break;
      case "casa-de-leiloes":
        lotes = await extrairDadosCasaDeLeiloes();
        break;
      case "regina-aude":
        lotes = await extrairDadosReginaAude();
        break;
      case "leiloes-ms":
        lotes = await extrairDadosLeiloesMS();
        break;
      case "autotran":
        lotes = await extrairDadosAutoTran();
        break;
      case "leilo":
        lotes = await extrairDadosLeilo();
        break;
      case "sodre":
        lotes = await extrairDadosSodre();
        break;
      case "marca-leiloes":
        lotes = await extrairDadosMarcaLeiloes();
        break;
      case "copart":
        lotes = await extrairDadosCopart();
        break;
      case "superbid":
        lotes = await extrairDadosSuperbid();
        break;
      case "milan":
      case "milan-leiloes":
        lotes = await extrairDadosMilanLeiloes();
        break;
      case "guariglia":
        lotes = await extrairDadosGuariglia();
        break;
      case "pestana":
        return res.status(501).json({ 
          error: "Scraper ainda não implementado",
          source,
          message: "Implemente nas fases seguintes"
        });
      default:
        return res.status(400).json({ error: "Source desconhecido" });
    }

    const savedCount = await insertAuctionLots(lotes);

    res.json({ 
      success: true, 
      source, 
      count: lotes.length,
      savedCount,
      lotes 
    });
  } catch (error: any) {
    console.error(`❌ Erro em ${source}:`, error.message);
    res.status(500).json({ 
      error: error.message,
      source,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// GET /api/auctions (listar lotes)
router.get("/", async (req: Request, res: Response) => {
  try {
    await ensureAuctionLotsTable();
    await deleteExpiredAuctionLots();
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;
    const lotes = await fetchAuctionLots(limit);
    res.json({ success: true, count: lotes.length, lotes });
  } catch (error: any) {
    console.error("❌ Erro ao buscar lotes:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auctions/:id (obter lote por id)
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await ensureAuctionLotsTable();
    const lot = await fetchAuctionLotById(parseInt(id, 10));
    if (!lot) {
      return res.status(404).json({ error: "Lote não encontrado" });
    }
    res.json({ success: true, lot });
  } catch (error: any) {
    console.error(`❌ Erro ao buscar lote ${id}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
