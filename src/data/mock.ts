import { Auction, Auctioneer, Lot, Tenant, User, Alert, Favorite, AuctionHistory, Purchase, VehiclePart, InventoryPart, Customer, CustomerInterest, Tag, LotTag, Note, SavedFilter } from '../types';

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

