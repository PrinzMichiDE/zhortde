#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Docker container entrypoint:
 * 1. Sync database schema (drizzle-kit push)
 * 2. Start the Next.js standalone server
 */

const { execSync, spawn } = require('child_process');

if (process.env.SKIP_DB_ENSURE !== '1') {
  try {
    execSync('node scripts/ensure-database.js', { stdio: 'inherit' });
  } catch {
    console.error('❌ Database schema bootstrap failed. Container will not start.');
    process.exit(1);
  }
} else {
  console.warn('⚠️  SKIP_DB_ENSURE=1 — skipping database schema bootstrap.');
}

const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env,
});

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
process.on('SIGINT', () => server.kill('SIGINT'));
