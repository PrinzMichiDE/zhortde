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

### Gap-Features umgesetzt

- **Redirect-Zeitpunkt-Enforcement** (`ef81031`): Scheduling, A/B-Varianten, Geo-Targeting und Tracking-Pixel werden nun beim Redirect serverseitig ausgewertet (Priorität: inaktiver Zeitplan → A/B-Variante → Smart-Redirect → lange URL); Pixel-Dashboard-Seite inkl. Masking-Generator.
- **Webhook-Zustellung & Ereignisabdeckung** (`14814a1`): `deliverWebhook` mit 3 Versuchen, exponentiellem Backoff + Jitter; nur 2xx als Erfolg; `link.expired` und `paste.created` sind jetzt gültige Ereignisse; 6 Tests.
- **V1-Analytics-Endpoint** (`273337f`): `GET /api/v1/links/:shortCode/analytics` mit API-Key-Auth, Eigentümerprüfung; liefert Klicks, eindeutige IPs, Geräte-/Länder-/Browser-Aufschlüsselung; OpenAPI-Spezifikation erweitert; 5 Tests.
- **API-Keys: Verfall, Rotation, Audit** (`672b310`): `expiresIn` (30d/90d/365d/never), Rotation über `POST /api/user/api-keys/[id]/rotate`, Audit-Einträge für Anlegen/Rotieren/Löschen; Dashboard mit Ablaufspalte und Rotate-Button; 5 Tests.
- **Duplikaterkennung** (`09d21d4`): `findDuplicateLink` prüft auf Benutzer + gespeicherte URL, HTTP 409 mit bestehendem Shortcode, Formular zeigt Warnhinweis mit Kopierfunktion; 2 Tests.
- **Link-Kommentare & Notizen** (`ab86a75`): `lib/link-comments.ts` mit Liste neueste zuerst, Anlegen/Löschen, Route mit `requireAuth` + Eigentümerprüfung + Zod-Schema; Dashboard-Seite `/dashboard/links/[linkId]/comments`; 5 Tests.
- **Dashboard: Suche, Filter, Export, Teilen** (`eeacdc3`): Tag-Filter-Chips (AND-Verknüpfung), Quick-Filter Meistgeklickt/Aktiv/Abgelaufen, entprellte Suche (250 ms), CSV-Export, Teilen über Web Share API; Tag-Join-Bugfix; 4 Tests.
- **Custom Domains** (`02d828e`): Seite `/dashboard/domains` mit Domain hinzufügen, DNS-Einträge (CNAME + TXT-Token), erneut verifizieren (PUT), löschen; `DELETE /api/user/domains/[id]` mit Audit-Eintrag; Sidebar-Eintrag; 17 neue Übersetzungen.
- **Enterprise-Audit-Trail** (`5652def`): `logAuditEvent` an allen sensiblen Stellen: `link.created`, `link.updated`, `link.deleted`, `team.created`, `team.member.added`; PATCH/DELETE-Link lösen zusätzlich Webhooks aus; alle Schreibvorgänge fire-and-forget.
- **Bulk-Shortener** (`b92de2b`): Tabellen `batch_jobs` und `batch_links` für Stapelverarbeitung, Massenkürzung mit Fortschrittsverfolgung und Status-Management.
- **Admin-Routentests** (`b92de2b`): Umfassende Testsuite für Admin-Routen, inkl. Blocklist-Handler mit `isSuperAdmin`-Prüfung (Commit `3cab839`) und SSO-Callback-Route-Tests (Commit `95e89bc`).
- **Fehlerbehandlungs-Infrastruktur** (`b92de2b`): Konsistente Fehlerbehandlung über alle API-Routen und Server-Komponenten hinweg, inkl. Validation Error Handling, Global Error Boundary, und API Error Responses.
- **I18n-Abdeckung aller Frontend-Seiten** (`b92de2b`): Neue UI-Keys (`copiedHint`, `deleting` u. a.) in allen 15 Locales; Propagation-Skript für automatische Übersetzungsverteilung.
- **Link-Management-Paginate & Suche** (`b92de2b`): Paginierte Link-Verwaltung mit erweiterter Suche über Kurz- und Lang-URLs.
- **CORS-Konfiguration & Preflight-Handler** (`b92de2b`): CORS-Header auf allen API-Routen, OPTIONS-Handler für Preflight-Anfragen, konfigurierbare Origins-Richtlinie.

### Added

- **Phase 1 Bulk-Shortener**: Vollständige Stapelverarbeitung für bis zu 100 Links pro Batch, verfügbar über Dashboard-Seite `/dashboard/bulk` mit Tab-Navigation (Eingabe, Ergebnisse, CSV-Export). Kernmodule umfassen `lib/bulk-shortening.ts` mit `processBulkLinks`, `parseCSV` und `parseTextInput`. API-Route `POST /api/links/bulk` unterstützt CSV-Upload und Texteingabe, gibt Ergebnisse als JSON zurück und ermöglicht CSV-Export. UI-Komponenten zeigen Fortschrittsbalken, Erfolgs-/Fehlerrückmeldungen und prozeentuelle Fortschrittsanzeige. Sidebar-Navigationseintrag mit `Package`-Icon. 13 Unit-Tests in `app/api/links/bulk/route.test.ts`. Datenbanktabellen `batch_jobs` und `batch_links` mit Fortschrittsverfolgung und Status-Management.

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
