export interface Auctioneer {
  id: string;
  nome: string;
  site: string;
  logoUrl?: string;
  estado?: string;
}

export interface Auction {
  id: string;
  titulo: string;
  leiloeiro: string;
  estado: string;
  cidade: string;
  data: string;
  quantidadeLotes: number;
  status: 'Ativo' | 'Encerrado' | 'Em Breve';
}

export interface Lot {
  id: string;
  numeroLote: string;
  marca: string;
  modelo: string;
  ano: number;
  estado: string;
  cidade: string;
  tipo: 'Sucata para Desmonte' | 'Direito à Documentação' | 'Sinistro';
  leiloeiro: string;
  imagens: string[];
  valorEstimado?: number;
  lanceAtual?: number;
  dataLeilao: string;
  motor?: boolean;
  cambio?: boolean;
  descricao?: string;
}

export interface Tenant {
  id: string;
  nome: string;
  plano: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  role: 'Admin' | 'User';
  avatar?: string;
}

export interface Favorite {
  id: string;
  tenantId: string;
  lotId: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  tenantId: string;
  titulo: string;
  criterios: string;
  ativo: boolean;
  marca?: string;
  modelo?: string;
  estado?: string;
  tipoLote?: string;
  valorMaximo?: number;
  createdAt: string;
}

export interface AuctionHistory {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  leiloeiro: string;
  valorArrematado: number;
  dataArrematacao: string;
  estado: string;
  cidade: string;
}

export type PurchaseStatus = 'ARREMATADO' | 'PAGO' | 'AGUARDANDO RETIRADA' | 'RETIRADO' | 'EM DESMONTAGEM' | 'FINALIZADO';

export interface Purchase {
  id: string;
  tenantId: string;
  lotId: string;
  valorArrematado: number;
  valorFrete: number;
  valorTaxas: number;
  observacoes: string;
  status: PurchaseStatus;
  dataCompra: string;
}

export type PartStatus = 'PENDENTE' | 'REMOVIDA' | 'EM ESTOQUE' | 'VENDIDA';

export interface VehiclePart {
  id: string;
  purchaseId: string;
  nomePeca: string;
  codigo: string;
  quantidade: number;
  status: PartStatus;
}

export interface InventoryPart {
  id: string;
  tenantId: string;
  nome: string;
  codigo: string;
  quantidade: number;
  valorCusto: number;
  valorVenda: number;
  origemLoteId?: string;
  status: 'Disponível' | 'Vendido' | 'Reservado';
  dataEntrada: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  cidade: string;
  estado: string;
  observacoes?: string;
}

export interface CustomerInterest {
  id: string;
  customerId: string;
  marca?: string;
  modelo?: string;
  peca: string;
  observacao?: string;
  ativo: boolean;
}

export interface Tag {
  id: string;
  tenantId: string;
  nome: string;
  cor: string;
}

export interface LotTag {
  lotId: string;
  tagId: string;
}

export interface Note {
  id: string;
  tenantId: string;
  lotId: string;
  usuarioId: string;
  texto: string;
  createdAt: string;
}

export interface SavedFilter {
  id: string;
  tenantId: string;
  nome: string;
  filtroJson: any;
  createdAt: string;
}
