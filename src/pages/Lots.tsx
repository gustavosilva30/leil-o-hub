import { useState } from 'react';
import { LOTS, BRANDS, STATES, AUCTIONEERS } from '@/src/data/mock';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, MapPin, Grid, List as ListIcon, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Lots() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  // Simple pagination / infinite scroll mock
  const displayedLots = LOTS.slice(0, 24);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 h-full flex flex-col hidden md:flex">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg tracking-tight">Filtros</h3>
            <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground">Limpar</Button>
          </div>
          <Select defaultValue="">
            <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 h-8 text-xs">
              <SelectValue placeholder="Filtros Salvos..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">Sucatas SP</SelectItem>
              <SelectItem value="honda">Honda Docs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
          <Accordion type="multiple" defaultValue={['tipo', 'marca', 'leiloeiro', 'estado']} className="w-full">
            <AccordionItem value="tipo">
              <AccordionTrigger className="text-sm font-semibold">Tipo do Lote</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="tipo-sucata" />
                  <Label htmlFor="tipo-sucata" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Sucata para Desmonte</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="tipo-doc" />
                  <Label htmlFor="tipo-doc" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Direito à Documentação</Label>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="marca">
              <AccordionTrigger className="text-sm font-semibold">Marca</AccordionTrigger>
              <AccordionContent className="space-y-2">
                {BRANDS.map(b => (
                  <div key={b.brand} className="flex items-center space-x-2">
                    <Checkbox id={`marca-${b.brand}`} />
                    <Label htmlFor={`marca-${b.brand}`} className="text-sm font-normal">{b.brand}</Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="leiloeiro">
              <AccordionTrigger className="text-sm font-semibold">Leiloeiro</AccordionTrigger>
              <AccordionContent className="space-y-2">
                {AUCTIONEERS.map(a => (
                  <div key={a.id} className="flex items-center space-x-2">
                    <Checkbox id={`auc-${a.id}`} />
                    <Label htmlFor={`auc-${a.id}`} className="text-sm font-normal">{a.nome}</Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="estado">
              <AccordionTrigger className="text-sm font-semibold">Estado</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {STATES.map(s => (
                     <div key={s} className="flex items-center space-x-2">
                      <Checkbox id={`uf-${s}`} />
                      <Label htmlFor={`uf-${s}`} className="text-sm font-normal">{s}</Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ano">
              <AccordionTrigger className="text-sm font-semibold">Ano</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Input placeholder="De" className="h-8" />
                  <span>até</span>
                  <Input placeholder="Até" className="h-8" />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lotes Nacionais</h2>
            <p className="text-sm text-muted-foreground">{LOTS.length} lotes encontrados em todo o Brasil</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select defaultValue="recentes">
              <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-950">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="menor-valor">Menor valor de lance</SelectItem>
                <SelectItem value="maior-valor">Maior valor de lance</SelectItem>
                <SelectItem value="proximos">Leilão mais próximo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md p-0.5 bg-white dark:bg-zinc-950">
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('grid')}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setView('list')}>
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-4 px-4 pb-4">
          <div className={view === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-4"
          }>
            {displayedLots.map(lot => (
              <Card key={lot.id} className="overflow-hidden group flex flex-col bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800 hover:shadow-md transition-shadow">
                <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img 
                    src={lot.imagens[0]} 
                    alt={`${lot.marca} ${lot.modelo}`}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant={lot.tipo === 'Sucata para Desmonte' ? 'destructive' : 'default'} className="backdrop-blur-md bg-opacity-90">
                      {lot.tipo}
                    </Badge>
                  </div>
                  <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md hover:bg-white/40">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1 text-slate-800 dark:text-slate-100">{lot.marca} {lot.modelo}</h3>
                      <p className="text-sm text-slate-500">{lot.ano}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">Lote {lot.numeroLote}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1">
                  <div className="flex flex-col gap-2 text-sm text-slate-500 mt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {lot.cidade} - {lot.estado}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(lot.dataLeilao).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="mt-2 text-blue-600 font-bold">
                      {lot.leiloeiro}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 mt-auto">
                  <div className="flex flex-col mt-2">
                    <span className="text-xs font-semibold text-slate-400">Lance Atual</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">R$ {lot.lanceAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Link to={`/lots/${lot.id}`} className="mt-2">
                    <Button size="sm">Analisar</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="py-8 flex justify-center">
            <Button variant="outline">Carregar mais lotes</Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
