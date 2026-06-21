import { Auction, Auctioneer, Lot, Tenant, User, Alert, Favorite, AuctionHistory, Purchase, VehiclePart, InventoryPart, Customer, CustomerInterest, Tag, LotTag, Note, SavedFilter } from '../types';

function generateRandomLots(count: number, leiloeiros: Auctioneer[], states: string[], cities: string[], baseBrands: any[]): Lot[] {
  const lots: Lot[] = [];
  const startId = 1000;
  for (let i = 0; i < count; i++) {
    const brandObj = baseBrands[Math.floor(Math.random() * baseBrands.length)];
    const model = brandObj.models[Math.floor(Math.random() * brandObj.models.length)];
    const tipo = Math.random() > 0.4 ? 'Sucata para Desmonte' : 'Direito à Documentação';
    const leiloeiro = leiloeiros[Math.floor(Math.random() * leiloeiros.length)];
    
    // Dates close to current
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30));

    lots.push({
      id: `L-${startId + i}`,
      numeroLote: `${Math.floor(100 + Math.random() * 900)}`,
      marca: brandObj.brand,
      modelo: model,
      ano: Math.floor(2005 + Math.random() * 19), // 2005 to 2023
      estado: states[Math.floor(Math.random() * states.length)],
      cidade: cities[Math.floor(Math.random() * cities.length)],
      tipo,
      leiloeiro: leiloeiro.nome,
      imagens: [
        `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800&h=600`,
        `https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=800&h=600`
      ],
      valorEstimado: Math.floor(5000 + Math.random() * 45000),
      lanceAtual: Math.floor(2000 + Math.random() * 20000),
      dataLeilao: date.toISOString().split('T')[0],
      motor: Math.random() > 0.2,
      cambio: Math.random() > 0.2,
      descricao: `Veículo modelo ${model} da marca ${brandObj.brand}, ano estimado para peça. Leilão por ${leiloeiro.nome}.`
    });
  }
  return lots;
}

export const BRANDS = [
  { brand: 'Volkswagen', models: ['Gol', 'Polo', 'Saveiro', 'Virtus', 'Nivus'] },
  { brand: 'Fiat', models: ['Strada', 'Argo', 'Mobi', 'Toro', 'Pulse'] },
  { brand: 'Chevrolet', models: ['Onix', 'Tracker', 'Montana', 'Spin'] },
  { brand: 'Hyundai', models: ['HB20', 'Creta', 'Tucson'] },
  { brand: 'Toyota', models: ['Corolla', 'Hilux', 'Yaris'] },
  { brand: 'Honda', models: ['Civic', 'HR-V', 'Fit', 'City'] },
  { brand: 'Ford', models: ['Ka', 'EcoSport', 'Ranger'] },
];

export const STATES = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'GO', 'BA'];
export const CITIES = ['São Paulo', 'Campinas', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Goiânia', 'Salvador'];

export const AUCTIONEERS: Auctioneer[] = [
  { id: 'AUC-1', nome: 'Copart Brasil', site: 'https://copart.com.br', estado: 'SP' },
  { id: 'AUC-2', nome: 'Sodré Santoro', site: 'https://sodresantoro.com.br', estado: 'SP' },
  { id: 'AUC-3', nome: 'Milan Leilões', site: 'https://milanleiloes.com.br', estado: 'SP' },
  { id: 'AUC-4', nome: 'Pestana Leilões', site: 'https://pestanaleiloes.com.br', estado: 'RS' },
  { id: 'AUC-5', nome: 'VIP Leilões', site: 'https://vipleiloes.com.br', estado: 'SP' }
];

export const AUCTIONS: Auction[] = Array.from({ length: 30 }).map((_, i) => {
  const t = new Date();
  t.setDate(t.getDate() + Math.floor(Math.random() * 15));
  return {
    id: `AUC-EV-${i + 1}`,
    titulo: `Leilão de Veículos e Sucatas #${1000 + i}`,
    leiloeiro: AUCTIONEERS[i % AUCTIONEERS.length].nome,
    estado: STATES[i % STATES.length],
    cidade: CITIES[i % CITIES.length],
    data: t.toISOString().split('T')[0],
    quantidadeLotes: Math.floor(20 + Math.random() * 100),
    status: Math.random() > 0.8 ? 'Em Breve' : 'Ativo'
  };
});

export const LOTS: Lot[] = generateRandomLots(500, AUCTIONEERS, STATES, CITIES, BRANDS);

export const TENANTS: Tenant[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `TENANT-${i + 1}`,
  nome: `AutoPeças Brasil ${i + 1} Ltda`,
  plano: i % 3 === 0 ? 'Pro' : 'Basic',
}));

export const USERS: User[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `USER-${i + 1}`,
  tenantId: TENANTS[i % TENANTS.length].id,
  nome: `Usuário ${i + 1} da Silva`,
  email: `usuario${i + 1}@tenant${(i % 20) + 1}.com.br`,
  role: i % 5 === 0 ? 'Admin' : 'User'
}));

export const CURRENT_TENANT = TENANTS[0];
export const CURRENT_USER = USERS[0];

export const ALERTS: Alert[] = [
  { id: 'ALT-1', tenantId: 'TENANT-1', titulo: 'Gol até R$ 5.000', criterios: 'Marca: Volkswagen, Modelo: Gol, Valor Max: 5000', ativo: true, marca: 'Volkswagen', modelo: 'Gol', valorMaximo: 5000, createdAt: new Date().toISOString() },
  { id: 'ALT-2', tenantId: 'TENANT-1', titulo: 'Saveiro Sucata', criterios: 'Modelo: Saveiro, Tipo: Sucata para Desmonte', ativo: true, modelo: 'Saveiro', tipoLote: 'Sucata para Desmonte', createdAt: new Date().toISOString() },
  { id: 'ALT-3', tenantId: 'TENANT-1', titulo: 'Strada SP/PR', criterios: 'Modelo: Strada, Estados: SP, PR', ativo: false, modelo: 'Strada', estado: 'SP, PR', createdAt: new Date().toISOString() }
];

export const FAVORITES: Favorite[] = [
  { id: 'FAV-1', tenantId: 'TENANT-1', lotId: LOTS[0].id, createdAt: new Date().toISOString() },
  { id: 'FAV-2', tenantId: 'TENANT-1', lotId: LOTS[1].id, createdAt: new Date().toISOString() },
  { id: 'FAV-3', tenantId: 'TENANT-1', lotId: LOTS[5].id, createdAt: new Date().toISOString() },
];

export const AUCTION_HISTORY: AuctionHistory[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `HIST-${i}`,
  marca: BRANDS[i % BRANDS.length].brand,
  modelo: BRANDS[i % BRANDS.length].models[0],
  ano: 2018 + (i % 5),
  leiloeiro: AUCTIONEERS[i % AUCTIONEERS.length].nome,
  valorArrematado: 4000 + (Math.random() * 20000),
  dataArrematacao: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  estado: STATES[i % STATES.length],
  cidade: CITIES[i % CITIES.length]
}));

export const PURCHASES: Purchase[] = [
  { id: 'PUR-1', tenantId: 'TENANT-1', lotId: LOTS[2].id, valorArrematado: 12500, valorFrete: 800, valorTaxas: 1200, observacoes: 'Retirar amanhã', status: 'AGUARDANDO RETIRADA', dataCompra: new Date().toISOString() },
  { id: 'PUR-2', tenantId: 'TENANT-1', lotId: LOTS[3].id, valorArrematado: 8000, valorFrete: 0, valorTaxas: 800, observacoes: '', status: 'ARREMATADO', dataCompra: new Date().toISOString() },
  { id: 'PUR-3', tenantId: 'TENANT-1', lotId: LOTS[4].id, valorArrematado: 5500, valorFrete: 500, valorTaxas: 550, observacoes: 'Veículo sinistrado pesado', status: 'EM DESMONTAGEM', dataCompra: new Date().toISOString() },
];

export const VEHICLE_PARTS: VehiclePart[] = [
  { id: 'PART-1', purchaseId: 'PUR-3', nomePeca: 'Motor', codigo: 'MOT-001', quantidade: 1, status: 'REMOVIDA' },
  { id: 'PART-2', purchaseId: 'PUR-3', nomePeca: 'Câmbio', codigo: 'CAM-001', quantidade: 1, status: 'PENDENTE' },
  { id: 'PART-3', purchaseId: 'PUR-3', nomePeca: 'Porta Dianteira Esq', codigo: 'PDE-001', quantidade: 1, status: 'EM ESTOQUE' },
];

export const INVENTORY_PARTS: InventoryPart[] = [
  { id: 'INV-1', tenantId: 'TENANT-1', nome: 'Farol Dianteiro Gol G6', codigo: 'FAR-GOL-01', quantidade: 2, valorCusto: 150, valorVenda: 350, status: 'Disponível', dataEntrada: new Date().toISOString() },
  { id: 'INV-2', tenantId: 'TENANT-1', nome: 'Motor 1.0 AP', codigo: 'MOT-AP-01', quantidade: 1, valorCusto: 1500, valorVenda: 3000, status: 'Disponível', dataEntrada: new Date().toISOString() },
  { id: 'INV-3', tenantId: 'TENANT-1', nome: 'Câmbio Manual Onix', codigo: 'CAM-ONX-01', quantidade: 1, valorCusto: 800, valorVenda: 1600, status: 'Vendido', dataEntrada: new Date().toISOString() },
];

export const CUSTOMERS: Customer[] = [
  { id: 'CUST-1', tenantId: 'TENANT-1', nome: 'Oficina do Zé', telefone: '(11) 99999-9999', cidade: 'São Paulo', estado: 'SP', observacoes: 'Cliente VIP' },
  { id: 'CUST-2', tenantId: 'TENANT-1', nome: 'Auto Mecânica Silva', telefone: '(41) 88888-8888', cidade: 'Curitiba', estado: 'PR' }
];

export const CUSTOMER_INTERESTS: CustomerInterest[] = [
  { id: 'INT-1', customerId: 'CUST-1', marca: 'Volkswagen', modelo: 'Gol', peca: 'TBI', ativo: true },
  { id: 'INT-2', customerId: 'CUST-2', peca: 'Compressor Ar Condicionado', ativo: true },
];

export const TAGS: Tag[] = [
  { id: 'TAG-1', tenantId: 'TENANT-1', nome: 'Motor Bom', cor: 'bg-green-500' },
  { id: 'TAG-2', tenantId: 'TENANT-1', nome: 'Alto Lucro', cor: 'bg-blue-500' },
  { id: 'TAG-3', tenantId: 'TENANT-1', nome: 'Atenção Documento', cor: 'bg-red-500' },
];

export const LOT_TAGS: LotTag[] = [
  { lotId: LOTS[0].id, tagId: 'TAG-1' },
  { lotId: LOTS[0].id, tagId: 'TAG-2' },
];

export const PRIVATE_NOTES: Note[] = [
  { id: 'NOTE-1', tenantId: 'TENANT-1', lotId: LOTS[0].id, usuarioId: 'USER-1', texto: 'Verificar custo de frete antes de dar lance.', createdAt: new Date().toISOString() }
];

export const SAVED_FILTERS: SavedFilter[] = [
  { id: 'FIL-1', tenantId: 'TENANT-1', nome: 'Sucatas SP', filtroJson: { tipo: 'Sucata para Desmonte', estado: 'SP' }, createdAt: new Date().toISOString() },
  { id: 'FIL-2', tenantId: 'TENANT-1', nome: 'Honda Docs', filtroJson: { marca: 'Honda', tipo: 'Direito à Documentação' }, createdAt: new Date().toISOString() },
];
