import { Router, Request, Response } from "express";
import { extrairDadosLeiloesMS, AuctionLot } from "@/services/leiloesScraper";
import { extrairDadosSodre } from "@/services/sodreScraper";

const router = Router();

// POST /api/auctions/sync/:source
router.post("/sync/:source", async (req: Request, res: Response) => {
  const { source } = req.params;

  try {
    console.log(`🔄 Iniciando sync: ${source}`);
    
    let lotes: AuctionLot[] = [];

    switch (source.toLowerCase()) {
      case "leiloes-ms":
        lotes = await extrairDadosLeiloesMS();
        break;
      case "sodre":
        lotes = await extrairDadosSodre();
        break;
      case "superbid":
      case "copart":
      case "autotran":
      case "pestana":
      case "marca-leiloes":
        return res.status(501).json({ 
          error: "Scraper ainda não implementado",
          source,
          message: "Implemente nas fases seguintes"
        });
      default:
        return res.status(400).json({ error: "Source desconhecido" });
    }

    res.json({ 
      success: true, 
      source, 
      count: lotes.length,
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
router.get("/", (req: Request, res: Response) => {
  res.json({ 
    message: "Busca no banco de dados - Implemente integração Supabase",
    available_endpoints: [
      "POST /api/auctions/sync/leiloes-ms",
      "POST /api/auctions/sync/sodre",
      "GET /api/auctions"
    ]
  });
});

// POST /api/auctions/webhook/n8n (receber dados processados)
router.post("/webhook/n8n", (req: Request, res: Response) => {
  console.log("📩 Webhook N8N recebido:", {
    lotes_count: req.body.lotes?.length || 0,
    timestamp: new Date()
  });
  res.json({ success: true, message: "Webhook recebido" });
});

export default router;
