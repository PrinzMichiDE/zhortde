/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
};
