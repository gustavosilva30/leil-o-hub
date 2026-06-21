import { CUSTOMERS, CUSTOMER_INTERESTS } from '@/src/data/mock';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Phone, MapPin, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Clientes & Interesses</h2>
          <p className="text-slate-500 mt-2">
            CRM base para registro de clientes oficinas e lista de peças procuradas (Lead).
          </p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Cadastrar Cliente</Button>
      </div>

      <div className="flex gap-4">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar por nome ou telefone..." className="pl-10 bg-white dark:bg-slate-900 border-none rounded-full" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CUSTOMERS.map(c => {
          const interests = CUSTOMER_INTERESTS.filter(i => i.customerId === c.id);

          return (
            <Card key={c.id} className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-slate-50 border-b border-slate-100 dark:bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center font-bold text-lg">
                    {c.nome.substring(0, 1)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{c.nome}</CardTitle>
                    <p className="text-sm text-slate-500 font-mono">{c.telefone}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 mr-2" /> {c.cidade} - {c.estado}
                </div>
                
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lista de Interesse</h4>
                   {interests.length > 0 ? (
                     <div className="space-y-2">
                        {interests.map(i => (
                          <div key={i.id} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                             <span className="font-medium">{i.peca}</span>
                             {i.marca && <Badge variant="secondary" className="text-[10px]">{i.marca} {i.modelo}</Badge>}
                          </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 italic">Nenhum interesse registrado.</p>
                   )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
