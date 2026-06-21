import { AUCTIONS } from '@/src/data/mock';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function Auctions() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = AUCTIONS.filter(a => {
    if (status !== 'all' && a.status !== status) return false;
    if (search && !a.titulo.toLowerCase().includes(search.toLowerCase()) && !a.leiloeiro.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leilões Cadastrados</h2>
        <p className="text-muted-foreground mt-2">
          Visualize os pátios e eventos de leilões rastreados de todo o país.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar leilão ou leiloeiro..." 
              className="pl-9 bg-white dark:bg-slate-950" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Em Breve">Em Breve</SelectItem>
              <SelectItem value="Encerrado">Encerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>Exportar Relatório</Button>
      </div>

      <div className="border rounded-md bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Leiloeiro</TableHead>
              <TableHead>Local / Data</TableHead>
              <TableHead>Lotes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum leilão encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell className="font-medium">{auction.titulo}</TableCell>
                  <TableCell>{auction.leiloeiro}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{auction.cidade} - {auction.estado}</span>
                      <span className="text-xs text-muted-foreground">{new Date(auction.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{auction.quantidadeLotes}</TableCell>
                  <TableCell>
                    <Badge variant={auction.status === 'Ativo' ? 'default' : auction.status === 'Em Breve' ? 'secondary' : 'outline'}>
                      {auction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ver Lotes
                      <ExternalLink className="ml-2 h-4 w-4" />
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
