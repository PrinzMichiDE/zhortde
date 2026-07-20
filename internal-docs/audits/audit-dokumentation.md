# Audit-Dokumentation – Daily Evolution 2026-07-20

## Einleitung

Dieses Dokument hält die technische Prüfung der Änderungen vom 2026-07-20 nachvollziehbar fest. Prüfungsanlass war eine kritische Schwachstelle im Passkey-Anmeldeablauf: Im vorherigen Stand genügte für den NextAuth-Credentials-Provider eine syntaktisch gültige E-Mail-Adresse zusammen mit einem beliebigen `passkey_token`; der Provider lud den Benutzer allein anhand der E-Mail-Adresse. Der Client verwendete dafür den statischen Wert `authenticated`. Damit war eine Kontoübernahme ohne erfolgreich verifizierten Passkey möglich.

Die Prüfung basiert auf dem Repository-Zustand des Branches `cursor/daily-evolution-pipeline-fe2a` bei Commit `58c06b7b6129d3069d6990ab481e562a0ea1d12a`, dem Vergleich mit `origin/main` bei `7e3b5fc`, den fünf Änderungscommits vom 2026-07-20 sowie lokal reproduzierten Prüfkommandos. Aussagen zur Produktion werden nur getroffen, wenn ein Nachweis vorliegt. Fehlende Betriebs-, Freigabe- oder Zuordnungsdaten sind als **klaerungsbeduerftige Information** gekennzeichnet und mit einer verantwortlichen Kontrolle versehen.

## Geltungsbereich

Geprüft wurden:

- der Passkey-Authentifizierungsfluss von der Challenge-Erzeugung bis zur NextAuth-Sitzung;
- die neuen Challenge- und Login-Token-Dienste einschließlich Ablaufzeit, Hashing und Einmalverwendung;
- die API-Routen für Start und Verifikation sowie die Client-Übergabe;
- Datenbankschema und Migration für vier neue Benutzerattribute;
- die sieben neu eingeführten Authentifizierungs-Regressionstests;
- direkte und transitive npm-Abhängigkeiten anhand des Lockfiles und der npm-Advisory-Datenbank;
- die Commits `5de8b5a`, `ba1bf8c`, `daa2586`, `7ad82b5` und `58c06b7`.

Nicht als nachgewiesen gelten:

- Ausführung der Migration in Staging oder Produktion;
- produktive WebAuthn-End-to-End-Anmeldung mit realem Authenticator und realer PostgreSQL-Datenbank;
- organisatorische Freigabe, Deploymentzeitpunkt oder namentliche Rollenbesetzung;
- Behebung der neun verbleibenden moderaten npm-Befunde.

Diese Punkte sind **klaerungsbeduerftige Information**. Der Change Owner muss vor einer Produktivfreigabe die Nachweise anfordern; Betrieb/Release muss Migrations- und Deploymentprotokolle liefern, Entwicklung und Security müssen die Freigabeentscheidung dokumentieren.

## Begriffe und Definitionen

| Begriff | Definition in dieser Prüfung |
|---|---|
| Passkey | WebAuthn-Credential, dessen Signatur serverseitig gegen Credential-ID, Public Key, RP-ID, Origin und Challenge geprüft wird. |
| Challenge | Servergenerierter WebAuthn-Wert, der im neuen Stand beim Benutzer mit fünf Minuten Gültigkeit gespeichert und beim Verifikationsversuch einmalig verbraucht wird. |
| Login-Token | Nach erfolgreicher WebAuthn-Verifikation erzeugter, zufälliger 32-Byte-Wert in Base64url-Darstellung. In der Datenbank wird ausschließlich sein SHA-256-Hash für höchstens zwei Minuten gespeichert. |
| Einmalverwendung | Atomare Datenbankoperation, die den gültigen Wert prüft und gleichzeitig löscht; ein zweiter Verbrauch liefert kein Benutzerobjekt beziehungsweise keine Challenge. |
| Regressionstest | Automatisierter Test, der sicherheitsrelevante Eigenschaften des Challenge- oder Token-Dienstes festschreibt. |
| Idempotente Migration | SQL-Änderung, deren vier `ADD COLUMN`-Operationen durch `IF NOT EXISTS` wiederholbar sind. |
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
2. **Bleibt die WebAuthn-Challenge unter Serverkontrolle?** Kriterium: Challenge serverseitig speichern, maximal fünf Minuten akzeptieren und nur einmal verbrauchen; keine vom Client gelieferte Challenge als Vertrauensanker.
3. **Ist die Übergabe zur NextAuth-Sitzung gebunden und kurzlebig?** Kriterium: Token erst nach erfolgreicher WebAuthn-Prüfung ausstellen, kryptografisch zufällig erzeugen, nur gehasht speichern, an E-Mail und Hash binden, nach zwei Minuten ablehnen und atomar verbrauchen.
4. **Ist das Datenmodell wiederholbar erweiterbar?** Kriterium: additive Spalten, `IF NOT EXISTS`, Schema und SQL konsistent.
5. **Sind die zentralen Sicherheitsverträge automatisiert geprüft?** Kriterium: positiver Pfad, Ablauf, Einmalverwendung, Hashspeicherung und Ablehnung des alten statischen Markers.
6. **Wurden bekannte hoch eingestufte Abhängigkeitsbefunde reduziert?** Kriterium: reproduzierbarer Vergleich desselben Lockfile-Scopes vor und nach dem Upgrade.
7. **Sind Migration, End-to-End-Verhalten und Freigabe betrieblich nachgewiesen?** Kriterium: Staging-Protokoll, Schemaabfrage, realer Passkey-Smoke-Test, Freigabevermerk und Rückfallentscheidung.

### Stichprobe

- **Commit-Stichprobe:** 100 % der fünf Commits zwischen `origin/main` und `HEAD`.
- **Datei-Stichprobe:** 100 % der 13 geänderten Pfade wurden über `git diff origin/main...HEAD` erfasst. Die sicherheitsrelevanten Implementierungs-, Test-, Schema-, Migrations- und Manifestdateien wurden inhaltlich geprüft.
- **Lockfile-Prüfung:** Wegen des Umfangs nicht zeilenweise, sondern vollständig durch `npm audit --json` gegen das jeweilige Lockfile ausgewertet.
- **Test-Stichprobe:** 100 % der vorhandenen Passkey-Regressionstests, zwei Testdateien mit insgesamt sieben Testfällen.
- **Betriebsstichprobe:** Keine Staging- oder Produktionsartefakte im Repository vorhanden; daher kein positiver Betriebsnachweis.

### Technische Änderung

- `getAuthenticationOptions` speichert `options.challenge` serverseitig. Die Start-API gibt weder eine separate Challenge noch eine Benutzer-ID zurück.
- `verifyAuthentication` lädt und verbraucht die gespeicherte Challenge; eine fehlende oder abgelaufene Challenge beendet den Ablauf.
- Nach erfolgreicher WebAuthn-Prüfung erzeugt die Verify-API einen zufälligen Login-Token. Der Client reicht genau diesen Wert an NextAuth weiter.
- Der Credentials-Provider ruft `consumePasskeyLoginToken` auf. Die Datenbankoperation verlangt passende E-Mail, passenden SHA-256-Hash und ein Ablaufdatum in der Zukunft und löscht Hash und Ablaufzeit in derselben `UPDATE ... RETURNING`-Operation.
- Die Migration `drizzle/0004_secure_passkey_auth.sql` ergänzt die vier erforderlichen Spalten mit `ADD COLUMN IF NOT EXISTS`.
- `drizzle-orm` wurde von `0.44.7` auf `0.45.2` aktualisiert; das Lockfile wurde mit aktuellen transitiven Versionen neu aufgelöst.

### Aktuelle Befunde, Abweichungen und Maßnahmen

| ID | Einstufung | Befund und Status | Nachweis | Maßnahme | Owner |
|---|---|---|---|---|---|
| F-01 | kritisch, technisch geschlossen | Der frühere statische Passkey-Marker autorisierte im Basisstand jeden vorhandenen Benutzer anhand der E-Mail-Adresse. Der aktuelle Code verlangt einen serverseitig ausgestellten, gültigen Einmal-Token. Auf Code- und Diensttestebene geschlossen; Produktionswirksamkeit noch nicht nachgewiesen. | Diff `origin/main...HEAD` in `lib/auth/config.ts`, `components/passkey-login.tsx`, `app/api/passkeys/authenticate/verify/route.ts`; Tests 7/7 grün. | Vor Produktion realen Passkey-Smoke-Test und Negativtest mit `authenticated` protokollieren. | Entwicklung (R), Security (A) |
| F-02 | hoch, technisch geschlossen | Die Challenge kam zuvor als Client-Eingabe zur Verify-API zurück. Jetzt wird sie serverseitig für fünf Minuten gespeichert und einmalig verbraucht. | `lib/auth/passkey-challenge.ts`, `lib/passkeys.ts`, Start-/Verify-Routen; drei Challenge-Tests. | Staging-Test mit realer Datenbank auf Ablauf und Wiederholung durchführen. | Entwicklung (R), Security (A) |
| F-03 | positiv | Login-Token werden mit `randomBytes(32)` erzeugt, als SHA-256-Hash gespeichert, nach zwei Minuten ungültig und atomar gelöscht. | `lib/auth/passkey-login-token.ts`; vier Token-Tests. | Eigenschaft bei künftigen Änderungen durch bestehende Tests erhalten. | Entwicklung |
| F-04 | positiv mit Restbefund | `npm audit --json` sank für das vollständige Lockfile von 21 Befunden (1 niedrig, 13 mittel, 7 hoch) auf 9 moderate Befunde; keine hohen oder kritischen Befunde verbleiben. | Vorheriges Lockfile aus `58c06b7^`; aktuelles `package-lock.json`; Auditläufe am 2026-07-20. | Neun moderate Befunde risikobasiert bewerten und in Folgeänderung behandeln. | Security (A), Entwicklung (R) |
| A-01 | mittel | `drizzle/0004_secure_passkey_auth.sql` ist idempotent, aber `drizzle/meta/_journal.json` endet bei `0003`. Eine Anwendung über `drizzle-kit migrate` ist damit nicht aus dem Journal nachweisbar. Der vorhandene Upgradepfad verwendet zusätzlich `db:push`; dessen Ausführung ist nicht belegt. | Migrationsdatei, `drizzle/meta/_journal.json`, `scripts/upgrade.js`, `scripts/push-schema.js`. | Vor Freigabe `npm run upgrade` in Staging ausführen, Log archivieren und die vier Spalten per Schemaabfrage bestätigen. Danach den beabsichtigten Migrationsmechanismus verbindlich dokumentieren. | Betrieb/Release (R), Change Owner (A) |
| A-02 | mittel | Die sieben Tests prüfen Dienstlogik mit In-Memory-Stores. API-Routen, NextAuth-Provider, konkurrierende Datenbankzugriffe und ein realer WebAuthn-Ablauf werden nicht integriert getestet. | Beide Dateien `lib/auth/*.test.ts`; Testausgabe 2 Dateien/7 Tests. | Vor Produktivfreigabe manuellen Staging-Smoke-Test und Negativtests protokollieren; Entwicklung ergänzt bei der nächsten Codeänderung einen Datenbank-/Routen-Integrationstest. | Entwicklung (R), Security (A) |
| A-03 | mittel | Der Repository-Lintlauf ist nicht freigabefähig: `npm run lint` endet mit 18 Fehlern und 121 Warnungen. Mindestens ein Fehler liegt in `components/passkey-login.tsx`; weitere Fehler sind repositoryweit vorhanden. | Lintlauf am 2026-07-20. | Fehlerursprung gegen `origin/main` trennen, sicherheitsrelevante geänderte Pfade vor Freigabe bereinigen oder eine dokumentierte Ausnahmeentscheidung treffen. | Entwicklung (R), Change Owner (A) |
| A-04 | offen | Staging-/Produktionsmigration, Deployment, Monitoring und formale Freigabe sind **klaerungsbeduerftige Information**. | Kein entsprechendes Artefakt im geprüften Repository oder Git-Verlauf. | Change Owner fordert Freigabevermerk an; Betrieb/Release archiviert Zeit, Umgebung, Commit-SHA, Migrationslog, Smoke-Test und Rückfallentscheidung. | Change Owner (A), Betrieb/Release (R) |

### Gesamturteil

Die kritische Kontoübernahmeursache ist im aktuellen Code schlüssig beseitigt und durch sieben fokussierte Diensttests abgesichert. Die Abhängigkeitslage wurde nachweislich von 21 Befunden mit sieben hohen Einstufungen auf neun moderate Befunde verbessert. Eine uneingeschränkte Produktionsfreigabe lässt sich aus den vorhandenen Artefakten dennoch nicht ableiten: Migrationsanwendung, realer End-to-End-Ablauf, Lint-Ausnahme beziehungsweise -Bereinigung und formale Freigabe sind offen. Der technische Stand ist daher **freigabefähig erst nach Erfüllung der Kontrollen A-01 bis A-04**.

## Nachweise und Artefakte

| Nachweis | Pfad/Referenz | Prüfaussage |
|---|---|---|
| Basisstand | `origin/main` / `7e3b5fc` | Enthält statischen Clientmarker und E-Mail-only-Autorisierung im Passkey-Zweig. |
| Regressionstest-Commit | `5de8b5a` | Fügt Token-Regressionstests und Vitest-Skript hinzu. |
| Challenge-Vertragscommit | `ba1bf8c` | Fügt drei Challenge-Tests hinzu. |
| Sicherheitsfix | `daa2586` | Ändert API, Client, Auth-Provider, Dienste, Schema und Migration. |
| Testimport-Korrektur | `7ad82b5` | Korrigiert Datenbankimporte der neuen Dienste. |
| Abhängigkeitsfix | `58c06b7` | Aktualisiert `drizzle-orm` und das Lockfile. |
| Challenge-Dienst | `lib/auth/passkey-challenge.ts` | Fünf Minuten Gültigkeit und atomarer Verbrauch. |
| Token-Dienst | `lib/auth/passkey-login-token.ts` | 32 Zufallsbytes, SHA-256, zwei Minuten, atomarer Verbrauch. |
| Authentifizierungsfluss | `lib/passkeys.ts`, `lib/auth/config.ts`, `app/api/passkeys/authenticate/*`, `components/passkey-login.tsx` | Servergebundene Challenge und Tokenübergabe. |
| Datenmodell | `lib/db/schema.ts`, `drizzle/0004_secure_passkey_auth.sql` | Vier additive Spalten; SQL mit `IF NOT EXISTS`. |
| Migrationsjournal | `drizzle/meta/_journal.json` | Enthält nur `0000` bis `0003`; Abweichung A-01. |
| Testlauf | `npm test` am 2026-07-20 | 2 Testdateien und 7 Tests bestanden; Dauer 596 ms. |
| Audit vorher | `npm audit --json --package-lock-only` auf `58c06b7^` | 21 Befunde: 1 niedrig, 13 mittel, 7 hoch, 0 kritisch. |
| Audit nachher | `npm audit --json` auf `58c06b7` | 9 Befunde: 9 mittel, 0 hoch, 0 kritisch. |
| Lintlauf | `npm run lint` am 2026-07-20 | Fehlgeschlagen mit 18 Fehlern und 121 Warnungen. |
| Änderungsübersicht | `git diff --name-status origin/main...HEAD` | 13 geänderte Pfade im Change-Scope. |

Die npm-Advisory-Datenbank ist zeitabhängig. Für spätere Audits müssen Datum, Commit-SHA, npm-Version und vollständige JSON-Ausgabe gemeinsam archiviert werden. Die hier aufgeführten Zahlen wurden am 2026-07-20 reproduziert.

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Umgehung der Passkey-Prüfung durch statischen Marker | Kontoübernahme und unberechtigter Zugriff | Vor Fix hoch; nach Codefix niedrig, solange neuer Pfad aktiv ist | Nur serverseitig ausgestellten Einmal-Token akzeptieren | Negativtest für `authenticated`, Tokenprüfung im Credentials-Provider | `lib/auth/config.ts`, Token-Test |
| Manipulierte oder wiederverwendete Challenge | Replay oder Prüfung gegen angreifergesteuerten Wert | Niedrig nach Implementierung | Challenge serverseitig speichern, fünf Minuten begrenzen und atomar verbrauchen | Challenge-Tests plus Staging-Negativtest | `lib/auth/passkey-challenge.ts`, drei Tests |
| Diebstahl eines Login-Tokens aus der Datenbank | Sitzungserstellung für fremdes Konto | Niedrig | Nur SHA-256-Hash speichern, Gültigkeit auf zwei Minuten begrenzen | Prüfung auf Hash, E-Mail, Ablauf und atomare Löschung | `lib/auth/passkey-login-token.ts`, vier Tests |
| Migration nicht angewendet | Passkey-Anmeldung schlägt zur Laufzeit wegen fehlender Spalten fehl | Mittel | Upgrade in Staging und Produktion vor Anwendungscode ausführen | Release-Gate prüft Upgrade-Log und Schemaabfrage | Abweichung A-01; `scripts/upgrade.js` |
| Nicht journalisierte Migration | Abweichendes Verhalten zwischen `db:migrate` und `db:push` | Mittel | Verbindlichen Migrationsweg festlegen und protokollieren | Change Owner verweigert Freigabe ohne Migrationsnachweis | `drizzle/meta/_journal.json`, Migration `0004` |
| Fehlende End-to-End-Abdeckung | Integrationsfehler bleiben trotz grüner Unit-Tests unentdeckt | Mittel | Realen Staging-Passkey-Ablauf und Negativfälle ausführen | Security zeichnet Smoke-Test-Ergebnis gegen Commit-SHA ab | Abweichung A-02 |
| Verbleibende moderate npm-Befunde | DoS, XSS oder Entwicklungsserver-Risiken abhängig von tatsächlicher Nutzung | Mittel | Befunde risikobasiert bewerten und sichere Upgrades planen | Wiederkehrender `npm audit --json`; keine hohen/kritischen Befunde als Release-Gate | Aktuelles Audit: 9 moderate |
| Rücksetzen auf den unsicheren Auth-Stand | Erneute kritische Kontoübernahme | Niedrig bei kontrolliertem Release | Sicherheitsfix nicht auf alten statischen Marker zurückrollen; bei Störung Deployment stoppen und sichere Vorversion ohne exponierten Passkey-Zweig wählen | Security muss jeden Auth-Rückfall freigeben | Basisdiff und F-01 |
| Ungeklärte Freigabe- und Betriebsrollen | Änderungen ohne nachweisbare Genehmigung oder Überwachung | Mittel | Namentliche RACI-Zuordnung vor Produktivsetzung | Change Owner archiviert Freigabe- und Deploymentartefakt | **klaerungsbeduerftige Information**, A-04 |

## Pflegeprozess

1. Entwicklung aktualisiert dieses Dokument bei Änderungen an Challenge-, Token-, NextAuth- oder Migrationslogik und verlinkt die betroffenen Commits.
2. Security wiederholt `npm test` und `npm audit --json`, prüft die Schutzkriterien und dokumentiert neue Abweichungen mit ID, Owner und Fälligkeit im Change-System.
3. Betrieb/Release führt vor jeder betroffenen Produktivsetzung `npm run upgrade` gemäß Repository-Regel aus und archiviert Umgebung, Commit-SHA, Zeitstempel, Ausgabe und Schemaabfrage.
4. Der Change Owner prüft vor Freigabe, dass A-01 bis A-04 entweder geschlossen oder mit einer expliziten, befristeten Risikoakzeptanz versehen sind. Eine solche Akzeptanz liegt derzeit nicht vor und ist **klaerungsbeduerftige Information**.
5. Nach der Produktivsetzung werden erfolgreicher Passkey-Login, Ablehnung eines ungültigen Tokens und relevante Auth-Fehler protokolliert geprüft. Konkrete Monitoring-Schwellen und Aufbewahrungsfristen sind **klaerungsbeduerftige Information**; Betrieb/Release definiert sie, Security genehmigt sie und der Change Owner kontrolliert die Ablage.
6. Bei Widersprüchen haben reproduzierbare Git-, Test-, Audit- und Betriebsartefakte Vorrang vor narrativen Aussagen; das Dokument wird entsprechend korrigiert.

## Revisionshistorie

| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 2026-07-20 | Technische Dokumentation / automatisierte Revision | Erstfassung mit Scope, Kriterien, Stichprobe, Evidenz, Befunden A-01 bis A-04 und Freigabekontrollen | Daily Evolution: kritischer Passkey-Sicherheitsfix, Regressionstests, Migration und Abhängigkeitsaktualisierung |
