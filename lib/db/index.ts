import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Globale Cache-Variable für die DB-Verbindung
declare global {
  // eslint-disable-next-line no-var
  var dbConnection: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getDb() {
  if (!global.dbConnection) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    
    if (!connectionString) {
      throw new Error('Database connection string not found. Set DATABASE_URL or POSTGRES_URL environment variable.');
    }

    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    global.dbConnection = drizzle(client, { schema });
  }

  return global.dbConnection;
}

// Proxy-Objekt, das DB-Abfragen erst bei tatsächlichem Zugriff ausführt
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle<typeof schema>>];
  },
});

