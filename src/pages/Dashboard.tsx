import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LOTS, PURCHASES, ALERTS, CURRENT_TENANT } from '@/src/data/mock';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Heart, BellRing, TrendingUp, Gavel, FileText, ShoppingCart, Wrench } from 'lucide-react';

export function Dashboard() {
  const comprasAndamento = PURCHASES.filter(p => p.status !== 'FINALIZADO').length;
  const emDesmontagem = PURCHASES.filter(p => p.status === 'EM DESMONTAGEM').length;

  const barData = Object.keys(LOTS.reduce((acc, lot) => { acc[lot.estado] = (acc[lot.estado] || 0) + 1; return acc; }, {} as Record<string, number>)).map(k => ({ name: k, total: LOTS.filter(l=>l.estado===k).length }));

  const lineData = [
    { name: 'Jan', compras: 2 }, { name: 'Fev', compras: 5 }, { name: 'Mar', compras: 3 },
    { name: 'Abr', compras: 8 }, { name: 'Mai', compras: 6 }, { name: 'Jun', compras: 4 }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Visão Geral da Empresa</h1>
          <p className="text-slate-500 text-sm mt-1">Dashboard Gerencial multi-tenant (Seu Tenant: {CURRENT_TENANT.nome})</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Compras Ativas</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{comprasAndamento}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-full">Arremates</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Desmontagem</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{emDesmontagem}</span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/40 px-2 py-1 rounded-full">Oficina</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alertas Ganhos</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{ALERTS.length}</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/40 px-2 py-1 rounded-full">Global</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lotes Monitorados</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{LOTS.length}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">Ativos</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Histórico de Compras (Arrematações)</CardTitle>
            <CardDescription>Volume de compras consolidadas por mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Line type="monotone" dataKey="compras" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
