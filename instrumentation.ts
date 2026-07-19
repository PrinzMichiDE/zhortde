export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // Non-blocking: schema sync also runs on first /api/links request.
  void import('./lib/db/ensure-schema')
    .then(({ ensureDatabaseSchema }) => ensureDatabaseSchema())
    .catch((error) => {
      console.error('Background database schema ensure failed:', error);
    });
}
