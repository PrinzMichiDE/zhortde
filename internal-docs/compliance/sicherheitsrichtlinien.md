# Informationssicherheitsrichtlinie
## Einleitung
Diese Richtlinie definiert die verbindlichen Sicherheitsanforderungen fuer Entwicklung, Bereitstellung und Betrieb von Zhort. Sie trennt Soll-Vorgaben von nachweisbaren Ist-Kontrollen. Grundlage ist die Repository-Analyse vom 20.07.2026, Commit `6618792`.

Die formale Inkraftsetzung und namentliche Freigabe durch die Leitung sind klaerungsbeduerftige Informationen. Owner ist die Leitung; Kontrolle ist eine signierte Richtlinienfreigabe vor Produktivbetrieb und danach mindestens jaehrlich. Bis zur Freigabe dienen die Anforderungen als Mindeststandard fuer Risikobewertung und technische Aenderungen.

## Geltungsbereich
Die Richtlinie gilt fuer:

- Quellcode, Datenbankschema, Migrationen, Abhaengigkeiten und Dokumentation;
- Next.js-Webanwendung, APIs, Middleware, NextAuth, SSO und WebAuthn/Passkeys;
- PostgreSQL, Container, Vercel-faehige Bereitstellung, GitHub Actions und GHCR;
- Entwicklungs-, Test- und Produktionsumgebungen;
- Konten, Rollen, API-Schluessel, Webhooks, Geheimnisse, Logs und Backups;
- interne und externe Personen mit Entwicklungs-, Betriebs-, Administrations- oder Lieferantenzugriff;
- alle verarbeiteten Inhalte und personenbezogenen Daten.

Physische Sicherheit und Arbeitsplatzsicherheit liegen ebenfalls im Geltungsbereich, koennen aber aus dem Repository nicht bewertet werden. Hosting-, Buero- und Endgeraetekontrollen sind daher klaerungsbeduerftig und durch Betrieb/Leitung nachzuweisen.

## Begriffe und Definitionen
| Begriff | Definition |
|---|---|
| Geheimnis | Passwort, privater Schluessel, Token, API-Key, Client-Secret oder Datenbank-Zugang. |
| Privilegierter Zugriff | Zugriff, der Nutzer, Konfiguration, Daten, Secrets, Deployment oder Sicherheitskontrollen veraendern kann. |
| Least Privilege | Nur die fuer eine Aufgabe minimal erforderlichen Rechte. |
| Defense in Depth | Mehrere voneinander moeglichst unabhaengige Kontrollen. |
| Sicherheitsereignis | Beobachtung mit moeglicher Sicherheitsrelevanz. |
| Sicherheitsvorfall | Bestaetigtes oder hinreichend wahrscheinliches Ereignis mit Auswirkung auf Vertraulichkeit, Integritaet oder Verfuegbarkeit. |
| Kritische Aenderung | Aenderung an Authentisierung, Autorisierung, Kryptografie, Datenbank, externen Datenfluesse, Secrets oder Deployment. |
| SAST/SCA/DAST | Statische Codeanalyse, Abhaengigkeitsanalyse und dynamische Sicherheitstests. |
| Ausnahme | Befristete, begruendete Abweichung mit Owner, Restrisiko, kompensierender Kontrolle und Ablaufdatum. |
| Klaerungsbeduerftige Information | Nicht im Repository belegte Betriebs- oder Governance-Tatsache mit verbindlichem Owner und Nachweis. |

## Verantwortlichkeiten
| Aktivitaet | Leitung / Service Owner | Entwicklung | Technischer Betrieb | Informationssicherheit | Datenschutz |
|---|---|---|---|---|---|
| Richtlinie und Risikoausnahmen freigeben | A | C | C | R | C |
| Sichere Architektur und Implementierung | I | A/R | C | C | C |
| Identitaeten, Secrets und privilegierte Zugriffe betreiben | I | C | R | A | I |
| CI/CD, Artefakte und Deployment | I | R | A | C | I |
| Logging, Monitoring und Schwachstellen | I | C | R | A | C |
| Backup, Restore und Kontinuitaet | I | C | A/R | C | I |
| Sicherheitsvorfaelle | A | C | R | R | C |
| Datenschutzverletzungen | A | C | C | R | R |
| Lieferanten- und Lizenzkontrolle | A | R | C | C | C |

R = ausfuehrend, A = rechenschaftspflichtig, C = konsultiert, I = informiert. Namentliche Besetzung, Stellvertretung und Erreichbarkeit sind klaerungsbeduerftig; die Leitung fuehrt ein quartalsweise bestaetigtes Rollenregister.

## Detailbeschreibung
### Sicherheitsgrundsaetze
1. Zugriff wird standardmaessig verweigert und explizit, minimal und nachvollziehbar erteilt.
2. Oeffentliche und anonyme Funktionen werden als feindlich exponiert behandelt.
3. Personenbezogene und vertrauliche Daten werden minimiert, zweckgebunden und verschluesselt uebertragen.
4. Geheimnisse duerfen weder im Repository noch in Logs, Fehlermeldungen oder Client-Bundles erscheinen.
5. Kritische Sicherheitspruefungen duerfen nicht unbemerkt fail-open arbeiten.
6. Jede sicherheitsrelevante Aenderung benoetigt Review, automatisierte Negativtests und Rollbackfaehigkeit.
7. Ein Repository-Kommentar oder eine vorhandene Tabelle gilt nicht als wirksame Betriebskontrolle; Wirksamkeit muss getestet und belegt werden.

### Informationsklassifizierung
| Klasse | Beispiele in Zhort | Mindestkontrollen |
|---|---|---|
| Oeffentlich | oeffentliche Links/Pastes, statische Website, OpenAPI | Integritaet, Missbrauchsschutz, keine unbeabsichtigten Metadaten. |
| Intern | Architektur, Runbooks, nicht geheime Konfiguration, Auditberichte | Authentisierter Zugriff, Aenderungsnachweis. |
| Vertraulich | private Links/Pastes, E-Mail, Klick-IP, Referer, Teamdaten, Auditlogs | Need-to-know, TLS, verschluesselte Speicherung/Backups, protokollierter Zugriff, Loeschfrist. |
| Streng vertraulich | Passwoerter, Tokens, API-Schluessel, Webhook- und SSO-Secrets, Datenbankzugang | Secret-Vault, keine Klartextpersistenz soweit vermeidbar, Rotation, MFA, Vier-Augen-Freigabe. |

Freie Inhalte koennen eine hoehere Schutzklasse enthalten, als das strukturierte Feld erkennen laesst. Oeffentliche Freigabe muss daher eine ausdrueckliche Nutzerentscheidung sein; anonyme Inhalte sind laut Code stets oeffentlich und muessen entsprechend transparent gekennzeichnet werden.

### Identitaets- und Zugriffsmanagement
- Jede Person nutzt eine eindeutige Identitaet; geteilte Administrationskonten sind unzulaessig.
- Privilegierte Rollen erfordern MFA, zeitnahe Sperrung bei Rollenende und quartalsweise Rezertifizierung.
- Anwendungskonten verwenden `user`, `admin` und Teamrollen. Superadmins werden ueber `SUPER_ADMINS` anhand der Session-E-Mail bestimmt. Produktive Werte, Aenderungsfreigaben und Reviews sind klaerungsbeduerftig.
- Autorisierung muss serverseitig erfolgen. Vorhandene Owner-Filter und `requireAuth` sind beizubehalten und durch Negativtests fuer jede Objektart zu belegen.
- API-Schluessel werden zufaellig erzeugt, nur einmal im Klartext angezeigt, als Hash gespeichert, widerrufbar und nach Moeglichkeit befristet. Schluessel muessen mindestens quartalsweise auf Nutzung und Notwendigkeit geprueft werden.
- JWT-Sessions haben derzeit 24 Stunden Maximalalter. Fuer kompromittierte Konten ist ein Widerrufs- oder globaler Secret-Rotationsprozess erforderlich; ein feingranulares Widerrufsregister ist nicht belegt.

### Authentisierung
| Verfahren | Nachweisbarer Ist-Stand | Verbindliche Restkontrolle |
|---|---|---|
| Passwort | Mindestens 8 Zeichen mit Komplexitaet; bcrypt Kostenfaktor 12; Timing-Vergleich bei unbekanntem Nutzer | Rate Limit fuer alle Loginpfade, kompromittierte Passwoerter pruefen, sichere Ruecksetzung und MFA fuer Privilegierte. |
| NextAuth/JWT | 24 Stunden; Cookie `httpOnly`, `sameSite=lax`, Produktion `secure` | Secret mindestens 32 zufaellige Bytes, Rotation und Sessionwiderruf dokumentieren. |
| Passkey-Login | WebAuthn mit `requireUserVerification`; eigene `passkey_auth_attempts`-Zeile je zufaelliger opaker Ceremony-ID erlaubt parallele Ceremonies; Challenge 5 Minuten und vor Nachweis nur gelesen; atomarer Abschluss genau eines Attempts; 32-Byte-Login-Token nur als SHA-256-Hash, 2 Minuten; NextAuth loescht die passende Zeile atomar | Operative Migration und Tabellenstruktur nachweisen; User-Enumeration reduzieren; Passkey-Endpunkte gesondert rate-limiten; reale PostgreSQL-Konkurrenz-/WebAuthn-E2E-Tests und Cleanup abgelaufener Attempt-Zeilen. |
| Passkey-Registrierung | Authentisierte Route und WebAuthn-Verifikation | Challenge nicht an den Client als Vertrauensanker zurueckgeben; serverseitig an Nutzer/Session binden, befristen und einmalig verbrauchen. |
| SSO | Verifizierte Domain, Provider-Codeaustausch, 5-Minuten-Single-Use-Handoff | Kryptografisch zufaelliger, servergebundener OAuth-State/Nonce; Secret-Vault; PKCE wo anwendbar; strikte Issuer-/Providerbindung. |

`drizzle/0004_secure_passkey_auth.sql` erstellt `passkey_auth_attempts` mit `CREATE TABLE IF NOT EXISTS` und ist in `drizzle/meta/_journal.json` registriert. Sie ist vor Aktivierung des neuen Passkey-Loginpfads anzuwenden; Migrationserfolg, Tabellen-/Constraint-Struktur und Rollback muessen pro Umgebung nachgewiesen werden.

### Geheimnis- und Kryptografiemanagement
- Secrets werden ausschliesslich ueber eine freigegebene Secret-Verwaltung injiziert. `.env`-Dateien mit echten Werten, Secrets in GitHub-Logs und Klartext in Tickets sind verboten.
- `DATABASE_URL`/`POSTGRES_URL`, `NEXTAUTH_SECRET`, `GOOGLE_SAFE_BROWSING_KEY`, SSO-Secrets, Webhook-Secrets und Registry-Zugaenge sind zu inventarisieren, ohne Werte in Nachweisen abzulegen.
- Rotation erfolgt bei Verdacht sofort, bei Rollenwechsel und ansonsten nach einer freigegebenen Frist. Fristen und Plattform sind klaerungsbeduerftig; Owner Betrieb.
- TLS 1.2 oder hoeher ist fuer alle externen und Datenbankverbindungen Pflicht. Der Aufruf von `http://ip-api.com` verletzt diese Vorgabe und ist bis zur Behebung auszusetzen.
- Kontopasswoerter und Zugriffsschluessel werden mit bcrypt gespeichert. Passkey-Handoff-Token und bestimmte API-Hilfswerte verwenden SHA-256; rohe Login-Tokens werden nicht gespeichert. Passkey-Handoff-Hashes liegen in dedizierten Attempt-Zeilen, die NextAuth beim erfolgreichen Verbrauch atomar loescht.
- Passwortfreigaben verwenden laut Hilfsbibliothek AES-256-GCM mit PBKDF2-SHA-256 und zufaelligen IV/Salt. Ob die Verschluesselung tatsaechlich ausschliesslich clientseitig stattfindet, muss durch End-to-End-Test und Bundle-Review belegt werden.
- SSO-Client-Secrets und Webhook-Secrets liegen laut Schema als Text vor. At-rest-Verschluesselung oder anwendungsseitige Feldverschluesselung ist nicht belegt.

### Anwendungssicherheit
- Eingaben werden mit expliziten Schemas, Groessenlimits, erlaubten Protokollen und serverseitiger Autorisierung validiert.
- Drizzle-Parameterisierung ist manueller SQL-Stringverkettung vorzuziehen.
- URL-Abrufe und Webhooks benoetigen SSRF-Schutz nach DNS-Aufloesung, Blockade privater/link-local/loopback Netze, Redirect-Revalidierung, Zeit-/Groessenlimits und Egress-Allowlist. Die vorhandene Literal-IP-Pruefung reicht gegen DNS-Rebinding nicht aus.
- Alle Darstellungen desselben Objekts muessen dieselben Datenschutz-, Ablauf-, Passwort- und Ownerkontrollen anwenden. Bei geschuetzten Pastes akzeptiert die Hauptansicht derzeit jedes nichtleere Passwort ohne Hashvergleich; die Raw-Route prueft weder Ablauf noch Passwort. Link- und Paste-Passwoerter werden zudem als Queryparameter uebergeben und koennen in Historie oder Logs erscheinen.
- P2P-Signalisierung muss Ablauf, Access-Key und den ausgegebenen Signalisierungstoken serverseitig pruefen. Die aktuelle POST-Route liest und schreibt Offer/Answer allein anhand der Share-ID.
- Benutzerdefiniertes HTML, Masking, Redirect-Seiten und Trackingkonfiguration gelten als aktive Inhalte und benoetigen Sanitizing/Sandboxing. Repository-Felder allein belegen diese Kontrolle nicht.
- CSRF-Schutz ist fuer cookie-authentisierte zustandsaendernde Aktionen erforderlich. Hilfsfunktionen existieren, ihre durchgaengige Nutzung in benutzerdefinierten API-Routen ist nicht belegt.
- Fehlerantworten duerfen keine Stacktraces, Tokens, Providerantworten oder personenbezogenen Daten offenlegen.

### Browser- und Netzwerksicherheit
- HSTS, `X-Content-Type-Options`, `X-Frame-Options`, Referrer- und Permissions-Policy sind im Code gesetzt; die Auslieferung ist nach jedem Deployment extern zu testen.
- Die CSP erlaubt derzeit `unsafe-inline`, `unsafe-eval` und ein externes CDN. Ziel ist nonce-/hashbasierte CSP ohne `unsafe-eval` und mit minimaler Allowlist.
- Middleware-Rate-Limits sind pro Instanz im Speicher und damit in horizontaler/serverloser Skalierung nicht global. DB-Rate-Limits arbeiten bei Datenbankfehler fail-open. Authentisierungs- und Passkeypfade muessen durch ein verteiltes, fail-safe und beobachtbares Limit geschuetzt werden.
- Vertrauenswuerdige Proxyketten fuer `x-forwarded-for` muessen konfiguriert sein; ungepruefte Client-Header duerfen nicht die Sicherheitsidentitaet bestimmen.
- Egress ist auf benoetigte Ziele zu begrenzen. Der Code kontaktiert unter anderem ip-api.com, Google Safe Browsing, jsDelivr, SSO-Provider, Nutzer-Webhooks und Google-STUN.

### Datenbank und Migrationen
- Separate Datenbankrollen fuer Anwendung, Migration und Read-only-Analyse sind Pflicht; Least Privilege und TLS sind nachzuweisen.
- Migrationen sind versioniert, peer-reviewed, vor Produktion in einer isolierten Umgebung getestet und rueckrollbar bzw. mit Wiederherstellungsplan versehen.
- Der Produktions-Build ruft ueber `prebuild` ein Upgrade auf, und Docker versucht beim Start einen Schema-Push; der Container startet nach fehlgeschlagenem Bootstrap weiter. Dieses Verhalten erhoeht Verfuegbarkeit, kann aber zu unkontrollierter Schemaaenderung oder einem halb migrierten Zustand fuehren. Produktiv ist ein explizites, einmaliges, blockierendes Migrations-Gate mit Backup und Erfolgskontrolle vorzuziehen.
- Direkte Produktivdaten duerfen nicht in Testumgebungen kopiert werden, ausser sie sind nachweisbar anonymisiert und freigegeben.

### Sichere Entwicklung und Lieferkette
1. Aenderungen erfolgen auf Branches mit Pull Request und mindestens einer fachkundigen Reviewperson; Branchschutz ist klaerungsbeduerftig.
2. Kritische Aenderungen an Auth, Berechtigungen, Migrationen, Kryptografie und Datenfluesse benoetigen Bedrohungsanalyse und Negativtests.
3. CI muss Build, Typecheck, Lint, Unit-/Integrationstests, Secret-Scan, SAST, SCA, Lizenzscan und Container-Scan blockierend ausfuehren.
4. GitHub Actions sind auf unveraenderliche Commit-SHAs zu pinnen oder durch eine dokumentierte Updatekontrolle abzusichern. Aktuell werden Major-Tags (`@v3` bis `@v6`) verwendet.
5. Das Dockerfile nutzt im Build `npm ci` und einen nicht-root Runner. Im Runner werden Pakete jedoch erneut mit `npm install --no-save` installiert; das finale Artefakt benoetigt ein eigenes SBOM und einen Scan.
6. Basisimages sind per Digest zu pinnen und regelmaessig zu aktualisieren. `node:20-alpine` ist derzeit nicht per Digest fixiert.
7. Produktionsartefakte erhalten Provenienz, Digest, SBOM und Notice-Bundle.

### Schwachstellenmanagement
`npm audit` und `npm audit --omit=dev` melden am 20.07.2026 jeweils 9 moderate Findings, keine hohen oder kritischen. Vier betroffene Eintraege sind direkt und fuenf transitiv. Weil `drizzle-kit` als Laufzeitabhaengigkeit deklariert und in das finale Docker-Image installiert wird, darf der Befund nicht als rein entwicklungsbezogen verworfen werden.

Behandlungsfristen ab Kenntnis:

| Schweregrad / Lage | Frist | Entscheidung |
|---|---:|---|
| Aktiv ausgenutzt oder kritische internetexponierte Luecke | 24 Stunden | Patch, Isolation oder Abschaltung; Leitung und Informationssicherheit informieren. |
| Hoch | 7 Kalendertage | Patch oder befristete Ausnahme mit kompensierender Kontrolle. |
| Moderat | 30 Kalendertage | Exposition pruefen, aktualisieren oder befristet akzeptieren. |
| Niedrig | 90 Kalendertage | Gebuendelte Behandlung oder begruendete Akzeptanz. |

Automatische Fixes, die inkompatible Downgrades vorschlagen, werden nicht blind ausgefuehrt. Jede Ausnahme dokumentiert Advisory, betroffene Version/Pfade, Exposition, Kontrolle, Owner, Freigabe und Ablaufdatum.

### Logging und Monitoring
- Sicherheitsrelevante Ereignisse umfassen Login-Erfolg/-Fehler, Rechteverweigerung, Rate Limit, Adminaktion, Secret-/Rollenwechsel, Migration, Export, Loeschung und Konfigurationsaenderung.
- Logs enthalten Zeit, Ereignistyp, korrelierbare Anfrage-ID, Akteur, Ergebnis und System, aber keine Passwoerter, Tokens, Secrets oder unnoetigen Inhaltsdaten.
- `lib/security.ts` schreibt Security-Events nur auf stdout. `link_history` und `audit_logs` existieren, sind aber nicht flaechendeckend; `logLinkAction` schluckt Fehler, und Linkhistorie wird bei Linkloeschung kaskadiert geloescht.
- Zentrale, manipulationsgeschuetzte Speicherung, Alarmregeln, Uhrzeitsynchronisation, Aufbewahrung und Zugriff sind klaerungsbeduerftig. Owner Informationssicherheit/Betrieb; Kontrolle ist ein monatlicher Testalarm und quartalsweiser Zugriffsreview.

### Backup, Wiederherstellung und Kontinuitaet
Produktionsdaten, Konfiguration und erforderliche Secrets muessen verschluesselt gesichert werden. Backups sind getrennt vom Primaersystem, zugriffsbeschraenkt und gegen unbemerkte Veraenderung geschuetzt. Restore-Tests erfolgen mindestens jaehrlich sowie nach wesentlicher Architekturveraenderung.

RTO, RPO, Backupintervall, Aufbewahrung, Anbieterredundanz und letzter Restore-Test sind klaerungsbeduerftige Informationen. Owner Betrieb; Kontrolle ist ein genehmigtes Kontinuitaetskonzept mit protokolliertem Restore. Ohne diesen Nachweis darf Wiederherstellbarkeit nicht als implementiert bewertet werden.

### Sicherheitsvorfaelle
1. Eingang ueber einen dokumentierten Meldekanal; Kanal und Rufbereitschaft sind klaerungsbeduerftig.
2. Unverzuegliche Triage nach Daten, Identitaet, Code, Lieferkette oder Verfuegbarkeit.
3. Eindammung: Token/Secrets widerrufen, Zugriff sperren, Artefakt isolieren, boesartige Weiterleitungen deaktivieren.
4. Beweissicherung: Zeiten, Logs, Artefakt-Digests, Entscheidungen und Chain of Custody.
5. Datenschutz prueft parallel die 72-Stunden-Meldefrist nach Art. 33 DSGVO.
6. Wiederherstellung nur aus geprueftem Stand; verstaerktes Monitoring.
7. Ursachenanalyse und Massnahmen mit Owner/Frist; Wirksamkeitspruefung innerhalb von 30 Tagen.

Mindestens jaehrlich wird eine Tabletop-Uebung fuer Account-Uebernahme, Datenabfluss und Lieferkettenkompromittierung durchgefuehrt.

### Lieferanten und Ausnahmen
Vor Datenuebermittlung oder produktiver Abhaengigkeit sind Sicherheit, Datenschutz, Verfuegbarkeit, Subprozessoren, Region, Exit und Loeschung zu pruefen. Dies betrifft insbesondere Hoster/DB, GitHub, SSO-Provider, ip-api.com, Google, jsDelivr und nutzerdefinierte Webhookempfaenger.

Ausnahmen sind nur befristet zulaessig. Erforderlich sind Risiko, Geschaeftsgrund, Scope, kompensierende Kontrolle, Owner, Freigabe durch Leitung und Informationssicherheit sowie ein festes Ablaufdatum. Eine stillschweigende oder unbefristete Ausnahme ist ungueltig.

## Nachweise und Artefakte
- `lib/auth/config.ts`, `lib/auth/actions.ts`: Passwort, JWT, Cookies und Handoff-Verfahren.
- `lib/auth/passkey-auth-attempt.ts`, `lib/passkeys.ts`: opak adressierte WebAuthn-Ceremonies, atomarer Attempt-Abschluss und Login-Token-Verbrauch.
- `drizzle/0004_secure_passkey_auth.sql`, `drizzle/meta/_journal.json`: dedizierte, journalisierte Tabelle `passkey_auth_attempts`.
- `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts`, `lib/auth/config.test.ts`: zehn erfolgreiche Tests fuer Parallelitaet, Ablauf, Hash, Einmalverwendung und die NextAuth-Credentials-Grenze am 20.07.2026.
- `middleware.ts`, `next.config.ts`, `lib/api-security.ts`, `lib/security.ts`, `lib/rate-limit.ts`: Header, CSP, Validierung, Logging und Limits.
- `lib/db/schema.ts`, `drizzle/*.sql`: Zugriffsdaten, Audit, Loeschbeziehungen und Migrationen.
- `app/protected/paste/[slug]/page.tsx`, `app/p/[slug]/page.tsx`, `app/p/[slug]/raw/route.ts`, `app/api/auth/sso/*`, `lib/analytics.ts`: dokumentierte offene Risiken.
- `Dockerfile`, `.github/workflows/docker-image.yml`, `scripts/*upgrade*`, `scripts/docker-entrypoint.js`: Build-, Release- und Migrationskontrollen.
- `package.json`, `package-lock.json`, Auditlauf vom 20.07.2026: Abhaengigkeits- und Schwachstellennachweise.
- Klaerungsbeduerftige Betriebsartefakte: Zugriffsliste, Secret-Inventar ohne Werte, Backup-/Restoreprotokoll, SIEM-Alarmtest, Incident-Runbook, Lieferantenakte, CI-Protokolle und Risikoausnahmen.

## Risiken und Kontrollen
| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Paste-Passwortschutz ohne wirksamen Hashvergleich | Vertraulichkeitsverlust | Hoch | Serverseitigen Hashvergleich und einheitliche Ablauf-/Ownerkontrollen implementieren | Negative End-to-End-Tests fuer Haupt- und Raw-Ansicht | Paste-Page-, Protected- und Raw-Routen |
| Schutzpasswoerter/Access-Keys in Queryparametern | Geheimnisoffenlegung in Historie/Logs | Mittel | POST-basierte Pruefung und kurzlebiges gebundenes Zugriffstoken | Log-/URL-Test ohne Passwortwerte | Protected-Link-, Paste- und Passwortfreigabe-Flows |
| P2P-Signalisierung ohne Token-/Access-Key-Pruefung | Manipulation oder Offenlegung von Offer/Answer | Hoch | Signalisierung an Token, Ablauf und Access-Key binden | Negative API-Tests fuer falschen Token, Ablauf und fremde Share-ID | `app/api/p2p/files/[shareId]/route.ts` |
| Passkey-Registrierung mit clientgelieferter Challenge | Unbefugte Credential-Registrierung | Mittel | Serverseitige, sessiongebundene Single-Use-Challenge | Replay-/Ablauf-/Bindungstest | `app/api/passkeys/register/*` |
| Passkey-Attempt-Migration ist betrieblich nicht verifiziert | Fehlende Tabelle oder Constraints verhindern oder schwaechen den Loginpfad | Mittel | Journalisierte Migration als blockierendes Release-Gate ausfuehren | Upgrade-Log und Schemaabfrage fuer Tabelle, Unique Constraint und Fremdschluessel | `drizzle/0004_secure_passkey_auth.sql`, Journal vorhanden; Betriebsnachweis offen |
| Passkey-Parallelitaet und End-to-End-Fluss nur in In-Memory-/Mock-Tests | Race- oder Integrationsfehler bleiben unentdeckt | Mittel | Reale PostgreSQL-Konkurrenztests und WebAuthn-Staging-E2E ausfuehren | Testprotokoll gegen freizugebenden Commit-SHA | 3 Dateien/10 Tests; kein Live-DB-/WebAuthn-E2E |
| Unsigned SSO-State und Klartext-Client-Secret | Login-CSRF, Secretdiebstahl | Mittel | State/Nonce serverseitig, PKCE, Vault/Feldverschluesselung | SSO-Bedrohungsanalyse und Integrationstest | `app/api/auth/sso/*`, Schema |
| Verteiltes Rate Limit fehlt und DB-Limit fail-open | Brute Force und Missbrauch | Hoch | Zentraler atomarer Store, fail-safe fuer Auth | Last-/Fehlertest ueber mehrere Instanzen | `middleware.ts`, `lib/rate-limit.ts` |
| CSP mit `unsafe-eval`/`unsafe-inline` | Erhoehte XSS-Auswirkung | Mittel | Nonce/Hashes und minimale Quellen | Automatischer Header-/CSP-Test | `middleware.ts` |
| Unvollstaendiger SSRF-Schutz | Zugriff auf interne Dienste/Metadaten | Hoch | DNS-/Redirect-Revalidierung und Egress-Allowlist | SSRF-Testkorpus fuer URLs/Webhooks/Preview | URL- und Webhookvalidierung |
| Security-Logs nur stdout und teils fail-open | Spaete Erkennung, fehlende Beweise | Hoch | Zentrales SIEM, Alarme, manipulationsgeschuetzte Auditspur | Monatlicher Alarmtest | `lib/security.ts`, `lib/audit-log.ts` |
| Schema-Push im Build/Start, Start trotz Fehler | Inkonsistentes oder unautorisiertes Schema | Mittel | Separates blockierendes Migrations-Gate mit Backup | Releaseprotokoll und Schema-Drift-Check | Upgrade-/Entrypoint-Skripte |
| Neun moderate Audit-Findings | Build-/Laufzeitkompromittierung | Mittel | Advisory-spezifisch patchen oder befristet akzeptieren | Monatliches SCA und Fristenkontrolle | Audits vom 20.07.2026 |
| Kein nachgewiesenes Backup/Restore | Dauerhafter Datenverlust | Mittel | Verschluesselte Backups und Restore-Test | Jaehrlicher Restore-Nachweis | Klaerungsbeduerftig; Owner Betrieb |
| CI baut ohne Test/Lint/Security-Scan | Fehlerhafte oder unsichere Images | Hoch | Blockierende Quality Gates | Branchschutz und gruene Checks | Docker-Workflow |
| Externe IP-Uebermittlung per HTTP | Datenoffenlegung und Datenschutzvorfall | Hoch | Aufruf aussetzen/HTTPS und Datenschutzfreigabe | Egress- und Integrationstest | `lib/analytics.ts` |

## Pflegeprozess
Die Richtlinie wird mindestens jaehrlich und nach Sicherheitsvorfaellen, wesentlichen Architektur- oder Rechtsaenderungen aktualisiert. Informationssicherheit koordiniert die Revision; die Leitung genehmigt.

Jede Revision umfasst:

1. Abgleich aller Aussagen mit Repository und produktiver Konfiguration;
2. Review von Rollen, Zugriffsrechten, Secrets, Lieferanten und Ausnahmen;
3. aktuelle SAST-, SCA-, Lizenz-, Container- und Penetrationstestnachweise;
4. Stichprobe von Auth-, Owner-, CSRF-, SSRF-, Ablauf- und Loeschkontrollen;
5. Backup-Restore-, Alarm- und Incident-Uebungsnachweis;
6. Aktualisierung von Risiko-, Massnahmen- und Revisionshistorie.

Richtlinienverstoesse werden als Sicherheitsereignis registriert. Ueberfaellige hohe Risiken werden an die Leitung eskaliert; kritische unkontrollierte Risiken koennen eine Aussetzung der betroffenen Funktion erfordern.

## Revisionshistorie
| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 20.07.2026 | Compliance-Dokumentation | Ersterstellung der vollstaendigen Sicherheitsrichtlinie mit Ist/Soll-Abgleich und technischen Restrisiken | Fehlende interne Sicherheitsrichtlinie |
| 20.07.2026 | Compliance-Dokumentation | Passkey-Login auf dedizierte Attempt-Tabelle, parallele Ceremonies, atomaren NextAuth-Verbrauch, registrierte Migration und 10 Tests aktualisiert; Betriebs-/E2E-Evidenz bleibt offen | Reviewfixes bis Commit `6618792` |
