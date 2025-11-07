# 🚀 Zhort v2.0 - Quick Start Guide

## Setup in 5 Minuten

### 1️⃣ Dependencies installieren
```bash
npm install
```

### 2️⃣ Datenbank migrieren

**Für neue Installation:**
```bash
psql $DATABASE_URL -f scripts/init-db.sql
```

**Für bestehende Installation (v1 → v2):**
```bash
psql $DATABASE_URL -f scripts/add-new-features.sql
```

### 3️⃣ Umgebungsvariablen
Stelle sicher, dass `.env.local` enthält:
```env
DATABASE_URL=your_postgres_url
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://your-domain.com
```

### 4️⃣ Starten
```bash
npm run dev
```

---

## 🎯 Feature-Nutzung

### Passwortgeschützten Link erstellen

**Via UI:**
1. Homepage öffnen
2. "Erweiterte Optionen" ▼ klicken
3. Passwort eingeben
4. Link erstellen

**Via API:**
```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "password": "geheim123"
  }'
```

### Link mit Ablaufdatum

**1 Stunde:**
```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "longUrl": "https://example.com",
    "expiresIn": "1h"
  }'
```

**24 Stunden:**
```json
{
  "longUrl": "https://example.com",
  "expiresIn": "24h"
}
```

### QR-Code abrufen

**Als Bild:**
```html
<img src="/api/qr/abc123" alt="QR Code" />
```

**Zum Download:**
```html
<a href="/api/qr/abc123?width=600" download="qr.png">
  Download QR-Code
</a>
```

**Als SVG:**
```html
<img src="/api/qr/abc123?format=svg" alt="QR Code" />
```

---

## 🔧 Konfiguration anpassen

### Rate-Limits ändern
`lib/rate-limit.ts`:
```typescript
create_link_anonymous: {
  windowMs: 60 * 60 * 1000,  // Zeit in ms
  maxRequests: 10,            // Anzahl Requests
}
```

### Neue Expiration-Option hinzufügen
`lib/password-protection.ts`:
```typescript
export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Stunde' },
  { value: '12h', label: '12 Stunden' },  // NEU
  { value: '24h', label: '24 Stunden' },
  // ...
];

// In calculateExpiration():
case '12h':
  return new Date(now.getTime() + 12 * 60 * 60 * 1000);
```

---

## 🧪 Testing

```bash
# Rate Limiting testen (sollte ab Request 11 fehlschlagen)
for i in {1..11}; do 
  curl -X POST http://localhost:3000/api/links \
    -H "Content-Type: application/json" \
    -d '{"longUrl":"https://test.com"}'
  echo ""
done

# Passwort-geschützten Link testen
LINK=$(curl -s -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com","password":"test"}' | jq -r '.shortCode')

curl -I "http://localhost:3000/s/$LINK"  # Sollte 302 zu /protected/ sein
curl -I "http://localhost:3000/s/$LINK?password=test"  # Sollte zu Ziel-URL leiten

# QR-Code testen
curl http://localhost:3000/api/qr/$LINK -o test-qr.png
```

---

## 📊 Monitoring

### Rate-Limit-Status prüfen
```sql
SELECT identifier, action, COUNT(*), MAX(window_start)
FROM rate_limits
WHERE window_start > NOW() - INTERVAL '1 hour'
GROUP BY identifier, action;
```

### Abgelaufene Links finden
```sql
SELECT shortCode, expiresAt
FROM links
WHERE expiresAt < NOW();
```

### Passwort-geschützte Links zählen
```sql
SELECT 
  COUNT(*) FILTER (WHERE password_hash IS NOT NULL) as protected,
  COUNT(*) FILTER (WHERE password_hash IS NULL) as public
FROM links;
```

---

## 🐛 Troubleshooting

### "Too many requests"
- Rate-Limit erreicht
- Warte bis `X-RateLimit-Reset` Zeit
- Oder: Authentifiziere dich für höhere Limits

### QR-Code lädt nicht
- Prüfe `NEXT_PUBLIC_BASE_URL` in `.env`
- Stelle sicher, dass `qrcode` installiert ist
- Check Server-Logs

### Passwort funktioniert nicht
- Prüfe, ob HTTPS aktiv ist (in Production)
- Check Browser-Konsole für Errors
- Verify bcryptjs installiert ist

---

## 🚢 Production-Deployment

### Vercel
```bash
# Umgebungsvariablen setzen
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET

# Deployen
vercel --prod

# Datenbank migrieren (über Vercel Postgres Dashboard)
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## ✅ Checklist vor Go-Live

- [ ] HTTPS aktiviert
- [ ] `NEXT_PUBLIC_BASE_URL` korrekt gesetzt
- [ ] Datenbank-Migration durchgeführt
- [ ] Rate-Limits für Production angepasst
- [ ] Backup-Strategie definiert
- [ ] Monitoring aufgesetzt
- [ ] Error-Tracking (z.B. Sentry) konfiguriert
- [ ] Smoke-Tests durchgeführt

---

**Viel Erfolg mit Zhort v2! 🎉**

