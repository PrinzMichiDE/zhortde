# Architekturübersicht Zhort
## Einleitung
Dieses Dokument beschreibt die im Repository nachweisbare Architektur der Anwendung Zhort zum technischen Stand des Commits `9cfdeea` auf dem Branch `cursor/daily-evolution-pipeline-139f` am 21.07.2026. Zhort ist eine monolithische Next.js-Anwendung mit App Router für URL-Kürzung, Pastebin, Link-Analyse, Team- und Enterprise-Funktionen, verschlüsselte Passwortfreigaben, WebRTC-Dateifreigaben sowie browser- und API-basierte Nutzung.

Die Aussagen beruhen auf Quellcode, Schema, SQL-Migrationen, Tests und Deployment-Dateien. Ein Zugriff auf produktive Laufzeitkonfiguration, Datenbank, Vercel-/Container-Projekt, DNS, Secret Store, Monitoring, Backups oder Auftragsverarbeitungsverträge war nicht Bestandteil des Repositorys. Solche Punkte sind ausdrücklich als **klärungsbedürftige Information** gekennzeichnet und dürfen nicht aus Repository-Dokumentation als produktiv umgesetzt abgeleitet werden.

## Geltungsbereich
Erfasst sind:

- die Next.js-16-/React-19-Anwendung mit 38 `page.tsx`-Seiten, 72 Route-Dateien mit 118 HTTP-Handlern und 36 React-Komponenten;
- App-Router-Oberflächen, Route Handler, Server Actions, Middleware, Authentifizierung und Autorisierung;
- PostgreSQL-Zugriff über Drizzle ORM/Postgres.js, 43 im TypeScript-Schema definierte Tabellen sowie SQL-Migrationen `0000` bis `0004`;
- die Bereitstellungsvarianten Vercel und OCI-/Docker-Container einschließlich GitHub-Actions-Image-Build;
- externe HTTP-, DNS-, OIDC-, WebAuthn- und WebRTC-Schnittstellen;
- Datenflüsse, Sicherheits- und Vertrauensgrenzen sowie der neue Passkey-Zustandsfluss.

Nicht als umgesetzt bestätigt sind produktive Topologie, Verfügbarkeit, Skalierung, Mandantentrennung auf Infrastruktur-Ebene, Netzwerkregeln, Datenbank-TLS, Backup-/Restore-Verfahren, Aufbewahrungs- und Löschfristen, Alarmierung, Incident Response und konkrete Rolleninhaber. Diese Informationen sind im Repository nicht verfügbar und daher klärungsbedürftig. Als Kontrolle ist vor jeder Freigabe ein Betriebsnachweis mit verantwortlicher Rolle, System-/Datenbankinventar, Secret- und Netzwerkparametern, Backup-/Restore-Test, Monitoring-/Alarmierungsziel und genehmigter Datenaufbewahrung zu hinterlegen.

## Begriffe und Definitionen
| Begriff | Definition in dieser Architektur |
|---|---|
| App Router | Dateisystembasierte Next.js-Routen unter `app/`; Seiten liefern UI, `route.ts`-Dateien HTTP-Schnittstellen. |
| Route Handler | Serverseitiger HTTP-Handler für `GET`, `POST`, `PUT`, `PATCH` oder `DELETE`. |
| Server Action | Direkt aus einer React-Anwendung aufgerufene serverseitige Funktion; hier insbesondere die Registrierung in `lib/auth/actions.ts`. |
| NextAuth-Sitzung | JWT-basierte Sitzung mit maximal 24 Stunden Laufzeit, transportiert in einem HttpOnly-/SameSite-Lax-Cookie. |
| Passkey | WebAuthn-Credential aus Credential-ID, öffentlichem Schlüssel, Signaturzähler und Gerätemetadaten. Private Schlüssel verbleiben beim Authenticator. |
| Passkey-Ceremony-ID | Zufälliger opaker 32-Byte-Wert in Base64url-Darstellung, der genau eine Zeile in `passkey_auth_attempts` adressiert und parallele Anmelde-Ceremonies desselben Benutzers trennt. |
| Passkey-Challenge | Fünf Minuten gültiger WebAuthn-Anmeldezustand in einer eigenen Attempt-Zeile. Er wird vor dem WebAuthn-Nachweis nur gelesen und erst beim atomaren Abschluss genau dieses Versuchs entfernt. |
| Passkey-Login-Token | Nach erfolgreicher WebAuthn-Prüfung erzeugter 32-Byte-Zwischentoken. Nur SHA-256-Hash und Ablaufzeit werden für zwei Minuten in derselben Attempt-Zeile gehalten; NextAuth tauscht ihn einmalig gegen eine Sitzung und löscht die passende Zeile atomar. |
| Paste-Zugriffsnachweis | HMAC-SHA-256-signierter, auf Paste-Slug, aktuellen Passwort-Hash und Ablauf gebundener Wert. Nach erfolgreichem bcrypt-Vergleich liegt er maximal eine Stunde als HttpOnly-/SameSite-Lax-Cookie auf dem Pfad des betroffenen Pastes vor. |
| API-Schlüssel | Mit Präfix `zhort_` ausgegebener Schlüssel; in PostgreSQL liegt ein bcrypt-Hash, der Klartext wird nur bei Erstellung zurückgegeben. |
| Vertrauensgrenze | Übergang zwischen Sicherheitsdomänen, an dem Identität, Eingaben, Transport und Datenfreigabe erneut geprüft werden müssen. |
| Relying Party (RP) | WebAuthn-Anwendung; RP-ID aus `WEBAUTHN_RP_ID` oder Host von `NEXTAUTH_URL`, Origin aus `NEXTAUTH_URL`. |
| Klärungsbedürftige Information | Für Betrieb oder Audit benötigte Information, die im Repository weder konfiguriert noch anderweitig beweisbar ist. |

## Verantwortlichkeiten
Die folgende RACI-Zuordnung ist ein kontrollorientiertes Rollenmodell. Konkrete Personen, Organisationseinheiten und Vertretungen sind im Repository nicht benannt und deshalb klärungsbedürftig. Die Kontrolle besteht darin, diese Rollen im Betriebs- oder ISMS-System namentlich zuzuweisen und mindestens halbjährlich zu bestätigen.

Legende: **R** = ausführend, **A** = rechenschaftspflichtig/freigebend, **C** = konsultiert, **I** = informiert.

| Aktivität | Repository-Maintainer | Betriebsverantwortung | Security/Datenschutz | Produktverantwortung |
|---|---:|---:|---:|---:|
| Architektur und Quellcode pflegen | R | C | C | A |
| Änderungen an Authentifizierung und Autorisierung freigeben | R | C | A | I |
| Schema und Migrationen entwickeln | R | A | C | I |
| Deployment, Secrets, Netzwerk und Datenbank betreiben | C | R/A | C | I |
| Backup, Restore, Monitoring und Incident Response nachweisen | I | R | A | I |
| Externe Dienste und Datenschutzfolgen bewerten | C | C | R | A |
| Risiken aus dieser Übersicht behandeln | R | R | A | C |
| Architekturübersicht und Diagramm revidieren | R | C | A | I |

Die Rollen „Betriebsverantwortung“, „Security/Datenschutz“ und „Produktverantwortung“ haben derzeit keinen repository-seitig belegbaren Inhaber. Bis zur dokumentierten Zuweisung darf eine Produktionsfreigabe nicht allein auf diese RACI-Matrix gestützt werden.

## Detailbeschreibung
### Systemkontext und Architekturentscheidungen
Zhort ist als deploybarer Monolith ausgeführt. Browser, API-Clients und MCP-Clients greifen über HTTP(S) auf denselben Next.js-Prozess zu. UI, API, Authentifizierung und Domänenlogik teilen denselben Quellcode und dieselbe PostgreSQL-Datenbank. Es gibt keine nachweisbaren separaten Worker, Queues, Caches oder internen Microservices.

Nachweisbare Entscheidungen und Annahmen:

1. **Ein Prozess, eine Datenbank:** `app/`, `components/` und `lib/` werden als Next.js-Standalone-Anwendung gebaut; Postgres.js nutzt einen pro Prozess global gecachten Pool mit maximal zehn Verbindungen.
2. **Serverseitige Autorisierung:** Schutz wird in Seiten und Route Handlern über `getServerSession`, `requireAuth`, Besitzprüfungen, Teamrollen oder `SUPER_ADMINS` umgesetzt. `middleware.ts` authentifiziert nicht.
3. **JWT statt Session-Tabelle:** NextAuth nutzt `strategy: 'jwt'`; Benutzer-ID und Rolle werden in JWT und Session übernommen.
4. **PostgreSQL als Zustandsanker:** Neben Fachdaten liegen Rate-Limits, WebAuthn-Credentials, kurzlebige Passkey-/SSO-Zustände, WebRTC-Signalisierung, Auditdaten und Statistiken in PostgreSQL.
5. **Optionale anonyme Nutzung:** Link-, Paste-, Passwortfreigabe-, P2P- und Teile der MCP-Erstellung erlauben anonyme Datensätze; diese erhalten keine `user_id`.
6. **Laufzeitumgebung:** Der Code kann auf Vercel (`vercel.json`, Region `fra1`) oder als Next.js-Standalone-Container laufen. Welcher Pfad produktiv ist und wer ihn betreibt, ist klärungsbedürftig.
7. **Stateless Paste Access Grant:** Paste-Passwörter verbleiben ausschließlich im POST-Body der Unlock-Route. Der Server persistiert keinen zusätzlichen Freigabezustand, sondern signiert einen kurzlebigen Nachweis mit `NEXTAUTH_SECRET`; eine Passwortänderung ändert den eingebundenen Hash und widerruft vorhandene Nachweise implizit.

### Vertrauensgrenzen
| Grenze | Übergang und Daten | Nachweisbare Kontrollen |
|---|---|---|
| Öffentliches Netz → Next.js | URLs, Formdaten, Cookies, API-Schlüssel, WebAuthn-Antworten | Middleware mit Headern, Bot-/Musterprüfung und pro Instanz geführtem Rate-Limit; Handler-spezifische Zod-/Größenprüfungen; NextAuth-CSRF im Auth-Fluss. |
| Browser → Authenticator | WebAuthn-Challenge und signierte Assertion/Attestation | Browser-WebAuthn über SimpleWebAuthn; serverseitige Prüfung von RP-ID, Origin und User Verification. |
| Next.js → PostgreSQL | Personen-, Authentifizierungs-, Inhalts-, Analyse- und Konfigurationsdaten | Drizzle-parametrisierte Abfragen, bcrypt/SHA-256 für ausgewählte Geheimnisse, Fremdschlüssel und Unique Constraints. Transportverschlüsselung ist aus der URL-Konfiguration nicht belegbar. |
| Next.js → externe Dienste/Zielsysteme | Ziel-URLs, IP-Adressen, OIDC-Codes/Tokens, Webhook-Payloads, DNS-Abfragen | Dienstspezifische Prüfungen, Timeouts teilweise vorhanden, HMAC für Webhooks; Egress-Allowlist und private-IP-Sperre sind nicht durchgängig implementiert. |
| Deployment/CI → Laufzeit und Datenbank | Image, Migrationen, Secrets | GitHub Actions baut GHCR-Image; Vercel- und Container-Buildpfade vorhanden; tatsächliche Secret-Verwaltung und Freigabekette sind klärungsbedürftig. |
| Benutzerrolle → Administrationsfunktionen | Benutzer- und Blocklist-Verwaltung | `/admin` und alle `/api/admin/*`-Routen prüfen E-Mail gegen `SUPER_ADMINS` über `requireSuperAdminApiAccess`; Admin-Aktionen werden in `audit_logs` protokolliert; Admin-APIs sind fail-closed rate-limitiert (`admin_api`). |
| Browser → geschütztes Paste | Passwort im Unlock-POST; anschließend HttpOnly-Zugriffscookie bei Haupt-/Raw-Aufruf | Zod-Längenprüfung, DB-Rate-Limit 5 Versuche je IP/Paste in 15 Minuten mit transaktionalem Advisory-Lock und Fail-closed-Speicherfehler, bcrypt-Vergleich, HMAC-Bindung an Slug/Hash/Ablauf, Cookie `SameSite=Lax`, in Produktion `Secure`, Pfad auf `/p/{slug}` begrenzt. |

### Komponenten
#### Präsentation und Client

- `app/layout.tsx` stellt global Providers, Header, Footer, Cookie-Banner und Internationalisierung bereit.
- Öffentliche Flächen umfassen Startseite, Login/Registrierung, Datenschutz, Kurzlink-Redirect `/s/[shortCode]`, Paste-Anzeige `/p/[slug]`, Bio-Profile, Passwort- und P2P-Freigaben sowie maschinenlesbare OpenAPI-, Robots-, Sitemap- und `llms.txt`-Routen.
- Dashboard-Flächen decken Links, Pastes, Analytics, Teams, Webhooks, Passkeys, SSO, API-Schlüssel, Collections, Bio, Bulk- und Enterprise-Funktionen ab.
- `components/` enthält wiederverwendbare UI-, Layout-, Dashboard- und Authentifizierungskomponenten. `SessionProvider`, Internationalisierung und Theme laufen clientseitig.
- Browserseitige Kryptografie/Web APIs werden für WebAuthn, AES-256-GCM/PBKDF2 und WebRTC verwendet. Der P2P-Dateiinhalt soll direkt zwischen Browsern fließen; der Server speichert Metadaten und Offer/Answer.

#### HTTP- und Anwendungslogik

- `/api/links` und Unterrouten verwalten Linkerstellung, Änderungen, Tags, Redirect-Regeln, A/B-Varianten, Maskierung, Pixel, Zeitpläne, Vorschau, Historie, Bulk und Export.
- `/api/pastes`, das geschützte Unlock-POST `/api/pastes/[slug]/unlock`, `/api/passwords`, `/api/p2p/files` und `/api/bio` verwalten weitere Inhaltsarten.
- `/api/analytics`, der Redirect-Handler `/s/[shortCode]` und `lib/analytics.ts` erfassen Hits, IP, User-Agent, Referrer, Geo-, Geräte-, Browser- und Betriebssystemdaten.
- `/api/user`, `/api/teams`, `/api/enterprise`, `/api/sso` und `/api/admin` bilden benutzer-, team-, unternehmens- und administrative Funktionen ab.
- `/api/v1/shorten` ist eine öffentliche Schreibschnittstelle; `/api/v1/links` nutzt Bearer-API-Schlüssel. `/api/mcp` bietet SSE und JSON-RPC; Bearer-Authentifizierung ist dort optional und nur einzelne Tools erfordern sie.
- `lib/` enthält Authentifizierung, Validierung, Rate-Limits, Blocklist/Phishing, Analytics, Webhooks, Smart Redirects, Monetarisierung, Enterprise-, Vorschau-, QR-, Passwort-, P2P- und Datenbanklogik.

Die maßgebliche Zugriffskontrolle liegt in jedem serverseitigen Datenzugriff. Das Dashboard-Layout selbst führt keine Sitzungsprüfung aus; nur ein Teil der Dashboard-Seiten prüft serverseitig, andere verwenden Client-Sitzungen oder verlassen sich auf die zugehörigen APIs. Diese Uneinheitlichkeit ist eine relevante Kontrollgrenze.

### Datenhaltung und Schema
`lib/db/schema.ts` definiert 43 PostgreSQL-Tabellen. Sie lassen sich wie folgt gruppieren:

- **Identität und Zugriff:** `users`, `passkeys`, `passkey_auth_attempts`, `api_keys`, `sso_domains`, `sso_domain_admins`.
- **Kerninhalte:** `links`, `pastes`, `shared_passwords`, `p2p_file_shares`, `bio_profiles`, `bio_links`.
- **Link-Erweiterungen:** `smart_redirects`, `link_masking`, `link_tags`, `link_schedules`, `link_variants`, `link_previews`, `tracking_pixels`, `link_comments`, `link_history`, `link_collections`, `link_health_checks`, `quick_actions`.
- **Analyse und Schutz:** `stats`, `blocked_domains`, `rate_limits`, `link_clicks`, `audit_logs`.
- **Teams und Enterprise:** `teams`, `team_members`, `team_links`, `custom_domains`, `custom_redirect_pages`, `usage_tracking`, `ip_whitelist`, `scheduled_reports`, `approval_workflows`, `link_approvals`, `link_templates`, `team_activity_feed`, `archived_links`.
- **Webhook-Integration:** `webhooks`.

Fremdschlüssel verwenden überwiegend `ON DELETE CASCADE`; ausgewählte Historienbezüge nutzen `SET NULL`. Mehrere komplexe oder flexible Werte werden als JSON-Text und nicht als `jsonb` gespeichert. `users.password_hash` ist optional, damit Passkey-only-Nutzer möglich sind. Kurzlebiger Passkey-Loginzustand liegt nicht in `users`, sondern in `passkey_auth_attempts` mit opaker Text-Primär-ID, Benutzer-Fremdschlüssel, Challenge-/Token-Feldern, eindeutigem Login-Token-Hash und Indizes auf beiden Ablaufspalten. SSO-Client-Secrets und Webhook-Secrets liegen nach Schema als Klartext vor; API-Schlüssel, Passwörter und Zugriffsschlüssel werden gehasht.

SQL-Migrationen `0000` bis `0004` sind im Drizzle-Journal registriert. Das TypeScript-Schema ist umfangreicher als diese Migrationen; Deployment-Skripte gleichen es zusätzlich per verpflichtendem `drizzle-kit push` ab. Die Datei `0004_secure_passkey_auth.sql` legt `passkey_auth_attempts` mit `CREATE TABLE IF NOT EXISTS`, Unique Constraint auf `login_token_hash`, kaskadierendem Benutzer-Fremdschlüssel und Indizes auf `challenge_expires_at` sowie `login_token_expires_at` an; `drizzle/meta/_journal.json` enthält den Tag `0004_secure_passkey_auth`. Der eigene Laufzeit-Migrator liest alle alphabetisch sortierten `.sql`-Dateien unabhängig vom Journal. `drizzle/meta/0004_snapshot.json` fehlt. Weder die Journalregistrierung noch die Repository-SQL-Datei belegen, dass die Migration in Staging oder Produktion ausgeführt und das Zielschema geprüft wurde.

### Zentrale Datenflüsse
#### Link anlegen und weiterleiten
1. Browser oder API-Client sendet Ziel-URL, optionale Schutz-/UTM-Daten und gegebenenfalls Sitzung oder API-Schlüssel.
2. Middleware und Handler prüfen Anfrage, Rate-Limit und Eingaben. Die Anwendung modifiziert unterstützte Amazon-URLs mit einem statisch im Code hinterlegten Affiliate-Tag.
3. Hagezi-Blocklist aus PostgreSQL und optional Google Safe Browsing prüfen die ursprüngliche URL. Fehler oder fehlender Safe-Browsing-Key führen zu „fail open“.
4. Link und optionale Audit-/Historieninformationen werden in PostgreSQL gespeichert; konfigurierte Webhooks erhalten HMAC-signierte Ereignisse.
5. Beim Aufruf `/s/{shortCode}` prüft der Server Existenz, Ablauf, optionales Passwort, Smart Redirect und Maskierung, erhöht Hits und sendet HTTP 302.
6. Asynchron werden Klickdaten gespeichert, die IP über `http://ip-api.com` aufgelöst und Webhooks ausgelöst. Der Browser wechselt anschließend in die Vertrauensdomäne der Ziel-URL.

#### Paste, Passwortfreigabe und P2P
Pastes werden serverseitig gespeichert und können öffentlich, privat, passwortgeschützt oder befristet sein. Für ein geschütztes Paste sendet der Browser das Passwort ausschließlich per `POST /api/pastes/{slug}/unlock`. Das datenbankgestützte Limit serialisiert dasselbe Aktions-/Identifier-Paar innerhalb einer PostgreSQL-Transaktion über `pg_advisory_xact_lock`; maximal fünf Versuche je IP/Paste in 15 Minuten gelangen zur bcrypt-Prüfung, und Speicherfehler führen zu HTTP 503. Nach erfolgreichem Vergleich stellt der Server einen maximal eine Stunde gültigen, HMAC-SHA-256-signierten HttpOnly-Cookie aus, der an Slug und aktuellen Passwort-Hash sowie auf `/p/{slug}` gebunden ist. Haupt- und Raw-Ansicht prüfen denselben Nachweis; die Raw-Route prüft zusätzlich den Paste-Ablauf und liefert erfolgreiche Antworten mit `Cache-Control: private, no-store` sowie `X-Content-Type-Options: nosniff`.

Bei Passwortfreigaben verschlüsselt der Browser Nutzdaten mit AES-256-GCM und PBKDF2; der Server speichert Ciphertext, Metadaten-Ciphertext, optionalen Schlüsselhash und bcrypt-gehashten Zugriffsschlüssel. Dieser Zugriffsschlüssel wird weiterhin auch als Query-Parameter akzeptiert. Zugriffszähler und Ablauf werden serverseitig geprüft.

Bei P2P-Freigaben hält PostgreSQL Dateiname, Größe, Hash, Zugriffsschutz, Signalisierungstoken sowie WebRTC-Offer/Answer. Der Dateistrom ist als direkter WebRTC-DataChannel zwischen Browsern implementiert. Google-STUN-Server unterstützen die NAT-Ermittlung; ein TURN-Dienst ist nicht konfiguriert.

#### Passwort- und SSO-Anmeldung
Bei Passwortanmeldung prüft NextAuth den bcrypt-Hash; bei Erfolg werden ID und Rolle in ein 24 Stunden gültiges JWT übernommen. SSO ermittelt anhand der E-Mail-Domain eine verifizierte Konfiguration, leitet zu Azure AD oder einem konfigurierten OIDC-/Keycloak-Endpunkt um, tauscht den Code serverseitig gegen Tokens, ruft UserInfo ab, legt bei Bedarf einen Benutzer an und speichert einen fünf Minuten gültigen Einmal-Token in `users`. Die Client-Callback-Seite tauscht diesen gegen die NextAuth-Sitzung.

SSO-Konfiguration einschließlich `client_secret` liegt in PostgreSQL. Der `state`-Parameter ist lediglich Base64-kodiertes JSON und im Code weder signiert noch an eine Sitzung gebunden. Dynamisch gespeicherte Token-/UserInfo-URLs überschreiten die externe Vertrauensgrenze.

### Neuer Passkey-Authentifizierungszustand
Der sichere Handoff wurde in Commit `daa2586` eingeführt und durch die Reviewfixes bis `8611a8d` auf einen dedizierten, konkurrierende Ceremonies unterstützenden Attempt-Zustand weiterentwickelt:

1. Der Client sendet die E-Mail an `POST /api/passkeys/authenticate/start`. Die Route prüft das datenbankgestützte, nach Client-IP adressierte Limit `passkey_auth_start` von zehn Anfragen in fünf Minuten; der gemeinsame Rate-Limit-Dienst arbeitet bei Datenbankfehler weiterhin fail open.
2. Der Server lädt Benutzer und erlaubte Credential-IDs, erzeugt eine WebAuthn-Challenge sowie mit `randomBytes(32)` eine opake Base64url-Ceremony-ID, löscht bei jedem Start alle abgelaufenen Challenge- oder Token-Attempts und speichert Challenge plus Fünf-Minuten-Ablauf in einer neuen `passkey_auth_attempts`-Zeile. Weitere Starts desselben Benutzers erzeugen unabhängige Zeilen.
3. Die Startantwort liefert `options` und `ceremonyId`. Der Browser ruft den lokalen/platformgebundenen Authenticator über SimpleWebAuthn auf; biometrische Daten und privater Schlüssel verlassen den Authenticator nicht.
4. Der Client sendet E-Mail, signierte Assertion und `ceremonyId` an `POST /api/passkeys/authenticate/verify`.
5. Der Server liest die zu Ceremony-ID und Benutzer passende, nicht abgelaufene Challenge, ohne sie zu verändern. Danach prüft SimpleWebAuthn Origin, RP-ID, öffentliche Credential-Daten, Zähler und zwingende User Verification.
6. Bei erfolgreichem WebAuthn-Nachweis aktualisiert der Server `last_used_at` und den Signaturzähler monoton über SQL `GREATEST(gespeicherter Zähler, neuer Zähler)`. Ein bedingtes `UPDATE ... RETURNING` schließt dann genau den passenden, noch nicht abgeschlossenen und nicht abgelaufenen Attempt atomar ab: Challenge und Challenge-Ablauf werden geleert, ausschließlich der SHA-256-Hash eines neuen 32-Byte-Tokens und dessen Zwei-Minuten-Ablauf werden gesetzt. Ein zweiter Abschluss desselben Attempts schlägt fehl.
7. Der Klartext-Zwischentoken wird einmal an den Browser geliefert und per `signIn('credentials', { email, passkey_token })` an NextAuth übergeben.
8. NextAuth ermittelt den Benutzer über die validierte E-Mail und verbraucht Hash und Ablauf atomar mit `DELETE ... RETURNING` auf der passenden Attempt-Zeile. Nur bei erfolgreicher Löschung entsteht das normale 24-Stunden-JWT; Wiederverwendung und der frühere statische Marker `authenticated` werden abgewiesen.

Die Migration `0004_secure_passkey_auth.sql` stellt die dedizierte Attempt-Tabelle und beide Ablaufindizes bereit und ist im Drizzle-Journal registriert; der Metadaten-Snapshot `drizzle/meta/0004_snapshot.json` fehlt. Vor einem Rollout muss ihre tatsächliche Anwendung einschließlich Tabelle, Unique Constraint, Fremdschlüssel und Indizes belegt werden. Die zwölf Tests in drei Dateien prüfen den Dienstzustand und die NextAuth-Credentials-Grenze, aber keine reale PostgreSQL-Atomizität unter Konkurrenz und keinen Live-WebAuthn-End-to-End-Fluss; daraus folgt keine Produktionsvalidierung. Außerdem nutzt die Passkey-Registrierung einen anderen Zustandspfad: Die Registrierungs-Challenge wird an den Client zurückgegeben und bei der Verifikation vom Client wieder eingereicht, statt aus einem serverseitigen Einmalspeicher gelesen zu werden. Dieser Unterschied ist sicherheitsrelevant und darf nicht mit dem abgesicherten Anmeldefluss gleichgesetzt werden.

### Externe Schnittstellen und Dienste
| Gegenstelle | Richtung | Zweck/Daten | Konfiguration oder Nachweis |
|---|---|---|---|
| PostgreSQL | ausgehend | gesamter persistenter Zustand | `DATABASE_URL` oder `POSTGRES_URL`; Anbieter, Region, TLS, HA, Backup und Aufbewahrung klärungsbedürftig |
| Azure AD / OIDC / Keycloak | bidirektional über Browser und Server | Autorisierungscode, Client-Credentials, Access Token, UserInfo/E-Mail | Datenbankkonfiguration in `sso_domains` |
| Google Safe Browsing | ausgehend | zu prüfende Ziel-URL | optionaler `GOOGLE_SAFE_BROWSING_KEY`; Fehler führen zu fail open |
| jsDelivr/Hagezi | ausgehend | Download einer Hosts-Blocklist | feste CDN-URL; Daten werden in `blocked_domains` ersetzt |
| ip-api.com | ausgehend, unverschlüsseltes HTTP | Besucher-IP zur Geo-Auflösung | fest im Code, kein API-Schlüssel |
| Ziel-Websites | ausgehend | OpenGraph-GET, Health-HEAD und Redirect-Ziel | URL aus Benutzereingabe; teilweise 5-/10-Sekunden-Timeout |
| Benutzerdefinierte Webhooks | ausgehend | Link-Ereignisse und Metadaten | URL/Secret in PostgreSQL; HMAC-SHA-256-Header |
| DNS-Resolver | ausgehend | TXT-Prüfung für SSO-Domain | Node-Resolver; konkrete Resolver-Infrastruktur klärungsbedürftig |
| Google STUN | Browser ausgehend | WebRTC ICE/NAT-Ermittlung | `stun.l.google.com:19302`, `stun1.l.google.com:19302` |
| Ko-fi/Impressum/Ziel-Links | Browser ausgehend | bewusste Navigation | statische Links; kein serverseitiger Datenaustausch nachgewiesen |

`@vercel/blob` ist als Abhängigkeit vorhanden, wird im untersuchten Anwendungscode jedoch nicht importiert; ein Blob-Speicher-Datenfluss ist daher nicht belegt.

### Deployment und Betrieb
Der Vercel-Pfad verwendet `npm run build` in Region `fra1`. Der `prebuild`-Hook startet bei gesetzter Datenbank-URL `npm run upgrade -- --skip-build` und bricht CI-/Vercel-/Produktions-Builds ohne Datenbank-URL ab. `upgrade.js` führt Team-Migration und den Schema-Push verpflichtend aus; Stats-Seeding und weitere Prüfungen bleiben optional. Der lokale Build ist nachweislich erfolgreich, überspringt ohne `DATABASE_URL` jedoch das Upgrade und belegt deshalb keine Migration.

Der Container-Pfad baut mit Node 20 Alpine und `npx next build`, kopiert das Standalone-Ergebnis und Migrationsteile in ein nicht privilegiertes Runtime-Image. Der Entrypoint führt vor Serverstart `scripts/ensure-database.js` aus und beendet den Container bei einem Bootstrapfehler; `server.js` startet dann nicht. Zusätzlich startet `instrumentation.ts` im Node-Runtime-Hintergrund `ensureDatabaseSchema()`, und `/api/links` ruft denselben Prozess beim ersten Schreibzugriff auf. Dieser Prozess wendet alle SQL-Dateien an, toleriert ausgewählte „bereits vorhanden“-Fehler und führt anschließend `drizzle-kit push` aus.

GitHub Actions baut auf Pull Requests ein Linux/AMD64-Image und veröffentlicht bei Push auf `main` oder Versions-Tags nach GHCR. Ein anschließendes Deployment des Images, Vercel-Projektbindung, Freigabestufen, Rollback, Health Checks oder Runtime-Skalierung sind nicht im Repository definiert und damit klärungsbedürftig. Kontrolle: Betreiber müssen pro Umgebung ein versioniertes Betriebsblatt und einen erfolgreichen Deployment-/Migrations-/Rollback-Nachweis führen.

## Nachweise und Artefakte
| Nachweis | Aussage |
|---|---|
| `package.json`, `package-lock.json` | Next.js 16, React 19, NextAuth 4, Drizzle/Postgres.js, SimpleWebAuthn und Build-/Migrationsskripte |
| `app/` | 38 Seiten, 72 Route-Dateien und 118 HTTP-Handler; tatsächliche Oberflächen und Schnittstellen |
| `components/` | 36 UI-, Dashboard-, Provider- und Passkey-Komponenten |
| `lib/auth/config.ts`, `types/next-auth.d.ts` | Credentials-Provider, JWT-Sitzung, Rollen-/ID-Claims und Cookie-Einstellungen |
| `lib/passkeys.ts`, `lib/auth/passkey-auth-attempt.ts` | WebAuthn-Prüfung, opake Ceremony-IDs, atomarer Attempt-Abschluss und Tokenverbrauch |
| `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts`, `lib/auth/config.test.ts` | 12 Tests für parallele Challenges, Ablauf, Startbereinigung, Hashspeicherung, einmaligen Verbrauch, Abweisung des statischen Markers und NextAuth-Credentials-Grenze |
| `drizzle/0004_secure_passkey_auth.sql`, `drizzle/meta/_journal.json` | `CREATE TABLE` und zwei Ablaufindizes für `passkey_auth_attempts`, registrierter Journal-Eintrag; `drizzle/meta/0004_snapshot.json` und operative Anwendung fehlen |
| `lib/db/schema.ts` | 43 Tabellen, Felder, Beziehungen und Löschregeln |
| `lib/db/index.ts`, `lib/db/ensure-schema.ts`, `lib/db/sql-migrate.ts` | Connection Pool, Laufzeit-Schemaabgleich und SQL-Anwendung |
| `middleware.ts`, `next.config.ts`, `lib/api-security.ts`, `lib/rate-limit.ts` | Sicherheitsheader, Anfrageprüfung, Sitzungshelper und zwei Rate-Limit-Mechanismen |
| `app/api/links/route.ts`, `app/s/[shortCode]/route.ts` | Linkerstellung, Blocklist, Persistenz, Redirect, Analytics und Webhooks |
| `app/api/pastes/[slug]/unlock/route.ts`, `app/p/[slug]/page.tsx`, `app/p/[slug]/raw/route.ts`, `lib/paste-access.ts` | POST-basierter Passwortnachweis, gebundener Zugriffscookie und einheitliche Haupt-/Raw-/Ablaufkontrolle |
| Vier Paste-Testdateien unter `app/api/pastes/`, `app/p/`, `lib/paste-access.test.ts` sowie `lib/rate-limit.test.ts` | 19 lokale Paste-/Rate-Limit-Vertragsfälle; vollständige Suite am 21.07.2026 mit 31/31 Tests bestanden; Konkurrenztest nutzt einen Transaktionsmock, keine Live-Datenbank |
| `app/api/auth/sso/*`, `app/api/sso/*` | SSO-Erkennung, DNS-Claim, OIDC-Codeaustausch und NextAuth-Handoff |
| `lib/blocklist.ts`, `lib/db/blocklist-service.ts`, `lib/phishing-check.ts`, `lib/analytics.ts`, `lib/webhooks.ts`, `lib/link-preview.ts` | externe HTTP-Datenflüsse |
| `Dockerfile`, `scripts/docker-entrypoint.js`, `instrumentation.ts`, `vercel.json`, `.github/workflows/docker-image.yml` | Build-, Start-, Schema- und Image-Bereitstellungspfade |
| `internal-docs/architektur/architektur.drawio` | unkomprimiertes Systemkontext-/Komponenten-/Datenflussdiagramm mit Vertrauensgrenzen |
| Git-Commits `daa2586`, `ddf3925` bis `8611a8d` | Einführung, Vereinheitlichung und Reviewkorrekturen des Passkey-Handoffs einschließlich paralleler Ceremonies und finalem Lifecycle-/Deployment-Hardening |

Repository-Anleitungen wie `README.md`, `SECURITY.md` und `VERCEL_DEPLOYMENT.md` wurden nur ergänzend betrachtet, da sie teilweise von der Implementierung abweichen, etwa Next.js 14 statt 16 oder pauschale Aussagen über Schutz und Betrieb.

## Risiken und Kontrollen
| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Produktive Betreiber, Datenbankanbieter, Secret Store, TLS, Backup, Aufbewahrung und Monitoring sind repository-seitig unbekannt. | Fehlende Verantwortlichkeit und nicht prüfbarer Schutz/Restore. | Hoch | Betriebsverantwortliche namentlich zuweisen und Umgebungs-/Dateninventar genehmigen. | Freigabesperre ohne aktuelles Betriebsblatt, Restore-Test und Monitoring-Nachweis. | Fehlende Owner-/Infra-Dateien; nur Vercel-/Docker-Konfiguration vorhanden. |
| `0004` ist im Drizzle-Journal registriert, der Snapshot fehlt und die Ausführung im Zielsystem ist nicht nachgewiesen. | Fehlende Attempt-Tabelle, Indizes oder Constraints lassen den Passkey-Login ausfallen oder vom geprüften Modell abweichen. | Hoch | Snapshotabweichung auflösen und die kanonische Migrationskette vor Aktivierung in einer produktionsnahen Umgebung ausführen. | Deployment prüft Tabelle, Unique Constraint, Fremdschlüssel, Indizes, Migrationsversion und Checksumme und archiviert das Protokoll. | `drizzle/0004_secure_passkey_auth.sql`, `drizzle/meta/_journal.json`; `drizzle/meta/0004_snapshot.json` und Betriebsnachweis fehlen. |
| Schema wird per Build, Containerstart, Instrumentation und erstem API-Aufruf verändert. | Race Conditions oder Teilmigrationen trotz fehlerschließendem Containerstart. | Mittel | Migration als einmaligen, fehlerschließenden Release-Schritt ausführen; App-Prozess nur nach erfolgreichem Check starten. | Readiness-Prüfung gegen erwartete Schema-Version und Rollback-Probe. | `prebuild`, `upgrade.js`, `docker-entrypoint.js`, `ensure-schema.ts`; Containerstart ist nun fail closed. |
| Middleware-Rate-Limit und MCP-Sitzungen liegen im Prozessspeicher. | Umgehung oder Verlust bei mehreren Instanzen, Cold Starts und Skalierung. | Hoch | Verteilten Zustand in PostgreSQL/Redis mit atomaren Operationen verwenden. | Mehrinstanz-Test und Metrik für globale Grenzwertverletzungen. | `middleware.ts`, `app/api/mcp/route.ts`. |
| Datenbank-Rate-Limit-Aktionen ausserhalb des Paste-Unlock sowie Blocklist/Safe-Browsing arbeiten bei Fehlern fail open. | Missbrauch oder Weiterleitung schädlicher Domains bei Störung. | Mittel | Paste-Muster aus transaktionalem Advisory-Lock und Fail-closed-Fehler auf weitere risikoreiche Schreib-/Zugriffswege übertragen. | Alarm auf Schutzdienstfehler; Mehrinstanz-/Chaos-Test mit nicht verfügbarer DB/API. | Paste-Unlock geschlossen; übrige `lib/rate-limit.ts`-Aktionen, `lib/blocklist.ts`, `lib/phishing-check.ts` offen. |
| Passkey-Registrierung vertraut einer vom Client zurückgesendeten Challenge; nur der Login nutzt serverseitigen Einmalzustand. | Manipulierbarer Registrierungszustand und fehlende Replay-Bindung. | Hoch | Registrierungs-Challenge serverseitig, nutzergebunden, kurzlebig und atomar einmalig speichern. | Negativtests für fremde, abgelaufene und wiederverwendete Registrierungs-Challenges. | `components/passkey-register.tsx`, `app/api/passkeys/register/verify/route.ts`, `lib/passkeys.ts`. |
| Passkey-Login-Parallelität und atomare Datenbankoperationen sind nur durch In-Memory-/Mock-Tests modelliert. | Race- oder Integrationsfehler können trotz 12 grüner Tests unentdeckt bleiben. | Mittel | Gleichzeitige Starts, Abschlüsse und Tokenverbräuche gegen reale PostgreSQL-Transaktionen sowie einen Live-WebAuthn-Stagingfluss testen. | Release-Gate verlangt DB-Konkurrenz- und WebAuthn-E2E-Protokoll gegen Commit-SHA. | Drei Testdateien/12 Tests; kein realer PostgreSQL-/WebAuthn-E2E-Nachweis. |
| Passkey-/SSO-Start unterscheidet Benutzer-, Domain- und Credential-Zustände in Antworten. | E-Mail-/Account-Enumeration. | Mittel | Einheitliche Antworten und vergleichbare Laufzeit; Details nur intern protokollieren. | Automatisierter Enumerationstest und Rate-Limit auf alle Passkey-Endpunkte. | Auth-Start hat DB-Limit 10/5 Minuten, das bei DB-Fehler fail open arbeitet; `getAuthenticationOptions`, `auth/sso/check`. |
| SSO-`state` ist nicht signiert/sitzungsgebunden; OIDC-Endpunkte sind dynamische URLs; Client-Secrets liegen im Klartext. | Login-CSRF, Konfigurationsmanipulation, SSRF und Secret-Offenlegung. | Hoch | Signierten Einmal-State/PKCE nutzen, Issuer/Endpoints erlaubnislisten, Secrets verschlüsselt in Secret Store halten. | OIDC-Negativtests, Egress-Regeln, Secret-Rotation und DB-Auslesetest. | `app/api/auth/sso/check/route.ts`, `callback/route.ts`, `sso_domains`. |
| Vorschau, Health Checks und Webhooks rufen benutzerbestimmte URLs auf; seit 2026-07-24 blockiert `assertSafeOutboundUrl`/`urlSchema` Literal-Hostname-SSRF (localhost, private/link-local IPv4, IPv6-Loopback). DNS-Rebinding und Redirect-Ketten sind weiterhin offen. | SSRF in interne Dienste oder Metadaten-Endpunkte bei umgehbarer Literal-Prüfung. | Mittel (Literal-SSRF geschlossen; Rebinding/Redirects offen) | DNS-Auflösung und alle Redirects gegen private/link-local/netzinterne Bereiche prüfen; Egress-Proxy/Allowlist einsetzen. | SSRF-Testkatalog (`lib/outbound-url.test.ts`, 6 Tests) plus geplante Rebinding-/Redirect-Fälle. | Teilweise geschlossen in `lib/security.ts`, `lib/webhooks.ts`, `lib/link-preview.ts`, `lib/user-features.ts`, `app/api/user/webhooks/[id]/test/route.ts` (2026-07-24). |
| Besucher-IP wird per unverschlüsseltem HTTP an `ip-api.com` übertragen und mit detaillierten Klickdaten gespeichert. | Vertraulichkeits- und Datenschutzverletzung. | Hoch | HTTPS-fähigen vertraglich geprüften Dienst oder lokale GeoIP-Datenbank nutzen; IP minimieren/pseudonymisieren und Frist festlegen. | Datenschutzfreigabe, Verzeichnis der Verarbeitung, Löschjob und Transporttest. | `lib/analytics.ts`, Tabelle `link_clicks`. |
| Dashboard-Schutz ist nicht zentral; einzelne Seiten verlassen sich auf Clientzustand oder API-Prüfungen. | Unbeabsichtigte UI-/Datenexposition bei neuen Seiten oder inkonsistenten Handlern. | Mittel | Serverseitigen Auth-Guard im Dashboard-Layout und standardisierte Handler-Wrapper verwenden; Besitzprüfung bleibt zwingend. | Routeninventar-Test für Authentifizierung und Autorisierung. | `app/dashboard/layout.tsx` und Sitzungs-Suche unter `app/dashboard`. |
| Blocklist-Statistik und Blocklist-Update waren ohne Super-Admin-RBAC erreichbar. | Informationspreisgabe und ressourcenintensive Aktualisierung durch jeden Benutzer. | Hoch | Beide Admin-Handler mit `requireSuperAdminApiAccess` schützen und Audit-Log schreiben. | API-Autorisierungstest für anonym, Benutzer und Super-Admin (`route.test.ts`). | Geschlossen in `app/api/admin/blocklist/route.ts` (2026-07-23). |
| MCP erlaubt ohne gültigen API-Schlüssel Linkerstellung und liefert öffentliche Linkdetails; Sitzungscontroller werden nicht sichtbar bereinigt. | Anonymer Missbrauch, Metadatenexposition und Speicherverbrauch. | Mittel | Schreib-/Statistiktools explizit authentifizieren, Ownership prüfen und Streams bei Abbruch/Timeout entfernen. | MCP-Vertragstests und Lasttest mit abgebrochenen SSE-Verbindungen. | `app/api/mcp/route.ts`. |
| Access-Counter für Passwort-/P2P-Freigaben wird read-modify-write aktualisiert. | Parallele Zugriffe können Höchstgrenzen überschreiten. | Mittel | Bedingtes atomisches `UPDATE ... WHERE current_accesses < max_accesses RETURNING` verwenden. | Parallelitätstest gegen exakt eingehaltene Obergrenze. | `app/api/passwords/[shareId]/route.ts`, `app/api/p2p/files/[shareId]/route.ts`. |
| Zugriffsschlüssel werden als Query-Parameter akzeptiert. | Offenlegung in Browserhistorie, Proxy-/Access-Logs und Referrern. | Mittel | Geheimnisse ausschließlich in Request-Body oder geschütztem Header übertragen. | Log- und Browser-Test auf Abwesenheit von Secrets in URLs. | beide Share-GET-Handler und Client-Fetches. |
| Paste-Zugriffscookies hängen von Verfügbarkeit und Stärke des `NEXTAUTH_SECRET` ab; produktive Cookie-/Proxy-Eigenschaften sind repository-seitig nicht belegt. | Fehlkonfiguration kann Unlock verhindern oder bei schwachem Secret Nachweise angreifbar machen. | Niedrig bei regelkonformer Konfiguration, betrieblich unbestätigt | Mindestens 32 zufällige Bytes, Secret Store und Rotation; Browser-/Proxy-Smoke-Test vor Freigabe. | Cookie-Attribute, URL-/Log-Abwesenheit des Passworts und Rotation gegen Staging prüfen. | `lib/paste-access.ts`, Unlock-Route und 19 Paste-/Rate-Limit-Tests; Betriebsnachweis offen. |
| CSP erlaubt `'unsafe-inline'` und `'unsafe-eval'`; Remote-Bilder sind sehr breit erlaubt. | Erhöhte XSS-/Supply-Chain-Angriffsfläche. | Mittel | Nonce-/Hash-basierte CSP und begrenzte Bild-/Connect-Domänen einführen. | Browser-CSP-Report-Only-Phase und automatisierter Header-Test. | `middleware.ts`, `next.config.ts`. |
| Sicherheitsereignisse werden nur auf `console` geschrieben; SIEM, Alarmierung und Aufbewahrung sind nicht belegt. | Angriffe werden verspätet oder nicht erkannt; Nachweise fehlen. | Hoch | Strukturierte Logs zentral erfassen, sensible Werte reduzieren und Alarme/Fristen definieren. | Testalarm und regelmäßige Stichprobe von Auth-/Berechtigungsereignissen. | `lib/security.ts`; keine SIEM-Konfiguration im Repository. |

## Pflegeprozess
1. Repository-Maintainer prüfen diese Übersicht bei jeder Änderung an Routen, Datenmodell, Authentifizierung, externen Diensten, Deployment oder Vertrauensgrenzen.
2. Jede Architekturänderung aktualisiert Markdown und draw.io im selben Review. Die Änderung nennt betroffene Datenflüsse, Risiken, Kontrollen und Migrationen.
3. Security/Datenschutz prüft mindestens halbjährlich sowie vor neuen externen Datenübermittlungen die Risiko- und Schnittstellentabellen.
4. Betriebsverantwortung ergänzt repository-externe Nachweise im kontrollierten Betriebs-/ISMS-System und verlinkt dort Commit, Image-Digest, Migrationsstand, Secret-Rotation, Backup-/Restore-Test und Monitoring-Alarmtest.
5. Vor Release werden Build, Tests und Migration in einer produktionsnahen Umgebung ausgeführt. Für Passkeys sind Registrierung, Login, Ablauf, Replay, falsche Origin/RP-ID und einmaliger Handoff zu prüfen.
6. Abweichungen zwischen TypeScript-Schema, SQL-Dateien und Drizzle-Journal blockieren die Freigabe, bis ein eindeutiger kanonischer Stand belegt ist.
7. Die Revisionshistorie wird append-only fortgeführt; fachliche Löschungen oder Risikoreduktionen werden mit Anlass und Nachweis dokumentiert.

## Revisionshistorie
| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 20.07.2026 | Automatisierte Repository-Analyse / Dokumentation | Ersterstellung der auditfähigen Architekturübersicht und des draw.io-Diagramms auf Basis von Commit `58c06b7`; neuer Passkey-Zustandsfluss und Migration `0004` aufgenommen. | Angeforderte Architektur- und Kontrolltransparenz für den aktuellen Repository-Stand. |
| 20.07.2026 | Automatisierte Repository-Analyse / Dokumentation | Passkey-Fluss nach Reviewfixes auf `passkey_auth_attempts`, parallele opak adressierte Ceremonies, atomaren Abschluss/Verbrauch, damaligen Teststand und journalisierte Migration aktualisiert; operative und Live-E2E-Nachweise bleiben offen. | Reviewfixes bis Commit `6618792`. |
| 20.07.2026 | Automatisierte Repository-Analyse / Dokumentation | Startlimit, Purge bei jedem Start, Ablaufindizes, monotone Zähler, 12 Tests und fehlerschließenden Schema-Bootstrap aufgenommen; reale DB-/WebAuthn-/Staging-Nachweise und `0004_snapshot.json` bleiben offen. | Finales Hardening bis Commit `8611a8d`. |
| 21.07.2026 | Automatisierte Repository-Analyse / Dokumentation | Paste-Unlock als POST-basierten, stateless HMAC-Zugriffsfluss mit gebundenem HttpOnly-Cookie, Haupt-/Raw-/Ablaufkontrolle, transaktional serialisiertem Fail-closed-Limit und 19 Tests aufgenommen. | Kritischer Paste-Vertraulichkeitsfix bis Commit `9cfdeea`. |
