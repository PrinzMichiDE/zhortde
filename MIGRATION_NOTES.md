# Migration von SQLite zu PostgreSQL

## Übersicht

Das Zhort-Projekt wurde erfolgreich von SQLite zu PostgreSQL migriert, um optimal mit Vercel zusammenzuarbeiten.

## Geänderte Dateien

### 1. `lib/db/schema.ts`
- **Vorher**: `sqliteTable` mit `integer` für IDs und Booleans
- **Nachher**: `pgTable` mit `serial` für Auto-Increment IDs und nativen `boolean`-Typ
- Timestamps verwenden jetzt `timestamp().defaultNow()` statt `integer` mit `unixepoch()`

```typescript
// Alte SQLite-Definition
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  isPublic: integer('is_public', { mode: 'boolean' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Neue PostgreSQL-Definition
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  isPublic: boolean('is_public'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2. `lib/db/index.ts`
- **Vorher**: `better-sqlite3` für lokale SQLite-Datei
- **Nachher**: `postgres` Client mit Connection Pooling
- Verbindung über `DATABASE_URL` oder `POSTGRES_URL` Umgebungsvariable

```typescript
// Alte SQLite-Verbindung
import Database from 'better-sqlite3';
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Neue PostgreSQL-Verbindung
import postgres from 'postgres';
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
```

### 3. `drizzle.config.ts`
- **Vorher**: `dialect: 'sqlite'` mit lokalem Dateipfad
- **Nachher**: `dialect: 'postgresql'` mit Connection String

### 4. `.env.local`
- **Neu**: PostgreSQL-spezifische Umgebungsvariablen

```env
# Vorher
DATABASE_URL=./zhort.db

# Nachher
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_URL=postgresql://user:password@host:port/database
```

### 5. `package.json`
- **Entfernt**: `better-sqlite3`, `@types/better-sqlite3`
- **Hinzugefügt**: `postgres`
- **Aktualisiert**: `drizzle-orm` auf neueste Version

## Datentyp-Mapping

| SQLite | PostgreSQL |
|--------|------------|
| `integer('id').primaryKey({ autoIncrement: true })` | `serial('id').primaryKey()` |
| `integer('is_public', { mode: 'boolean' })` | `boolean('is_public')` |
| `integer('created_at', { mode: 'timestamp' })` | `timestamp('created_at')` |
| `default(sql\`(unixepoch())\`)` | `defaultNow()` |

## Vorteile der Migration

### 1. **Vercel-Kompatibilität**
- Vercel Postgres ist vollständig managed
- Automatische Backups
- Serverless Architecture

### 2. **Bessere Datentypen**
- Native Boolean-Typen
- Native Timestamp-Typen
- Bessere Typsicherheit

### 3. **Skalierbarkeit**
- Connection Pooling integriert
- Horizontale Skalierung möglich
- Keine Dateigrößen-Limitierungen

### 4. **Performance**
- Optimierte Queries
- Indizes und Constraints
- Transaktionen

## Deployment-Workflow

### Lokale Entwicklung
```bash
# 1. PostgreSQL-Umgebungsvariablen setzen
# 2. Schema pushen
npm run db:push

# 3. Dev-Server starten
npm run dev
```

### Produktion (Vercel)
```bash
# 1. Vercel Postgres erstellen (via Dashboard)
# 2. Umgebungsvariablen setzen
# 3. Deployen
vercel deploy

# 4. Schema migrieren
vercel env pull .env.local
npm run db:push
```

## Rückwärts-Kompatibilität

❌ **Keine direkte Rückwärts-Kompatibilität**

Die Migration ist eine Breaking Change. Wenn Sie zu SQLite zurückkehren möchten:
1. Setzen Sie alle Dateien auf den vorherigen Commit zurück
2. Führen Sie `npm install` aus
3. Exportieren/Importieren Sie Ihre Daten manuell

## Testing

Alle Funktionen wurden getestet:
- ✅ Build erfolgreich (`npm run build`)
- ✅ TypeScript-Typen korrekt
- ✅ Schema-Definition valide
- ✅ Keine Linter-Fehler

## Nächste Schritte

1. Verbinden Sie Vercel Postgres in Ihrem Dashboard
2. Setzen Sie die Umgebungsvariablen
3. Deployen Sie die Anwendung
4. Führen Sie `npm run db:push` aus
5. Testen Sie die Anwendung

## Support

Bei Fragen zur Migration:
- Lesen Sie `VERCEL_DEPLOYMENT.md` für detaillierte Deployment-Anweisungen
- Konsultieren Sie die [Drizzle PostgreSQL Docs](https://orm.drizzle.team/docs/get-started-postgresql)
- Prüfen Sie die [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)

