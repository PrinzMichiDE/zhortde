# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [Unreleased]

Seit dem Stand vom 2026-07-20 sind keine weiteren Änderungen dokumentiert.

## [2026-07-20]

### Security

- Kritischen Kontoübernahmeweg in der Passkey-Anmeldung geschlossen: Parallele WebAuthn-Ceremonies werden in eigenen `passkey_auth_attempts`-Zeilen unter zufälligen, opaken Ceremony-IDs geführt. Die Challenge bleibt bis zur erfolgreichen WebAuthn-Prüfung lesbar; anschließend wird genau ein Versuch atomar abgeschlossen und ein serverseitig ausgestellter, ausschließlich als SHA-256-Hash gespeicherter Einmal-Token mit zwei Minuten Gültigkeit statt des statischen Markers `authenticated` ausgegeben.
- Laufzeitabhängigkeiten und transitive Lockfile-Versionen sicherheitsorientiert aktualisiert, einschließlich `drizzle-orm` `0.45.2`. Der vollständige npm-Audit-Stand wurde von 21 Schwachstellen, davon 7 hoch, auf 9 moderate Schwachstellen reduziert.

### Added

- Vitest-Regressions-Harness und zehn Authentifizierungstests in drei Dateien für parallele Challenges, Ablauf und Abschluss, Token-Hashing, Zwei-Minuten-Ablauf, Einmalverwendung, Ablehnung des früheren statischen Passkey-Markers und die NextAuth-Credentials-Grenze ergänzt.
- Idempotente und im Drizzle-Journal registrierte Datenbankmigration `drizzle/0004_secure_passkey_auth.sql` mit `CREATE TABLE IF NOT EXISTS` für den dedizierten Challenge- und Login-Token-Zustand in `passkey_auth_attempts` ergänzt.

### Changed

- Passkey-Start-, Verify-, Client- und NextAuth-Fluss auf eine opake `ceremonyId`, konkurrierende Authentifizierungsversuche und das atomare Löschen der passenden Attempt-Zeile beim Tokenverbrauch umgestellt.
