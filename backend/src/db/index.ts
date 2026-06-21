import { Pool } from "pg";
import config from "@/config/index";

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function close() {
  await pool.end();
}
