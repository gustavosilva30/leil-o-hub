import fs from "fs/promises";
import path from "path";
import { scrapeSource } from "@/services/scraperTemplate";

type SourceDef = {
  id: string;
  name: string;
  url: string;
  priority?: string;
  requires?: string;
};

async function loadSources(): Promise<SourceDef[]> {
  const file = path.join(__dirname, "../../../data/sources_initial.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as SourceDef[];
}

async function run() {
  const sources = await loadSources();
  const targets = sources.filter((s) => s.id === "sodre" || s.id === "leiloes_ms");

  for (const src of targets) {
    console.log(`→ Iniciando scrape: ${src.id} (${src.url})`);
    const results = await scrapeSource(src as any);
    console.log(`  Encontrados: ${results.length} itens em ${src.id}`);
    if (results.length > 0) {
      console.log(results.slice(0, 5));
    }
  }
}

run().catch((err) => {
  console.error("Erro no worker:", err);
  process.exit(1);
});
