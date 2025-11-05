# Zhort - Entwicklungs-Dokumentation

## Schnellstart

### Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft dann auf `http://localhost:3000`.

### Datenbank-Befehle

```bash
# Schema-Änderungen generieren
npm run db:generate

# Schema in Datenbank pushen
npm run db:push

# Drizzle Studio öffnen (Datenbank-GUI)
npm run db:studio
```

## Projektstruktur

### Haupt-Routen

1. **Homepage (`/`)**: URL-Shortener-Formular
2. **Login (`/login`)**: Benutzer-Anmeldung
3. **Registrierung (`/register`)**: Neuen Account erstellen
4. **Dashboard (`/dashboard`)**: Verwaltung von Links und Pastes (authentifiziert)
5. **Paste erstellen (`/paste/create`)**: Neues Paste erstellen
6. **Paste anzeigen (`/p/[slug]`)**: Paste-Anzeige mit Syntax-Highlighting
7. **Link-Weiterleitung (`/s/[shortCode]`)**: Automatische Weiterleitung zur Ziel-URL

### API-Endpunkte

#### Authentifizierung
- `POST /api/auth/[...nextauth]`: NextAuth.js-Handler

#### Links
- `POST /api/links`: Neuen Link erstellen
- `DELETE /api/links/[id]`: Link löschen (authentifiziert)

#### Pastes
- `POST /api/pastes`: Neues Paste erstellen
- `DELETE /api/pastes/[id]`: Paste löschen (authentifiziert)

## Komponenten-Architektur

### Server Components (Standard)
- `app/page.tsx`: Homepage
- `app/dashboard/page.tsx`: Dashboard
- `app/p/[slug]/page.tsx`: Paste-Anzeige (Server-Teil)
- Alle Layout-Komponenten

### Client Components (`'use client'`)
- `components/header.tsx`: Navigation mit Session-Status
- `components/providers.tsx`: NextAuth SessionProvider
- `components/paste-display.tsx`: Paste-Anzeige mit Syntax-Highlighting
- `components/dashboard/links-list.tsx`: Links-Verwaltung
- `components/dashboard/pastes-list.tsx`: Pastes-Verwaltung
- Alle Formulare und interaktive Komponenten

## Datenbank-Schema

### Tabellen

#### `users`
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- email: TEXT UNIQUE NOT NULL
- password_hash: TEXT NOT NULL
- created_at: INTEGER (timestamp) NOT NULL
```

#### `links`
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- short_code: TEXT UNIQUE NOT NULL
- long_url: TEXT NOT NULL
- user_id: INTEGER (FK -> users.id, CASCADE)
- is_public: BOOLEAN NOT NULL DEFAULT 1
- hits: INTEGER NOT NULL DEFAULT 0
- created_at: INTEGER (timestamp) NOT NULL
```

#### `pastes`
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- slug: TEXT UNIQUE NOT NULL
- content: TEXT NOT NULL
- user_id: INTEGER (FK -> users.id, CASCADE)
- syntax_highlighting_language: TEXT
- is_public: BOOLEAN NOT NULL DEFAULT 1
- created_at: INTEGER (timestamp) NOT NULL
```

## Funktionalitäten

### URL Shortener

**Anonyme Nutzung:**
- Jeder kann URLs kürzen
- Links sind automatisch öffentlich
- Kein Zugriff auf Dashboard/Statistiken

**Registrierte Nutzer:**
- Private Links erstellen (nur für eigenen Account sichtbar)
- Links im Dashboard verwalten
- Statistiken über Klicks einsehen
- Links löschen

### Pastebin

**Anonyme Nutzung:**
- Code/Text teilen ohne Account
- Automatisch öffentlich
- Syntax-Highlighting für 20+ Sprachen

**Registrierte Nutzer:**
- Private Pastes erstellen
- Pastes im Dashboard verwalten
- Pastes löschen

## Authentifizierung

### NextAuth.js

Die Authentifizierung verwendet NextAuth.js mit:
- **Strategy**: JWT-basierte Sessions
- **Provider**: Credentials (E-Mail/Passwort)
- **Passwort-Hashing**: bcryptjs

### Session-Zugriff

**Server Components:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const session = await getServerSession(authOptions);
```

**Client Components:**
```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
```

## Styling

### Tailwind CSS

Die Anwendung verwendet Tailwind CSS für das Styling. Hauptfarben:
- **Primary**: Indigo (indigo-600, indigo-700, etc.)
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red

### Headless UI

Verwendet für:
- Dropdown-Menüs (`Menu`)
- Toggle-Switches (`Switch`)
- Listboxes (`Listbox`)

Alle Headless UI-Komponenten sind vollständig mit Tailwind gestylt.

## Wichtige Entscheidungen

### Server vs. Client Components

**Server Components werden verwendet für:**
- Datenbank-Abfragen
- Authentifizierungs-Checks
- SEO-relevante Inhalte
- Statische Inhalte

**Client Components werden verwendet für:**
- Formulare mit State
- Interaktive UI-Elemente
- Browser-APIs (clipboard, etc.)
- Session-Status in Navigation

### Datenbank

**SQLite** für lokale Entwicklung:
- Einfaches Setup
- Keine externe Datenbank erforderlich
- Datei-basiert

**Für Produktion (Vercel):**
- Empfohlen: Turso (LibSQL) - serverless SQLite
- Alternative: PostgreSQL (Vercel Postgres, Supabase, etc.)

## Umgebungsvariablen

```env
# Datenbank
DATABASE_URL=./zhort.db

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

**Wichtig:** `NEXTAUTH_SECRET` sollte ein starker, zufälliger String sein. Generieren mit:
```bash
openssl rand -base64 32
```

## Bekannte Einschränkungen

1. **SQLite auf Vercel**: Nicht für Produktion geeignet (Ephemeral Filesystem)
   - Lösung: Migration zu Turso oder PostgreSQL

2. **Syntax-Highlighting**: Erhöht Bundle-Größe
   - Client-seitig geladen (keine SSR)
   - Alternative: Leichtere Bibliothek wie `shiki`

3. **Keine E-Mail-Verifikation**: Benutzer können sich mit beliebiger E-Mail registrieren
   - TODO: E-Mail-Verifikation implementieren

4. **Keine Rate-Limiting**: API-Endpoints sind nicht geschützt
   - TODO: Rate-Limiting mit `@upstash/ratelimit` oder ähnlich

## Nächste Schritte / Erweiterungen

- [ ] E-Mail-Verifikation für neue Accounts
- [ ] Rate-Limiting für API-Routen
- [ ] QR-Code-Generierung für Short-Links
- [ ] Link-Ablaufdatum (expiry)
- [ ] Benutzerdefinierte Short-Codes
- [ ] Analytics-Dashboard mit Grafiken
- [ ] Export-Funktion für Links/Pastes
- [ ] Dark Mode
- [ ] Internationalisierung (i18n)
- [ ] API-Schlüssel für programmatischen Zugriff

## Troubleshooting

### Datenbank-Fehler

**Problem**: `table users already exists`
**Lösung**: Datenbank zurücksetzen
```bash
rm zhort.db zhort.db-shm zhort.db-wal
npm run db:push
```

### Build-Fehler

**Problem**: TypeScript-Fehler
**Lösung**: Node-Modules neu installieren
```bash
rm -rf node_modules package-lock.json
npm install
```

### NextAuth-Fehler

**Problem**: `[next-auth][error][SIGNIN_OAUTH_ERROR]`
**Lösung**: 
1. Prüfe `NEXTAUTH_URL` in `.env.local`
2. Prüfe `NEXTAUTH_SECRET` ist gesetzt
3. Server neustarten

## Performance-Optimierungen

1. **Syntax-Highlighter**: Dynamic Import (nur bei Bedarf geladen)
2. **Images**: Next.js Image-Komponente (wenn verwendet)
3. **Fonts**: Google Fonts mit Next.js Font-Optimierung
4. **Database Queries**: Drizzle ORM mit prepared statements

## Sicherheit

### Implementiert
- ✅ Passwort-Hashing mit bcrypt
- ✅ JWT-basierte Sessions
- ✅ SQL-Injection-Schutz durch Drizzle ORM
- ✅ CSRF-Schutz durch NextAuth.js
- ✅ Zugriffskontrolle für private Links/Pastes

### TODO
- ⏳ Rate-Limiting
- ⏳ E-Mail-Verifikation
- ⏳ 2FA (Zwei-Faktor-Authentifizierung)
- ⏳ Content Security Policy (CSP)

