import express from "express";
import cors from "cors";
import config from "@/config/index";
import auctionsRouter from "@/routes/auctions";
import authRouter from "@/routes/auth";
import { ensureAuctionLotsTable } from "@/db/auctions";
import { ensureUsersTable, seedAdminUser } from "@/db/users";
import { initScheduler } from "@/scheduler/cron";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root status
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "leilao-backend",
    environment: config.NODE_ENV,
    available: [
      "GET /health",
      "POST /api/auctions/sync/:source",
      "GET /api/auctions",
      "POST /api/auth/login",
      "GET /api/auth/me"
    ]
  });
});

// Rotas
app.use("/api/auctions", auctionsRouter);
app.use("/api/auth", authRouter);

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

async function startServer() {
  try {
    await ensureAuctionLotsTable();
    await ensureUsersTable();
    await seedAdminUser();
    initScheduler();
    app.listen(config.PORT, () => {
      console.log(`🚀 Backend rodando em http://localhost:${config.PORT}`);
      console.log(`📊 Ambiente: ${config.NODE_ENV}`);
      console.log(`📝 Webhooks N8N configurados`);
    });
  } catch (error: any) {
    console.error("❌ Falha ao inicializar o banco de dados:", error.message || error);
    process.exit(1);
  }
}

startServer();

export default app;
