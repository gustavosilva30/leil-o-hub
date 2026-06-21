import { PURCHASES, LOTS, VEHICLE_PARTS } from '@/src/data/mock';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MonitorPlay, Wrench, PackagePlus } from 'lucide-react';
import { Progress } from "@/components/ui/progress"

export function Disassembly() {
  const ongoing = PURCHASES.filter(p => p.status === 'EM DESMONTAGEM');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Painel de Desmontagem</h2>
        <p className="text-slate-500 mt-2">
          Controle operacional dos veículos que já deram entrada no pátio para desmontagem técnica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ongoing.map(purchase => {
          const lot = LOTS.find(l => l.id === purchase.lotId);
          if (!lot) return null;

          const parts = VEHICLE_PARTS.filter(p => p.purchaseId === purchase.id);
          const totalParts = parts.length;
          const finishedParts = parts.filter(p => p.status === 'EM ESTOQUE' || p.status === 'VENDIDA').length;
          const progress = totalParts > 0 ? (finishedParts / totalParts) * 100 : 0;

          return (
            <Card key={purchase.id} className="overflow-hidden border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="flex flex-col sm:flex-row h-full">
                <div className="sm:w-2/5 p-4 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 hidden sm:flex flex-col">
                   <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden mb-4 relative">
                      <img src={lot.imagens[0]} alt="Lote" className="object-cover w-full h-full" />
                      <Badge className="absolute top-2 left-2 backdrop-blur-md bg-black/50 border-none">{lot.numeroLote}</Badge>
                   </div>
                   <h3 className="font-bold text-slate-800 dark:text-slate-100 text-center leading-tight">{lot.marca} {lot.modelo}</h3>
                   <p className="text-sm text-slate-500 text-center mt-1">Ano: {lot.ano}</p>
                </div>
                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          Status Peças <Wrench className="w-4 h-4" />
                       </h4>
                       <p className="text-xs text-slate-400 mt-1">Progresso geral</p>
                     </div>
                     <span className="font-mono text-sm font-bold bg-blue-50 text-blue-700 px-2 py-1 round dark:bg-blue-900/30 dark:text-blue-400">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-6" />

                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[200px]">
                     {parts.map(p => (
                       <div key={p.id} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                         <span className="font-medium text-slate-600 dark:text-slate-300">{p.nomePeca}</span>
                         <Badge variant="outline" className={
                           p.status === 'EM ESTOQUE' ? 'text-green-600 border-green-200 bg-green-50' :
                           p.status === 'REMOVIDA' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                           'text-slate-500'
                         }>{p.status}</Badge>
                       </div>
                     ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"><MonitorPlay className="w-4 h-4 mr-2" /> Visão Operacional</Button>
                    <Button size="sm" className="flex-1"><PackagePlus className="w-4 h-4 mr-2" /> Nova Peça</Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {ongoing.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
             Nenhum veículo em fase de desmontagem neste momento.
          </div>
        )}
      </div>
    </div>
  );
}
