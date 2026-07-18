export function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('invalid or missing postgresql') ||
    message.includes('connection') ||
    message.includes('connect') ||
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('no available server') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('getaddrinfo')
  );
}

export function getDatabaseErrorMessage(error: unknown): string {
  if (isDatabaseUnavailable(error)) {
    return 'Datenbank vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.';
  }

  return 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
}
