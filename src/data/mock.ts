import { Auction, Auctioneer, Lot, Tenant, User, Alert, Favorite, AuctionHistory, Purchase, VehiclePart, InventoryPart, Customer, CustomerInterest, Tag, LotTag, Note, SavedFilter } from '../types';

export const BRANDS = [
  { brand: 'Chevrolet', models: ['Onix', 'Prisma', 'Celta', 'Corsa', 'Cruze', 'Tracker', 'S10', 'Montana', 'Spin', 'Kadett', 'Monza'] },
  { brand: 'Fiat', models: ['Strada', 'Uno', 'Palio', 'Argo', 'Mobi', 'Toro', 'Fiorino', 'Siena', 'Cronos', 'Pulse', 'Idea', 'Punto'] },
  { brand: 'Volkswagen', models: ['Gol', 'Fox', 'Saveiro', 'Polo', 'Voyage', 'Golf', 'T-Cross', 'Nivus', 'Virtus', 'Amarok', 'Jetta', 'Bora'] },
  { brand: 'Ford', models: ['Ka', 'Fiesta', 'EcoSport', 'Ranger', 'Focus', 'Fusion', 'Focus Sedan'] },
  { brand: 'Hyundai', models: ['HB20', 'Creta', 'Tucson', 'HB20S', 'i30', 'Elantra', 'Santa Fe'] },
  { brand: 'Toyota', models: ['Corolla', 'Hilux', 'Etios', 'Yaris', 'SW4', 'RAV4'] },
  { brand: 'Honda', models: ['Civic', 'Fit', 'HR-V', 'City', 'CR-V'] },
  { brand: 'Renault', models: ['Sandero', 'Logan', 'Duster', 'Kwid', 'Captur', 'Oroch', 'Clio'] },
  { brand: 'Jeep', models: ['Compass', 'Renegade', 'Commander', 'Grand Cherokee'] },
  { brand: 'Nissan', models: ['Versa', 'March', 'Kicks', 'Frontier', 'Sentra'] },
  { brand: 'Peugeot', models: ['208', '2008', '308', '207', '3008'] },
  { brand: 'Citroën', models: ['C3', 'C4 Cactus', 'C3 Aircross', 'C4 Picasso'] },
  { brand: 'Mitsubishi', models: ['L200 Triton', 'ASX', 'Outlander', 'Pajero'] },
  { brand: 'Caoa Chery', models: ['Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Arrizo 6'] },
  { brand: 'Kia', models: ['Sportage', 'Cerato', 'Picanto', 'Sorento'] },
  { brand: 'BMW', models: ['320i', 'X1', '328i', 'X3', 'X5'] },
  { brand: 'Mercedes-Benz', models: ['Classe C', 'GLA', 'Classe A', 'C180', 'C200'] },
  { brand: 'Audi', models: ['A3', 'A4', 'Q3', 'A5', 'Q5'] },
];

export const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
export const CITIES = ['São Paulo', 'Campinas', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Goiânia', 'Salvador'];

export const AUCTIONEERS: Auctioneer[] = [
  { id: 'AUC-1', nome: 'Copart Brasil', site: 'https://copart.com.br', estado: 'SP' },
  { id: 'AUC-2', nome: 'Sodré Santoro', site: 'https://sodresantoro.com.br', estado: 'SP' },
  { id: 'AUC-3', nome: 'Milan Leilões', site: 'https://milanleiloes.com.br', estado: 'SP' },
  { id: 'AUC-4', nome: 'Pestana Leilões', site: 'https://pestanaleiloes.com.br', estado: 'RS' },
  { id: 'AUC-5', nome: 'VIP Leilões', site: 'https://vipleiloes.com.br', estado: 'SP' },
  { id: 'AUC-6', nome: 'Marca Leilões', site: 'https://www.marcaleiloes.com.br', estado: 'MS' },
  { id: 'AUC-7', nome: 'Via Leilões', site: 'https://www.vialeiloes.com.br', estado: 'SP' },
  { id: 'AUC-8', nome: 'Regina Aude Leilões', site: 'https://www.reginaaudeleiloes.com.br', estado: 'MS' },
  { id: 'AUC-9', nome: 'AutoTran Leilões', site: 'https://autotranleiloes.org', estado: 'MS' },
  { id: 'AUC-10', nome: 'Leiló', site: 'https://leilo.com.br', estado: 'MS' }
];

export const AUCTIONS: Auction[] = [];

export const LOTS: Lot[] = [];

export const TENANTS: Tenant[] = [
  {
    id: 'TENANT-1',
    nome: 'AutoPeças Brasil Ltda',
    plano: 'Pro',
  }
];

export const USERS: User[] = [
  {
    id: 'USER-1',
    tenantId: 'TENANT-1',
    nome: 'Usuário Administrador',
    email: 'admin@leilaohub.com.br',
    role: 'Admin'
  }
];

export const CURRENT_TENANT = TENANTS[0];
export const CURRENT_USER = USERS[0];

export const ALERTS: Alert[] = [];
export const FAVORITES: Favorite[] = [];
export const AUCTION_HISTORY: AuctionHistory[] = [];
export const PURCHASES: Purchase[] = [];
export const VEHICLE_PARTS: VehiclePart[] = [];
export const INVENTORY_PARTS: InventoryPart[] = [];
export const CUSTOMERS: Customer[] = [];
export const CUSTOMER_INTERESTS: CustomerInterest[] = [];
export const TAGS: Tag[] = [];
export const LOT_TAGS: LotTag[] = [];
export const PRIVATE_NOTES: Note[] = [];
export const SAVED_FILTERS: SavedFilter[] = [];

