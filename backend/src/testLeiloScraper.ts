import { extrairDadosLeilo } from './services/leiloScraper';

(async () => {
  console.log("Running Leiló scraper test...");
  try {
    const lotes = await extrairDadosLeilo();
    console.log(`Success! Found ${lotes.length} lots.`);
    if (lotes.length > 0) {
      console.log("First lot sample:", JSON.stringify(lotes[0], null, 2));
    }
  } catch (err) {
    console.error("Scraper failed:", err);
  }
})();
