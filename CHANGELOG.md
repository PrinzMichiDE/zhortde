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

### Changed

- Das Passwortformular sendet Zugangsdaten per `POST /api/pastes/[slug]/unlock`; URLs, Browserhistorie und Referrer enthalten kein Paste-Passwort mehr.

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
