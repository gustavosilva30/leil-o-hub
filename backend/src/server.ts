import express from "express";
import cors from "cors";
import config from "@/config/index";
import auctionsRouter from "@/routes/auctions";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/auctions", auctionsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date(),
    environment: config.NODE_ENV
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint não encontrado",
    path: req.path,
    available: [
      "GET /health",
      "POST /api/auctions/sync/:source",
      "GET /api/auctions"
    ]
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${config.PORT}`);
  console.log(`📊 Ambiente: ${config.NODE_ENV}`);
  console.log(`📝 Webhooks N8N configurados`);
});

export default app;
