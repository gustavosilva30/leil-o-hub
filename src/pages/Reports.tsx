import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, LayoutDashboard, ShoppingCart } from 'lucide-react';

const REPORTS = [
  { id: 'compras', title: 'Relatório de Compras', description: 'Arrematações, lotes pagos, em trânsito e finalizados.', icon: ShoppingCart },
  { id: 'desmontagem', title: 'Relatório de Desmontagem', description: 'Veículos na oficina e totalizador de peças removidas.', icon: LayoutDashboard },
  { id: 'lotes', title: 'Histórico de Lotes Monitorados', description: 'Lotes que dispararam alertas e seus respectivos desfechos de preço.', icon: FileText },
];

export function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Relatórios (Gerencial)</h2>
        <p className="text-slate-500 mt-2">
          Extraia inteligência dos dados do seu Tenant. Exporte para Excel (XLSX) ou CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {REPORTS.map(rep => (
          <Card key={rep.id} className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
               <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <rep.icon className="w-6 h-6" />
               </div>
               <div>
                  <CardTitle className="text-lg">{rep.title}</CardTitle>
               </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-500 mb-6">{rep.description}</CardDescription>
              <div className="flex gap-3">
                 <Button variant="outline" className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300">
                    <Download className="w-4 h-4 mr-2" /> Excel (.xlsx)
                 </Button>
                 <Button variant="outline" className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300">
                    <Download className="w-4 h-4 mr-2" /> CSV
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
