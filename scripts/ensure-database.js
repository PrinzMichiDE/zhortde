#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Ensures the database schema at container/runtime startup.
 * 1. Applies drizzle SQL migrations idempotently
 * 2. Runs drizzle-kit push using drizzle.config.js (dialect + schema)
 */

const { execFileSync } = require('child_process');
const { readFileSync, readdirSync, existsSync } = require('fs');
const path = require('path');
const postgres = require('postgres');

const IGNORABLE_PG_CODES = new Set([
  '42P07',
  '42701',
  '42710',
  '42P06',
  '42704',
]);

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function isIgnorableMigrationError(error) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if (error.code && IGNORABLE_PG_CODES.has(error.code)) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('multiple primary keys')
  );
}

async function applySqlMigrations(databaseUrl) {
  const migrationsDir = path.join(process.cwd(), 'drizzle');
  if (!existsSync(migrationsDir)) {
    console.warn('⚠️  drizzle/ folder not found; skipping SQL migrations.');
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });

  try {
    for (const file of files) {
      const content = readFileSync(path.join(migrationsDir, file), 'utf8');
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
    console.log('✓ SQL migrations applied');
  } finally {
    await client.end();
  }
}

function runDrizzleKitPush(databaseUrl) {
  const schemaPath = path.join(process.cwd(), 'lib/db/schema.ts');
  if (!existsSync(schemaPath)) {
    throw new Error(`Missing ${schemaPath}`);
  }

  const drizzleKitPath = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'drizzle-kit.cmd' : 'drizzle-kit',
  );

  execFileSync(
    drizzleKitPath,
    [
      'push',
      '--force',
      '--dialect',
      'postgresql',
      '--schema',
      './lib/db/schema.ts',
      '--url',
      databaseUrl,
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        POSTGRES_URL: databaseUrl,
      },
    },
  );
}

async function main() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL not set; skipping schema ensure.');
    process.exit(0);
  }

  if (!databaseUrl.startsWith('postgres')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string.');
    process.exit(1);
  }

  console.log('\n📊 Ensuring database schema...\n');
  console.log(`Database: ${databaseUrl.replace(/:([^:@]+)@/, ':****@')}\n`);

  await applySqlMigrations(databaseUrl);
  runDrizzleKitPush(databaseUrl);

  console.log('\n✅ Database schema is up to date.\n');
}

main().catch((error) => {
  console.error('\n❌ Failed to ensure database schema.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
