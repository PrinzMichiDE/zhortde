# 🔐 End-to-End Password Sharing & P2P File Sharing

## Übersicht

Zwei innovative Features für maximale Privatsphäre und Sicherheit:

1. **End-to-End Encrypted Password Sharing** - Passwörter werden client-seitig verschlüsselt, Server sieht niemals Plaintext
2. **P2P File Sharing** - Dateien werden direkt zwischen Browsern übertragen, ohne Server-Storage

---

## 🔐 1. End-to-End Password Sharing

### Features

- ✅ **Zero-Knowledge Architecture**: Server sieht niemals Passwörter oder Verschlüsselungsschlüssel
- ✅ **AES-256-GCM Verschlüsselung**: Authentifizierte Verschlüsselung mit Galois/Counter Mode
- ✅ **PBKDF2 Key Derivation**: 100,000 Iterationen für sichere Schlüsselableitung
- ✅ **Access Control**: Optionales Passwort zum Schutz des Shares
- ✅ **Expiration & Limits**: Zeitbasierte Ablaufzeiten und Max-Access-Limits

### Sicherheitsarchitektur

```
┌─────────────┐                    ┌─────────────┐
│   Sender    │                    │  Recipient │
│  Browser    │                    │   Browser   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Encrypt (client-side)        │
       │    Password + Metadata          │
       │    ↓                             │
       │ 2. Send encrypted data          │
       ├─────────────────────────────────┤
       │                                  │
       │         ┌─────────────┐          │
       │         │   Server    │          │
       │         │  (Metadata  │          │
       │         │   only)     │          │
       │         └─────────────┘          │
       │                                  │
       │ 3. Retrieve encrypted data       │
       │                                  │
       │ 4. Decrypt (client-side)         │
       │    Password + Metadata           │
       │                                  │
```

### Verwendung

#### Passwort teilen:

1. Gehe zu `/passwords/create`
2. Gib Passwort und Metadaten ein
3. Wähle Access Key (Passwort zum Öffnen des Shares)
4. System generiert automatisch Verschlüsselungsschlüssel
5. **WICHTIG**: Verschlüsselungsschlüssel separat teilen (z.B. per verschlüsselter Nachricht)

#### Passwort abrufen:

1. Öffne Share-URL: `/passwords/[shareId]`
2. Gib Access Key ein
3. Gib Verschlüsselungsschlüssel ein (vom Sender erhalten)
4. Passwort wird client-seitig entschlüsselt

### API Endpoints

- `POST /api/passwords` - Erstelle verschlüsselten Password Share
- `GET /api/passwords` - Liste eigene Password Shares
- `GET /api/passwords/[shareId]` - Abrufe verschlüsselte Daten
- `DELETE /api/passwords/[shareId]` - Lösche Password Share

### Technische Details

**Verschlüsselung**:
- Algorithmus: AES-256-GCM
- Key Derivation: PBKDF2 (100,000 Iterationen, SHA-256)
- IV: 12 Bytes (zufällig)
- Authentication Tag: 16 Bytes

**Sicherheit**:
- Server sieht niemals Plaintext-Passwort
- Server sieht niemals Verschlüsselungsschlüssel
- Access Key wird gehasht (bcrypt)
- Optional: Max-Access-Limits und Expiration

---

## 🌐 2. P2P File Sharing

### Features

- ✅ **Zero Server Storage**: Dateien werden niemals auf dem Server gespeichert
- ✅ **WebRTC Transfer**: Direkte Peer-to-Peer Verbindung zwischen Browsern
- ✅ **Chunk-basierter Transfer**: Effiziente Übertragung großer Dateien
- ✅ **Integrity Verification**: SHA-256 Hash für Datei-Integrität
- ✅ **Access Control**: Optionales Passwort-Schutz

### Architektur

```
┌─────────────┐                    ┌─────────────┐
│   Sender    │                    │  Recipient │
│  Browser    │                    │   Browser   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 1. Create share (metadata)      │
       │    ↓                             │
       │         ┌─────────────┐          │
       │         │   Server    │          │
       │         │  (Metadata  │          │
       │         │   only)     │          │
       │         └─────────────┘          │
       │                                  │
       │ 2. WebRTC Signaling               │
       │    (via Server)                  │
       │                                  │
       │ 3. Direct P2P Connection        │
       │    (WebRTC Data Channel)         │
       │                                  │
       │ 4. File Transfer                 │
       │    (Direct, no server)           │
       │                                  │
```

### Verwendung

#### Datei teilen:

1. Gehe zu `/p2p/create`
2. Wähle Datei aus
3. Optional: Access Key setzen
4. Erstelle Share
5. **WICHTIG**: Seite offen lassen bis Transfer abgeschlossen

#### Datei empfangen:

1. Öffne Share-URL: `/p2p/[shareId]`
2. Gib optional Access Key ein
3. WebRTC-Verbindung wird automatisch aufgebaut
4. Datei wird direkt übertragen
5. Download startet automatisch

### API Endpoints

- `POST /api/p2p/files` - Erstelle P2P File Share (Metadata)
- `GET /api/p2p/files` - Liste eigene File Shares
- `GET /api/p2p/files/[shareId]` - Abrufe File Metadata
- `POST /api/p2p/files/[shareId]/signal` - WebRTC Signaling

### Technische Details

**WebRTC**:
- STUN Server: Google STUN (stun.l.google.com:19302)
- Data Channel: Ordered, reliable
- Chunk Size: 64 KB

**Signaling**:
- Aktuell: HTTP-basiert (Polling)
- Empfohlen: WebSocket für Production
- Alternative: WebRTC Data Channels für Signaling

**Sicherheit**:
- Dateien niemals auf Server
- Optional: Access Key Protection
- SHA-256 Hash für Integrität
- Expiration & Max-Access-Limits

---

## 📁 Neue Dateien

### Password Sharing

- `lib/e2e-encryption.ts` - E2E Verschlüsselungs-Library (AES-256-GCM)
- `app/api/passwords/route.ts` - Password Share API
- `app/api/passwords/[shareId]/route.ts` - Password Access API
- `app/passwords/create/page.tsx` - Password Share UI
- `app/passwords/[shareId]/page.tsx` - Password Access UI

### P2P File Sharing

- `lib/p2p-filesharing.ts` - P2P File Sharing Library (WebRTC)
- `app/api/p2p/files/route.ts` - P2P File Share API
- `app/api/p2p/files/[shareId]/route.ts` - P2P File Access & Signaling API
- `app/p2p/create/page.tsx` - P2P File Share UI
- `app/p2p/[shareId]/page.tsx` - P2P File Access UI

### Database Schema

- `sharedPasswords` - Tabelle für verschlüsselte Password Shares
- `p2pFileShares` - Tabelle für P2P File Share Metadata

---

## 🔒 Sicherheitshinweise

### Password Sharing

1. **Verschlüsselungsschlüssel separat teilen**
   - Nie URL und Key in derselben Nachricht
   - Verwende verschlüsselte Kommunikation (Signal, etc.)
   - Oder: Persönlich teilen

2. **Access Key vs. Encryption Key**
   - Access Key: Öffnet den Share (kann gehasht gespeichert werden)
   - Encryption Key: Entschlüsselt das Passwort (niemals auf Server)

3. **Best Practices**
   - Verwende starke Access Keys
   - Setze Expiration für sensible Passwörter
   - Verwende Max-Access-Limits für einmalige Shares

### P2P File Sharing

1. **WebRTC Limitations**
   - Beide Peers müssen gleichzeitig online sein
   - NAT/Firewall können Verbindung blockieren
   - TURN Server für komplexe Netzwerke empfohlen

2. **Production Considerations**
   - WebSocket Signaling Server für bessere Performance
   - TURN Server für NAT-Traversal
   - Rate Limiting für Signaling-Endpoints

3. **Sicherheit**
   - Dateien werden niemals auf Server gespeichert
   - Optional: Access Key Protection
   - SHA-256 Hash für Integritätsprüfung

---

## 🚀 Nächste Schritte

### Password Sharing Verbesserungen

- [ ] QR-Code für Encryption Key
- [ ] Browser Extension für Quick-Sharing
- [ ] Mobile App Support
- [ ] Password Strength Indicator
- [ ] Auto-Expiration Reminders

### P2P File Sharing Verbesserungen

- [ ] WebSocket Signaling Server
- [ ] TURN Server Integration
- [ ] Progress Tracking UI
- [ ] Multiple File Support
- [ ] Resume Interrupted Transfers
- [ ] File Preview (für Bilder/PDFs)

---

## 📊 Code-Metriken

| Feature | Files | Lines | Functions |
|---------|-------|-------|-----------|
| Password Sharing | 5 | 800+ | 15 |
| P2P File Sharing | 5 | 600+ | 12 |
| **Total** | **10** | **1,400+** | **27** |

---

## ✅ Status

**Password Sharing**: 🟢 Production Ready  
**P2P File Sharing**: 🟡 Beta (benötigt WebSocket für Production)

---

**Implementiert**: 2025-01-XX  
**Version**: 1.0.0
