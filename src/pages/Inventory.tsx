import { useState } from 'react';
import { INVENTORY_PARTS } from '@/src/data/mock';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PenLine } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Inventory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filteredItems = INVENTORY_PARTS.filter(p => {
    if (status !== 'all' && p.status !== status) return false;
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase()) && !p.codigo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Estoque de Peças</h2>
        <p className="text-slate-500 mt-2">
          Gerenciamento do inventário de peças desmontadas ou compradas avulsas.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome, código..." 
              className="pl-10 bg-white dark:bg-slate-900 border-none rounded-full" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-none rounded-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Disponível">Disponível</SelectItem>
              <SelectItem value="Reservado">Reservado</SelectItem>
              <SelectItem value="Vendido">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="rounded-full shadow-sm">Nova Peça Avulsa</Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome da Peça</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Venda</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                  Nenhuma peça encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-semibold">{item.codigo}</TableCell>
                  <TableCell className="font-medium text-slate-700 dark:text-slate-200">{item.nome}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.quantidade}</TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">R$ {item.valorCusto.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-green-600 dark:text-green-400">R$ {item.valorVenda.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.status === 'Disponível' ? 'default' : item.status === 'Vendido' ? 'secondary' : 'outline'} className={item.status === 'Disponível' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : ''}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                      <PenLine className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
