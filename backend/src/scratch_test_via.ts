import { chromium } from "playwright";

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Acessando home page...");
  await page.goto("https://www.vialeiloes.com.br/", { waitUntil: "networkidle", timeout: 45000 });
  
  console.log("Preenchendo campo de busca...");
  await page.fill("#TextBoxBuscaTopo", "sucata");
  await page.press("#TextBoxBuscaTopo", "Enter");
  
  console.log("Aguardando navegação...");
  await page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
  
  console.log("Nova URL após busca:", page.url());

  await browser.close();
}

test().catch(console.error);
