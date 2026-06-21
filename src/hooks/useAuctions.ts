import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface AuctionLot {
  numero_lote: string;
  veiculo_origem: string;
  link_leilao: string;
  tipo_sucata: "aproveitavel" | "inservivel";
  image_url: string;
  auction_start_at: string | null;
  auction_end_at: string | null;
  fonte: string;
}

export interface SyncResponse {
  success: boolean;
  source: string;
  count: number;
  lotes: AuctionLot[];
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/auctions";

export function useAuctions() {
  const queryClient = useQueryClient();
  const [lastSync, setLastSync] = useState<{ source: string; time: Date } | null>(null);

  // Listar lotes
  const { data: lotes, isLoading: loadingLotes } = useQuery({
    queryKey: ["auctions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Sync de um source
  const { mutate: sync, isPending, isSuccess } = useMutation({
    mutationFn: async (src: string): Promise<SyncResponse> => {
      const res = await fetch(`${API_BASE}/sync/${src}`, { 
        method: "POST" 
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      console.log(`✅ ${data.count} lotes sincronizados de ${data.source}`);
      setLastSync({ source: data.source, time: new Date() });
      // Invalidate queries para recarregar
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
    onError: (error) => {
      console.error("❌ Erro no sync:", error);
    },
  });

  return {
    lotes: lotes?.lotes || [],
    loadingLotes,
    sync,
    isPending,
    isSuccess,
    lastSync,
  };
}
