import schedule from "node-schedule";
import { extrairDadosLeiloesMS } from "@/services/leiloesScraper";
import { extrairDadosSodre } from "@/services/sodreScraper";
import { extrairDadosMarcaLeiloes } from "@/services/marcaLeiloesScraper";
import { extrairDadosCopart } from "@/services/copartScraper";
import { extrairDadosSuperbid } from "@/services/superbidScraper";
import { extrairDadosMilanLeiloes } from "@/services/milanLeiloesScraper";
import { extrairDadosCasaDeLeiloes } from "@/services/casaDeLeiloesScraper";
import { extrairDadosRicoLeiloes } from "@/services/ricoLeiloesScraper";
import { extrairDadosSumareLeiloes } from "@/services/sumareleiloesScraper";
import { extrairDadosReginaAude } from "@/services/reginaAudeScraper";
import { extrairDadosAutoTran } from "@/services/autotranScraper";
import { extrairDadosLeilo } from "@/services/leiloScraper";
import { extrairDadosGuariglia } from "@/services/guarigliaScraper";
import { ensureAuctionLotsTable, insertAuctionLots, deleteExpiredAuctionLots } from "@/db/auctions";

/** Aguarda N milissegundos antes de continuar */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Intervalo mínimo entre cada scraper (em milissegundos) */
const INTERVALO_ENTRE_SCRAPERS_MS = 5 * 60 * 1000; // 5 minutos

/** Executa um scraper e salva os lotes, exibindo tempo decorrido */
async function runScraper(
  nome: string,
  scraperFn: () => Promise<any[]>
): Promise<number> {
  console.log(`\n⏰ [Scheduler] ▶ Iniciando: ${nome}...`);
  const inicio = Date.now();

  const lotes = await scraperFn().catch((err) => {
    console.error(`⏰ [Scheduler] ❌ Erro em ${nome}:`, err.message);
    return [];
  });

  await insertAuctionLots(lotes);

  const secs = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(
    `⏰ [Scheduler] ✅ ${nome} concluído em ${secs}s — ${lotes.length} lote(s) salvos.`
  );
  return lotes.length;
}

export function initScheduler() {
  console.log("⏰ [Scheduler] Inicializando agendador de scrapers...");

  // Agenda para rodar todos os dias às 02:00 da manhã.
  // Com 6 scrapers × 5 min de intervalo → termina aprox. às 02:30.
  schedule.scheduleJob("0 2 * * *", async () => {
    const inicioTotal = Date.now();
    console.log("⏰ [Scheduler] ══════════════════════════════════════");
    console.log("⏰ [Scheduler] Iniciando sincronização diária de leilões...");
    console.log("⏰ [Scheduler] ══════════════════════════════════════");

    try {
      await ensureAuctionLotsTable();

      // Limpeza de expirados antes de sincronizar
      const cleanedCount = await deleteExpiredAuctionLots();
      console.log(`⏰ [Scheduler] 🗑  Limpeza: ${cleanedCount} lotes expirados removidos.`);

      // ── Scrapers executados sequencialmente com 5 min de intervalo ──────
      const scrapers: Array<{ nome: string; fn: () => Promise<any[]> }> = [
        { nome: "Regina Aude",    fn: extrairDadosReginaAude   },
        { nome: "AutoTran",       fn: extrairDadosAutoTran     },
        { nome: "Leiló",          fn: extrairDadosLeilo        },
        { nome: "Guariglia",      fn: extrairDadosGuariglia    },
        { nome: "Sumaré Leilões", fn: extrairDadosSumareLeiloes },
        { nome: "Rico Leilões",   fn: extrairDadosRicoLeiloes },
        { nome: "Casa de Leilões", fn: extrairDadosCasaDeLeiloes },
        { nome: "Leilões MS",    fn: extrairDadosLeiloesMS    },
        { nome: "Sodré Santoro", fn: extrairDadosSodre        },
        { nome: "Marca Leilões", fn: extrairDadosMarcaLeiloes },
        { nome: "Copart Brasil", fn: extrairDadosCopart       },
        { nome: "Superbid",      fn: extrairDadosSuperbid     },
        { nome: "Milan Leilões", fn: extrairDadosMilanLeiloes },
      ];

      let totalLotes = 0;

      for (let i = 0; i < scrapers.length; i++) {
        const { nome, fn } = scrapers[i];
        totalLotes += await runScraper(nome, fn);

        // Aguarda 5 min entre scrapers (exceto após o último)
        if (i < scrapers.length - 1) {
          console.log(
            `⏰ [Scheduler] ⏳ Aguardando ${INTERVALO_ENTRE_SCRAPERS_MS / 60000} min antes do próximo scraper...`
          );
          await sleep(INTERVALO_ENTRE_SCRAPERS_MS);
        }
      }

      const minTotal = ((Date.now() - inicioTotal) / 60000).toFixed(1);
      console.log("\n⏰ [Scheduler] ══════════════════════════════════════");
      console.log(`⏰ [Scheduler] ✅ Sincronização diária finalizada!`);
      console.log(`⏰ [Scheduler]    Total de lotes salvos : ${totalLotes}`);
      console.log(`⏰ [Scheduler]    Duração total         : ${minTotal} min`);
      console.log("⏰ [Scheduler] ══════════════════════════════════════\n");
    } catch (error: any) {
      console.error("🚨 [Scheduler] Erro crítico na rotina diária:", error.message || error);
    }
  });
}
