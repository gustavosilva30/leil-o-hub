import { useState } from 'react';
import { PURCHASES, LOTS } from '@/src/data/mock';
import { PurchaseStatus, Purchase } from '@/src/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STATUS_COLUMNS: { id: PurchaseStatus; title: string }[] = [
  { id: 'ARREMATADO', title: 'Arrematado (A Pagar)' },
  { id: 'PAGO', title: 'Pago / Liberado' },
  { id: 'AGUARDANDO RETIRADA', title: 'Aguardando Retirada' },
  { id: 'RETIRADO', title: 'Em Trânsito / Recebido' },
  { id: 'EM DESMONTAGEM', title: 'Em Desmontagem' },
  { id: 'FINALIZADO', title: 'Finalizado' },
];

export function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>(PURCHASES);
  const [search, setSearch] = useState('');

  const filteredPurchases = purchases.filter(p => {
    const lot = LOTS.find(l => l.id === p.lotId);
    if (!lot) return false;
    const match = `${lot.marca} ${lot.modelo} ${lot.numeroLote}`.toLowerCase();
    return match.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Controle de Arrematações</h2>
          <p className="text-slate-500 text-sm mt-1">
            Kanban operacional de compras. Arraste os cards para atualizar o status (Simulado).
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar compra (marca, modelo)..." 
            className="pl-9 bg-white dark:bg-slate-900 border-none rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full pb-4 items-start" style={{ width: 'max-content' }}>
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="w-80 flex flex-col h-full bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shrink-0">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{column.title}</h3>
                <Badge variant="secondary" className="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {filteredPurchases.filter(p => p.status === column.id).length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredPurchases
                  .filter((p) => p.status === column.id)
                  .map((purchase) => {
                    const lot = LOTS.find(l => l.id === purchase.lotId);
                    if (!lot) return null;
                    return (
                      <Card key={purchase.id} className="cursor-grab hover:shadow-md transition-shadow dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group">
                        <div className="h-1 bg-blue-500 w-full" />
                        <CardHeader className="p-3 pb-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-xs font-bold text-slate-400">#{lot.numeroLote}</span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">R$ {purchase.valorArrematado.toLocaleString()}</span>
                          </div>
                          <h4 className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-200">{lot.marca} {lot.modelo} ({lot.ano})</h4>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{lot.cidade} - {lot.estado}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>{new Date(purchase.dataCompra).toLocaleDateString('pt-br')}</span>
                            </div>
                          </div>
                          {purchase.observacoes && (
                             <p className="mt-3 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 p-2 rounded-md border border-yellow-100 dark:border-yellow-900/50">
                               {purchase.observacoes}
                             </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
