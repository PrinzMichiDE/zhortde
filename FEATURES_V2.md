# Zhort v2.0 - Neue Features

## 🚀 Übersicht

Diese Version bringt vier wichtige neue Features, die Zhort zu einem produktionsreifen URL-Shortener mit erweiterten Sicherheits- und Komfortfunktionen machen.

---

## ✨ Neue Features

### 1. 🔐 Rate Limiting

**Verhindert Spam und Missbrauch durch intelligente Request-Limitierung**

#### Funktionsweise
- **Anonyme User (IP-basiert)**:
  - Links erstellen: 10 pro Stunde
  - Pastes erstellen: 5 pro Stunde
  - Passwort-Versuche: 5 in 15 Minuten

- **Authentifizierte User (User-ID-basiert)**:
  - Links erstellen: 50 pro Stunde
  - Pastes erstellen: 20 pro Stunde

#### Technische Details
- Implementiert in `lib/rate-limit.ts`
- Verwendet PostgreSQL-Tabelle `rate_limits`
- Rolling-Window-Algorithmus
- Automatische Cleanup alter Einträge
- Fail-open-Strategie bei DB-Fehlern

#### HTTP Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
```

---

### 2. ⏰ Link-Ablaufdatum (Expiration)

**Automatische Löschung oder Deaktivierung nach Zeitablauf**

#### Optionen
- **1 Stunde**: Für sehr temporäre Links
- **24 Stunden**: Standard für Einmal-Links
- **7 Tage**: Wochenprojekte
- **30 Tage**: Monatskampagnen
- **Nie**: Permanente Links (Default)

#### Funktionsweise
- Wird beim Erstellen des Links/Pastes festgelegt
- Check beim Zugriff (keine Hintergrund-Jobs nötig)
- HTTP 410 Gone Status bei abgelaufenen Links
- Visuelle Anzeige des Ablaufdatums in der UI

#### Implementierung
```typescript
// Datenbank-Felder
expiresAt: timestamp | null

// Check-Funktion
function isExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}
```

---

### 3. 🔒 Passwortschutz

**Zusätzliche Sicherheitsebene für sensible Links und Pastes**

#### Features
- **Bcrypt-Hashing**: Sichere Passwort-Speicherung (10 Salt-Rounds)
- **Rate-Limited**: Max. 5 Versuche in 15 Minuten pro IP
- **Elegante UI**: Dedizierte Passwort-Eingabe-Seiten
- **Flexible Integration**: Optional für jeden Link/Paste

#### User Flow
1. User erstellt Link mit Passwort
2. Link wird mit gehashtem Passwort gespeichert
3. Beim Zugriff → Redirect zu `/protected/{shortCode}`
4. Passwort-Eingabe
5. Verifikation + Rate-Limiting
6. Redirect zum Ziel (bei korrektem Passwort)

#### Sicherheit
- Passwörter werden NIEMALS im Klartext gespeichert
- Rate-Limiting verhindert Brute-Force
- Passwort wird als Query-Parameter übergeben (HTTPS!)

---

### 4. 📱 QR-Code Generation

**Automatische QR-Codes für jeden Short-Link**

#### Features
- **Formate**: PNG (default) und SVG
- **Anpassbar**: Width, Margin, Error-Correction-Level
- **Performance**: Server-seitige Generation mit qrcode-Library
- **Caching**: 1-Stunde Browser-Cache

#### API Endpoint
```
GET /api/qr/{shortCode}?format=png&width=300
```

#### Parameter
- `format`: `png` | `svg` (default: png)
- `width`: Pixel-Breite (default: 300)

#### Integration
- Direct Display: `<img src="/api/qr/abc123" />`
- Download: `<a download href="/api/qr/abc123?width=600">`
- In LinkForm-Komponente integriert

#### Verwendung
```typescript
// Inline anzeigen
const qrUrl = `/api/qr/${shortCode}?format=png`;

// Als SVG
const qrSvg = `/api/qr/${shortCode}?format=svg`;

// High-Res Download
const qrDownload = `/api/qr/${shortCode}?format=png&width=1200`;
```

---

## 📦 Datenbankschema-Änderungen

### Neue Felder in `links`-Tabelle
```sql
ALTER TABLE "links" 
ADD COLUMN "password_hash" text,
ADD COLUMN "expires_at" timestamp;
```

### Neue Felder in `pastes`-Tabelle
```sql
ALTER TABLE "pastes" 
ADD COLUMN "password_hash" text,
ADD COLUMN "expires_at" timestamp;
```

### Neue `rate_limits`-Tabelle
```sql
CREATE TABLE "rate_limits" (
  "id" serial PRIMARY KEY,
  "identifier" text NOT NULL,
  "action" text NOT NULL,
  "count" integer DEFAULT 1 NOT NULL,
  "window_start" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "rate_limits_identifier_action_idx" 
ON "rate_limits" ("identifier", "action", "window_start");
```

### Performance-Indizes
```sql
-- Für schnelle Expiration-Checks
CREATE INDEX "links_expires_at_idx" 
ON "links" ("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE INDEX "pastes_expires_at_idx" 
ON "pastes" ("expires_at") WHERE "expires_at" IS NOT NULL;
```

---

## 🛠️ Installation & Migration

### 1. Dependencies installieren
```bash
npm install qrcode @types/qrcode
```

### 2. Datenbank migrieren

**Option A: Fresh Install**
```bash
# Verwende das aktualisierte init-db.sql
psql $DATABASE_URL -f scripts/init-db.sql
```

**Option B: Bestehende Datenbank**
```bash
# Verwende das Migrations-Script
psql $DATABASE_URL -f scripts/add-new-features.sql
```

### 3. Schema pushen (mit Drizzle)
```bash
npm run db:push
```

### 4. Anwendung starten
```bash
npm run dev
```

---

## 📖 API-Änderungen

### POST /api/links
**Neue Request-Body-Felder:**
```json
{
  "longUrl": "https://example.com",
  "customCode": "optional",
  "isPublic": true,
  "password": "optional-password",      // NEU
  "expiresIn": "24h"                    // NEU: '1h'|'24h'|'7d'|'30d'|'never'
}
```

**Neue Response-Felder:**
```json
{
  "shortCode": "abc123",
  "longUrl": "https://example.com",
  "expiresAt": "2024-01-02T12:00:00.000Z",  // NEU
  "hasPassword": true                        // NEU
}
```

**Neue Response-Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 2024-01-01T13:00:00.000Z
```

### POST /api/pastes
**Identische Änderungen wie bei Links**

### GET /s/{shortCode}
**Neue Query-Parameter:**
- `?password=secret` - Für passwortgeschützte Links

**Neue HTTP-Status-Codes:**
- `410 Gone` - Link ist abgelaufen
- `401 Unauthorized` - Falsches Passwort
- `429 Too Many Requests` - Rate-Limit erreicht

---

## 🎨 UI-Komponenten

### Neue Komponenten

#### 1. `components/link-form.tsx`
Erweiterte Link-Erstellungs-Formular mit:
- Collapsible "Erweiterte Optionen"
- Passwort-Eingabe
- Ablaufdatum-Select
- QR-Code Preview & Download
- Rate-Limit-Feedback

#### 2. `app/protected/[shortCode]/page.tsx`
Passwort-Eingabe-Seite für geschützte Links:
- Responsive Design
- Error Handling
- Auto-Focus auf Password-Feld
- Rate-Limit-Anzeige

#### 3. `app/protected/paste/[slug]/page.tsx`
Äquivalent für geschützte Pastes

---

## 🔧 Konfiguration

### Rate-Limit-Anpassung
Editiere `lib/rate-limit.ts`:

```typescript
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  create_link_anonymous: {
    windowMs: 60 * 60 * 1000,  // 1 Stunde
    maxRequests: 10,            // Anpassen
  },
  // ...
};
```

### Expiration-Optionen
Editiere `lib/password-protection.ts`:

```typescript
export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Stunde' },
  { value: '24h', label: '24 Stunden' },
  // Neue Optionen hinzufügen
] as const;
```

---

## 🧪 Testing

### Rate Limiting testen
```bash
# 11 Requests in schneller Folge
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/links \
    -H "Content-Type: application/json" \
    -d '{"longUrl":"https://example.com"}'
done

# 11. Request sollte 429 zurückgeben
```

### Passwortschutz testen
```bash
# 1. Link mit Passwort erstellen
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com","password":"test123"}'

# 2. Zugriff ohne Passwort (sollte zu /protected/ redirecten)
curl -I http://localhost:3000/s/{shortCode}

# 3. Zugriff mit Passwort
curl -I "http://localhost:3000/s/{shortCode}?password=test123"
```

### Expiration testen
```bash
# Link mit 1-Stunden-Ablauf
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com","expiresIn":"1h"}'

# Nach 1 Stunde sollte 410 Gone zurückgegeben werden
```

### QR-Code testen
```bash
# QR-Code generieren
curl http://localhost:3000/api/qr/{shortCode} > qr.png

# SVG-Version
curl http://localhost:3000/api/qr/{shortCode}?format=svg > qr.svg

# High-Resolution
curl http://localhost:3000/api/qr/{shortCode}?width=1200 > qr-hd.png
```

---

## 🚀 Deployment-Checklist

- [ ] Dependencies installiert (`npm install`)
- [ ] Datenbank-Migration durchgeführt
- [ ] `.env` enthält `NEXT_PUBLIC_BASE_URL` für QR-Codes
- [ ] Rate-Limits für Production angepasst
- [ ] HTTPS aktiviert (wichtig für Passwort-Übertragung!)
- [ ] Vercel Postgres oder äquivalente DB konfiguriert
- [ ] Build erfolgreich (`npm run build`)
- [ ] Smoke-Tests durchgeführt

---

## 📊 Performance-Überlegungen

### Rate-Limiting
- **DB-Belastung**: Moderate (1 Read + 1 Write pro Request)
- **Mitigation**: Automatisches Cleanup alter Einträge
- **Alternative**: Redis (für High-Traffic-Szenarien)

### QR-Code Generation
- **Server-Last**: Gering (cached für 1 Stunde)
- **Response-Zeit**: ~50-100ms
- **Optimierung**: CDN für statische QR-Codes

### Password-Hashing
- **CPU-Last**: Moderat (bcrypt mit 10 Rounds)
- **Response-Zeit**: ~100-200ms
- **Akzeptabel**: Nur bei Link-Erstellung, nicht bei jedem Zugriff

---

## 🔐 Sicherheits-Best-Practices

1. **HTTPS Pflicht**: Passwörter werden als Query-Parameter übertragen
2. **Rate-Limiting**: Verhindert Brute-Force und DoS
3. **Bcrypt**: Sichere Passwort-Hashing-Algorithmus
4. **Input-Validation**: Alle Inputs werden validiert
5. **SQL-Injection-Schutz**: Drizzle ORM verwendet Prepared Statements

---

## 📚 Weitere Ressourcen

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [qrcode Library](https://www.npmjs.com/package/qrcode)
- [bcryptjs Docs](https://www.npmjs.com/package/bcryptjs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🙋 Support & Fragen

Bei Fragen oder Problemen:
1. Prüfe die Migrations-Scripts in `scripts/`
2. Überprüfe die Logs (`console.log` in API-Routes)
3. Teste mit curl/Postman
4. Checke Vercel-Logs (bei Deployment-Problemen)

---

**Version**: 2.0.0  
**Datum**: November 2024  
**Status**: ✅ Production Ready

