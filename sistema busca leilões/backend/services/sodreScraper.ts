import axios from "axios";
import { chromium } from "playwright";
import { mapearTipoSucata } from "../utils/validadorSucata";

const WEBHOOK_SODRE = "https://n8n.douradosap.com.br/webhook/receber-sodre";

// Interface atualizada para incluir as datas
export interface SodreLot {
    numero_lote: string;
    veiculo_origem: string;
    link_leilao: string;
    tipo_sucata: string;
    image_url: string;
    auction_start_at: string | null;
    auction_end_at: string | null;
    fonte: string;
}

export const extrairDadosSodre = async () => {
    console.log("🔱 [Sodre] Iniciando Arrastão Dourados AP (Stealth + Datas)...");
    let veiculosEncontrados: SodreLot[] = [];
    let browser;

    try {
        browser = await chromium.launch({ headless: true });
        
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            locale: "pt-BR",
        });
        const page = await context.newPage();

        console.log('[Sodre] Gerando cookies e furando o Firewall...');
        await page.goto('https://www.sodresantoro.com.br/sucatas/lotes', { 
            waitUntil: 'networkidle', 
            timeout: 60000 
        });

        const payloadBusca = {
            "indices":["sucatas"],
            "query":{"bool":{"filter":[{"bool":{"should":[{"bool":{"must":[{"term":{"auction_status":"online"}}]}},{"bool":{"must":[{"term":{"auction_status":"aberto"}}],"must_not":[{"terms":{"lot_status_id":[5,7]}}]}},{"bool":{"must":[{"term":{"auction_status":"encerrado"}},{"terms":{"lot_status_id":[6]}}]}}],"minimum_should_match":1}},{"bool":{"should":[{"bool":{"must_not":{"term":{"lot_status_id":6}}}},{"bool":{"must":[{"term":{"lot_status_id":6}},{"term":{"segment_id":1}}]}}],"minimum_should_match":1}},{"bool":{"should":[{"bool":{"must_not":[{"term":{"lot_test":true}}]}}],"minimum_should_match":1}}]}},
            "from":0,
            "size":100, 
            "sort":[{"lot_status_id_order":{"order":"asc"}},{"auction_date_init":{"order":"asc"}}]
        };

        const data = await page.evaluate(async (bodyData) => {
            const resposta = await fetch('https://www.sodresantoro.com.br/api/search-lots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(bodyData)
            });
            return resposta.json();
        }, payloadBusca);

        if (data && data.results && Array.isArray(data.results)) {
            console.log(`📡 [Sodre] API entregou ${data.results.length} lotes brutos.`);

            for (const carro of data.results) {
                // Filtro de segurança do próprio Sodré
                if (carro.lot_is_scrap !== true) continue; 

                const tituloBase = carro.lot_title || "Sodré";
                const titulo = `SUCATA - ${tituloBase}`;
                const foto = carro.lot_pictures && carro.lot_pictures.length > 0 ? carro.lot_pictures[0] : "";
                
                // Lote Blindado: Lote + ID Único do Sodré
                const numeroLoteBruto = carro.lot_number !== "Indef." ? carro.lot_number : carro.lot_inspection_number;
                const numeroLote = numeroLoteBruto ? `${numeroLoteBruto}-${carro.lot_id}` : String(carro.lot_id);

                const link = `https://www.sodresantoro.com.br/leilao/${carro.auction_id}/lote/${carro.lot_id}/`;

                // --- TRATAMENTO DE DATAS DA API ---
                // O Sodré costuma enviar timestamps ou strings ISO. 
                // Convertemos para garantir que o Supabase aceite.
                const formatarData = (d: any) => d ? new Date(d).toISOString() : null;

                if (numeroLote && foto) {
                    veiculosEncontrados.push({
                        numero_lote: String(numeroLote),
                        veiculo_origem: titulo.slice(0, 120),
                        link_leilao: link,
                        tipo_sucata: mapearTipoSucata(titulo),
                        image_url: foto,
                        auction_start_at: formatarData(carro.auction_date_init),
                        auction_end_at: formatarData(carro.auction_date_limit || carro.auction_date_end),
                        fonte: "Sodré Santoro"
                    });
                }
            }
        }

    } catch (error: any) {
        console.error('[Sodre] Erro no Playwright:', error.message);
    } finally {
        if (browser) await browser.close();
    }

    if (veiculosEncontrados.length > 0) {
        try {
            await axios.post(WEBHOOK_SODRE, { lotes: veiculosEncontrados });
            console.log(`🚀 [Sodre] ${veiculosEncontrados.length} lotes com datas enviados para o CRM!`);
        } catch (err) {
            console.error("[Sodre] Erro ao enviar para o n8n.");
        }
    } else {
        console.log('[Sodre] Nenhum lote novo encontrado.');
    }
};