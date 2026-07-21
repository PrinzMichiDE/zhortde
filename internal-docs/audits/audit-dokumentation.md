# Audit-Dokumentation – Daily Evolution 2026-07-20

## Einleitung

Dieses Dokument hält die technische Prüfung der Änderungen vom 2026-07-20 und 2026-07-21 nachvollziehbar fest. Prüfungsanlässe waren eine kritische Schwachstelle im Passkey-Anmeldeablauf und ein kritischer Vertraulichkeitsfehler bei passwortgeschützten Pastes. Im Paste-Basisstand genügte jeder nichtleere `password`-Queryparameter, um die Hauptansicht freizugeben; die Raw-Route lieferte geschützte und abgelaufene Inhalte ohne Passwort- beziehungsweise Ablaufprüfung aus.

Die Prüfung des aktuellen Paste-Changes basiert auf dem Branch `cursor/daily-evolution-pipeline-139f` bei technischem Commit `9cfdeea` und `origin/main` bei `3dc67e9`; die Passkey-Evidenz bleibt auf dem darin enthaltenen Stand `8611a8d`. Aussagen zur Produktion werden nur getroffen, wenn ein Nachweis vorliegt. Fehlende Betriebs-, Freigabe- oder Zuordnungsdaten sind als **klaerungsbeduerftige Information** gekennzeichnet und mit einer verantwortlichen Kontrolle versehen.

## Geltungsbereich

Geprüft wurden:

- der Passkey-Authentifizierungsfluss von der Challenge-Erzeugung bis zur NextAuth-Sitzung;
- der kanonische Dienst `lib/auth/passkey-auth-attempt.ts` für Challenge und Login-Token einschließlich paralleler Ceremonies, Ablaufzeit, Bereinigung bei jedem Start, Hashing und Einmalverwendung;
- die API-Routen für Start und Verifikation sowie die Client-Übergabe;
- das datenbankgestützte Startlimit `passkey_auth_start` mit zehn Anfragen pro Client-IP in fünf Minuten und die monotone Zähleraktualisierung per SQL `GREATEST`;
- Datenbankschema und Migration für die dedizierte Tabelle `passkey_auth_attempts` einschließlich der Indizes auf Challenge- und Token-Ablauf;
- die zwölf neu eingeführten Authentifizierungs-Regressionstests in drei Dateien einschließlich der NextAuth-Credentials-Grenze;
- den verpflichtenden Schema-Push im Upgrade und den fehlerschließenden Docker-Entrypoint;
- direkte und transitive npm-Abhängigkeiten anhand des Lockfiles und der npm-Advisory-Datenbank;
- die ursprünglichen Sicherheitscommits sowie die Architektur- und Reviewkorrekturen bis `8611a8d`.
- Paste-Hauptansicht, Raw-Route, neues Unlock-POST, kryptografischer Zugriffsnachweis, transaktional serialisiertes Fail-closed-Rate-Limit und 19 zugehörige Regressionstests bis `9cfdeea`.

Nicht als nachgewiesen gelten:

- Ausführung der Migration in Staging oder Produktion;
- produktive WebAuthn-End-to-End-Anmeldung mit realem Authenticator und realer PostgreSQL-Datenbank;
- reale PostgreSQL-Konkurrenzprüfung sowie ein Drizzle-Metadaten-Snapshot `drizzle/meta/0004_snapshot.json`;
- organisatorische Freigabe, Deploymentzeitpunkt oder namentliche Rollenbesetzung;
- Behebung der neun verbleibenden moderaten npm-Befunde.

Diese Punkte sind **klaerungsbeduerftige Information**. Der Change Owner muss vor einer Produktivfreigabe die Nachweise anfordern; Betrieb/Release muss Migrations- und Deploymentprotokolle liefern, Entwicklung und Security müssen die Freigabeentscheidung dokumentieren.

## Begriffe und Definitionen

| Begriff | Definition in dieser Prüfung |
|---|---|
| Passkey | WebAuthn-Credential, dessen Signatur serverseitig gegen Credential-ID, Public Key, RP-ID, Origin und Challenge geprüft wird. |
| Challenge | Servergenerierter WebAuthn-Wert, der in einer eigenen, über eine zufällige opake Ceremony-ID adressierten `passkey_auth_attempts`-Zeile fünf Minuten gültig ist. Er wird vor der WebAuthn-Prüfung nur gelesen und erst beim atomaren Abschluss genau eines Versuchs entfernt. |
| Login-Token | Nach erfolgreicher WebAuthn-Verifikation erzeugter, zufälliger 32-Byte-Wert in Base64url-Darstellung. In der Datenbank wird ausschließlich sein SHA-256-Hash für höchstens zwei Minuten gespeichert. |
| Einmalverwendung | Atomare Datenbankoperation: Der erfolgreiche Abschluss tauscht genau eine noch gültige Challenge gegen einen Token-Hash; NextAuth löscht beim erfolgreichen Tokenverbrauch genau die passende Attempt-Zeile. |
| Regressionstest | Automatisierter Test, der sicherheitsrelevante Eigenschaften des Attempt-Dienstes oder der NextAuth-Credentials-Grenze festschreibt. |
| Paste-Zugriffsnachweis | HMAC-SHA-256-signierter Wert aus Paste-Slug, aktuellem Passwort-Hash und Ablaufzeit. Er wird nach erfolgreichem bcrypt-Vergleich als HttpOnly-/SameSite-Lax-Cookie für maximal eine Stunde und nur auf dem Pfad des betroffenen Pastes ausgestellt. |
| Idempotente Migration | Im Drizzle-Journal registrierte SQL-Änderung, die `passkey_auth_attempts` mit `CREATE TABLE IF NOT EXISTS`, einem wiederholbar abgesicherten Fremdschlüssel und zwei Ablaufindizes anlegt; der zugehörige Snapshot `drizzle/meta/0004_snapshot.json` fehlt. |
| Abweichung | Festgestellte Lücke zwischen Prüfkriterium und vorhandenem Nachweis oder Implementierungsstand. |
| Nachweis | Reproduzierbarer Repository-Pfad, Commit, Diff oder protokolliertes Prüfergebnis. |

## Verantwortlichkeiten

Die Matrix beschreibt die für diesen Change erforderlichen Rollen. Eine namentliche Zuordnung und die tatsächlich erteilte Freigabe sind **klaerungsbeduerftige Information**. Kontrolle: Der Change Owner trägt Namen, Freigabezeitpunkt und Referenz auf das Freigabeartefakt vor Produktion in das Change-System ein; Security prüft die Vollständigkeit.

RACI: **R** = ausführend verantwortlich, **A** = rechenschaftspflichtig/freigebend, **C** = konsultiert, **I** = informiert.

| Aktivität | Change Owner | Entwicklung | Security/Revision | Betrieb/Release |
|---|---:|---:|---:|---:|
| Sicherheitsursache und Schutzanforderungen bewerten | A | R | R | I |
| Authentifizierungsänderung und Tests pflegen | A | R | C | I |
| Migration in Staging/Produktion ausführen und protokollieren | A | C | I | R |
| Abhängigkeitsbefunde bewerten | A | R | R | C |
| Freigabekriterien und Restabweichungen prüfen | A | C | R | C |
| Produktivsetzung und Rückfallentscheidung | A | C | C | R |
| Nachweise archivieren und Dokumente pflegen | A | R | C | R |

## Detailbeschreibung

### Prüfungsfragen und Kriterien

1. **Ist der frühere Kontoübernahmeweg geschlossen?** Kriterium: Der Credentials-Provider darf eine Passkey-Sitzung nicht allein anhand einer E-Mail-Adresse oder des statischen Markers `authenticated` erzeugen.
2. **Bleibt die WebAuthn-Challenge unter Serverkontrolle?** Kriterium: Challenge pro zufälliger opaker Ceremony-ID serverseitig speichern, parallele Versuche zulassen, maximal fünf Minuten akzeptieren, vor dem WebAuthn-Nachweis nicht verbrauchen und danach genau einen Versuch atomar abschließen; keine vom Client gelieferte Challenge als Vertrauensanker.
3. **Ist die Übergabe zur NextAuth-Sitzung gebunden und kurzlebig?** Kriterium: Token erst nach erfolgreicher WebAuthn-Prüfung ausstellen, kryptografisch zufällig erzeugen, nur gehasht speichern, an E-Mail und Hash binden, nach zwei Minuten ablehnen und atomar verbrauchen.
4. **Ist das Datenmodell wiederholbar erweiterbar?** Kriterium: dedizierte Attempt-Tabelle, `CREATE TABLE IF NOT EXISTS`, Fremdschlüssel, Ablaufindizes, Schema, SQL, Drizzle-Journal und Snapshot konsistent.
5. **Sind die zentralen Sicherheitsverträge automatisiert geprüft?** Kriterium: positiver Pfad, Ablauf, Einmalverwendung, Hashspeicherung und Ablehnung des alten statischen Markers.
6. **Wurden bekannte hoch eingestufte Abhängigkeitsbefunde reduziert?** Kriterium: reproduzierbarer Vergleich desselben Lockfile-Scopes vor und nach dem Upgrade.
7. **Sind Migration, End-to-End-Verhalten und Freigabe betrieblich nachgewiesen?** Kriterium: Staging-Protokoll, Schemaabfrage, realer Passkey-Smoke-Test, Freigabevermerk und Rückfallentscheidung.
8. **Bleiben geschützte oder abgelaufene Pastes über alle Darstellungen vertraulich?** Kriterium: Kein Passwort in URL/Query, serverseitiger bcrypt-Vergleich, gebundener und ablaufender HttpOnly-Nachweis, identische Haupt-/Raw-Kontrolle sowie begrenzte Fehlversuche.

### Stichprobe

- **Commit-Stichprobe:** 100 % der 13 Commits zwischen `origin/main` und `HEAD`.
- **Datei-Stichprobe:** 100 % der 27 auf aktuellem `HEAD` geänderten Pfade wurden über `git diff origin/main...HEAD` erfasst. Die sicherheitsrelevanten Implementierungs-, Test-, Schema-, Migrations- und Manifestdateien wurden inhaltlich geprüft.
- **Lockfile-Prüfung:** Wegen des Umfangs nicht zeilenweise, sondern vollständig durch `npm audit --json` gegen das jeweilige Lockfile ausgewertet.
- **Test-Stichprobe:** 100 % der vorhandenen Passkey-Regressionstests, drei Testdateien mit insgesamt zwölf Testfällen.
- **Betriebsstichprobe:** Keine Staging- oder Produktionsartefakte im Repository vorhanden; daher kein positiver Betriebsnachweis.

### Technische Änderung

- Die Start-API prüft vor der Challenge-Erzeugung das datenbankgestützte, nach Client-IP adressierte Limit `passkey_auth_start` von zehn Anfragen in fünf Minuten. Der Rate-Limit-Dienst arbeitet bei Datenbankfehler weiterhin fail open.
- `getAuthenticationOptions` löscht bei jedem Start abgelaufene Challenge- oder Token-Attempts und legt für `options.challenge` eine eigene `passkey_auth_attempts`-Zeile unter einer zufälligen opaken ID an. Die Start-API gibt diese als `ceremonyId` zusammen mit `options`, aber weder eine separate Challenge noch eine Benutzer-ID zurück; mehrere Ceremonies desselben Benutzers können parallel bestehen.
- `verifyAuthentication` liest die zur `ceremonyId` und zum Benutzer passende Challenge, ohne sie vor dem WebAuthn-Nachweis zu verbrauchen. Erst nach erfolgreicher Prüfung tauscht ein bedingtes `UPDATE ... RETURNING` genau diesen noch gültigen Versuch atomar gegen einen Login-Token-Hash.
- Nach erfolgreicher WebAuthn-Prüfung erzeugt die Verify-API einen zufälligen Login-Token. Der Client reicht genau diesen Wert an NextAuth weiter.
- Der Credentials-Provider ruft `consumePasskeyLoginToken` auf. Die Datenbankoperation verlangt den zur E-Mail gehörenden Benutzer, passenden SHA-256-Hash und ein Ablaufdatum in der Zukunft und löscht die passende Attempt-Zeile atomar mit `DELETE ... RETURNING`.
- Nach erfolgreicher Verifikation aktualisiert SQL den Authenticator-Zähler mit `GREATEST(gespeichert, neu)` monoton.
- Die Migration `drizzle/0004_secure_passkey_auth.sql` erstellt `passkey_auth_attempts` mit `CREATE TABLE IF NOT EXISTS`, Unique Constraint, Fremdschlüssel und Indizes auf `challenge_expires_at` und `login_token_expires_at`; `drizzle/meta/_journal.json` registriert `0004_secure_passkey_auth`, aber `drizzle/meta/0004_snapshot.json` fehlt.
- `scripts/upgrade.js` führt den Schema-Push verpflichtend aus. Der Docker-Entrypoint startet `server.js` nicht, wenn `scripts/ensure-database.js` fehlschlägt.
- `drizzle-orm` wurde von `0.44.7` auf `0.45.2` aktualisiert; das Lockfile wurde mit aktuellen transitiven Versionen neu aufgelöst.
- `POST /api/pastes/[slug]/unlock` validiert und begrenzt Passwortversuche, vergleicht den gespeicherten bcrypt-Hash und setzt nur bei Erfolg einen HMAC-signierten, auf Slug und Passwort-Hash gebundenen HttpOnly-Cookie. Haupt- und Raw-Ansicht akzeptieren keine URL-Passwörter mehr; beide prüfen den Nachweis, und die Raw-Route lehnt abgelaufene Inhalte mit HTTP 410 ab.

### Aktuelle Befunde, Abweichungen und Maßnahmen

| ID | Einstufung | Befund und Status | Nachweis | Maßnahme | Owner |
|---|---|---|---|---|---|
| F-01 | kritisch, technisch geschlossen | Der frühere statische Passkey-Marker autorisierte im Basisstand jeden vorhandenen Benutzer anhand der E-Mail-Adresse. Der aktuelle Code verlangt einen serverseitig ausgestellten, gültigen Einmal-Token. Auf Code-, Dienst- und gemockter NextAuth-Credentials-Grenze geschlossen; Produktionswirksamkeit noch nicht nachgewiesen. | Diff `origin/main...HEAD` in `lib/auth/config.ts`, `components/passkey-login.tsx`, `app/api/passkeys/authenticate/verify/route.ts`; Tests 12/12 grün. | Vor Produktion realen Passkey-Smoke-Test und Negativtest mit `authenticated` protokollieren. | Entwicklung (R), Security (A) |
| F-02 | hoch, technisch geschlossen | Die Challenge kam zuvor als Client-Eingabe zur Verify-API zurück. Jetzt liegt jeder Versuch fünf Minuten in einer eigenen, opak adressierten Zeile; Lesen verbraucht sie nicht, und erst ein erfolgreicher WebAuthn-Nachweis schließt genau einen Versuch atomar ab. | `lib/auth/passkey-auth-attempt.ts`, `lib/passkeys.ts`, Start-/Verify-Routen; vier Challenge-Tests. | Staging-Test mit realer PostgreSQL-Datenbank auf Parallelität, Ablauf und Wiederholung durchführen. | Entwicklung (R), Security (A) |
| F-03 | positiv | Login-Token werden mit `randomBytes(32)` erzeugt, als SHA-256-Hash gespeichert, nach zwei Minuten ungültig und durch atomare Löschung der passenden Attempt-Zeile verbraucht. | `lib/auth/passkey-auth-attempt.ts`; fünf Token-Tests und drei NextAuth-Credentials-Tests. | Eigenschaft bei künftigen Änderungen durch bestehende Tests erhalten. | Entwicklung |
| F-04 | positiv mit Restbefund | `npm audit --json` sank für das vollständige Lockfile von 21 Befunden (1 niedrig, 13 mittel, 7 hoch) auf 9 moderate Befunde; keine hohen oder kritischen Befunde verbleiben. | Vorheriges Lockfile aus `58c06b7^`; aktuelles `package-lock.json`; Auditläufe am 2026-07-20. | Neun moderate Befunde risikobasiert bewerten und in Folgeänderung behandeln. | Security (A), Entwicklung (R) |
| A-01 | mittel | `drizzle/0004_secure_passkey_auth.sql` erstellt Attempt-Tabelle und zwei Ablaufindizes idempotent und ist im Drizzle-Journal registriert. `drizzle/meta/0004_snapshot.json` fehlt; die tatsächliche Anwendung in Staging oder Produktion sowie die resultierende Tabellen-, Constraint-, Fremdschlüssel- und Indexstruktur sind weiterhin nicht belegt. | Migrationsdatei, `drizzle/meta/_journal.json`, fehlender Snapshot, `scripts/upgrade.js`, `scripts/push-schema.js`. | Vor Freigabe fehlenden Snapshot erzeugen oder Abweichung freigeben, `npm run upgrade` in Staging ausführen, Log archivieren und Tabelle, Unique Constraint, Fremdschlüssel sowie Indizes per Schemaabfrage bestätigen. | Betrieb/Release (R), Change Owner (A) |
| A-02 | mittel | Zwölf Tests in drei Dateien prüfen Dienstlogik mit In-Memory-Stores und die NextAuth-Credentials-Grenze mit Mock. API-Routen, atomare PostgreSQL-Operationen unter realer Konkurrenz und ein realer WebAuthn-Ablauf werden nicht integriert getestet. | `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts`, `lib/auth/config.test.ts`; Testausgabe 3 Dateien/12 Tests. | Vor Produktivfreigabe manuellen Staging-Smoke-Test und Negativtests protokollieren; Entwicklung ergänzt einen realen PostgreSQL-Parallelitäts-/Routen-Integrationstest. | Entwicklung (R), Security (A) |
| A-03 | mittel | Der Repository-Lintlauf ist nicht freigabefähig: `npm run lint` endet mit 17 Fehlern und 120 Warnungen als vorbestehende Baseline. Der separate Lauf über die geänderten ausführbaren Dateien endet mit 0 Fehlern und 5 Warnungen. | Lintläufe am 2026-07-20. | Verbleibende Baseline-Fehler gegen `origin/main` trennen und bereinigen oder eine dokumentierte Ausnahmeentscheidung treffen; geänderte Pfade weiterhin separat prüfen. | Entwicklung (R), Change Owner (A) |
| A-04 | offen | Staging-/Produktionsmigration, Deployment, Monitoring und formale Freigabe sind **klaerungsbeduerftige Information**. | Kein entsprechendes Artefakt im geprüften Repository oder Git-Verlauf. | Change Owner fordert Freigabevermerk an; Betrieb/Release archiviert Zeit, Umgebung, Commit-SHA, Migrationslog, Smoke-Test und Rückfallentscheidung. | Change Owner (A), Betrieb/Release (R) |
| F-05 | kritisch, technisch geschlossen | Passwortgeschützte Pastes waren durch jeden nichtleeren Querywert lesbar; die Raw-Route umging Passwort und Ablauf vollständig. Der aktuelle Code nutzt POST-basierten bcrypt-Nachweis und einen gebundenen HttpOnly-Zugriffscookie für Haupt- und Raw-Ansicht. Das Review identifizierte einen Parallelitäts- und Fail-open-Bypass des verwendeten Limits; `9cfdeea` serialisiert dasselbe Schlüsselpaar per PostgreSQL-Advisory-Lock und verweigert bei Speicherfehler mit HTTP 503. | Commits `83013a4`, `44daa90`, `9cfdeea`; vier Paste-Testdateien mit 16 Fällen und drei Rate-Limit-Fälle; vollständiger Lauf 8 Dateien/31 Tests. | Vor Produktion Browser-Smoke-Test, Cookie-Attribute, Proxy-/Access-Logs, realen PostgreSQL-Konkurrenzlauf und `NEXTAUTH_SECRET`-Bereitstellung prüfen; verbleibende Query-Secrets anderer Funktionen separat behandeln. | Entwicklung (R), Security (A), Betrieb/Release (C) |

### Gesamturteil

Die kritischen Passkey- und Paste-Ursachen sind im aktuellen Code schlüssig beseitigt. Der Paste-/Rate-Limit-Vertrag ist lokal mit 19 fokussierten Fällen sowie im vollständigen Lauf mit 31/31 Tests, TypeScript und geändertem Scope-Lint abgesichert. Eine uneingeschränkte Produktionsfreigabe lässt sich daraus nicht ableiten: Neben A-01 bis A-04 fehlen ein produktionsnaher Browser-/Cookie-/Proxy-Log-Nachweis, ein realer PostgreSQL-Konkurrenzlauf und die belegte Bereitstellung eines ausreichend starken `NEXTAUTH_SECRET`.

## Nachweise und Artefakte

| Nachweis | Pfad/Referenz | Prüfaussage |
|---|---|---|
| Basisstand | `origin/main` / `7e3b5fc` | Enthält statischen Clientmarker und E-Mail-only-Autorisierung im Passkey-Zweig. |
| Regressionstest-Commit | `5de8b5a` | Fügt Token-Regressionstests und Vitest-Skript hinzu. |
| Challenge-Vertragscommit | `ba1bf8c` | Fügt drei Challenge-Tests hinzu. |
| Sicherheitsfix | `daa2586` | Ändert API, Client, Auth-Provider, Dienste, Schema und Migration. |
| Testimport-Korrektur | `7ad82b5` | Korrigiert Datenbankimporte der neuen Dienste. |
| Abhängigkeitsfix | `58c06b7` | Aktualisiert `drizzle-orm` und das Lockfile. |
| Scope-Lint-Korrektur | `22f129c` | Entfernt den letzten Lintfehler aus dem geänderten Passkey-Client. |
| Reviewkorrekturen | `ddf3925` bis `8611a8d` | Vereinheitlichen Attempt-Dienst und Test-Fixture, isolieren konkurrierende Ceremonies, registrieren Migration `0004`, prüfen die konfigurierte NextAuth-Credentials-Grenze und härten Lifecycle sowie Deployment. |
| Passkey-Attempt-Dienst | `lib/auth/passkey-auth-attempt.ts` | Opake Ceremony-ID, fünf Minuten Challenge-Gültigkeit, atomarer Abschluss, SHA-256-Token-Hash, zwei Minuten Token-Gültigkeit und atomare Löschung. |
| Authentifizierungsfluss | `lib/passkeys.ts`, `lib/auth/config.ts`, `app/api/passkeys/authenticate/*`, `components/passkey-login.tsx` | Servergebundene parallele Ceremonies und Tokenübergabe. |
| Datenmodell | `lib/db/schema.ts`, `drizzle/0004_secure_passkey_auth.sql` | Dedizierte Tabelle `passkey_auth_attempts`; SQL mit `CREATE TABLE IF NOT EXISTS` und zwei Ablaufindizes. |
| Migrationsjournal | `drizzle/meta/_journal.json` | Registriert `0000` bis `0004`; `drizzle/meta/0004_snapshot.json` fehlt und operative Ausführung bleibt gemäß A-01 offen. |
| Testlauf | `npm test` am 2026-07-20 | 3 Testdateien und 12 Tests bestanden. |
| Audit vorher | `npm audit --json --package-lock-only` auf `58c06b7^` | 21 Befunde: 1 niedrig, 13 mittel, 7 hoch, 0 kritisch. |
| Audit nachher | `npm audit --json` auf `58c06b7` | 9 Befunde: 9 mittel, 0 hoch, 0 kritisch. |
| Lintlauf | `npm run lint` am 2026-07-20 | Repositoryweit fehlgeschlagen mit 17 Fehlern und 120 Warnungen (vorbestehende Baseline); Lint der geänderten ausführbaren Dateien mit 0 Fehlern und 5 Warnungen. |
| Build | `npm run build` am 2026-07-20 | Lokaler Next.js-Produktionsbuild bestanden; Datenbank-Upgrade mangels `DATABASE_URL` kontrolliert übersprungen, daher kein Migrations- oder Produktionsnachweis. |
| Änderungsübersicht | `git diff --name-status origin/main...HEAD` | 30 geänderte Pfade einschliesslich Compliance-, Audit- und Architekturartefakten. |
| Paste-Regressionsnachweis | Commits `83013a4`, `44daa90`, `9cfdeea`; vier Paste-Testdateien und `lib/rate-limit.test.ts` | Belegt Ablehnung ohne Nachweis und bei Ablauf, Nichtakzeptanz von URL-Passwörtern, korrektes Unlock, Cookie-Attribute, Manipulations-/Bindungs-/Ablaufprüfung, 5-von-20-Serialisierung im Transaktionsmock und Fail-closed-Speicherfehler. Kein Live-PostgreSQL-Nachweis. |
| Aktueller Test- und Qualitätslauf | `npm test`, `npx tsc --noEmit -p tsconfig.json`, Scope-ESLint am 2026-07-21 | 8 Dateien/31 Tests bestanden; TypeScript und alle geänderten ausführbaren Dateien ohne Fehler. |
| Aktueller SCA-Lauf | `npm audit --audit-level=moderate --json` am 2026-07-21 | 9 moderate, 0 hohe, 0 kritische Befunde; unveränderter dokumentierter Reststand. |

Die npm-Advisory-Datenbank ist zeitabhängig. Für spätere Audits müssen Datum, Commit-SHA, npm-Version und vollständige JSON-Ausgabe gemeinsam archiviert werden. Die hier aufgeführten Zahlen wurden am 2026-07-20 reproduziert.

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Umgehung der Passkey-Prüfung durch statischen Marker | Kontoübernahme und unberechtigter Zugriff | Vor Fix hoch; nach Codefix niedrig, solange neuer Pfad aktiv ist | Nur serverseitig ausgestellten Einmal-Token akzeptieren | Negativtest für `authenticated`, Tokenprüfung im Credentials-Provider | `lib/auth/config.ts`, Token-Test |
| Manipulierte, wiederverwendete oder konkurrierende Challenge | Replay, Verwechslung paralleler Ceremonies oder Prüfung gegen angreifergesteuerten Wert | Niedrig nach Implementierung, betrieblich unbestätigt | Challenge je opaker Ceremony-ID serverseitig speichern, Starts auf 10/5 Minuten begrenzen, bei jedem Start abgelaufene Attempts löschen, fünf Minuten begrenzen, vor Beweis nur lesen und genau einen Versuch atomar abschließen | Vier Challenge-Tests plus realer PostgreSQL-Parallelitäts-/Staging-Negativtest | `lib/auth/passkey-auth-attempt.ts`, `lib/rate-limit.ts`; A-02 |
| Diebstahl eines Login-Tokens aus der Datenbank | Sitzungserstellung für fremdes Konto | Niedrig | Nur SHA-256-Hash speichern, Gültigkeit auf zwei Minuten begrenzen | Prüfung auf Benutzer, Hash, Ablauf und atomare Zeilenlöschung | `lib/auth/passkey-auth-attempt.ts`, fünf Token- und drei NextAuth-Tests |
| Migration nicht angewendet | Passkey-Anmeldung schlägt zur Laufzeit wegen fehlender Tabelle fehl | Mittel | Upgrade in Staging und Produktion vor Anwendungscode ausführen | Release-Gate prüft Upgrade-Log und Tabellen-/Constraint-Abfrage | Abweichung A-01; `scripts/upgrade.js` |
| Journalisierte Migration operativ nicht verifiziert; `0004`-Snapshot fehlt | Repository-Kontrolle und Drizzle-Metadaten können vom tatsächlichen Zielschemazustand abweichen | Mittel | Snapshotabweichung auflösen und registrierte Migration über den verbindlichen Upgradepfad ausführen und protokollieren | Change Owner verweigert Freigabe ohne vollständige Metadatenentscheidung, Migrations- und Schema-Nachweis | `drizzle/meta/_journal.json`, fehlende `drizzle/meta/0004_snapshot.json`, Migration `0004`; A-01 |
| Fehlende reale Datenbank- und End-to-End-Abdeckung | Integrations- oder Konkurrenzfehler bleiben trotz grüner Unit-/Boundary-Tests unentdeckt | Mittel | Realen PostgreSQL-Parallelitätstest sowie Staging-Passkey-Ablauf und Negativfälle ausführen | Security zeichnet Ergebnisse gegen Commit-SHA ab | Abweichung A-02 |
| Verbleibende moderate npm-Befunde | DoS, XSS oder Entwicklungsserver-Risiken abhängig von tatsächlicher Nutzung | Mittel | Befunde risikobasiert bewerten und sichere Upgrades planen | Wiederkehrender `npm audit --json`; keine hohen/kritischen Befunde als Release-Gate | Aktuelles Audit: 9 moderate |
| Rücksetzen auf den unsicheren Auth-Stand | Erneute kritische Kontoübernahme | Niedrig bei kontrolliertem Release | Sicherheitsfix nicht auf alten statischen Marker zurückrollen; bei Störung Deployment stoppen und sichere Vorversion ohne exponierten Passkey-Zweig wählen | Security muss jeden Auth-Rückfall freigeben | Basisdiff und F-01 |
| Ungeklärte Freigabe- und Betriebsrollen | Änderungen ohne nachweisbare Genehmigung oder Überwachung | Mittel | Namentliche RACI-Zuordnung vor Produktivsetzung | Change Owner archiviert Freigabe- und Deploymentartefakt | **klaerungsbeduerftige Information**, A-04 |
| Paste-Zugriffsnachweis oder Versuchslimit wird falsch gebunden, gefälscht, parallel umgangen oder nach Passwortänderung weiter akzeptiert | Offenlegung vertraulicher Inhalte | Niedrig nach Codefix, produktiv unbestätigt | HMAC an Slug, aktuellen Passwort-Hash und Ablauf binden; Cookieattribute setzen; Versuchslimit per PostgreSQL-Advisory-Lock serialisieren und Speicherfehler fail-closed behandeln | 19 Regressionstests plus produktionsnaher Browser-/Cookie-/Live-DB-Smoke-Test | `lib/paste-access.ts`, `lib/rate-limit.ts`, Paste-Routen; F-05 |

## Pflegeprozess

1. Entwicklung aktualisiert dieses Dokument bei Änderungen am Passkey-Attempt-, NextAuth- oder Migrationsfluss und verlinkt die betroffenen Commits.
2. Security wiederholt `npm test` und `npm audit --json`, prüft die Schutzkriterien und dokumentiert neue Abweichungen mit ID, Owner und Fälligkeit im Change-System.
3. Betrieb/Release führt vor jeder betroffenen Produktivsetzung `npm run upgrade` gemäß Repository-Regel aus und archiviert Umgebung, Commit-SHA, Zeitstempel, Ausgabe und Schemaabfrage.
4. Der Change Owner prüft vor Freigabe, dass A-01 bis A-04 entweder geschlossen oder mit einer expliziten, befristeten Risikoakzeptanz versehen sind. Eine solche Akzeptanz liegt derzeit nicht vor und ist **klaerungsbeduerftige Information**.
5. Nach der Produktivsetzung werden erfolgreicher Passkey-Login, Ablehnung eines ungültigen Tokens und relevante Auth-Fehler protokolliert geprüft. Konkrete Monitoring-Schwellen und Aufbewahrungsfristen sind **klaerungsbeduerftige Information**; Betrieb/Release definiert sie, Security genehmigt sie und der Change Owner kontrolliert die Ablage.
6. Bei Widersprüchen haben reproduzierbare Git-, Test-, Audit- und Betriebsartefakte Vorrang vor narrativen Aussagen; das Dokument wird entsprechend korrigiert.

## Revisionshistorie

| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Erstfassung mit Scope, Kriterien, Stichprobe, Evidenz, Befunden A-01 bis A-04 und Freigabekontrollen | Daily Evolution: kritischer Passkey-Sicherheitsfix, Regressionstests, Migration und Abhängigkeitsaktualisierung |
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Architektur nach Reviewkorrekturen auf dedizierte Attempt-Zeilen, damaligen Teststand und registrierte Migration `0004` aktualisiert; operative Migration und reale DB-/WebAuthn-Prüfung bleiben offen | Reviewfixes bis Commit `6618792` |
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Auf 12 Tests/3 Dateien, Startlimit 10/5 Minuten, Purge bei jedem Start, Ablaufindizes, monotone Zähler und fehlerschließenden Schema-Bootstrap aktualisiert; reale DB-/WebAuthn-/Staging-Prüfung und `0004_snapshot.json` bleiben offen | Finales Hardening bis Commit `8611a8d` |
| 2026-07-21 | Technische Dokumentation / automatisierte Revision | Kritischen Paste-Passwort- und Raw-/Ablauf-Bypass als F-05 aufgenommen; Reviewbefunde zu Parallelität und Fail-open mit Advisory-Lock/HTTP 503 geschlossen und 19 Regressionstests dokumentiert; produktiver Browser-/Cookie-/Proxy-/Live-DB-Nachweis bleibt offen | Daily Evolution bis Commit `9cfdeea` |
