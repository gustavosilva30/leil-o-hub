import axios from "axios";
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";

export interface AuctionLot {
  source: string;
  source_lot_id?: string;
  numero_lote: string;
  veiculo_origem: string;
  link_leilao: string;
  tipo_sucata: string;
  image_url: string;
  auction_start_at: string | null;
  auction_end_at: string | null;
  fonte: string;
  marca?: string | null;
  modelo?: string | null;
  ano?: string | null;
  placa?: string | null;
  raw?: any;
}

export async function extrairDadosLeilo(): Promise<AuctionLot[]> {
  console.log("🔱 [Leiló] Iniciando Arrastão...");
  const veiculosEncontrados: AuctionLot[] = [];

  try {
    const payload = {
      from: 0,
      size: 50, // Limite razoável para sync
      listaOrdenacao: [
        {
          campo: "dataFim",
          tipoCampo: "long",
          tipoOrdenacao: "asc"
        }
      ],
      requisicoesBusca: [
        {
          campo: "tipo",
          tipo: "exata",
          label: "Tipo",
          valor: "Sucatas"
        }
      ]
    };

    const res = await axios.post("https://api.leilo.com.br/v1/lote/busca-elastic", payload, {
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://leilo.com.br",
        "Referer": "https://leilo.com.br/leilao/sucatas",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 15000
    });

    if (res.status === 201 && Array.isArray(res.data)) {
      console.log(`📡 [Leiló] ${res.data.length} lotes retornados pela API.`);
      
      for (const item of res.data) {
        const title = item.nome || "";
        const idUnico = item.id || String(item.numero);

        // Valida se o lote é do tipo sucata/veículo
        const textoValidacao = `${title} ${item.veiculo?.infocarModelo || ""} ${item.tipo || ""}`.toUpperCase();
        if (!isSucataVeicularValida(textoValidacao)) {
          continue;
        }

        const lotData: AuctionLot = {
          source: "leilo",
          source_lot_id: idUnico,
          numero_lote: String(item.numero || "0"),
          veiculo_origem: title,
          link_leilao: `https://leilo.com.br/lote/${idUnico}`,
          tipo_sucata: mapearTipoSucata(textoValidacao),
          image_url: item.fotosUrls?.[0] || "",
          auction_start_at: item.leilao?.data || null,
          auction_end_at: item.dataFim || null,
          fonte: "Leiló",
          marca: item.veiculo?.infocarMarca || null,
          modelo: item.veiculo?.infocarModelo || null,
          ano: item.veiculo?.anoModelo ? String(item.veiculo.anoModelo) : null,
          raw: {
            ...item,
            lot_pictures: item.fotosUrls || []
          }
        };

        veiculosEncontrados.push(lotData);
      }
    }
  } catch (error: any) {
    console.error("🚨 [Leiló] Erro no Scraper:", error?.message || error);
  }

  if (veiculosEncontrados.length > 0) {
    console.log(`🚀 [Leiló] ${veiculosEncontrados.length} lotes novos encontrados.`);
  }

  return veiculosEncontrados;
}
