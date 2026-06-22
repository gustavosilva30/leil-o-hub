import schedule from "node-schedule";
import { extrairDadosLeiloesMS } from "@/services/leiloesScraper";
import { extrairDadosSodre } from "@/services/sodreScraper";
import { extrairDadosMarcaLeiloes } from "@/services/marcaLeiloesScraper";
import { extrairDadosCopart } from "@/services/copartScraper";
import { ensureAuctionLotsTable, insertAuctionLots, deleteExpiredAuctionLots } from "@/db/auctions";

export function initScheduler() {
  console.log("⏰ [Scheduler] Inicializando agendador de scrapers...");

  // Agenda para rodar todos os dias às 02:00 da manhã
  // Padrão cron: minuto hora dia-do-mês mês dia-da-semana
  schedule.scheduleJob("0 2 * * *", async () => {
    console.log("⏰ [Scheduler] Iniciando sincronização diária de leilões...");
    try {
      await ensureAuctionLotsTable();
      
      // Limpeza de expirados antes de sincronizar
      const cleanedCount = await deleteExpiredAuctionLots();
      console.log(`⏰ [Scheduler] Limpeza concluída. ${cleanedCount} lotes expirados removidos.`);

      // Executa os scrapers sequencialmente
      console.log("⏰ [Scheduler] Sincronizando Leilões MS...");
      const lotsMS = await extrairDadosLeiloesMS().catch(err => {
        console.error("Erro ao rodar Leilões MS:", err.message);
        return [];
      });
      await insertAuctionLots(lotsMS);

      console.log("⏰ [Scheduler] Sincronizando Sodré Santoro...");
      const lotsSodre = await extrairDadosSodre().catch(err => {
        console.error("Erro ao rodar Sodré:", err.message);
        return [];
      });
      await insertAuctionLots(lotsSodre);

      console.log("⏰ [Scheduler] Sincronizando Marca Leilões...");
      const lotsMarca = await extrairDadosMarcaLeiloes().catch(err => {
        console.error("Erro ao rodar Marca Leilões:", err.message);
        return [];
      });
      await insertAuctionLots(lotsMarca);

      console.log("⏰ [Scheduler] Sincronizando Copart Brasil...");
      const lotsCopart = await extrairDadosCopart().catch(err => {
        console.error("Erro ao rodar Copart:", err.message);
        return [];
      });
      await insertAuctionLots(lotsCopart);

      console.log("⏰ [Scheduler] Sincronização diária finalizada com sucesso!");
    } catch (error: any) {
      console.error("🚨 [Scheduler] Erro na rotina diária do agendador:", error.message || error);
    }
  });
}
