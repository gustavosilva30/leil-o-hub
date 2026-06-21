import type { AuctionLot } from "@/services/leiloesScraper";
import { query } from "@/db/index";

export async function ensureAuctionLotsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS auction_lots (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      source_lot_id TEXT,
      numero_lote TEXT NOT NULL,
      veiculo_origem TEXT,
      link_leilao TEXT,
      tipo_sucata TEXT,
      image_url TEXT,
      auction_start_at TIMESTAMPTZ,
      auction_end_at TIMESTAMPTZ,
      fonte TEXT,
      marca TEXT,
      modelo TEXT,
      ano TEXT,
      placa TEXT,
      raw JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (source, numero_lote)
    );
  `);
}

const UPSERT_AUCTION_LOT = `
  INSERT INTO auction_lots
    (source, source_lot_id, numero_lote, veiculo_origem, link_leilao, tipo_sucata, image_url,
      auction_start_at, auction_end_at, fonte, marca, modelo, ano, placa, raw)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (source, numero_lote) DO UPDATE SET
    source_lot_id = EXCLUDED.source_lot_id,
    veiculo_origem = EXCLUDED.veiculo_origem,
    link_leilao = EXCLUDED.link_leilao,
    tipo_sucata = EXCLUDED.tipo_sucata,
    image_url = EXCLUDED.image_url,
    auction_start_at = EXCLUDED.auction_start_at,
    auction_end_at = EXCLUDED.auction_end_at,
    fonte = EXCLUDED.fonte,
    marca = EXCLUDED.marca,
    modelo = EXCLUDED.modelo,
    ano = EXCLUDED.ano,
    placa = EXCLUDED.placa,
    raw = EXCLUDED.raw,
    updated_at = NOW();
`;

export async function upsertAuctionLot(lot: AuctionLot): Promise<void> {
  const params = [
    lot.source ?? lot.fonte ?? "unknown",
    lot.source_lot_id ?? null,
    lot.numero_lote,
    lot.veiculo_origem ?? null,
    lot.link_leilao ?? null,
    lot.tipo_sucata ?? null,
    lot.image_url ?? null,
    lot.auction_start_at ?? null,
    lot.auction_end_at ?? null,
    lot.fonte ?? null,
    lot.marca ?? null,
    lot.modelo ?? null,
    lot.ano ?? null,
    lot.placa ?? null,
    lot.raw ?? null,
  ];

  await query(UPSERT_AUCTION_LOT, params);
}

export async function insertAuctionLots(lots: AuctionLot[]): Promise<number> {
  if (!lots.length) {
    return 0;
  }

  for (const lot of lots) {
    await upsertAuctionLot(lot);
  }

  return lots.length;
}

export async function fetchAuctionLots(limit = 100): Promise<AuctionLot[]> {
  const result = await query(
    `SELECT id, source, source_lot_id, numero_lote, veiculo_origem, link_leilao, tipo_sucata, image_url,
      auction_start_at, auction_end_at, fonte, marca, modelo, ano, placa, raw
      FROM auction_lots
      ORDER BY auction_start_at NULLS LAST, created_at DESC
      LIMIT $1`,
    [limit]
  );

  return result.rows as AuctionLot[];
}

export async function fetchAuctionLotById(id: number): Promise<AuctionLot | null> {
  const result = await query(
    `SELECT id, source, source_lot_id, numero_lote, veiculo_origem, link_leilao, tipo_sucata, image_url,
      auction_start_at, auction_end_at, fonte, marca, modelo, ano, placa, raw
      FROM auction_lots
      WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0] as AuctionLot;
}
