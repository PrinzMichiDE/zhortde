# Changelog

Alle wesentlichen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [Unreleased]

Seit dem Stand vom 2026-07-20 sind keine weiteren Änderungen dokumentiert.

## [2026-07-20]

### Security

- Kritischen Kontoübernahmeweg in der Passkey-Anmeldung geschlossen: WebAuthn-Challenges werden serverseitig gespeichert und einmalig verbraucht; die Sitzungsübergabe verwendet einen serverseitig ausgestellten, ausschließlich als SHA-256-Hash gespeicherten Einmal-Token mit zwei Minuten Gültigkeit statt des statischen Markers `authenticated`.
- Laufzeitabhängigkeiten und transitive Lockfile-Versionen sicherheitsorientiert aktualisiert, einschließlich `drizzle-orm` `0.45.2`. Der vollständige npm-Audit-Stand wurde von 21 Schwachstellen, davon 7 hoch, auf 9 moderate Schwachstellen reduziert.

### Added

- Vitest-Regressions-Harness und sieben Authentifizierungstests für Challenge-Ablauf und -Einmalverwendung, Token-Hashing, Zwei-Minuten-Ablauf, Einmalverwendung und Ablehnung des früheren statischen Passkey-Markers ergänzt.
- Idempotente Datenbankmigration `drizzle/0004_secure_passkey_auth.sql` mit vier additiven `ADD COLUMN IF NOT EXISTS`-Änderungen für Challenge- und Login-Token-Zustand ergänzt.

### Changed

- Passkey-Start-, Verify-, Client- und NextAuth-Fluss auf servergebundene Challenge und kurzlebigen Einmal-Login-Token umgestellt.
