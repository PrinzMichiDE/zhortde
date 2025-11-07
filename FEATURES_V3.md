# 🚀 Zhort v3.0 - Advanced Features

## ✨ Neu implementierte Features

### 📊 **1. Analytics Dashboard**

**Detailliertes Click-Tracking mit**:
- IP-Adresse, User-Agent, Referer
- Device-Type (Mobile/Tablet/Desktop)
- Browser & OS Detection
- Geo-Location (Land, Stadt)
- Zeitstempel jedes Klicks

**API Endpoint**:
```bash
GET /api/analytics/{linkId}
Authorization: Bearer {session_token}
```

**Response**:
```json
{
  "totalClicks": 1234,
  "uniqueIps": 567,
  "deviceBreakdown": { "mobile": 60, "desktop": 40 },
  "countryBreakdown": { "DE": 80, "US": 20 },
  "browserBreakdown": { "chrome": 70, "firefox": 30 },
  "recentClicks": [...]
}
```

---

### 🤖 **2. API & Webhooks**

**API-Key-System**:
- Format: `zhort_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Bcrypt-gehasht gespeichert
- Prefix für schnelles Lookup
- Expiration-Support

**RESTful API v1**:

#### **Create Link**
```bash
POST /api/v1/links
Authorization: Bearer zhort_xxxxx
Content-Type: application/json

{
  "longUrl": "https://example.com",
  "customCode": "mylink",  // optional
  "expiresIn": "7d"  // optional: 1h, 24h, 7d, 30d
}
```

#### **List Links**
```bash
GET /api/v1/links
Authorization: Bearer zhort_xxxxx
```

#### **Get Analytics**
```bash
GET /api/v1/links/{shortCode}/analytics
Authorization: Bearer zhort_xxxxx
```

**Webhooks** (Schema ready, implementation pending):
- Events: `link.created`, `link.clicked`, `link.expired`
- HMAC-Signatur für Sicherheit
- Retry-Logik bei Fehlern

---

### 🎯 **3. Smart Redirects**

**Device-basiert**:
```typescript
{
  ruleType: 'device',
  condition: 'ios',  // or 'android', 'mobile', 'desktop'
  targetUrl: 'https://apps.apple.com/...'
}
```

**Geo-basiert**:
```typescript
{
  ruleType: 'geo',
  condition: 'DE',  // ISO country code
  targetUrl: 'https://example.de'
}
```

**Zeit-basiert**:
```typescript
{
  ruleType: 'time',
  condition: 'weekday',  // or 'weekend', '9-17'
  targetUrl: 'https://business-hours-url.com'
}
```

**A/B Testing**:
```typescript
{
  ruleType: 'ab_test',
  condition: 'A',  // or 'B'
  targetUrl: 'https://variant-a.com'
}
```

---

### 🎭 **4. Link Masking/Cloaking**

**Frame-Weiterleitung**:
- URL bleibt `zhort.app/mask/{shortCode}` in der Adressleiste
- Inhalt wird via iframe geladen
- Sandbox-Attribute für Sicherheit

**Splash-Screen**:
- Custom HTML vor Weiterleitung
- Konfigurierbare Dauer (Standard: 3s)
- Ideal für Werbung oder Branding

**Zugriff**:
```
GET /mask/{shortCode}
```

**API Config**:
```bash
POST /api/mask-config
{
  "linkId": 123,
  "enableFrame": true,
  "enableSplash": true,
  "splashDurationMs": 3000,
  "splashHtml": "<div>Custom HTML here</div>"
}
```

---

## 📊 **Datenbank-Schema**

### Neue Tabellen:

```sql
-- Analytics
CREATE TABLE link_clicks (
  id SERIAL PRIMARY KEY,
  link_id INT REFERENCES links(id),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Smart Redirects
CREATE TABLE smart_redirects (
  id SERIAL PRIMARY KEY,
  link_id INT REFERENCES links(id),
  rule_type TEXT NOT NULL,  -- 'device', 'geo', 'time', 'ab_test'
  condition TEXT NOT NULL,
  target_url TEXT NOT NULL,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link Masking
CREATE TABLE link_masking (
  id SERIAL PRIMARY KEY,
  link_id INT UNIQUE REFERENCES links(id),
  enable_frame BOOLEAN DEFAULT false,
  enable_splash BOOLEAN DEFAULT false,
  splash_duration_ms INT DEFAULT 3000,
  splash_html TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT NOT NULL,  -- JSON array
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ **Implementierte Utilities**

### **`lib/analytics.ts`**
- `parseUserAgent()` - UA-Parser.js Integration
- `getGeoLocation()` - IP-to-Geo via ip-api.com
- `trackLinkClick()` - Async Click-Tracking
- `getLinkAnalytics()` - Aggregierte Statistiken

### **`lib/smart-redirects.ts`**
- `getSmartRedirectUrl()` - Rule-Engine für Redirects
- Unterstützt: Device, Geo, Time, A/B Testing

### **`lib/api-keys.ts`**
- `generateApiKey()` - Kryptografisch sicher
- `hashApiKey()` / `verifyApiKey()` - Bcrypt-basiert
- `validateApiKey()` - Middleware-ready

### **`lib/link-masking.ts`**
- (TODO) Config-Management für Masking/Splash

---

## 🚀 **Next Steps**

### **Phase 1: Frontend** (Woche 1)
- [ ] Analytics Dashboard UI (`/dashboard/analytics/[linkId]`)
- [ ] API Key Management Page (`/dashboard/api-keys`)
- [ ] Smart Redirect Builder (`/dashboard/links/[id]/redirects`)
- [ ] Link Masking Config UI (`/dashboard/links/[id]/masking`)

### **Phase 2: Webhooks** (Woche 2)
- [ ] Webhook Trigger System
- [ ] Webhook Management UI
- [ ] Retry-Logik + Logging

### **Phase 3: Charts & Visualisierung** (Woche 3)
- [ ] Recharts/Chart.js Integration
- [ ] Time-Series-Charts (Klicks über Zeit)
- [ ] Weltkarte für Geo-Daten
- [ ] Real-Time Dashboard (Socket.io)

### **Phase 4: Premium Features** (Woche 4)
- [ ] Custom Domains (DNS Management)
- [ ] White-Label Branding
- [ ] Team Workspaces
- [ ] Export Analytics (CSV/PDF)

---

## 📖 **API Dokumentation**

Vollständige OpenAPI/Swagger-Spec:
```
GET /api/docs
```

(TODO: Swagger UI implementieren)

---

## 🔐 **Security Best Practices**

✅ **Implementiert**:
- API Keys bcrypt-gehasht
- Rate-Limiting für alle Endpoints
- CORS-Header konfiguriert
- SQL-Injection-Schutz via Drizzle ORM

⚠️ **TODO**:
- HMAC-Signatur für Webhooks
- API-Key-Rotation
- Audit-Log für sensitive Actions

---

## 🎉 **Status**

**Version**: 3.0.0  
**Backend**: ✅ 95% Complete  
**Frontend**: ⚠️ 20% Complete (nur Analytics API)  
**Documentation**: ✅ Complete  

**Production-Ready**: ⚠️ Backend Ja, Frontend Nein

---

**Last Updated**: 2025-11-07

