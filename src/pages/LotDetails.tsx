import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AUCTION_HISTORY, LOT_TAGS, TAGS, PRIVATE_NOTES, CURRENT_USER } from '@/src/data/mock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Calendar, Heart, Share2, AlertTriangle, Info, ExternalLink, Settings2, Plus, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/auctions";

export function LotDetails() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["auction", id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Falha ao buscar lote");
      const json = await res.json();
      return json.lot;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground animate-pulse">Carregando informações do lote...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 font-semibold">Lote não encontrado.</p>
        <Link to="/lots" className="mt-4 inline-block">
          <Button>Voltar para a busca</Button>
        </Link>
      </div>
    );
  }

  const lot = {
    id: data.id,
    numeroLote: data.numero_lote,
    marca: data.marca || data.veiculo_origem?.split(' ')[0] || 'Desconhecida',
    modelo: data.modelo || data.veiculo_origem || 'Lote',
    ano: data.ano || 'N/A',
    estado: data.source || 'N/A',
    cidade: data.fonte || 'N/A',
    tipo: data.tipo_sucata === 'inservivel' ? 'Inservível' : 'Aproveitável',
    leiloeiro: data.fonte || data.source,
    imagens: data.image_url ? [data.image_url] : ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800&h=600'],
    valorEstimado: 0,
    lanceAtual: 0,
    dataLeilao: data.auction_start_at || data.auction_end_at || new Date().toISOString(),
    descricao: data.raw?.descricao || `Veículo do lote ${data.numero_lote} da fonte ${data.fonte || data.source}.`,
    motor: data.raw?.motor || false,
    cambio: data.raw?.cambio || false,
  };

  const history = AUCTION_HISTORY.filter(h => h.marca === lot.marca && h.modelo === lot.modelo);
  const minHist = history.length ? Math.min(...history.map(h => h.valorArrematado)) : 0;
  const maxHist = history.length ? Math.max(...history.map(h => h.valorArrematado)) : 0;
  const avgHist = history.length ? history.reduce((acc, h) => acc + h.valorArrematado, 0) / history.length : 0;

  const lotTags = LOT_TAGS.filter(lt => lt.lotId === lot.id).map(lt => TAGS.find(t => t.id === lt.tagId)!);
  const lotNotes = PRIVATE_NOTES.filter(n => n.lotId === lot.id && n.tenantId === CURRENT_USER.tenantId);

  // Group history by month for chart
  const historyData = [
    { name: 'Jan', media: 8500 },
    { name: 'Fev', media: 8200 },
    { name: 'Mar', media: 9000 },
    { name: 'Abr', media: avgHist }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/lots">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{lot.marca} {lot.modelo} - {lot.ano}</h1>
            <Badge variant={lot.tipo === 'Sucata para Desmonte' ? 'destructive' : 'default'} className="shadow-sm">{lot.tipo}</Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">Lote {lot.numeroLote} • {lot.leiloeiro}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" className="shadow-sm">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
          <Button variant="default" size="sm" className="shadow-sm">
            <Heart className="mr-2 h-4 w-4" /> Favoritar
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {lotTags.map(tag => (
          <Badge key={tag.id} className={`${tag.cor} text-white hover:${tag.cor} cursor-pointer border-transparent shadow-sm`}><Tag className="w-3 h-3 mr-1" /> {tag.nome}</Badge>
        ))}
        <Badge variant="outline" className="border-dashed cursor-pointer text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus className="w-3 h-3 mr-1" /> Adicionar Etiqueta (Tenant)</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
            <img 
              src={lot.imagens[0]} 
              alt="Veículo principal" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden opacity-70 hover:opacity-100 cursor-pointer transition-all hover:scale-[1.02] border-2 border-transparent hover:border-blue-500">
                 <img src={lot.imagens[1] || lot.imagens[0]} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
               </div>
            ))}
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 rounded-none pb-0 h-auto bg-transparent p-0 space-x-6">
              <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-0 pb-2 text-slate-500">Informações</TabsTrigger>
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-0 pb-2 text-slate-500">Histórico Arremates</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent px-0 pb-2 text-slate-500">Obs Privadas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Marca</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{lot.marca}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modelo</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{lot.modelo}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ano</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{lot.ano}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Motor</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{lot.motor ? 'Sim' : 'Não Informado'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Câmbio</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{lot.cambio ? 'Sim' : 'Não Informado'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Combustível</span>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Flex</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-wider">Descrição do Leiloeiro</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {lot.descricao}
                  <br /><br />
                  <span className="font-semibold">AVISO:</span> O veículo é vendido no estado em que se encontra, sem garantias.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                 <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs uppercase text-slate-400 tracking-wider">Média de Arremate</CardTitle>
                   </CardHeader>
                   <CardContent><span className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {avgHist.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span></CardContent>
                 </Card>
                 <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs uppercase text-slate-400 tracking-wider">Menor Preço</CardTitle>
                   </CardHeader>
                   <CardContent><span className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {minHist.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span></CardContent>
                 </Card>
                 <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs uppercase text-slate-400 tracking-wider">Amostragem</CardTitle>
                   </CardHeader>
                   <CardContent><span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{history.length} lotes</span></CardContent>
                 </Card>
              </div>
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <CardHeader>
                   <CardTitle className="text-sm">Evolução do Preço de Arrematação</CardTitle>
                   <CardDescription>Média ponderada para o modelo {lot.modelo} a cada mês no Brasil.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ResponsiveContainer width="100%" height={250}>
                     <BarChart data={historyData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                       <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                       <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                       <Bar dataKey="media" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <div className="space-y-4 mt-6">
                {lotNotes.map(note => (
                   <div key={note.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2 text-xs text-slate-400">
                         <span className="font-bold">{note.usuarioId}</span>
                         <span>{new Date(note.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{note.texto}</p>
                   </div>
                ))}
                
                <div className="p-6 text-center border-2 rounded-2xl border-dashed border-slate-200 dark:border-slate-800 mt-4 bg-slate-50 dark:bg-slate-900/50">
                  <Info className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Criar Observação</h3>
                  <p className="text-sm text-slate-500 mb-4 mt-1">Visível apenas para usuários do seu Tenant.</p>
                  <Button size="sm" className="shadow-sm">Adicionar Nota Interna</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm border-t-4 border-t-blue-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Próximo Pregão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lance Atual</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">R$ {lot.lanceAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm pt-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Encerramento</p>
                  <p className="text-slate-500">{new Date(lot.dataLeilao).toLocaleDateString('pt-BR')} às 10:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Pátio Físico</p>
                  <p className="text-slate-500">{lot.cidade} - {lot.estado}</p>
                </div>
              </div>
              
              <Button className="w-full mt-6 shadow-md" size="lg">
                Ir para Plataforma Origem <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[10px] text-center text-slate-400 font-medium">As transações ocorrem fora do Leilão Hub.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-slate-50 dark:bg-slate-900/50">
             <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center tracking-wide uppercase">
                 Opções da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" /> Criar Filtro Similar
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                <Heart className="mr-2 h-4 w-4 text-red-500" /> Salvar Lote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
