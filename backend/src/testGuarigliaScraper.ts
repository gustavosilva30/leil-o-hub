import { extrairDadosGuariglia } from './services/guarigliaScraper';

(async () => {
  console.log("Running Guariglia Leilões scraper integration test...");
  try {
    const lotes = await extrairDadosGuariglia();
    console.log(`Success! Found ${lotes.length} lots.`);
    if (lotes.length > 0) {
      console.log("First lot sample:", JSON.stringify(lotes[0], null, 2));
    }
  } catch (err) {
    console.error("Scraper failed:", err);
  }
})();
