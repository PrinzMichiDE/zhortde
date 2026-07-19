import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const IGNORABLE_PG_CODES = new Set([
  '42P07', // duplicate_table
  '42701', // duplicate_column
  '42710', // duplicate_object
  '42P06', // duplicate_schema
  '42704', // undefined_object (constraint already dropped)
]);

function isIgnorableMigrationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const pgError = error as { code?: string; message?: string };
  if (pgError.code && IGNORABLE_PG_CODES.has(pgError.code)) {
    return true;
  }

  const message = (pgError.message ?? '').toLowerCase();
  return (
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('multiple primary keys')
  );
}

/**
 * Applies drizzle SQL migration files idempotently.
 * Ignores "already exists" errors so partially migrated databases can recover.
 */
export async function applySqlMigrations(databaseUrl: string): Promise<void> {
  const migrationsDir = join(process.cwd(), 'drizzle');
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });

  try {
    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), 'utf8');
      const statements = content
        .split('--> statement-breakpoint')
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        try {
          await client.unsafe(statement);
        } catch (error) {
          if (!isIgnorableMigrationError(error)) {
            throw error;
          }
        }
      }
    }
  } finally {
    await client.end();
  }
}
