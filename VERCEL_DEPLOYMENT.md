# Vercel Deployment Guide

## Voraussetzungen

- GitHub Account
- Vercel Account
- Zhort Repository auf GitHub

## 1. Vercel PostgreSQL einrichten

### Datenbank erstellen

1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Wählen Sie Ihr Projekt aus (oder erstellen Sie ein neues)
3. Navigieren Sie zu **Storage** → **Create Database**
4. Wählen Sie **Postgres**
5. Geben Sie einen Namen ein (z.B. `zhort-db`)
6. Klicken Sie auf **Create**

Vercel erstellt automatisch folgende Umgebungsvariablen:
- `POSTGRES_URL` - Standard-Verbindung mit Connection Pooling
- `POSTGRES_PRISMA_URL` - Optimiert für Prisma (können wir auch nutzen)
- `POSTGRES_URL_NON_POOLING` - Direkte Verbindung ohne Pooling

## 2. Umgebungsvariablen konfigurieren

Gehen Sie zu **Settings** → **Environment Variables** und fügen Sie hinzu:

### DATABASE_URL
```
Wert: [Kopieren Sie POSTGRES_URL]
```

### NEXTAUTH_URL
```
Wert: https://ihr-projekt.vercel.app
```

### NEXTAUTH_SECRET
```
Wert: [Generieren Sie einen sicheren Schlüssel]
```

**Tipp**: Generieren Sie einen sicheren Secret mit:
```bash
openssl rand -base64 32
```

## 3. Projekt deployen

### Option A: Über Vercel Dashboard

1. Gehen Sie zu **Deployments**
2. Klicken Sie auf **Deploy**
3. Wählen Sie den Branch (z.B. `main`)
4. Klicken Sie auf **Deploy**

### Option B: Über Git Push

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

Vercel deployed automatisch bei jedem Push.

## 4. Datenbank-Schema migrieren

Nach dem ersten Deployment müssen Sie das Datenbank-Schema erstellen.

### Option A: Über Vercel CLI (Empfohlen)

1. Installieren Sie Vercel CLI:
```bash
npm i -g vercel
```

2. Login:
```bash
vercel login
```

3. Link zum Projekt:
```bash
vercel link
```

4. Pushen Sie das Schema:
```bash
vercel env pull .env.local
npm run db:push
```

### Option B: Lokal mit Vercel-Credentials

1. Gehen Sie zu **Settings** → **Environment Variables**
2. Kopieren Sie die `POSTGRES_URL`
3. Fügen Sie sie in Ihre lokale `.env.local` ein:
```env
DATABASE_URL=postgresql://...
```

4. Führen Sie lokal aus:
```bash
npm run db:push
```

## 5. Initialisierung der Counter

Die Counter (Besucher: 126.819, Links: 126.819) werden beim ersten API-Aufruf automatisch initialisiert.

Sie können dies auch manuell testen:
```bash
curl https://ihr-projekt.vercel.app/api/stats/visitors
```

## 6. Verifizierung

Testen Sie die Deployment:

1. **Homepage**: `https://ihr-projekt.vercel.app`
2. **API**: `https://ihr-projekt.vercel.app/api/v1/shorten`
3. **Dashboard**: `https://ihr-projekt.vercel.app/dashboard`

## Troubleshooting

### Problem: "Database connection error"

**Lösung**: Prüfen Sie, ob `DATABASE_URL` korrekt gesetzt ist:
```bash
vercel env ls
```

### Problem: "Tabellen existieren nicht"

**Lösung**: Führen Sie die Migration aus (siehe Schritt 4)

### Problem: "NEXTAUTH_SECRET is not set"

**Lösung**: Stellen Sie sicher, dass alle Umgebungsvariablen gesetzt sind:
```bash
vercel env add NEXTAUTH_SECRET
```

## Performance-Tipps

1. **Connection Pooling**: Verwenden Sie `POSTGRES_URL` (ist standardmäßig aktiv)
2. **Caching**: Die Blocklist wird 1 Stunde gecacht
3. **Edge Functions**: Next.js verwendet automatisch Vercel Edge Functions

## Wartung

### Backup

Vercel PostgreSQL erstellt automatisch Backups. Zugriff über:
1. **Storage** → Ihre Datenbank
2. **Backups** Tab

### Monitoring

Überwachen Sie Ihre Anwendung:
1. **Analytics** → Performance-Metriken
2. **Logs** → Deployment-Logs und Fehler
3. **Usage** → Datenbank-Nutzung

## Kosten

- **Hobby Plan**: Kostenlos (inkl. 60 Stunden PostgreSQL-Compute)
- **Pro Plan**: $20/Monat (inkl. mehr Ressourcen)

Weitere Infos: [Vercel Pricing](https://vercel.com/pricing)

## Nächste Schritte

Nach erfolgreichem Deployment:

1. ✅ Testen Sie die URL-Kürzung
2. ✅ Erstellen Sie einen Test-Account
3. ✅ Testen Sie die API
4. ✅ Prüfen Sie die Footer-Counter
5. ✅ Konfigurieren Sie Ihre Custom Domain (optional)

## Support

Bei Problemen:
- [Vercel Documentation](https://vercel.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Next.js Docs](https://nextjs.org/docs)

