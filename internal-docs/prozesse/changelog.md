# Interner Änderungsnachweis – Daily Evolution 2026-07-20

## Einleitung

Dieser Änderungsnachweis beschreibt Anlass, Umsetzung, Auswirkung, Prüfung, Freigabebedingungen und Rückfallvorgehen der Daily Evolution vom 2026-07-20. Maßgeblicher Repository-Stand ist Commit `58c06b7b6129d3069d6990ab481e562a0ea1d12a` auf `cursor/daily-evolution-pipeline-fe2a`; Vergleichsbasis ist `origin/main` bei `7e3b5fc`.

Der Change beseitigt einen kritischen Kontoübernahmeweg in der Passkey-Anmeldung, ergänzt einen Regressionstest-Harness mit sieben Authentifizierungstests, führt eine additive idempotente Datenbankmigration ein und aktualisiert sicherheitsrelevante Laufzeitabhängigkeiten. Nicht belegte Freigabe- und Betriebsangaben werden als **klaerungsbeduerftige Information** behandelt und erhalten eine verantwortliche Kontrolle.

## Geltungsbereich

Im Change enthalten sind:

- Passkey-Start und -Verifikation unter `app/api/passkeys/authenticate/`;
- Passkey-Clientfluss in `components/passkey-login.tsx`;
- NextAuth-Credentials-Provider in `lib/auth/config.ts`;
- WebAuthn-Verifikation in `lib/passkeys.ts`;
- neue Dienste `lib/auth/passkey-challenge.ts` und `lib/auth/passkey-login-token.ts`;
- sieben Tests in den zugehörigen `*.test.ts`-Dateien und das neue npm-Skript `test`;
- vier neue Spalten im Drizzle-Schema und `drizzle/0004_secure_passkey_auth.sql`;
- `package.json` und `package-lock.json`, insbesondere `drizzle-orm` `0.45.2`.

Nicht enthalten sind funktionale Änderungen an Passwort-, SSO- oder Passkey-Registrierungsabläufen. Ebenfalls nicht nachgewiesen sind Staging-/Produktivmigration, Deployment, realer Authenticator-Test und formale Freigabe. Diese Angaben sind **klaerungsbeduerftige Information**; Change Owner und Betrieb/Release müssen sie vor der Produktivsetzung schließen.

## Begriffe und Definitionen

| Begriff | Bedeutung |
|---|---|
| Daily Evolution | Die fünf zusammengehörigen Commits `5de8b5a` bis `58c06b7` vom 2026-07-20. |
| Challenge | Kurzlebiger, serverseitig gespeicherter WebAuthn-Prüfwert mit fünf Minuten Gültigkeit. |
| Passkey-Login-Token | Nach erfolgreicher WebAuthn-Prüfung ausgegebener Zufallswert; serverseitig nur als SHA-256-Hash für zwei Minuten gespeichert. |
| Single Use | Ein erfolgreicher Verbrauch löscht Challenge beziehungsweise Token atomar; Wiederverwendung wird abgelehnt. |
| Laufzeitabhängigkeit | Paket aus `dependencies` oder dessen transitive Abhängigkeit, die im installierten Produktionsgraphen vorkommen kann. |
| Rollback | Kontrollierte Rückkehr auf einen nachweislich sicheren Anwendungsstand; kein Rücksetzen auf einen Stand mit bekannter kritischer Schwachstelle. |
| Freigabenachweis | Referenzierbares Artefakt mit Commit-SHA, Umgebung, Prüfergebnis, freigebender Rolle und Zeitpunkt. |

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
| Servergespeicherte Passkey-Challenge | Die bisher vom Client zurückgesendete Challenge war kein belastbarer serverseitiger Vertrauensanker. | Challenge wird beim Start für fünf Minuten am Benutzer gespeichert und bei Verifikation einmalig verbraucht; Startantwort und Verify-Anfrage enthalten keine separate Challenge mehr. | `lib/passkeys.ts`, `lib/auth/passkey-challenge.ts`, beide Auth-API-Routen, `components/passkey-login.tsx` |
| Gehashter Einmal-Login-Token | Der frühere statische Marker `authenticated` erlaubte dem Credentials-Provider die Anmeldung allein anhand einer vorhandenen E-Mail-Adresse. | Verify-API stellt nach erfolgreichem WebAuthn einen zufälligen 32-Byte-Token aus. NextAuth akzeptiert nur passenden Hash, E-Mail und nicht abgelaufene Zwei-Minuten-Frist; erfolgreicher Verbrauch löscht den Wert. | `lib/auth/passkey-login-token.ts`, `lib/auth/config.ts`, Verify-Route, Passkey-Client |
| Regressionstest-Harness | Sicherheitsverträge mussten reproduzierbar gegen Rückfälle geschützt werden. | Neues `npm test` über Vitest; sieben Tests prüfen Challenge-Laufzeit und -Einmaligkeit sowie Token-Hashing, statischen Altmarker, Ablauf und Einmaligkeit. | `package.json`, `package-lock.json`, `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts` |
| Additive Datenbankänderung | Challenge und Token benötigen serverseitige, benutzergebundene Persistenz. | Vier nullable Spalten werden ergänzt. Jede SQL-Anweisung nutzt `ADD COLUMN IF NOT EXISTS` und ist damit wiederholbar. | `lib/db/schema.ts`, `drizzle/0004_secure_passkey_auth.sql` |
| Sicherheitsaktualisierung der Abhängigkeiten | Der vorherige Lockfile-Stand enthielt bekannte hohe Befunde, darunter `drizzle-orm` vor dem SQL-Identifier-Fix. | `drizzle-orm` wurde von `0.44.7` auf `0.45.2` angehoben und der Abhängigkeitsgraph neu aufgelöst. Der vollständige npm-Audit-Stand sank von 21 Befunden, davon 7 hoch, auf 9 moderate Befunde. | `package.json`, `package-lock.json` |

### Schnittstellenänderungen

- `POST /api/passkeys/authenticate/start` liefert `options`, aber nicht mehr zusätzlich `challenge` oder `userId`.
- `POST /api/passkeys/authenticate/verify` akzeptiert `email` und `response`, aber keine Client-Challenge mehr.
- Die Verify-Antwort enthält nach erfolgreicher Prüfung `loginToken`.
- Der NextAuth-Credentials-Aufruf verwendet den ausgegebenen `loginToken` anstelle von `authenticated`.
- Das Benutzerschema erhält `passkey_login_token_hash`, `passkey_login_expires_at`, `passkey_challenge` und `passkey_challenge_expires_at`.

### Test- und Prüfergebnisse

| Prüfung | Ergebnis vom 2026-07-20 | Bewertung |
|---|---|---|
| `npm test` | Bestanden: 2 Testdateien, 7 Tests, 0 Fehler | Fokussierter Regressionstest erfolgreich. |
| `npm audit --json --package-lock-only` auf `58c06b7^` | 21 Befunde: 1 niedrig, 13 mittel, 7 hoch, 0 kritisch | Reproduzierte Ausgangslage des vollständigen Lockfiles. |
| `npm audit --json` auf `58c06b7` | 9 Befunde: 9 mittel, 0 hoch, 0 kritisch | Hohe Befunde im aktuellen Graphen beseitigt; moderate Restbefunde offen. |
| `npm run lint` | Fehlgeschlagen: 18 Fehler, 121 Warnungen | Kein grünes repositoryweites Lint-Gate; Freigabeentscheidung erforderlich. |
| Stagingmigration | **klaerungsbeduerftige Information** | Betrieb/Release muss `npm run upgrade`, Log und Schemaabfrage nachweisen. |
| WebAuthn-/NextAuth-End-to-End-Test | **klaerungsbeduerftige Information** | Entwicklung führt gemeinsam mit Betrieb einen realen Staging-Smoke-Test aus; Security zeichnet ab. |
| Build | **klaerungsbeduerftige Information** | Kein Buildnachweis in dieser Prüfung; Betrieb/Release muss den Build gegen denselben Commit protokollieren. |
| Formale Genehmigung | **klaerungsbeduerftige Information** | Change Owner erfasst Freigaberolle, Zeitpunkt und Artefaktreferenz. |

Die Testdateien verwenden In-Memory-Stores. Sie belegen die Dienstverträge, aber nicht die PostgreSQL-Atomizität, API-Verkabelung oder einen realen Authenticator. Diese Einschränkung ist Bestandteil der Freigabekontrolle.

### Freigabekriterien

Vor Produktion müssen alle folgenden Punkte erfüllt und gegen Commit `58c06b7` oder einen nachfolgenden, inhaltlich geprüften Commit referenziert sein:

1. `npm test` ist ohne Fehler abgeschlossen.
2. `npm audit --json` weist keine hohen oder kritischen Befunde aus; die neun moderaten Restbefunde sind durch Security akzeptiert oder einer Folgeänderung zugeordnet.
3. `npm run upgrade` wurde in Staging ausgeführt; die vier Spalten wurden per Schemaabfrage bestätigt.
4. Ein realer Passkey-Login ist erfolgreich; `authenticated`, ein falscher Token, ein wiederverwendeter Token und ein abgelaufener Token werden abgelehnt.
5. Der Build ist erfolgreich und das Lint-Ergebnis ist bereinigt oder durch den Change Owner mit Security-Ausnahme dokumentiert.
6. Deployment-, Monitoring- und namentliche RACI-Angaben liegen als Freigabenachweis vor.

Der aktuelle Repository-Nachweis erfüllt Punkt 1 und die technische Messung aus Punkt 2. Die übrigen Freigabepunkte sind ganz oder teilweise **klaerungsbeduerftige Information** und dürfen nicht stillschweigend als erfüllt gelten.

### Rollback-Leitlinie

- Ein Rücksetzen auf `origin/main`/`7e3b5fc` ist kein zulässiger Sicherheitsrollback, weil dadurch der kritische statische Passkey-Marker wieder aktiv würde.
- Vor Deployment muss Betrieb/Release ein sicheres Rückfallartefakt festlegen, das den neuen Authentifizierungsvertrag beibehält. Ob ein solches Artefakt oder eine betriebliche Möglichkeit zur temporären Deaktivierung der Passkey-Anmeldung existiert, ist **klaerungsbeduerftige Information**. Kontrolle: Betrieb/Release dokumentiert Ziel-Commit und technische Sperrmaßnahme; Security genehmigt sie.
- Die vier neuen Spalten sind nullable und additiv. Bei einem Anwendungsrollback sollen sie zunächst bestehen bleiben; ein destruktives Entfernen benötigt einen eigenen genehmigten Datenbankchange und einen Datensicherungsnachweis.
- Ein isoliertes Zurücksetzen des Lockfiles würde bekannte hohe Befunde wieder einführen und benötigt deshalb eine ausdrückliche Security-Freigabe. Standardvorgehen ist Vorwärtskorrektur auf einem sicheren Abhängigkeitsstand.
- Rückfallauslöser, Entscheidungszeit, ausführende Rolle, Ziel-Commit, Datenbankzustand und anschließender Smoke-Test sind im Change-System zu protokollieren.

## Nachweise und Artefakte

| Artefakt | Referenz | Inhalt |
|---|---|---|
| Git-Vergleich | `git diff origin/main...58c06b7` | Vollständige Änderung über 13 Pfade. |
| Token-Testcommit | `5de8b5a` | Vier Token-Regressionsfälle und Test-Harness. |
| Challenge-Testcommit | `ba1bf8c` | Drei Challenge-Regressionsfälle. |
| Authentifizierungsfix | `daa2586` | Serverchallenge, Einmal-Token, API-/Client-/Provider-Anpassung, Schema und Migration. |
| Importkorrektur | `7ad82b5` | Lauffähige Datenbankimporte in beiden Diensten. |
| Dependency-Upgrade | `58c06b7` | `drizzle-orm` `0.45.2` und aktualisiertes Lockfile. |
| Migration | `drizzle/0004_secure_passkey_auth.sql` | Vier idempotente `ADD COLUMN IF NOT EXISTS`-Anweisungen. |
| Schema | `lib/db/schema.ts` | Drizzle-Abbildung der vier neuen Spalten. |
| Regressionstests | `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts` | Sieben bestandene Diensttests. |
| Interne Revision | `internal-docs/audits/audit-dokumentation.md` | Kriterien, Stichprobe, Befunde, Abweichungen und Kontrollen. |
| Externe Änderungsübersicht | `CHANGELOG.md` | Keep-a-Changelog-Eintrag für 2026-07-20. |

Die vollständigen JSON-Ausgaben der npm-Audits und die Kommandoausgaben sind nicht als Repository-Datei archiviert. Deren dauerhafter Ablageort ist **klaerungsbeduerftige Information**; Security legt den Aufbewahrungsort fest, Change Owner kontrolliert die Verlinkung.

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Alter statischer Passkey-Marker wird erneut akzeptiert | Kritische Kontoübernahme | Niedrig nach Fix, hoch bei unsicherem Rollback | Serverausgestellten Einmal-Token zwingend prüfen | Negativtest und Security-Freigabe jedes Auth-Rollbacks | Token-Test; `lib/auth/config.ts` |
| Challenge oder Token wird wiederverwendet | Replay und unberechtigte Sitzung | Niedrig | Atomare Löschung bei Verbrauch und kurze Ablaufzeit | Sieben Regressionstests plus Staging-Negativfälle | Beide Auth-Dienste und Tests |
| Datenbankspalten fehlen im Zielsystem | Passkey-Anmeldung fällt zur Laufzeit aus | Mittel | Upgrade vor Anwendungscode ausführen | Schemaabfrage und Migrationslog als Deployment-Gate | Migration `0004`; **klaerungsbeduerftige Information** zum Betriebsnachweis |
| Migration ist nicht im Drizzle-Journal registriert | `db:migrate` und `db:push` können unterschiedliche Zustände erzeugen | Mittel | Verbindlichen Upgradepfad festlegen und testen | Betrieb dokumentiert tatsächlich verwendeten Mechanismus; Change Owner prüft | `drizzle/meta/_journal.json` endet bei `0003` |
| Nur Unit-Tests, kein realer WebAuthn-/DB-Fluss | Integrationsfehler bleiben unentdeckt | Mittel | Staging-Smoke-Test und Negativtests | Security-Abzeichnung gegen Commit-SHA | Testscope und offene Freigabekriterien |
| Neun moderate Dependency-Befunde verbleiben | Sicherheits- oder Verfügbarkeitsbeeinträchtigung abhängig vom Einsatzpfad | Mittel | Risikobewertung und geplante Folgeaktualisierung | Wiederholter npm-Audit bei jedem Release | Auditstand 9 moderate |
| Repository-Lint ist rot | Qualitätsfehler werden übersehen oder Gate wird umgangen | Hoch ohne Ausnahmeprozess | Fehler beheben oder begründete befristete Ausnahme | Change Owner und Security zeichnen Ausnahme ab | `npm run lint`: 18 Fehler, 121 Warnungen |
| Fehlende Freigabe- oder Rollbackzuordnung | Unkontrolliertes Deployment oder verzögerte Störungsreaktion | Mittel | Namentliche RACI- und Rückfallzuordnung | Kein Produktionsdeployment ohne Freigabeartefakt | **klaerungsbeduerftige Information** mit Change Owner als Kontrolle |

## Pflegeprozess

1. Jede Änderung am Passkey-, NextAuth-, Challenge-, Token- oder Migrationsfluss erzeugt einen neuen datierten Eintrag mit Commit-Referenzen, Begründung, Wirkung und Rückfallhinweisen.
2. Entwicklung aktualisiert Testumfang und Komponententabelle; Security aktualisiert Auditwerte und Risikoentscheidung.
3. Betrieb/Release ergänzt nach Staging und Produktion die extern gespeicherten Migrations-, Build-, Deployment- und Smoke-Test-Nachweise.
4. Der Change Owner prüft vor Freigabe die sechs Freigabekriterien. Offene **klaerungsbeduerftige Information** wird entweder geschlossen oder mit dokumentierter, befristeter Risikoakzeptanz versehen.
5. Bei einem Rückfall wird kein unsicherer Basisstand verwendet. Rückfallartefakt und Datenbankstrategie werden vorab getestet und nach Ausführung erneut gegen Passkey-Negativfälle geprüft.
6. npm-Auditwerte werden mit Datum und Lockfile-Commit geführt, da sich die Advisory-Datenbank nachträglich ändern kann.

## Revisionshistorie

| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Erstfassung mit Änderungsumfang, Begründung, Wirkung, Tests, Freigabe- und Rollbackkontrollen | Daily Evolution 2026-07-20 |
