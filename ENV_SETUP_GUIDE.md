# 🔧 Environment Variables Setup Guide

## Problem: DATABASE_URL zeigt auf ./zhort.db (SQLite)

Nach der Migration zu PostgreSQL müssen die Environment-Variablen aktualisiert werden.

---

## ✅ Lösung 1: Lokale Entwicklung mit PostgreSQL

### Schritt 1: Lokale PostgreSQL installieren (optional)

#### Windows
```powershell
# Via Chocolatey
choco install postgresql

# Oder via Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux
```bash
sudo apt-get install postgresql
```

### Schritt 2: .env.local aktualisieren

Öffnen Sie `C:\projects\zhort\.env.local` und ändern Sie:

```env
# ❌ ALT (SQLite)
DATABASE_URL=./zhort.db

# ✅ NEU (PostgreSQL lokal)
DATABASE_URL=postgresql://postgres:password@localhost:5432/zhort

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-here
```

### Schritt 3: Lokale Datenbank erstellen

```bash
# PostgreSQL Datenbank erstellen
createdb zhort

# Schema migrieren
npm run db:push

# Dev-Server starten
npm run dev
```

---

## ✅ Lösung 2: Vercel Postgres für lokale Entwicklung

### Schritt 1: Credentials von Vercel holen

1. Gehen Sie zu [Vercel Dashboard](https://vercel.com/dashboard)
2. **Storage** → Ihre Datenbank → **Settings**
3. Kopieren Sie `POSTGRES_URL` oder `DATABASE_URL`

### Schritt 2: .env.local aktualisieren

```env
# Von Vercel kopiert:
DATABASE_URL=postgresql://default:...@...vercel-storage.com:5432/verceldb

# Oder via Vercel CLI:
# vercel env pull .env.local
```

### Schritt 3: Testen

```bash
npm run dev
```

---

## ✅ Lösung 3: Nur für Production bauen (NICHT empfohlen)

Wenn Sie keine lokale Entwicklung machen wollen:

### .env.local temporär leeren

```env
# Kommentieren Sie aus:
# DATABASE_URL=./zhort.db

# ODER setzen Sie auf Mock-Wert:
DATABASE_URL=postgresql://mock:mock@localhost:5432/mock
```

### Build nur für Vercel

```bash
# Build wird fehlschlagen, aber Vercel hat die richtigen Vars
git push origin main
```

**⚠️ Warnung**: Lokale Entwicklung funktioniert dann nicht!

---

## 🔍 Aktuelle Vercel Environment Variables

Ihre Vercel-Variablen (aus dem Screenshot):

```
✅ DATABASE_URL                  (gesetzt)
✅ NEXTAUTH_URL                  (gesetzt)  
✅ NEXTAUTH_SECRET               (gesetzt)
✅ zhort_POSTGRES_URL            (gesetzt)
✅ zhort_PRISMA_DATABASE_URL     (gesetzt - nicht benötigt)
✅ zhort_DATABASE_URL            (gesetzt - möglicherweise Duplikat)
   BLOB_READ_WRITE_TOKEN         (optional)
```

### Empfohlene Bereinigung in Vercel:

Die `zhort_*` Variablen sind Vercel-interne Duplikate. Sie brauchen nur:

1. **`DATABASE_URL`** ← Wichtig! Nutzt Ihr Code
2. **`NEXTAUTH_URL`** ← Wichtig!
3. **`NEXTAUTH_SECRET`** ← Wichtig!

Optional können Sie löschen:
- `zhort_POSTGRES_URL` (Duplikat)
- `zhort_PRISMA_DATABASE_URL` (nicht genutzt, Prisma nicht installiert)
- `zhort_DATABASE_URL` (Duplikat)

---

## 🧪 Testen nach Update

### Test 1: Lokale Verbindung

```bash
# PowerShell
$env:DATABASE_URL="postgresql://..."
npm run dev

# Testen Sie:
curl http://localhost:3000/api/admin/blocklist
```

### Test 2: Build

```bash
npm run build
```

**Sollte ohne Fehler durchlaufen!**

### Test 3: Vercel Production

```bash
git push origin main
```

---

## 📋 Checkliste

Lokale Entwicklung:
- [ ] `.env.local` existiert
- [ ] `DATABASE_URL` zeigt auf PostgreSQL (nicht `./zhort.db`)
- [ ] PostgreSQL läuft (lokal oder Vercel)
- [ ] `npm run dev` funktioniert ohne DB-Fehler
- [ ] Links erstellen funktioniert

Vercel Production:
- [ ] `DATABASE_URL` in Vercel gesetzt
- [ ] `NEXTAUTH_URL` = Production-Domain
- [ ] `NEXTAUTH_SECRET` gesetzt
- [ ] Datenbank-Tabellen erstellt (via Query)
- [ ] Build erfolgreich

---

## 🆘 Schnellhilfe

### "Invalid or missing PostgreSQL connection string"

**Ursache**: `.env.local` enthält noch `./zhort.db`

**Fix**:
```bash
# Öffnen Sie .env.local und ändern Sie:
DATABASE_URL=postgresql://postgres:password@localhost:5432/zhort
```

### "Failed to connect to database"

**Ursache**: PostgreSQL läuft nicht oder falsche Credentials

**Fix**:
```bash
# Prüfen Sie PostgreSQL:
# Windows (PowerShell):
Get-Service -Name postgresql*

# Oder via Docker:
docker ps | grep postgres

# Testen Sie Connection:
psql postgresql://postgres:password@localhost:5432/zhort
```

### "relation does not exist"

**Ursache**: Tabellen wurden noch nicht erstellt

**Fix**:
```bash
npm run db:push
```

---

## 💡 Empfehlung

Für **lokale Entwicklung**:

1. ✅ Installieren Sie Docker Desktop
2. ✅ Starten Sie PostgreSQL Container:
   ```bash
   docker run -d \
     --name zhort-postgres \
     -e POSTGRES_PASSWORD=zhort123 \
     -e POSTGRES_DB=zhort \
     -p 5432:5432 \
     postgres:15-alpine
   ```
3. ✅ Aktualisieren Sie `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:zhort123@localhost:5432/zhort
   ```
4. ✅ Migrieren Sie:
   ```bash
   npm run db:push
   ```

Für **Vercel Production**: Bereits korrekt konfiguriert! ✅

---

**Nächster Schritt**: Aktualisieren Sie Ihre lokale `.env.local` mit einer gültigen PostgreSQL-URL!

