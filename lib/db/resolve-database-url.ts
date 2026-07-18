export function resolveDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!url || !url.startsWith('postgres')) {
    return null;
  }
  return url;
}
