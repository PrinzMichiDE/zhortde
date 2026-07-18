#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Push Schema zur Datenbank
 * Nutzt DATABASE_URL aus der Umgebung oder .env.local
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envVars = {};
  const envContent = fs.readFileSync(filePath, 'utf8');

  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (line.startsWith('#') || !line) {
      return;
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      return;
    }

    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);
    }

    if (key && value) {
      envVars[key] = value;
    }
  });

  return envVars;
}

const envPath = path.join(process.cwd(), '.env.local');
const fileEnv = loadEnvFile(envPath);
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  fileEnv.DATABASE_URL ||
  fileEnv.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL oder POSTGRES_URL nicht gefunden!');
  console.log('\n📝 Setzen Sie DATABASE_URL in der Umgebung oder in .env.local\n');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.error('❌ Ungültige DATABASE_URL!');
  console.log(`Gefunden: ${databaseUrl}`);
  console.log('\nMuss starten mit: postgres:// oder postgresql://\n');
  process.exit(1);
}

console.log('\n📊 Pushing schema to database...\n');
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

  console.log('\n✅ Schema erfolgreich gepusht!\n');
} catch {
  console.error('\n❌ Fehler beim Pushen des Schemas');
  process.exit(1);
}
