#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Ensures `npm run upgrade` is executed for production/CI deployments,
 * but does not break local builds when DATABASE_URL is not configured.
 *
 * Rules:
 * - If DATABASE_URL/POSTGRES_URL is present -> run upgrade (always)
 * - If missing and running on CI/Vercel/production -> fail fast
 * - If missing and local -> warn and continue
 */

const { execSync } = require('child_process');

function isTruthy(v) {
  return v === '1' || v === 'true' || v === 'yes';
}

const env = process.env;
const hasDbUrl = Boolean(env.DATABASE_URL || env.POSTGRES_URL);
const isCi = isTruthy(env.CI);
const isVercel = isTruthy(env.VERCEL) || Boolean(env.VERCEL_ENV);
const isProduction = env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';
const isDeployLike = isCi || isVercel || isProduction;

if (hasDbUrl) {
  execSync('npm run upgrade -- --skip-build', { stdio: 'inherit' });
  process.exit(0);
}

if (isDeployLike) {
  console.error('❌ DATABASE_URL/POSTGRES_URL is missing. Upgrade must run on deploy.');
  console.error('Set DATABASE_URL (or POSTGRES_URL) for production builds.');
  process.exit(1);
}

console.warn('⚠️  DATABASE_URL/POSTGRES_URL not set; skipping `npm run upgrade` for local build.');
process.exit(0);

