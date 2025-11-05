import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';

// Verwende einen persistenten SQLite-Speicherort
const dbPath = process.env.DATABASE_URL || join(process.cwd(), 'zhort.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

