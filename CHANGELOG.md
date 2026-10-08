# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [Unreleased]

### Security

- Kritischen Vertraulichkeitsfehler bei passwortgeschützten Pastes geschlossen: Haupt- und Raw-Ansicht akzeptieren keine Passwortwerte mehr aus der URL und geben Inhalte nur nach einem serverseitigen bcrypt-Vergleich frei.
- Nach erfolgreicher Prüfung wird ein auf Paste-Slug und aktuellen Passwort-Hash gebundener, HMAC-SHA-256-signierter HttpOnly-Cookie mit einer Stunde Gültigkeit ausgestellt. Der Cookie ist auf den Pfad des jeweiligen Pastes begrenzt, wird in Produktion nur über HTTPS gesendet und wird bei einer Passwortänderung automatisch ungültig.
- Die Raw-Ansicht prüft nun zusätzlich den Ablaufzeitpunkt und liefert geschützte Inhalte weder ohne Zugriffsnachweis noch aus abgelaufenen Pastes aus.
- Passwortversuche für Pastes sind datenbankgestützt auf fünf Anfragen je Client-IP und Paste in 15 Minuten begrenzt.
- Gleichzeitige Versuche desselben Schlüssels werden über eine PostgreSQL-Transaktion mit Advisory Lock serialisiert; fällt der Rate-Limit-Speicher aus, verweigert der Paste-Unlock die Prüfung mit HTTP 503 statt unbegrenzt weiterzuprüfen.

### Added

- 19 Regressionstests für Paste-Seite, Raw-Route, Unlock-API, kryptografische Zugriffsnachweise sowie Konkurrenz- und Ausfallverhalten des Rate-Limits ergänzt; die vollständige Suite umfasst nun 31 Tests in acht Dateien.
- Redirect-Zeitpunkt-Enforcement ergänzt: Zeitplanung (aktiv/abgelaufen mit Fallback-URL), A/B-Varianten, Geo-Targeting und Tracking-Pixel werden nun serverseitig in `lib/redirect-target.ts` ausgewertet und beim Redirect angewendet; die Pixel-Dashboard-Seite `/dashboard/links/[linkId]/pixels` verwaltet Pixel-Codes inklusive Masking-Generator.
- Webhook-Zustellung robuster gemacht: `lib/webhooks.ts` liefert Ereignisse mit bis zu drei Versuchen und exponentiellem Backoff inklusive Jitter aus, wertet nur 2xx-Antworten als Erfolg und aktualisiert `lastTriggeredAt` bei Zustellung; die Ereignisse `link.expired` und `paste.created` sind jetzt gültig und `link.created` wird in allen authentifizierten Erstellungspfaden (V1-API, Bulk, MCP) ausgelöst.
- V1-Endpoint `GET /api/v1/links/:shortCode/analytics` (API-Key-Authentifizierung, Eigentümerprüfung) liefert Klicks, eindeutige IPs und Geräte-/Länder-/Browser-Aufschlüsselungen; in der OpenAPI-Dokumentation spezifiziert.
- API-Keys unterstützen jetzt Verfall (`expiresIn`: 30d/90d/365d/never), Rotation über `POST /api/user/api-keys/[id]/rotate` sowie Audit-Einträge für Anlegen, Rotieren und Löschen; das Dashboard zeigt eine Ablaufspalte und einen Rotieren-Button.
- Duplikaterkennung beim Kürzen: Authentifizierte Benutzer erhalten HTTP 409 mit dem bestehenden Kurzcode, wenn dieselbe (monetarisierte) URL bereits gekürzt wurde; das Formular zeigt den bestehenden Link mit Kopierfunktion an.
- Link-Kommentare und interne Notizen end-to-end umgesetzt: `lib/link-comments.ts`, `GET/POST/DELETE /api/links/[linkId]/comments` mit Eigentümerprüfung sowie die Seite `/dashboard/links/[linkId]/comments`, erreichbar über das Quick-Actions-Menü.
- Links-Dashboard um Tag-Filter-Chips (fehlerhafte `getUserTags`-Abfrage per Join korrigiert), Schnellfilter Meistgeklickt/Aktiv/Abgelaufen, entprellte Suche, CSV-Export der gefilterten Links und Teilen-Aktion (Web Share API mit Zwischenablage-Fallback) erweitert.
- Custom-Domain-Verwaltung: neue Seite `/dashboard/domains` mit DNS-Einträgen, Verifizierungs-Token und erneutem Prüfen sowie `DELETE /api/user/domains/[id]`; Sidebar-Eintrag ergänzt.
- Enterprise-Audit-Trail verdrahtet: `link.created`, `link.updated`, `link.deleted`, `team.created` und `team.member.added` schreiben zusammen mit den bereits vorhandenen `api_key.*`- und `custom_domain.deleted`-Einträgen in `audit_logs`; Link-UPdates/-Löschungen lösen zusätzlich die Webhooks `link.updated`/`link.deleted` aus.
- V1-Links-API speichert übergebene Passwörter jetzt als bcrypt-Hash statt sie zu ignorieren.

### Changed

- Das Passwortformular sendet Zugangsdaten per `POST /api/pastes/[slug]/unlock`; URLs, Browserhistorie und Referrer enthalten kein Paste-Passwort mehr.

### Fixed

- Unescape apostrophes in template strings to resolve `react/no-unescaped-entities` ESLint errors.
- Resolve `react-hooks/set-state-in-effect` by removing synchronous `setState` calls from `useEffect` in `recent-links.tsx`.
- Replace `any` with `unknown` and `Blob` in type annotations across enterprise and p2p feature modules to resolve `@typescript-eslint/no-explicit-any`.
- Resolve ~206 TypeScript compilation errors: added missing `pasteTags`/`tags` exports, generated `.d.ts` declarations from `drizzle-orm` `.d.cts` files, and added missing `'link.updated'` / `'link.deleted'` to the `WebhookEvent` type union.

## [2026-07-20]

### Security

- Kritischen Kontoübernahmeweg in der Passkey-Anmeldung geschlossen: Parallele WebAuthn-Ceremonies werden in eigenen `passkey_auth_attempts`-Zeilen unter zufälligen, opaken Ceremony-IDs geführt. Die Challenge bleibt bis zur erfolgreichen WebAuthn-Prüfung lesbar; anschließend wird genau ein Versuch atomar abgeschlossen und ein serverseitig ausgestellter, ausschließlich als SHA-256-Hash gespeicherter Einmal-Token mit zwei Minuten Gültigkeit statt des statischen Markers `authenticated` ausgegeben.
- Lebenszyklus der Passkey-Anmeldeversuche gehärtet: Jeder Start bereinigt abgelaufene Attempt-Zeilen und ist über das datenbankgestützte Limit `passkey_auth_start` auf zehn Anfragen pro Client-IP in fünf Minuten begrenzt.
- WebAuthn-Signaturzähler werden mit SQL `GREATEST` monoton aktualisiert, sodass konkurrierende erfolgreiche Prüfungen keinen höheren bereits gespeicherten Zähler zurücksetzen.
- Laufzeitabhängigkeiten und transitive Lockfile-Versionen sicherheitsorientiert aktualisiert, einschließlich `drizzle-orm` `0.45.2`. Der vollständige npm-Audit-Stand wurde von 21 Schwachstellen, davon 7 hoch, auf 9 moderate Schwachstellen reduziert.

### Added

- Vitest-Regressions-Harness und zwölf Authentifizierungstests in drei Dateien für parallele Challenges, Ablauf, Bereinigung und Abschluss, Token-Hashing, Zwei-Minuten-Ablauf, Einmalverwendung, Ablehnung des früheren statischen Passkey-Markers und die NextAuth-Credentials-Grenze ergänzt.
- Idempotente und im Drizzle-Journal registrierte Datenbankmigration `drizzle/0004_secure_passkey_auth.sql` mit `CREATE TABLE IF NOT EXISTS` sowie Ablaufindizes für Challenge und Login-Token in `passkey_auth_attempts` ergänzt.

### Changed

- Passkey-Start-, Verify-, Client- und NextAuth-Fluss auf eine opake `ceremonyId`, konkurrierende Authentifizierungsversuche und das atomare Löschen der passenden Attempt-Zeile beim Tokenverbrauch umgestellt.
- `scripts/upgrade.js` führt den Schema-Push verpflichtend aus; der Docker-Entrypoint verweigert den Anwendungsstart, wenn der Schema-Bootstrap fehlschlägt.
