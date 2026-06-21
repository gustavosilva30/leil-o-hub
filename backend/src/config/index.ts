import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Webhooks N8N
  WEBHOOK_N8N_LEILOES_MS: 
    process.env.WEBHOOK_N8N_LEILOES_MS ||
    "https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331",
  WEBHOOK_N8N_SODRE:
    process.env.WEBHOOK_N8N_SODRE ||
    "https://n8n.douradosap.com.br/webhook/receber-sodre",
  WEBHOOK_N8N_SUPERBID:
    process.env.WEBHOOK_N8N_SUPERBID ||
    "https://n8n.douradosap.com.br/webhook/receber-superbid",
  WEBHOOK_N8N_COPART:
    process.env.WEBHOOK_N8N_COPART ||
    "https://n8n.douradosap.com.br/webhook/receber-copart",
  WEBHOOK_N8N_AUTOTRAN:
    process.env.WEBHOOK_N8N_AUTOTRAN ||
    "https://n8n.douradosap.com.br/webhook/receber-autotran",
  WEBHOOK_N8N_PESTANA:
    process.env.WEBHOOK_N8N_PESTANA ||
    "https://n8n.douradosap.com.br/webhook/receber-pestana",
  WEBHOOK_N8N_MARCA_LEILOES:
    process.env.WEBHOOK_N8N_MARCA_LEILOES ||
    "https://n8n.douradosap.com.br/webhook/receber-marca-leiloes",

  // Supabase (se usar)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
};

export default config;
