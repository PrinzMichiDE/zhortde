# Zhort - URL Shortener & Pastebin

Eine moderne Next.js-Anwendung zum Kürzen von URLs und Teilen von Code-Snippets.

## Features

- ⚡ **URL Shortener**: Kürzen Sie lange URLs schnell und einfach
- 📄 **Pastebin**: Teilen Sie Code-Snippets mit Syntax-Highlighting und Raw-Ansicht
- 🔐 **Authentifizierung**: Optionale Registrierung für erweiterte Funktionen
- 📊 **Dashboard**: Verwalten Sie Ihre Links und Pastes
- 🔒 **Private Links**: Erstellen Sie private Links, die nur für Sie sichtbar sind
- 📈 **Statistiken**: Verfolgen Sie Klicks auf Ihre Links
- 🛡️ **Blocklist-Schutz**: Automatische Prüfung gegen Hagezi DNS Blocklist
- 🔌 **Öffentliche API**: Programmatischer Zugriff zum Kürzen von URLs
- ✏️ **Individuelle Short Codes**: Wählen Sie Ihren eigenen Short Code (für alle Nutzer)

## Technologie-Stack

- **Framework**: Next.js 14 (App Router)
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS
- **UI-Komponenten**: Headless UI
- **Datenbank**: PostgreSQL mit Drizzle ORM
- **Authentifizierung**: NextAuth.js
- **Syntax-Highlighting**: React Syntax Highlighter

## Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd zhort
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis:
```env
# PostgreSQL (von Vercel)
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

**Hinweis**: Für lokale Entwicklung können Sie eine lokale PostgreSQL-Instanz verwenden oder die Vercel-Datenbank.

4. Datenbank-Migrationen:
```bash
# Generiere Migrationen
npm run db:generate

# Pushe Schema zur Datenbank
npm run db:push
```

5. Entwicklungsserver starten:
```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:3000` verfügbar.

## Deployment auf Vercel

### Vercel PostgreSQL einrichten

1. Gehen Sie zu Ihrem Vercel-Projekt
2. Navigieren Sie zu **Storage** → **Create Database** → **Postgres**
3. Vercel erstellt automatisch:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### Deployment-Schritte

1. Pushen Sie Ihr Projekt zu GitHub
2. Importieren Sie das Projekt in Vercel
3. Verbinden Sie die PostgreSQL-Datenbank (siehe oben)
4. Fügen Sie zusätzliche Umgebungsvariablen hinzu:
   - `DATABASE_URL` (kopieren Sie `POSTGRES_URL`)
   - `NEXTAUTH_URL` (Ihre Vercel-Domain, z.B. `https://zhort.vercel.app`)
   - `NEXTAUTH_SECRET` (generieren Sie einen sicheren Schlüssel)
5. Deployen Sie das Projekt
6. Nach dem Deploy: Führen Sie die Datenbank-Migration aus:
   ```bash
   npx drizzle-kit push
   ```
   Oder verwenden Sie die Vercel CLI

## Verwendung

### Anonyme Nutzung

- Kürzen Sie URLs ohne Registrierung
- Erstellen Sie Pastes ohne Account
- Alle anonymen Inhalte sind öffentlich

### Registrierte Nutzer

- Private Links und Pastes erstellen
- Dashboard zur Verwaltung Ihrer Inhalte
- Statistiken über Link-Klicks
- Links und Pastes löschen

## Projektstruktur

```
zhort/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   ├── dashboard/           # Dashboard-Seite
│   ├── login/               # Login-Seite
│   ├── register/            # Registrierungs-Seite
│   ├── paste/               # Paste-Seiten
│   ├── p/[slug]/            # Paste-Anzeige
│   │   └── raw/            # Raw-Ansicht (reiner Text)
│   └── s/[shortCode]/       # Link-Weiterleitung
├── components/              # React-Komponenten
├── lib/                     # Utility-Funktionen
│   ├── auth/               # Authentifizierungs-Logik
│   └── db/                 # Datenbank-Schema und -Konfiguration
├── types/                   # TypeScript-Typen
└── public/                  # Statische Assets
```

## Datenbank-Schema

### Users
- `id`: Primärschlüssel
- `email`: E-Mail-Adresse (unique)
- `passwordHash`: Gehashtes Passwort
- `createdAt`: Erstellungszeitpunkt

### Links
- `id`: Primärschlüssel
- `shortCode`: Kurzer Code für die URL (unique)
- `longUrl`: Ziel-URL
- `userId`: Referenz zum Benutzer (optional)
- `isPublic`: Öffentlich/Privat
- `hits`: Anzahl der Klicks
- `createdAt`: Erstellungszeitpunkt

### Pastes
- `id`: Primärschlüssel
- `slug`: Eindeutiger Slug (unique)
- `content`: Paste-Inhalt
- `userId`: Referenz zum Benutzer (optional)
- `syntaxHighlightingLanguage`: Programmiersprache (optional)
- `isPublic`: Öffentlich/Privat
- `createdAt`: Erstellungszeitpunkt

## Scripts

- `npm run dev`: Entwicklungsserver starten
- `npm run build`: Produktions-Build erstellen
- `npm run start`: Produktionsserver starten
- `npm run lint`: Linting ausführen
- `npm run db:generate`: Datenbank-Migrationen generieren
- `npm run db:push`: Schema in Datenbank pushen
- `npm run db:studio`: Drizzle Studio öffnen

## Lizenz

MIT
