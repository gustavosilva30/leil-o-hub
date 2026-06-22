import { useAuctions, AuctionLot } from "@/src/hooks/useAuctions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import { useState } from "react";

const SOURCES = [
  { id: "leiloes-ms", label: "Leilões MS", color: "bg-blue-500" },
  { id: "regina-aude", label: "Regina Aude", color: "bg-rose-500" },
  { id: "sodre", label: "Sodré", color: "bg-purple-500" },
  { id: "superbid", label: "Superbid", color: "bg-green-500" },
  { id: "copart", label: "Copart", color: "bg-orange-500" },
  { id: "marca-leiloes", label: "Marca Leilões", color: "bg-indigo-500" },
  { id: "milan", label: "Milan Leilões", color: "bg-yellow-600" },
  { id: "via-leiloes", label: "Via Leilões", color: "bg-teal-500" },
  { id: "autotran", label: "AutoTran", color: "bg-red-500" },
  { id: "leilo", label: "Leiló", color: "bg-amber-500" },
  { id: "guariglia", label: "Guariglia", color: "bg-cyan-600" },
  { id: "pestana", label: "Pestana", color: "bg-pink-500", disabled: true },
];


export default function AuctionSync() {
  const { lotes, sync, isPending, lastSync } = useAuctions();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleSync = (sourceId: string) => {
    setSelectedSource(sourceId);
    sync(sourceId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🔄 Sincronização de Leilões</h1>
        <p className="text-gray-600">Sincronize lotes de múltiplos sites de leilões</p>
      </div>

      {/* Botões de Sync */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Fontes de Leilões</h2>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((src) => (
            <Button
              key={src.id}
              onClick={() => handleSync(src.id)}
              disabled={isPending || src.disabled}
              variant={selectedSource === src.id && isPending ? "default" : "outline"}
              className={`transition-all ${
                selectedSource === src.id && isPending ? src.color : ""
              }`}
            >
              {selectedSource === src.id && isPending ? (
                <Loader className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              <span className="text-xs md:text-sm">{src.label}</span>
              {src.disabled && <span className="text-xs ml-1">soon</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Último Sync */}
      {lastSync && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Última sincronização: <strong>{lastSync.source}</strong> às {lastSync.time.toLocaleTimeString("pt-BR")}
          </p>
        </div>
      )}

      {/* Grid de Lotes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Lotes Recentes</h2>
        {lotes && lotes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lotes.slice(0, 12).map((lot: AuctionLot) => (
              <Card
                key={lot.numero_lote}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Imagem */}
                {lot.image_url ? (
                  <img
                    src={lot.image_url}
                    alt={lot.veiculo_origem}
                    className="w-full h-48 object-cover bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}

                {/* Conteúdo */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                      {lot.veiculo_origem}
                    </h3>
                    <Badge
                      variant={lot.tipo_sucata === "inservivel" ? "destructive" : "default"}
                      className="ml-2 text-xs"
                    >
                      {lot.tipo_sucata === "inservivel" ? "Inservível" : "Aproveitável"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    <p>
                      <span className="font-medium">Lote:</span> {lot.numero_lote}
                    </p>
                    <p>
                      <span className="font-medium">Fonte:</span> {lot.fonte}
                    </p>
                    {lot.auction_end_at && (
                      <p>
                        <span className="font-medium">Encerramento:</span>{" "}
                        {new Date(lot.auction_end_at).toLocaleDateString("pt-BR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  <a
                    href={lot.link_leilao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Ver no site →
                  </a>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-500">
            <p>Nenhum lote sincronizado. Clique em um botão acima para começar.</p>
          </Card>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t text-xs text-gray-500">
        <p>
          💡 Total de lotes: <strong>{lotes?.length || 0}</strong>
        </p>
        <p>API: {import.meta.env.VITE_API_URL || "http://localhost:3001/api/auctions"}</p>
      </div>
    </div>
  );
}
