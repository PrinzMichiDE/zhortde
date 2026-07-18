import { execFileSync } from 'child_process';
import path from 'path';
import { resolveDatabaseUrl } from './resolve-database-url';

let schemaEnsured = false;
let ensurePromise: Promise<boolean> | null = null;

function runDrizzlePush(databaseUrl: string): void {
  const drizzleKitPath = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'drizzle-kit.cmd' : 'drizzle-kit',
  );

  execFileSync(
    drizzleKitPath,
    ['push', '--force', '--url', databaseUrl],
    {
      stdio: process.env.NODE_ENV === 'development' ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        POSTGRES_URL: databaseUrl,
      },
    },
  );
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
    runDrizzlePush(databaseUrl);
    schemaEnsured = true;

    const { initStats } = await import('./init-stats');
    await initStats();

    if (process.env.NODE_ENV !== 'production') {
      console.log('Database schema ensured successfully.');
    }

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
