import { query } from "@/db/index";
import bcrypt from "bcryptjs";

export async function ensureUsersTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      failed_attempts INTEGER DEFAULT 0,
      lockout_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function seedAdminUser(): Promise<void> {
  const email = "admin@leilaohub.com.br";
  const defaultPassword = "Admin@123456!";
  const nome = "Administrador";

  // Check if admin user already exists
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length === 0) {
    console.log("🌱 Semeando usuário administrador inicial...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    await query(
      `INSERT INTO users (email, password_hash, nome) VALUES ($1, $2, $3)`,
      [email, passwordHash, nome]
    );
    console.log(`✅ Usuário administrador criado: ${email} / ${defaultPassword}`);
  }
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  nome: string;
  failed_attempts: number;
  lockout_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0] as User;
}

export async function updateUserAttempts(
  id: number,
  failedAttempts: number,
  lockoutUntil: Date | null
): Promise<void> {
  await query(
    "UPDATE users SET failed_attempts = $1, lockout_until = $2, updated_at = NOW() WHERE id = $3",
    [failedAttempts, lockoutUntil, id]
  );
}

export async function resetUserAttempts(id: number): Promise<void> {
  await query(
    "UPDATE users SET failed_attempts = 0, lockout_until = NULL, updated_at = NOW() WHERE id = $1",
    [id]
  );
}
