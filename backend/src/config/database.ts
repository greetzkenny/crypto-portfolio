import { Client, Pool } from "postgres";
import { DatabaseConfig } from "../types/index.ts";

let pool: Pool | null = null;

export function createDatabasePool(config: DatabaseConfig): Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    hostname: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  }, 10); // Pool size of 10 connections

  return pool;
}

export function getDatabasePool(): Pool {
  if (!pool) {
    throw new Error("Database pool not initialized. Call createDatabasePool first.");
  }
  return pool;
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Helper function to get a client from the pool
export async function getClient(): Promise<Client> {
  const pool = getDatabasePool();
  return await pool.connect();
}

// Helper function to execute a query with automatic client management
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await getClient();
  try {
    const result = await client.queryObject<T>(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.queryObject("BEGIN");
    const result = await callback(client);
    await client.queryObject("COMMIT");
    return result;
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} 