import axios from "axios";

const url = "https://www.sodresantoro.com.br/veiculos/lotes?term=sucata";

async function main() {
    const { data: html } = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            "Referer": "https://www.sodresantoro.com.br/",
        },
        timeout: 15000,
    });

    const s = html as string;
    console.log("HTML length:", s.length);

    // Check for __NEXT_DATA__
    const nextMatch = s.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextMatch) {
        console.log("Found __NEXT_DATA__");
        try {
            const json = JSON.parse(nextMatch[1]);
            console.log("Keys:", Object.keys(json));
        } catch (e) {
            console.log("Parse error");
        }
    } else {
        console.log("No __NEXT_DATA__");
    }

    // __NUXT__ extraction
    const idx = s.indexOf("window.__NUXT__=");
    if (idx >= 0) {
        const start = idx + "window.__NUXT__=".length;
        let depth = 0;
        let inStr = false;
        let strChar = "";
        let end = start;
        const firstCh = s[start];
        const open = firstCh === "(" ? "(" : "{";
        const close = firstCh === "(" ? ")" : "}";
        for (let i = start; i < Math.min(start + 500000, s.length); i++) {
            const c = s[i];
            if (!inStr) {
                if (c === open) depth++;
                else if (c === close) {
                    depth--;
                    if (depth === 0) {
                        end = i + 1;
                        break;
                    }
                } else if (c === '"' || c === "'") {
                    inStr = true;
                    strChar = c;
                }
            } else if (c === strChar && s[i - 1] !== "\\") inStr = false;
        }
        const jsonStr = s.slice(start, end).trim();
        const toParse = jsonStr.startsWith("(") ? jsonStr.slice(1, -1) : jsonStr;
        try {
            const nuxt = JSON.parse(toParse);
            console.log("__NUXT__ keys:", Object.keys(nuxt));
            if (nuxt.data?.[0]) {
                const d = nuxt.data[0];
                console.log("data[0] keys:", Object.keys(d));
                const lots = d.lots || d.lotes || d.data;
                if (lots?.length) {
                    console.log("Lots count:", lots.length);
                    console.log("First lot:", JSON.stringify(lots[0], null, 2).slice(0, 600));
                }
            }
        } catch (e) {
            console.log("Parse error:", (e as Error).message);
        }
    }

    // All links containing lot or lote (excluding assets)
    const allHrefs = [...s.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    const lotRelated = allHrefs.filter(
        (h) => h.includes("lot") && !h.includes("_nuxt") && !h.includes(".css") && !h.includes(".js")
    );
    console.log("Lot-related links:", lotRelated.length);
    const samples = [...new Set(lotRelated)].slice(0, 10);
    console.log("Samples:", samples);

    // Look for API-like URLs in script
    const apiMatches = s.match(/["'](\/api\/[^"']+)["']/g);
    if (apiMatches) console.log("API paths:", [...new Set(apiMatches)].slice(0, 5));

    // Look for fetch/axios URLs
    const fetchMatches = s.match(/["'](https?:\/\/[^"']*sodresantoro[^"']*)["']/g);
    if (fetchMatches) console.log("Sodre URLs in HTML:", [...new Set(fetchMatches)].slice(0, 10));
}

main().catch(console.error);
