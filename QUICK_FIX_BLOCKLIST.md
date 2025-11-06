# ⚡ Quick Fix: Datenbank-Tabellen fehlen

## Probleme

```
relation "blocked_domains" does not exist
relation "pastes" does not exist  
relation "links" does not exist
relation "users" does not exist
```

Die Datenbank-Tabellen wurden noch nicht erstellt.

---

## ✅ Lösung (2 Minuten)

### Option A: Alle Tabellen auf einmal (Empfohlen)

Verwenden Sie das komplette Schema-Script:

**Via Vercel Postgres Query:**
1. Öffnen Sie die Datei `scripts/create-all-tables.sql` in Ihrem Editor
2. Kopieren Sie den **gesamten Inhalt**
3. Gehen Sie zu **Vercel Dashboard** → **Storage** → **Query**
4. Fügen Sie das Script ein und klicken Sie auf **Run Query**

**Via psql (lokal):**
```powershell
psql postgresql://postgres:zhort123@localhost:5432/zhort -f scripts/create-all-tables.sql
```

**Via Docker:**
```powershell
docker exec -i zhort-postgres psql -U postgres -d zhort < scripts/create-all-tables.sql
```

Dies erstellt:
- ✅ `stats` - Besucher- und Link-Counter
- ✅ `users` - Benutzer-Accounts
- ✅ `links` - Gekürzte URLs
- ✅ `pastes` - Code-Snippets
- ✅ `blocked_domains` - Blocklist (~280k Domains)
- ✅ Alle Indexes und Foreign Keys
- ✅ Initial-Daten (Counter: 126.819)

#### Für Vercel Postgres:
1. Gehen Sie zu [Vercel Dashboard](https://vercel.com/dashboard)
2. **Storage** → Ihre Datenbank → **Query** Tab
3. Kopieren & einfügen der SQL oben
4. Klicken Sie auf **Run Query**

#### Für lokales PostgreSQL:
```powershell
# Via psql
psql postgresql://postgres:zhort123@localhost:5432/zhort

# Dann die SQL-Befehle einfügen
```

#### Für Docker PostgreSQL:
```powershell
docker exec -it zhort-postgres psql -U postgres -d zhort

# Dann die SQL-Befehle einfügen
```

### Option B: Via Drizzle Push

```bash
npm run db:push
```

Dies erstellt **alle** fehlenden Tabellen automatisch.

---

## 🎯 Nach der Tabellenerstellung

### Test 1: Blocklist lädt automatisch

```bash
# Starten Sie den Server neu
npm run dev

# Beim ersten Request wird die Blocklist automatisch geladen
# Logs sollten zeigen:
# "Fetching blocklist from CDN..."
# "Parsed 279315 domains from blocklist"
# "Inserted 10000/279315 domains..."
# "✅ Blocklist updated: 279315 domains in database"
```

### Test 2: Statistiken prüfen

```bash
curl http://localhost:3000/api/admin/blocklist
```

**Erwartete Response:**
```json
{
  "total": 279315,
  "lastUpdate": "2025-11-06T...",
  "ageHours": 0,
  "status": "active"
}
```

### Test 3: Link erstellen

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com"}'
```

**Sollte funktionieren!** ✅

---

## 📋 Komplettes Setup (falls noch nicht gemacht)

Wenn Sie alle Tabellen auf einmal erstellen wollen:

```sql
-- Vollständiges Schema aus scripts/init-db.sql

-- 1. Stats table
CREATE TABLE IF NOT EXISTS "stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "stats_key_unique" UNIQUE("key")
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- 3. Links table
CREATE TABLE IF NOT EXISTS "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" text NOT NULL,
	"long_url" text NOT NULL,
	"user_id" integer,
	"is_public" boolean DEFAULT true NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_short_code_unique" UNIQUE("short_code")
);

-- 4. Pastes table
CREATE TABLE IF NOT EXISTS "pastes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"user_id" integer,
	"syntax_highlighting_language" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pastes_slug_unique" UNIQUE("slug")
);

-- 5. Blocked domains table
CREATE TABLE IF NOT EXISTS "blocked_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_domains_domain_unique" UNIQUE("domain")
);

-- Create index for fast domain lookups
CREATE INDEX IF NOT EXISTS "blocked_domains_domain_idx" ON "blocked_domains" ("domain");

-- Add foreign keys
ALTER TABLE "links" DROP CONSTRAINT IF EXISTS "links_user_id_users_id_fk";
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "pastes" DROP CONSTRAINT IF EXISTS "pastes_user_id_users_id_fk";
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
  ON DELETE cascade ON UPDATE no action;

-- Initialize stats
INSERT INTO "stats" ("key", "value") 
VALUES ('visitors', 126819), ('links', 126819)
ON CONFLICT ("key") DO NOTHING;
```

---

## 🔄 Was passiert nach der Tabellenerstellung?

1. **Beim ersten Request**: Blocklist wird automatisch vom CDN geladen
2. **~30-60 Sekunden**: 279.315 Domains werden in die DB geschrieben
3. **Danach**: Alle Domain-Checks laufen in < 1ms
4. **Auto-Update**: Alle 24 Stunden wird die Liste aktualisiert

---

## 🎯 Checkliste

- [ ] `blocked_domains` Tabelle erstellt
- [ ] Index auf `domain` Spalte erstellt
- [ ] Server neu gestartet
- [ ] Logs zeigen "Blocklist updated"
- [ ] `/api/admin/blocklist` gibt Statistiken zurück
- [ ] Links erstellen funktioniert

---

## 🆘 Falls es nicht funktioniert

### "Blocklist is outdated or empty, updating..."

**Normal!** Beim ersten Start lädt die App die Blocklist.

Warten Sie 30-60 Sekunden und schauen Sie in die Logs:
```
Fetching blocklist from CDN...
Parsed 279315 domains from blocklist
Inserted 10000/279315 domains...
Inserted 20000/279315 domains...
...
✅ Blocklist updated: 279315 domains in database
```

### "Failed to fetch blocklist"

**Ursache**: CDN nicht erreichbar oder Rate-Limit

**Fix**: Warten Sie 5 Minuten und starten Sie den Server neu.

### Noch Fehler?

Prüfen Sie die Tabelle:
```sql
-- Via psql oder Vercel Query
SELECT COUNT(*) FROM blocked_domains;
-- Sollte 279315 oder 0 sein (wenn noch nicht geladen)

SELECT * FROM blocked_domains LIMIT 5;
-- Sollte Domains zeigen
```

---

**Nächster Schritt**: Führen Sie die SQL-Befehle aus! ⚡

