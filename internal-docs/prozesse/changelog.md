# Interner Änderungsnachweis – Daily Evolution 2026-07-20 bis 2026-07-21

## Einleitung

Dieser Änderungsnachweis beschreibt Anlass, Umsetzung, Auswirkung, Prüfung, Freigabebedingungen und Rückfallvorgehen der Daily Evolutions vom 2026-07-20 und 2026-07-21. Maßgeblicher technischer Stand des aktuellen Paste-Changes ist Commit `9cfdeea` auf `cursor/daily-evolution-pipeline-139f`; Vergleichsbasis ist `origin/main` bei `3dc67e9`, das die Passkey-Änderungen vom Vortag bereits enthält.

Die Changes beseitigen einen kritischen Kontoübernahmeweg in der Passkey-Anmeldung und einen kritischen Vertraulichkeitsfehler bei passwortgeschützten Pastes. Der aktuelle Paste-Change ersetzt URL-Passwörter durch ein begrenztes Unlock-POST und einen gebundenen HttpOnly-Zugriffsnachweis, vereinheitlicht Haupt-/Raw-/Ablaufkontrollen und erweitert die Suite um 19 auf 31 Tests. Nicht belegte Freigabe- und Betriebsangaben werden als **klaerungsbeduerftige Information** behandelt und erhalten eine verantwortliche Kontrolle.

## Geltungsbereich

Im Change enthalten sind:

- Passkey-Start und -Verifikation unter `app/api/passkeys/authenticate/`;
- Passkey-Clientfluss in `components/passkey-login.tsx`;
- NextAuth-Credentials-Provider in `lib/auth/config.ts`;
- WebAuthn-Verifikation in `lib/passkeys.ts`;
- kanonischer Dienst `lib/auth/passkey-auth-attempt.ts` für Challenge, Abschluss und Tokenverbrauch; die früheren getrennten Challenge- und Token-Dienste entfallen;
- zwölf Tests in drei `*.test.ts`-Dateien einschließlich der NextAuth-Credentials-Grenze und das neue npm-Skript `test`;
- neue Tabelle `passkey_auth_attempts` mit Challenge- und Token-Ablaufindizes im Drizzle-Schema und in der journalisierten Migration `drizzle/0004_secure_passkey_auth.sql`; die vier Passkey-Zustandsspalten in `users` entfallen;
- datenbankgestütztes Startlimit `passkey_auth_start` mit zehn Anfragen je Client-IP und fünf Minuten, Bereinigung abgelaufener Attempts bei jedem Start sowie monotone Zähleraktualisierung über SQL `GREATEST`;
- verpflichtender Schema-Push in `scripts/upgrade.js` und verweigerter Containerstart bei fehlgeschlagenem Schema-Bootstrap;
- `package.json` und `package-lock.json`, insbesondere `drizzle-orm` `0.45.2`.
- Paste-Anzeige und Raw-Route unter `app/p/[slug]/`, Passwortformular unter `app/protected/paste/[slug]/`, neues Unlock-POST unter `app/api/pastes/[slug]/unlock`, HMAC-Nachweise in `lib/paste-access.ts` und das Limit `access_protected_paste`;
- 16 Paste-Regressionsfälle in vier Testdateien sowie drei Rate-Limit-Vertragsfälle; vollständige Suite 31 Tests in acht Dateien.

Nicht enthalten sind funktionale Änderungen an Link-Passwörtern, Passwortfreigaben, SSO oder Passkey-Registrierung. Ebenfalls nicht nachgewiesen sind Staging-/Produktivmigration, Deployment, realer Authenticator-Test, produktionsnaher Paste-Browser-/Cookie-/Proxy-Log-Test und formale Freigabe. Diese Angaben sind **klaerungsbeduerftige Information**; Change Owner und Betrieb/Release müssen sie vor der Produktivsetzung schließen.

## Begriffe und Definitionen

| Begriff | Bedeutung |
|---|---|
| Daily Evolution | Die zusammengehörigen Sicherheits-, Dokumentations- und Reviewcommits bis `8611a8d` vom 2026-07-20. |
| Challenge | Kurzlebiger, serverseitig in einer eigenen Attempt-Zeile gespeicherter WebAuthn-Prüfwert mit fünf Minuten Gültigkeit, adressiert durch eine zufällige opake Ceremony-ID. |
| Passkey-Login-Token | Nach erfolgreicher WebAuthn-Prüfung ausgegebener Zufallswert; serverseitig nur als SHA-256-Hash für zwei Minuten gespeichert. |
| Single Use | Ein erfolgreicher WebAuthn-Nachweis schließt genau einen Attempt atomar ab; NextAuth löscht beim Tokenverbrauch genau die passende Attempt-Zeile. Wiederverwendung wird abgelehnt. |
| Laufzeitabhängigkeit | Paket aus `dependencies` oder dessen transitive Abhängigkeit, die im installierten Produktionsgraphen vorkommen kann. |
| Rollback | Kontrollierte Rückkehr auf einen nachweislich sicheren Anwendungsstand; kein Rücksetzen auf einen Stand mit bekannter kritischer Schwachstelle. |
| Freigabenachweis | Referenzierbares Artefakt mit Commit-SHA, Umgebung, Prüfergebnis, freigebender Rolle und Zeitpunkt. |
| Paste-Zugriffsnachweis | Maximal eine Stunde gültiger HMAC-SHA-256-Wert, gebunden an Paste-Slug, aktuellen Passwort-Hash und Ablauf; Transport als HttpOnly-/SameSite-Lax-Cookie auf dem Paste-Pfad. |

## Verantwortlichkeiten

Die Rollen sind für den Change verbindlich als Funktionsrollen beschrieben. Namentliche Besetzung und tatsächlich erfolgte Genehmigungen sind **klaerungsbeduerftige Information**. Kontrolle: Der Change Owner dokumentiert die Namen und Freigabereferenzen; Security prüft diese Angaben vor Produktion.

RACI: **R** = ausführend verantwortlich, **A** = rechenschaftspflichtig/freigebend, **C** = konsultiert, **I** = informiert.

| Änderungsaktivität | Change Owner | Entwicklung | Security | Betrieb/Release |
|---|---:|---:|---:|---:|
| Sicherheitsanforderung und Priorität festlegen | A | C | R | I |
| Code, Migration und Tests erstellen | A | R | C | C |
| Testergebnisse und Dependency-Audit bewerten | A | R | R | I |
| Stagingmigration und Smoke-Test durchführen | A | C | C | R |
| Produktivfreigabe erteilen | A | C | R | C |
| Deployment und Rückfall ausführen | A | C | C | R |
| Änderungs- und Betriebsnachweise archivieren | A | R | C | R |

## Detailbeschreibung

### Änderungsübersicht mit Begründung und Wirkung

| Änderung | Begründung | Auswirkung | Komponenten |
|---|---|---|---|
| Servergespeicherte Passkey-Challenge | Die bisher vom Client zurückgesendete Challenge war kein belastbarer serverseitiger Vertrauensanker; ein einzelner Zustand am Benutzer würde konkurrierende Anmeldungen überschreiben. | Jeder Start wird je Client-IP datenbankgestützt auf zehn Anfragen in fünf Minuten begrenzt, löscht abgelaufene Attempts und legt eine eigene fünf Minuten gültige Attempt-Zeile unter einer zufälligen opaken `ceremonyId` an. Lesen vor der WebAuthn-Prüfung verbraucht die Challenge nicht; erst danach schließt ein bedingtes Update genau einen Attempt atomar ab. | `lib/rate-limit.ts`, `lib/passkeys.ts`, `lib/auth/passkey-auth-attempt.ts`, beide Auth-API-Routen, `components/passkey-login.tsx` |
| Gehashter Einmal-Login-Token | Der frühere statische Marker `authenticated` erlaubte dem Credentials-Provider die Anmeldung allein anhand einer vorhandenen E-Mail-Adresse. | Verify stellt nach erfolgreichem WebAuthn einen zufälligen 32-Byte-Token aus und speichert nur dessen Hash für zwei Minuten in derselben Attempt-Zeile. NextAuth akzeptiert nur Benutzer, Hash und nicht abgelaufene Frist und löscht die passende Zeile atomar. | `lib/auth/passkey-auth-attempt.ts`, `lib/auth/config.ts`, Verify-Route, Passkey-Client |
| Regressionstest-Harness | Sicherheitsverträge mussten reproduzierbar gegen Rückfälle geschützt werden. | Neues `npm test` über Vitest; zwölf Tests in drei Dateien prüfen getrennte parallele Challenges, Lesen vor Beweis, Bindung, Ablauf und Startbereinigung, atomaren Abschluss, Token-Hashing, statischen Altmarker, Einmaligkeit und die NextAuth-Credentials-Grenze. | `package.json`, `package-lock.json`, `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts`, `lib/auth/config.test.ts` |
| Dedizierte Datenbankänderung | Challenge und Token benötigen serverseitige, benutzergebundene Persistenz, ohne konkurrierende Ceremonies in einer Benutzerzeile zu vermischen. | `CREATE TABLE IF NOT EXISTS` legt `passkey_auth_attempts` mit opaker Primär-ID, Benutzer-Fremdschlüssel, Challenge-/Token-Feldern, Unique Constraint für Token-Hashes und Indizes auf beide Ablaufspalten an. Migration `0004` ist im Drizzle-Journal registriert; `drizzle/meta/0004_snapshot.json` fehlt weiterhin. | `lib/db/schema.ts`, `drizzle/0004_secure_passkey_auth.sql`, `drizzle/meta/_journal.json` |
| Monotone Authenticator-Zähler | Parallele erfolgreiche Prüfungen dürfen einen bereits höheren gespeicherten Signaturzähler nicht zurücksetzen. | Das Zähler-Update schreibt per SQL `GREATEST` nur den höheren Wert und aktualisiert zugleich `last_used_at`. | `lib/passkeys.ts` |
| Fehlerschließender Schema-Bootstrap | Ein optionaler Schema-Push oder Weiterstart nach Bootstrapfehler kann inkompatiblen Anwendungscode starten. | `scripts/upgrade.js` führt `npm run db:push` verpflichtend aus; `scripts/docker-entrypoint.js` beendet den Container vor `server.js`, wenn `ensure-database.js` fehlschlägt. | `scripts/upgrade.js`, `scripts/docker-entrypoint.js` |
| Sicherheitsaktualisierung der Abhängigkeiten | Der vorherige Lockfile-Stand enthielt bekannte hohe Befunde, darunter `drizzle-orm` vor dem SQL-Identifier-Fix. | `drizzle-orm` wurde von `0.44.7` auf `0.45.2` angehoben und der Abhängigkeitsgraph neu aufgelöst. Der vollständige npm-Audit-Stand sank von 21 Befunden, davon 7 hoch, auf 9 moderate Befunde. | `package.json`, `package-lock.json` |
| Paste-Passwort- und Raw-Bypass | Die Hauptansicht akzeptierte jeden nichtleeren Querywert; die Raw-Route prüfte weder Passwort noch Ablauf und konnte vertrauliche Inhalte offenlegen. | Passwort nur noch per Unlock-POST; bcrypt-Prüfung, 5 Versuche je IP/Paste in 15 Minuten, HMAC-Nachweis an Slug/Hash/Ablauf, HttpOnly-/SameSite-/Secure-/Pfadattribute, identische Haupt-/Raw-Prüfung und HTTP 410 bei Ablauf. Gleichzeitige Versuche desselben Schlüssels werden in einer PostgreSQL-Transaktion per Advisory Lock serialisiert; Speicherfehler führen beim Paste-Unlock zu HTTP 503. | Paste-Seiten/-Routen, `lib/paste-access.ts`, `lib/rate-limit.ts` |
| Paste- und Rate-Limit-Regressionstests | Die Schwachstelle, kryptografische Bindung sowie Konkurrenz- und Ausfallverhalten benötigten reproduzierbare Negativ- und Positivnachweise. | 16 Paste-Tests prüfen URL-Bypass, Raw-Verweigerung, Ablauf, gültigen Zugriff, falsches Passwort, HTTP 503, Cookie-Attribute, Manipulation, Bindung und Tokenablauf; drei Rate-Limit-Tests prüfen 5-von-20-Serialisierung sowie Fail-closed/-open-Policy. Vollständige Suite 31/31 grün. | Vier Paste-Testdateien und `lib/rate-limit.test.ts` |

### Schnittstellenänderungen

- `POST /api/passkeys/authenticate/start` liefert `options` und die zufällige opake `ceremonyId`, aber keine separate `challenge` oder `userId`.
- `POST /api/passkeys/authenticate/verify` akzeptiert `email`, `response` und `ceremonyId`, aber keine Client-Challenge.
- Die Verify-Antwort enthält nach erfolgreicher Prüfung `loginToken`.
- Der NextAuth-Credentials-Aufruf verwendet den ausgegebenen `loginToken` anstelle von `authenticated`.
- Das Benutzerschema enthält keine Passkey-Challenge-/Login-Token-Spalten; dieser Zustand liegt ausschließlich in `passkey_auth_attempts`.
- `POST /api/pastes/[slug]/unlock` akzeptiert das Paste-Passwort im JSON-Body und liefert nur Erfolg plus Zielpfad; der Zugriffsnachweis liegt ausschließlich im HttpOnly-Cookie.
- `/p/[slug]` ignoriert frühere `password`-Querywerte; `/p/[slug]/raw` verlangt denselben Nachweis und antwortet bei Ablauf mit HTTP 410.

### Test- und Prüfergebnisse

| Prüfung | Ergebnis vom 2026-07-20 | Bewertung |
|---|---|---|
| `npm test` | Bestanden: 3 Testdateien, 12 Tests, 0 Fehler | Fokussierte Dienst- und NextAuth-Boundary-Regressionstests einschließlich Attempt-Bereinigung erfolgreich. |
| `npm audit --json --package-lock-only` auf `58c06b7^` | 21 Befunde: 1 niedrig, 13 mittel, 7 hoch, 0 kritisch | Reproduzierte Ausgangslage des vollständigen Lockfiles. |
| `npm audit --json` auf `58c06b7` | 9 Befunde: 9 mittel, 0 hoch, 0 kritisch | Hohe Befunde im aktuellen Graphen beseitigt; moderate Restbefunde offen. |
| `npm run lint` am 2026-07-21 | Fehlgeschlagen: 17 Fehler, 119 Warnungen als vorbestehende Baseline; der Lauf über die geänderten ausführbaren Dateien hat 0 Fehler und 0 Warnungen | Kein grünes repositoryweites Lint-Gate; der geänderte ausführbare Scope ist fehlerfrei, die Baseline-Schulden benötigen weiterhin eine Freigabeentscheidung. |
| Stagingmigration | **klaerungsbeduerftige Information** | Betrieb/Release muss `npm run upgrade`, Log und Schemaabfrage nachweisen. |
| WebAuthn-/NextAuth-End-to-End-Test | **klaerungsbeduerftige Information** | Entwicklung führt gemeinsam mit Betrieb einen realen Staging-Smoke-Test aus; Security zeichnet ab. |
| `npm run build` | Lokal bestanden; Datenbank-Upgrade wurde mangels `DATABASE_URL` kontrolliert übersprungen | Kompilierung, TypeScript, Seitengenerierung und Bundle erfolgreich; damit sind weder Schema-Push noch Stagingmigration nachgewiesen. |
| `npm test` am 2026-07-21 | Bestanden: 8 Testdateien, 31 Tests, 0 Fehler | 16 Paste-, drei Rate-Limit- und zwölf bestehende Passkey-Vertragsfälle erfolgreich. |
| `npx tsc --noEmit -p tsconfig.json` und Scope-ESLint am 2026-07-21 | Bestanden, 0 Fehler | TypeScript und alle am Paste-Change geänderten ausführbaren Dateien fehlerfrei. |
| `npm audit --audit-level=moderate --json` am 2026-07-21 | 9 moderate, 0 hohe, 0 kritische Befunde | Unveränderter Reststand; keine automatische unsichere Downgrade-/Force-Fix-Maßnahme. |
| Formale Genehmigung | **klaerungsbeduerftige Information** | Change Owner erfasst Freigaberolle, Zeitpunkt und Artefaktreferenz. |

Die Diensttestdateien verwenden In-Memory-Stores; der NextAuth-Test mockt den kanonischen Verbrauchsdienst. Sie belegen Dienstverträge und die Credentials-Verkabelung, aber nicht PostgreSQL-Atomizität unter realer Konkurrenz, die API-Routen oder einen realen Authenticator. Diese Einschränkung ist Bestandteil der Freigabekontrolle.

### Freigabekriterien

Vor Produktion müssen alle folgenden Punkte erfüllt und gegen Commit `8611a8d` oder einen nachfolgenden, inhaltlich geprüften Commit referenziert sein:

1. `npm test` ist ohne Fehler abgeschlossen.
2. `npm audit --json` weist keine hohen oder kritischen Befunde aus; die neun moderaten Restbefunde sind durch Security akzeptiert oder einer Folgeänderung zugeordnet.
3. `npm run upgrade` wurde in Staging ausgeführt; Tabelle `passkey_auth_attempts`, Unique Constraint, Fremdschlüssel und beide Ablaufindizes wurden per Schemaabfrage bestätigt; der fehlende Drizzle-Snapshot `drizzle/meta/0004_snapshot.json` wurde erzeugt oder als bewusstes, freigegebenes Residuum dokumentiert.
4. Ein realer Passkey-Login sowie konkurrierende Ceremonies gegen PostgreSQL sind erfolgreich; `authenticated`, ein falscher Token, ein wiederverwendeter Token und ein abgelaufener Token werden abgelehnt.
5. Der Build ist erfolgreich und das Lint-Ergebnis ist bereinigt oder durch den Change Owner mit Security-Ausnahme dokumentiert.
6. Deployment-, Monitoring- und namentliche RACI-Angaben liegen als Freigabenachweis vor.

Der aktuelle Repository-Nachweis erfüllt Punkt 1 und die technische Messung aus Punkt 2. Die übrigen Freigabepunkte sind ganz oder teilweise **klaerungsbeduerftige Information** und dürfen nicht stillschweigend als erfüllt gelten.

### Rollback-Leitlinie

- Ein Rücksetzen auf `origin/main`/`7e3b5fc` ist kein zulässiger Sicherheitsrollback, weil dadurch der kritische statische Passkey-Marker wieder aktiv würde.
- Vor Deployment muss Betrieb/Release ein sicheres Rückfallartefakt festlegen, das den neuen Authentifizierungsvertrag beibehält. Ob ein solches Artefakt oder eine betriebliche Möglichkeit zur temporären Deaktivierung der Passkey-Anmeldung existiert, ist **klaerungsbeduerftige Information**. Kontrolle: Betrieb/Release dokumentiert Ziel-Commit und technische Sperrmaßnahme; Security genehmigt sie.
- Die neue Tabelle ist additiv. Bei einem Anwendungsrollback soll sie zunächst bestehen bleiben; ein destruktives Entfernen benötigt einen eigenen genehmigten Datenbankchange und einen Datensicherungsnachweis.
- Ein isoliertes Zurücksetzen des Lockfiles würde bekannte hohe Befunde wieder einführen und benötigt deshalb eine ausdrückliche Security-Freigabe. Standardvorgehen ist Vorwärtskorrektur auf einem sicheren Abhängigkeitsstand.
- Rückfallauslöser, Entscheidungszeit, ausführende Rolle, Ziel-Commit, Datenbankzustand und anschließender Smoke-Test sind im Change-System zu protokollieren.

## Nachweise und Artefakte

| Artefakt | Referenz | Inhalt |
|---|---|---|
| Git-Vergleich | `git diff origin/main...8611a8d` | Vollständige technische und dokumentarische Änderung auf aktuellem HEAD. |
| Token-Testcommit | `5de8b5a` | Vier Token-Regressionsfälle und Test-Harness. |
| Challenge-Testcommit | `ba1bf8c` | Drei Challenge-Regressionsfälle. |
| Authentifizierungsfix | `daa2586` | Serverchallenge, Einmal-Token, API-/Client-/Provider-Anpassung, Schema und Migration. |
| Importkorrektur | `7ad82b5` | Lauffähige Datenbankimporte in beiden Diensten. |
| Dependency-Upgrade | `58c06b7` | `drizzle-orm` `0.45.2` und aktualisiertes Lockfile. |
| Reviewkorrekturen | `ddf3925` bis `8611a8d` | Dedizierter Attempt-Dienst, parallele Ceremonies, journalisierte Migration, NextAuth-Credentials-Boundary-Test und finales Lifecycle-/Deployment-Hardening. |
| Paste-Regression und Fix | `83013a4`, `44daa90`, `9cfdeea` | Reproduziert Raw-/Ablauf-Bypass und implementiert Unlock-POST, HMAC-Cookie, Rate-Limit, Haupt-/Raw-Kontrolle, transaktionale Serialisierung, Fail-closed-Policy und 19 neue Tests. |
| Migration | `drizzle/0004_secure_passkey_auth.sql`, `drizzle/meta/_journal.json` | Idempotentes `CREATE TABLE IF NOT EXISTS`, zwei Ablaufindizes und registrierter Journal-Eintrag `0004`; `drizzle/meta/0004_snapshot.json` fehlt. |
| Schema | `lib/db/schema.ts` | Drizzle-Abbildung von `passkey_auth_attempts`; keine vier Passkey-Zustandsspalten in `users`. |
| Regressionstests | Passkey-Tests unter `lib/auth/`, vier Paste-Testdateien unter `app/api/pastes/`, `app/p/` und `lib/` sowie `lib/rate-limit.test.ts` | Acht Dateien und 31 bestandene Tests. |
| Interne Revision | `internal-docs/audits/audit-dokumentation.md` | Kriterien, Stichprobe, Befunde, Abweichungen und Kontrollen. |
| Externe Änderungsübersicht | `CHANGELOG.md` | Keep-a-Changelog-Eintrag für 2026-07-20. |

Die vollständigen JSON-Ausgaben der npm-Audits und die Kommandoausgaben sind nicht als Repository-Datei archiviert. Deren dauerhafter Ablageort ist **klaerungsbeduerftige Information**; Security legt den Aufbewahrungsort fest, Change Owner kontrolliert die Verlinkung.

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Alter statischer Passkey-Marker wird erneut akzeptiert | Kritische Kontoübernahme | Niedrig nach Fix, hoch bei unsicherem Rollback | Serverausgestellten Einmal-Token zwingend prüfen | Negativtest und Security-Freigabe jedes Auth-Rollbacks | Token-Test; `lib/auth/config.ts` |
| Challenge oder Token wird wiederverwendet oder einer parallelen Ceremony falsch zugeordnet | Replay und unberechtigte Sitzung | Niedrig im Dienstmodell, betrieblich unbestätigt | Opake Attempt-ID, Startlimit, Bereinigung bei jedem Start, atomarer Abschluss/Löschung und kurze Ablaufzeit | Zwölf Regressionstests plus realer PostgreSQL-Parallelitäts- und Staging-Negativtest | `lib/auth/passkey-auth-attempt.ts`, `lib/rate-limit.ts` und Tests |
| Attempt-Tabelle fehlt im Zielsystem | Passkey-Anmeldung fällt zur Laufzeit aus | Mittel | Upgrade vor Anwendungscode ausführen | Schemaabfrage und Migrationslog als Deployment-Gate | Migration `0004`; **klaerungsbeduerftige Information** zum Betriebsnachweis |
| Journalisierte Migration ist operativ nicht verifiziert und Snapshot `0004` fehlt | Repository-, Drizzle-Metadaten- und Zieldatenbankzustand können abweichen | Mittel | Verbindlichen Upgradepfad ausführen, Tabelle/Constraints/Indizes prüfen und fehlenden Snapshot auflösen | Betrieb dokumentiert tatsächlich verwendeten Mechanismus; Change Owner prüft | `drizzle/meta/_journal.json` enthält `0004`, aber `drizzle/meta/0004_snapshot.json` fehlt; Betriebsnachweis offen |
| Kein realer WebAuthn-/PostgreSQL-Konkurrenzfluss | Integrations- oder Race-Fehler bleiben unentdeckt | Mittel | Staging-Smoke-Test, reale Parallelitäts- und Negativtests | Security-Abzeichnung gegen Commit-SHA | Testscope und offene Freigabekriterien |
| Neun moderate Dependency-Befunde verbleiben | Sicherheits- oder Verfügbarkeitsbeeinträchtigung abhängig vom Einsatzpfad | Mittel | Risikobewertung und geplante Folgeaktualisierung | Wiederholter npm-Audit bei jedem Release | Auditstand 9 moderate |
| Repository-Lint ist rot | Qualitätsfehler werden übersehen oder Gate wird umgangen | Hoch ohne Ausnahmeprozess | Vorbestehende Baseline-Fehler beheben oder begründete befristete Ausnahme | Change Owner und Security zeichnen Ausnahme ab; geänderte ausführbare Dateien bleiben separat fehlerfrei | `npm run lint`: 17 Fehler, 119 Warnungen; Scope-Lint: 0 Fehler, 0 Warnungen |
| Fehlende Freigabe- oder Rollbackzuordnung | Unkontrolliertes Deployment oder verzögerte Störungsreaktion | Mittel | Namentliche RACI- und Rückfallzuordnung | Kein Produktionsdeployment ohne Freigabeartefakt | **klaerungsbeduerftige Information** mit Change Owner als Kontrolle |
| Paste-Zugriffsnachweis wird umgangen, falsch gebunden oder in Produktion mit schwachem/fehlendem Secret betrieben | Vertraulichkeitsverlust oder nicht nutzbarer Unlock | Niedrig nach Codefix, betrieblich unbestätigt | bcrypt-POST, HMAC an Slug/Hash/Ablauf, HttpOnly/Pfad/TTL, transaktional serialisiertes Fail-closed-Limit und Secret-Policy | 19 Regressionstests; Browser-/Cookie-/Proxy-Log-Test und Secret-Nachweis vor Release | `lib/paste-access.ts`, Paste-Routen, `lib/rate-limit.ts`; Commits bis `9cfdeea` |

## Pflegeprozess

1. Jede Änderung am Passkey-Attempt-, NextAuth- oder Migrationsfluss erzeugt einen neuen datierten Eintrag mit Commit-Referenzen, Begründung, Wirkung und Rückfallhinweisen.
2. Entwicklung aktualisiert Testumfang und Komponententabelle; Security aktualisiert Auditwerte und Risikoentscheidung.
3. Betrieb/Release ergänzt nach Staging und Produktion die extern gespeicherten Migrations-, Build-, Deployment- und Smoke-Test-Nachweise.
4. Der Change Owner prüft vor Freigabe die sechs Freigabekriterien. Offene **klaerungsbeduerftige Information** wird entweder geschlossen oder mit dokumentierter, befristeter Risikoakzeptanz versehen.
5. Bei einem Rückfall wird kein unsicherer Basisstand verwendet. Rückfallartefakt und Datenbankstrategie werden vorab getestet und nach Ausführung erneut gegen Passkey-Negativfälle geprüft.
6. npm-Auditwerte werden mit Datum und Lockfile-Commit geführt, da sich die Advisory-Datenbank nachträglich ändern kann.
7. Änderungen an Paste-Passwort-, Cookie- oder Raw-Zugriffspfaden erfordern Negativtests für URL-Leakage, falschen/fehlenden/abgelaufenen Nachweis und abgelaufene Inhalte.

## Revisionshistorie

| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Erstfassung mit Änderungsumfang, Begründung, Wirkung, Tests, Freigabe- und Rollbackkontrollen | Daily Evolution 2026-07-20 |
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Nach Reviewfixes auf dedizierte Attempt-Tabelle, parallele Ceremonies, damaligen Teststand und journalisierte Migration aktualisiert; Betriebs- und E2E-Nachweise bleiben offen | Reviewfixes bis `6618792` |
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Auf 12 Tests/3 Dateien, Startlimit 10/5 Minuten, Purge bei jedem Start, Ablaufindizes, monotone Zähler und fehlerschließenden Schema-Bootstrap aktualisiert; realer PostgreSQL-/WebAuthn-/Staging-Nachweis und `0004_snapshot.json` bleiben offen | Finales Hardening bis `8611a8d` |
| 2026-07-21 | Technische Dokumentation / automatisierte Revision | Paste-Passwort- und Raw-/Ablauf-Bypass, POST-basierten bcrypt-Nachweis, gebundenen HttpOnly-Cookie, transaktional serialisiertes Fail-closed-Limit und 19 neue Tests dokumentiert; produktiver Browser-/Proxy-/Live-DB-Nachweis bleibt offen | Daily Evolution bis `9cfdeea` |
| 2026-07-24 | Technische Dokumentation / automatisierte Revision | Admin-Operations-Dashboard (`/admin`), Audit-Log (`/admin/audit`), Super-Admin-RBAC und Rate-Limits für alle Admin-APIs, Blocklist-RBAC-Härtung, SSRF-Schutz für Outbound-Fetches; Suite 51/51 grün in 13 Dateien | Daily Operational Pipeline auf `cursor/daily-operational-pipeline-c1f5` |
