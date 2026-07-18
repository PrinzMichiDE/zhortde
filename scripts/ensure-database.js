#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Ensures the database schema matches lib/db/schema.ts at runtime.
 * Used by Docker entrypoint and can be run manually in production.
 */

const { execFileSync } = require('child_process');
const path = require('path');

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

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

try {
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
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        POSTGRES_URL: databaseUrl,
      },
    },
  );

  console.log('\n✅ Database schema is up to date.\n');
} catch (error) {
  console.error('\n❌ Failed to ensure database schema.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
