import { ALERTS } from '@/src/data/mock';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BellRing, Plus, MoreVertical, Trash2, Edit2, Mail, MessageCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Alerts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Alertas de Oportunidades</h2>
          <p className="text-slate-500 mt-2">
            Avisos automatizados para novos lotes. Preparado para disparo multicanal.
          </p>
        </div>
        <Button className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Alerta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALERTS.map(alert => (
          <Card key={alert.id} className="relative overflow-hidden group border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className={`absolute top-0 w-full h-1 ${alert.ativo ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <BellRing className={`w-4 h-4 ${alert.ativo ? 'text-blue-500' : 'text-slate-400'}`} />
                  {alert.titulo}
                </CardTitle>
                <CardDescription className="mt-2 flex items-center gap-2">
                  <Badge variant={alert.ativo ? 'default' : 'secondary'} className={alert.ativo ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}>
                    {alert.ativo ? 'Ativo' : 'Desativado'}
                  </Badge>
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 -mt-1 -mr-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500">
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-xs uppercase text-slate-400 mb-2">Critérios do Filtro</p>
                <div className="flex flex-wrap gap-1">
                  {alert.marca && <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">{alert.marca}</Badge>}
                  {alert.modelo && <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">{alert.modelo}</Badge>}
                  {alert.estado && <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">Estado: {alert.estado}</Badge>}
                  {alert.tipoLote && <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">{alert.tipoLote}</Badge>}
                  {alert.valorMaximo && <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">Máx: R$ {alert.valorMaximo}</Badge>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                 <Badge variant="secondary" className="flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800"><MessageCircle className="w-3 h-3" /> WhatsApp (Em breve)</Badge>
                 <Badge variant="secondary" className="flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800"><Mail className="w-3 h-3" /> Email (Em breve)</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
