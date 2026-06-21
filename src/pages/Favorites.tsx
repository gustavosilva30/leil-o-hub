import { useState } from 'react';
import { FAVORITES, LOTS, TAGS, LOT_TAGS } from '@/src/data/mock';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, ExternalLink, HeartOff, Search, Tag, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Favorites() {
  const [search, setSearch] = useState('');

  const favoriteLots = FAVORITES.map(f => LOTS.find(l => l.id === f.lotId)).filter(Boolean) as typeof LOTS;

  const filteredLots = favoriteLots.filter(lot => {
    const match = `${lot.marca} ${lot.modelo} ${lot.cidade} ${lot.estado} ${lot.tipo}`.toLowerCase();
    return match.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Meus Favoritos</h2>
            <p className="text-slate-500 mt-2">
              Lotes em acompanhamento ativo. {FAVORITES.length} na lista.
            </p>
         </div>
      </div>

      <div className="flex gap-4">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por lote, marca ou estado..." 
              className="pl-10 bg-white dark:bg-slate-900 border-none rounded-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <Button variant="outline" className="rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
           <Filter className="w-4 h-4 mr-2 text-slate-500" /> Filtros
         </Button>
      </div>

      {filteredLots.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <HeartOff className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum favorito encontrado</h3>
          <p className="text-slate-500 mt-2">Tente outra busca ou adicione mais lotes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLots.map(lot => {
             const lotTags = LOT_TAGS.filter(lt => lt.lotId === lot.id).map(lt => TAGS.find(t => t.id === lt.tagId)!);

             return (
              <Card key={lot.id} className="overflow-hidden group flex flex-col bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:shadow-md transition-all hover:scale-[1.01] rounded-2xl">
                <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img 
                    src={lot.imagens[0]} 
                    alt={`${lot.marca} ${lot.modelo}`}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                     <Badge variant={lot.tipo === 'Sucata para Desmonte' ? 'destructive' : 'default'} className="shadow-sm backdrop-blur-md">
                       {lot.tipo}
                     </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-white/20 hover:bg-red-500 border border-transparent backdrop-blur-sm text-white group-hover:opacity-100 transition-opacity opacity-0 rounded-full">
                    <HeartOff className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1 text-slate-800 dark:text-slate-100">{lot.marca} {lot.modelo}</h3>
                      <p className="text-sm font-medium text-slate-500">{lot.ano}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <div className="flex flex-wrap gap-1 mb-4">
                     {lotTags.map(tag => (
                        <Badge key={tag.id} className={`${tag.cor} text-white shadow-sm hover:${tag.cor} text-[10px]`}>{tag.nome}</Badge>
                     ))}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {lot.cidade} - {lot.estado}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(lot.dataLeilao).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lance Atual</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">R$ {lot.lanceAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Link to={`/lots/${lot.id}`}>
                    <Button size="sm" className="shadow-sm">Acessar</Button>
                  </Link>
                </CardFooter>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
}
