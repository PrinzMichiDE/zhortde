import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { resolveDatabaseUrl } from './resolve-database-url';
import { applySqlMigrations } from './sql-migrate';
import * as schema from './schema';

let schemaEnsured = false;
let ensurePromise: Promise<boolean> | null = null;

async function pushSchemaWithDrizzleKit(databaseUrl: string): Promise<void> {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });

  try {
    const db = drizzle(client, { schema });
    const { pushSchema } = await import('drizzle-kit/api');
    // drizzle-kit types target node-pg; postgres-js drizzle works at runtime
    const result = await pushSchema(
      { './lib/db/schema.ts': schema },
      db as never,
    );
    await result.apply();
  } finally {
    await client.end();
  }
}

async function ensureSchemaInternal(): Promise<boolean> {
  if (schemaEnsured) {
    return true;
  }

  if (process.env.SKIP_DB_ENSURE === '1') {
    return false;
  }

  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    return false;
  }

  try {
    await applySqlMigrations(databaseUrl);
    await pushSchemaWithDrizzleKit(databaseUrl);
    schemaEnsured = true;

    const { initStats } = await import('./init-stats');
    await initStats();

    return true;
  } catch (error) {
    console.error(
      'Failed to ensure database schema. Link creation and rate limiting may not work.',
      error,
    );
    return false;
  }
}

export async function ensureDatabaseSchema(): Promise<boolean> {
  if (schemaEnsured) {
    return true;
  }

  if (!ensurePromise) {
    ensurePromise = ensureSchemaInternal();
  }

  return ensurePromise;
}
