export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { ensureDatabaseSchema } = await import('./lib/db/ensure-schema');
  await ensureDatabaseSchema();
}
