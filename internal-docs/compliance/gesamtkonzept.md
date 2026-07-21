# Compliance- und Sicherheitsgesamtkonzept
## Einleitung
Dieses Dokument beschreibt das strategische Compliance-, Datenschutz- und Informationssicherheitsmodell fuer Zhort. Die Anwendung ist ein internetexponierter URL-Shortener und Pastebin auf Next.js 16 mit PostgreSQL und Drizzle ORM. Sie bietet anonyme sowie kontogebundene Inhalte, Link-Analytics, Teams, API-Schluessel, Webhooks, SSO, Passkeys, verschluesselte Passwortfreigaben und P2P-Dateifreigaben.

Die Bestandsaufnahme basiert auf dem technischen Repository-Stand vom 21.07.2026, Commit `9cfdeea`, insbesondere `package.json`, `package-lock.json`, `lib/db/schema.ts`, den API-Routen, `middleware.ts`, `next.config.ts`, `Dockerfile`, `.github/workflows/docker-image.yml` und den Migrationen `drizzle/0000_*.sql` bis `drizzle/0004_secure_passkey_auth.sql`. Aussagen ueber Produktivkonfiguration, Vertraege oder gelebte Prozesse werden nur getroffen, wenn Repository-Nachweise vorliegen.

Das Konzept ist keine Behauptung einer ISO-27001-Zertifizierung. Es bildet den nachweisbaren Ist-Stand, verbindliche Soll-Kontrollen und klaerungsbeduerftige Betriebsinformationen getrennt ab.

## Geltungsbereich
Der Geltungsbereich umfasst:

- Quellcode, Konfiguration, Abhaengigkeiten und Datenbankmigrationen im Zhort-Repository;
- Webanwendung, API, Authentifizierung und Autorisierung;
- PostgreSQL-Datenhaltung einschliesslich Inhalts-, Identitaets-, Analytics-, Audit-, Team- und Signalisierungsdaten;
- Build und Auslieferung als Next.js-Standalone-Anwendung, Docker-Image und GitHub-Actions-Workflow;
- moegliche Bereitstellung auf Vercel sowie Docker-basierte Bereitstellungen;
- externe Datenfluesse zu SSO-Providern, Google Safe Browsing, ip-api.com, jsDelivr/Hagezi, nutzerdefinierten Webhooks und Google-STUN-Servern;
- Datenschutz, Informationssicherheit, Open-Source-Lizenzen, Lieferkette, Vorfallbehandlung und Kontinuitaet.

Nicht als nachgewiesener Ist-Stand gelten Hostingstandort, produktiver Hostinganbieter, Backupkonfiguration, Auftragsverarbeitungsvertraege, Supportorganisation, Mitarbeitende, Zertifizierungen und produktive Geheimnisverwaltung. Diese Punkte sind im Dokument als klaerungsbeduerftige Information gefuehrt.

## Begriffe und Definitionen
| Begriff | Definition |
|---|---|
| Asset | Schutzbeduerftige Information, Komponente, Dienstleistung oder Nachweis. |
| Kontrolle | Technische oder organisatorische Massnahme zur Risikoreduktion. |
| Restrisiko | Risiko, das nach wirksamer Umsetzung einer Kontrolle verbleibt. |
| RACI | Responsible, Accountable, Consulted, Informed. |
| VVT | Verzeichnis von Verarbeitungstaetigkeiten nach Art. 30 DSGVO. |
| TOM | Technische und organisatorische Massnahme nach Art. 32 DSGVO. |
| ISMS | Managementsystem fuer Informationssicherheit. |
| SSO | Anmeldung ueber einen externen OpenID-Connect- oder Azure-AD-Provider. |
| Passkey | WebAuthn-Credential mit privatem Schluessel beim Authenticator und oeffentlichem Schluessel im Dienst. |
| Klaerungsbeduerftige Information | Operative oder vertragliche Tatsache, die im Repository nicht belegt ist; sie erfordert einen benannten Owner, einen Nachweis und eine Kontrollfrist. |

## Verantwortlichkeiten
Die Rollen sind funktional definiert. Ihre namentliche Besetzung ist eine klaerungsbeduerftige Information. Owner ist die Leitung; Kontrolle ist ein freigegebenes Rollenregister vor produktiver Anwendung dieses Konzepts und danach eine quartalsweise Bestaetigung.

| Aktivitaet | Leitung / Service Owner | Technischer Betrieb | Entwicklung | Datenschutz | Informationssicherheit |
|---|---|---|---|---|---|
| Risikogrenzen und Risikoakzeptanz | A | C | C | C | R |
| Architektur und sichere Entwicklung | I | C | A/R | C | C |
| Deployment, Backup, Wiederherstellung | I | A/R | C | I | C |
| VVT, Betroffenenrechte, DSFA-Pruefung | A | C | C | R | C |
| Schwachstellen- und Patchmanagement | I | C | R | I | A |
| Lieferanten- und Lizenzpruefung | A | C | R | C | C |
| Sicherheitsvorfall und Datenschutzverletzung | A | R | C | R | R |
| Nachweisfuehrung und interne Kontrolle | A | R | C | C | R |

R = ausfuehrend, A = rechenschaftspflichtig, C = konsultiert, I = informiert. Eine Person darf mehrere Rollen innehaben; Risikoakzeptanz und Kontrollpruefung muessen dennoch nachvollziehbar getrennt freigegeben werden.

## Detailbeschreibung
### Strategische Ziele
1. Vertraulichkeit von Konten, nichtoeffentlichen Inhalten, Schluesseln und SSO-Konfigurationen.
2. Integritaet von Weiterleitungszielen, Pastes, Authentisierungsentscheidungen und Auditnachweisen.
3. Verfuegbarkeit des Redirect- und Paste-Dienstes mit nachweisbarer Wiederherstellbarkeit.
4. Rechtmaessige, transparente und minimierte Verarbeitung personenbezogener Daten.
5. Kontrollierte Softwarelieferkette mit reproduzierbaren Versionen, Lizenzpruefung und risikobasiertem Patchen.
6. Nachweisbare Trennung von implementierten, nur geplanten und nicht belegten Kontrollen.

### Schutzbedarf und Risikogrenzen
Die folgenden Grenzen sind die Soll-Risikoappetit-Erklaerung; ihre formale Freigabe ist klaerungsbeduerftige Information. Owner ist die Leitung, Kontrolle ist eine signierte Freigabe mit jaehrlicher Neubewertung.

| Kategorie | Risikoappetit | Behandlung |
|---|---|---|
| Unbefugter Zugriff, Token- oder Schluesseloffenlegung | Null bis sehr niedrig | Kein bewusst unkontrolliertes hohes oder kritisches Risiko; sofortige Sperrung und Ursachenbehebung. |
| Datenschutzverstoss oder unzulaessige Drittlanduebermittlung | Null | Verarbeitung aussetzen, Datenschutz einbeziehen, Meldepflicht bewerten. |
| Datenverlust und fehlende Wiederherstellbarkeit | Sehr niedrig | Backup und Restore-Test muessen vor Produktivfreigabe nachgewiesen sein. |
| Kritische Schwachstelle in internetexponierter Laufzeit | Null | Innerhalb von 24 Stunden bewerten und kompensieren oder Dienst isolieren. |
| Hohe Schwachstelle | Niedrig | Innerhalb von 7 Tagen behandeln oder befristet durch Leitung und Informationssicherheit akzeptieren. |
| Moderate Schwachstelle | Begrenzt | Innerhalb von 30 Tagen bewerten; Abweichung mit Ausnutzbarkeit, Exposition, Kontrolle und Ablaufdatum dokumentieren. |
| Verfuegbarkeitsbeeintraechtigung ohne Datenverlust | Mittel | Akzeptabel nur innerhalb festgelegter RTO/RPO; konkrete Werte sind klaerungsbeduerftig. |
| Neue Tracking- oder Marketingverarbeitung | Sehr niedrig | Nur nach VVT-, Rechtsgrundlagen-, Transparenz- und Einwilligungspruefung. |

### Architektur und Datenfluesse
| Quelle | Ziel | Daten | Zweck | Nachweisbare Kontrollen | Offener Punkt |
|---|---|---|---|---|---|
| Browser | Next.js-App/API | URL, Paste, E-Mail, Passwort, Session, Metadaten | Dienstbereitstellung | Zod-Validierung in zentralen Routen, Header/CSP, HTTPS-HSTS-Sollheader, Rate Limits; Paste-Passwoerter nur im Unlock-POST mit bcrypt und gebundenem HttpOnly-Nachweis | CSP erlaubt `unsafe-inline` und `unsafe-eval`; CSRF-Nutzung ausserhalb NextAuth und produktiver Paste-Cookie-/Proxy-Nachweis sind nicht belegt. |
| Next.js | PostgreSQL | Konten, Passkey-Auth-Versuche, Hashes, Links, Pastes, Klickdaten, Teams, Tokens, Auditdaten | Persistenz | Drizzle-Abfragen, Fremdschluessel, bcrypt/SHA-256 je Anwendungsfall, Passkey-Ablaufindizes | Verschluesselung ruhender Daten, DB-TLS, operative Anwendung der Attempt-Tabellenmigration und `drizzle/meta/0004_snapshot.json` sind nicht belegt. |
| Redirect-Route | ip-api.com | Vollstaendige Client-IP | Geo-Analytics | Fehler werden abgefangen | `lib/analytics.ts` nutzt HTTP; Rechtsgrundlage, Vertrag, Empfaengerstandort und IP-Anonymisierung sind nicht belegt. |
| Linkanlage | Google Safe Browsing | Vollstaendige Ziel-URL | Phishingpruefung | Optionaler API-Key, Fehlerbehandlung | Kontrolle arbeitet bei fehlendem Key oder Fehler fail-open. |
| Blocklist-Service | jsDelivr/Hagezi | Abrufmetadaten | Domainblockliste | Tagesintervall im Code, DB-Cache | Produktive Aktualisierung und Verfuegbarkeitsmonitoring sind nicht belegt. |
| App | SSO-Provider | Code, Client-ID/-Secret, E-Mail/Profil | OIDC/Azure-AD-Anmeldung | Domainabgleich, kurzlebiger Single-Use-Login-Token | OAuth-State ist nur Base64-codiert; SSO-Client-Secret liegt als Klartextfeld in PostgreSQL. |
| App | Nutzer-Webhooks | Ziel-URL, Link- und Klickdaten einschliesslich IP/User-Agent/Referer | Ereignisintegration | HTTPS-Validierung bei Anlage, HMAC-SHA-256-Signatur | Auftragsrolle, Empfaengerfreigabe, SSRF-Schutz und Datenminimierung sind nicht vollstaendig belegt. |
| Browser | Google-STUN | Netzwerkadressen/ICE-Metadaten | P2P-Verbindungsaufbau | Datei bleibt laut Code peer-to-peer | Transparenz, Einwilligung/Rechtsgrundlage und Transferpruefung sind nicht belegt. |
| GitHub Actions | GHCR | Quellkontext, Image, Metadaten | Docker-Build und Registry | `npm ci`, Buildx, eingeschraenkte Workflow-Permissions | Workflow fuehrt keine Tests, kein Linting, kein `npm audit` und kein Image-Scanning aus. |
| Hostingplattform | Nutzer | Webanwendung | Betrieb | Vercel-Unterstuetzung im Code; nicht-root Docker-Runner | Tatsaechlich genutzte Plattform, Region, DPA, Subprozessoren und Logging sind klaerungsbeduerftig. |

`@vercel/blob` ist im Manifest und Lockfile enthalten, im durchsuchten Anwendungscode wurde aber keine Nutzung gefunden. Eine Blob-Datenuebertragung darf daher nicht als Ist-Datenfluss behauptet werden.

### Authentisierungsmodell
- NextAuth verwendet Credentials und JWT-Sessions mit 24 Stunden Maximalalter; das Session-Cookie ist `httpOnly`, `sameSite=lax` und in Produktion `secure`.
- Kontopasswoerter werden mit bcrypt Kostenfaktor 12 gespeichert. API-Schluessel werden zufaellig erzeugt, nur einmal im Klartext ausgegeben und als bcrypt-Hash gespeichert.
- Passkey-Authentisierung begrenzt Starts ueber das datenbankgestuetzte `passkey_auth_start`-Limit auf 10 Anfragen je Client-IP in 5 Minuten, purgt bei jedem Start abgelaufene Attempts und legt eine eigene `passkey_auth_attempts`-Zeile unter einer zufaelligen opaken Ceremony-ID an; so koennen mehrere Ceremonies desselben Nutzers parallel bestehen. Die Challenge ist fuenf Minuten gueltig und wird vor der WebAuthn-Pruefung nur gelesen. Nach erfolgreichem Nachweis aktualisiert SQL den Authenticator-Zähler mit `GREATEST` monoton, schliesst ein bedingtes Update genau einen Attempt atomar ab, stellt einen zufaelligen 32-Byte-Login-Token aus und speichert nur dessen SHA-256-Hash fuer zwei Minuten. NextAuth verbraucht ihn durch atomare Loeschung der passenden Attempt-Zeile. Migration: `drizzle/0004_secure_passkey_auth.sql` mit zwei Ablaufindizes, registriert in `drizzle/meta/_journal.json`; `drizzle/meta/0004_snapshot.json` fehlt.
- Die Passkey-Registrierung uebergibt die Challenge derzeit an den Client und nimmt sie bei der Verifikation wieder vom Client entgegen. Das ist nicht dieselbe serverseitige Challenge-Kontrolle wie beim Login und bleibt ein offenes Sicherheitsrisiko.
- SSO-Login-Tokens sind fuenf Minuten gueltig und werden nach erfolgreicher NextAuth-Anmeldung geloescht. Die vorgelagerte OIDC-State- und Secret-Behandlung ist nur teilweise abgesichert.

### Operating Model
| Phase | Verbindliche Aktivitaet | Aktueller Repository-Nachweis | Klaerungsbeduerftige Information und Kontrolle |
|---|---|---|---|
| Planen | Schutzbedarf, VVT, Bedrohungs- und DSFA-Schwellenpruefung | Diese Dokumentenreihe, Schema und Datenflussanalyse | Freigabe durch Leitung/Datenschutz; Nachweis je Release mit neuer Verarbeitung. |
| Entwickeln | Review, Tests, Geheimnisfreiheit, Migration | Git-Historie; zwoelf Vitest-Tests in drei Dateien fuer Passkey-Attempts, Startbereinigung, Login-Token und NextAuth-Credentials-Grenze | Reale PostgreSQL-Konkurrenz-/WebAuthn-E2E-Tests, Branchschutz, Reviewer-Regeln und Secret-Scanning; Owner Entwicklung, quartalsweiser Nachweis. |
| Bauen | Lockfile-basierter Build, SCA, Lint, Test, Artefaktscan | `npm ci` im Dockerfile; ein Docker-Workflow | Quality Gates fehlen im Workflow; Owner Entwicklung, Kontrolle je Pull Request. |
| Bereitstellen | Genehmigtes Release, Migration, Rollback | `prebuild`; verpflichtender Schema-Push in `upgrade.js`; Docker-Entrypoint verweigert Start bei Bootstrapfehler | Tatsaechlicher Staging-Migrations-, Freigabe- und Rollbacknachweis sowie fehlender `0004`-Snapshot; Owner Betrieb, je Release. |
| Betreiben | Monitoring, Backup, Restore, Kapazitaet, Zugriffskontrolle | Prozesslogs, DB-Audittabellen, Rate Limits | SIEM, Alerting, Backup, RTO/RPO, Zugriffsreviews; Owner Betrieb/Informationssicherheit. |
| Erkennen/Reagieren | Triage, Eindämmung, Beweissicherung, Meldung | Security-Events werden auf stdout geschrieben | Rufbereitschaft, Incident-Runbook, 72-Stunden-DSGVO-Prozess; Owner Informationssicherheit/Datenschutz. |
| Verbessern | Metriken, Ursachenanalyse, Risiko- und Dokumentenreview | Git und Revisionshistorien | Regelmaessiges Managementreview; Owner Leitung, mindestens jaehrlich. |

### Zentrale klaerungsbeduerftige Informationen
| Information | Owner | Verbindliche Kontrolle / Nachweis |
|---|---|---|
| Namentliche Rollen und Freigabebefugnisse | Leitung | Signiertes Rollenregister; quartalsweise Rezertifizierung. |
| Hostinganbieter, Region, Subprozessoren, DPA und Transfermechanismen | Datenschutz | Lieferantenakte vor Produktivbetrieb; jaehrliche und anlassbezogene Pruefung. |
| Backup, Verschluesselung, Restore, RTO und RPO | Technischer Betrieb | Dokumentierte Konfiguration und mindestens jaehrlicher Restore-Test. |
| Zentrale Logs, Aufbewahrung, Alarmierung und Zugriff | Informationssicherheit | Loggingkonzept, Testalarm und monatlicher Stichprobennachweis. |
| Produktive Secrets und Rotation | Technischer Betrieb | Secret-Inventar ohne Werte, Rotationsnachweis, Zugriffsliste. |
| Risikoakzeptanzen und Ausnahmefristen | Leitung / Informationssicherheit | Signiertes Risikoregister mit Ablaufdatum und kompensierenden Kontrollen. |

## Nachweise und Artefakte
- `package.json`, `package-lock.json`: Next.js 16, direkte und transitive Abhaengigkeiten, reproduzierbare Versionen.
- `lib/db/schema.ts`, `drizzle/*.sql`: Datenkategorien, Beziehungen, Loeschkaskaden, Authentisierungsfelder und Migrationen.
- `lib/auth/config.ts`, `lib/auth/actions.ts`: JWT-Session, Credentials, SSO- und Passkey-Handoff, bcrypt.
- `lib/auth/passkey-auth-attempt.ts`: opak adressierte fuenfminuetige Challenges, Purge abgelaufener Attempts bei jedem Start, atomarer Attempt-Abschluss und zweiminuetiges gehashtes Login-Token mit atomarer Zeilenloeschung.
- `lib/auth/passkey-challenge.test.ts`, `lib/auth/passkey-login-token.test.ts`, `lib/auth/config.test.ts`: zwoelf erfolgreiche Vitest-Tests am 20.07.2026 fuer Parallelitaet, Ablauf, Startbereinigung, Hashing, Einmalverwendung und die NextAuth-Credentials-Grenze.
- `middleware.ts`, `next.config.ts`, `lib/api-security.ts`, `lib/rate-limit.ts`: Header, CSP, Eingabepruefung und Rate Limits.
- `app/s/[shortCode]/route.ts`, `lib/analytics.ts`, `lib/webhooks.ts`: Redirect-, Analytics- und Empfaenger-Datenfluesse.
- `app/protected/paste/[slug]/page.tsx`, `app/api/pastes/[slug]/unlock/route.ts`, `app/p/[slug]/page.tsx`, `app/p/[slug]/raw/route.ts`, `lib/paste-access.ts`, `lib/rate-limit.ts`: technisch geschlossener Paste-Passwort- und Raw-/Ablauf-Bypass mit POST, bcrypt, HMAC-Cookie, transaktionalem Advisory-Lock, Fail-closed-Speicherfehler und 19 Regressionstests.
- `Dockerfile`, `.github/workflows/docker-image.yml`, `scripts/run-upgrade-if-configured.js`, `scripts/upgrade.js`, `scripts/docker-entrypoint.js`: Build-, Container- und Migrationspfade; Schema-Push ist im Upgrade Pflicht und der Containerstart bei Bootstrapfehler fail closed. Der lokale Build bestand ohne `DATABASE_URL`, uebersprang dabei aber das Upgrade.
- `app/datenschutz/page.tsx`: oeffentliche Datenschutzdarstellung; sie ist kein Ersatz fuer das interne VVT.
- Pruefbefehl `npm audit --json` am 20.07.2026: 9 moderate, 0 hohe, 0 kritische Findings. `npm audit --omit=dev --json` meldete dieselben 9 Findings; sie sind daher nicht als rein entwicklungsbezogen einzustufen.

## Risiken und Kontrollen
| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Ungeklaerte Hosting- und Transferkette | Rechtswidrige Verarbeitung, Auditabweichung | Mittel | Anbieter, Region, DPA, Subprozessoren und Transfergrundlage erfassen | Datenschutzfreigabe vor Produktivbetrieb und jaehrlich | Lieferantenakte; derzeit klaerungsbeduerftig |
| Vollstaendige IP an ip-api.com ueber HTTP | Vertraulichkeitsverlust, unzulaessiger Empfaengertransfer | Hoch | Aufruf aussetzen oder HTTPS-konformen, vertraglich geprueften Dienst mit Datenminimierung einsetzen | Datenschutz- und Security-Gate fuer externe Telemetrie | `lib/analytics.ts` |
| Kein nachgewiesenes Backup/Restore | Dauerhafter Datenverlust | Mittel | Verschluesselte Backups, RTO/RPO und Restore-Test einrichten | Jaehrlicher Restore-Test und monatliche Backupkontrolle | Klaerungsbeduerftig; Owner Betrieb |
| Lueckenhafte CI-Quality-Gates | Unsichere oder fehlerhafte Releases | Hoch | Test, Lint, SCA und Image-Scan als blockierende Checks | Pull-Request-Schutz und protokollierte Checks | `.github/workflows/docker-image.yml` |
| Moderate Abhaengigkeitsschwachstellen | Ausnutzung in Build oder Laufzeit | Mittel | Je Advisory Exposition bewerten, Updates testen, Ausnahme befristen | Monatlicher SCA-Lauf und 30-Tage-Frist | `npm audit` vom 20.07.2026 |
| Nicht zentralisierte Security-Logs | Spaete Erkennung, unvollstaendige Beweise | Hoch | Strukturierte, manipulationsgeschuetzte zentrale Logs und Alarme | Monatlicher Alarmtest und Zugriffsreview | `lib/security.ts` schreibt nur stdout |
| Passkey-Registrierung vertraut Client-Challenge | Manipulierte Registrierung | Mittel | Challenge serverseitig binden, befristen und einmalig verbrauchen | Integrationstest fuer Replay, Ablauf und Nutzerbindung | `app/api/passkeys/register/*`, `lib/passkeys.ts` |
| SSO-State und Client-Secret unzureichend geschuetzt | Login-CSRF, Secret-Offenlegung | Mittel | Signierter/zufaelliger State mit Serverbindung; Secret-Vault oder Feldverschluesselung | SSO-Sicherheitsreview vor Aktivierung | `app/api/auth/sso/*`, `lib/db/schema.ts` |
| Paste-Passwortschutz, Zugriffsnachweis oder Versuchslimit regrediert; produktive Cookie-/Secret-/Live-DB-Konfiguration ist unbestaetigt | Unbefugte Offenlegung vertraulicher Inhalte | Niedrig nach Codefix, betrieblich unbestaetigt | POST-basierten bcrypt-Vergleich, HMAC-Bindung, konsistente Haupt-/Raw-/Ablaufkontrollen, Advisory-Lock und Fail-closed-Speicherfehler erhalten | 19 Regressionstests sowie produktionsnaher Browser-, Cookie-, Proxy-Log- und PostgreSQL-Konkurrenztest | Paste-Routen, `lib/paste-access.ts`, `lib/rate-limit.ts`; technischer Commit `9cfdeea` |
| P2P-Signalisierung prueft Token, Access-Key und Ablauf nicht | Manipulation oder Offenlegung von Verbindungsmetadaten | Hoch | Signalisierung serverseitig an alle drei Kontrollen binden | Negative API-Tests und Auditereignis | `app/api/p2p/files/[shareId]/route.ts` |
| Abgelaufene Daten werden nicht durchgaengig zeitgesteuert geloescht; Passkey-Attempts werden nur bei einem weiteren Start gepurgt | Ueberlange Speicherung | Hoch | Vorhandenen Start-Purge beibehalten und geplanten unabhaengigen Purge mit referenzieller Loeschung und Protokoll ergaenzen | Taeglicher Job, Fehleralarm, monatliche Stichprobe | Gueltigkeitspruefungen, Token-Loeschung und Start-Purge im Code; allgemeiner zeitgesteuerter Purge nicht belegt |
| Passkey-Migration hat keinen `0004`-Snapshot und keine Staging-Evidenz | Schema-Drift oder fehlende Tabelle/Indizes im Zielsystem | Mittel | Snapshotabweichung aufloesen und verpflichtenden Upgradepfad in Staging ausfuehren | Schemaabfrage und archiviertes Upgradeprotokoll vor Freigabe | Journal und SQL vorhanden; `drizzle/meta/0004_snapshot.json` und tatsaechlicher Staginglauf fehlen |
| Rollen sind nicht namentlich zugeordnet | Kontrollen bleiben ohne Verantwortliche | Hoch | Rollenregister freigeben | Quartalsweise Rezertifizierung | Klaerungsbeduerftig; Owner Leitung |

## Pflegeprozess
Der Service Owner veranlasst mindestens jaehrlich sowie bei wesentlichen Aenderungen eine Revision. Wesentliche Aenderungen sind neue Datenkategorien, Empfaenger, Hostingregionen, Authentisierungsverfahren, Trackingfunktionen, kritische Abhaengigkeiten, Sicherheitsvorfaelle und Rechtsaenderungen.

Jede Revision muss:

1. Repository-Nachweise gegen den produktiven Stand abgleichen;
2. Datenfluesse, VVT, TOM, ISO-Mapping, Lizenzinventar und Risikoregister synchronisieren;
3. `npm audit` und eine Lizenzinventarisierung auf dem Lockfile ausfuehren;
4. offene Informationen mit Owner, Frist, Nachweis und Eskalation fuehren;
5. Risikoakzeptanzen befristen und durch die rechenschaftspflichtige Rolle freigeben;
6. die Revisionshistorie aktualisieren.

Abweichungen duerfen nicht durch Formulierungen als implementiert dargestellt werden. Fehlende Evidenz fuehrt zum Status „klaerungsbeduerftig“ oder „nicht belegt“.

## Revisionshistorie
| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 20.07.2026 | Compliance-Dokumentation | Ersterstellung auf Basis einer Repository- und Lockfile-Analyse; Ist/Soll-Trennung, Datenfluesse, Operating Model und Risikogrenzen aufgenommen | Fehlende interne Compliance-Dokumentation |
| 20.07.2026 | Compliance-Dokumentation | Passkey-Architektur nach Reviewfixes auf dedizierte Attempt-Zeilen, parallele Ceremonies, registrierte Migration und damaligen Teststand aktualisiert; operative und E2E-Nachweise bleiben offen | Reviewfixes bis Commit `6618792` |
| 20.07.2026 | Compliance-Dokumentation | Startlimit, Purge bei jedem Start, Ablaufindizes, monotone Zähler, 12 Tests und fehlerschliessenden Schema-Bootstrap aufgenommen; reale DB-/WebAuthn-/Staging-Evidenz und `0004_snapshot.json` bleiben offen | Finales Hardening bis Commit `8611a8d` |
| 21.07.2026 | Compliance-Dokumentation | Paste-Datenfluss, geschlossenen Passwort-/Raw-/Ablauf-Bypass, gebundenen HttpOnly-Nachweis, transaktionales Fail-closed-Limit und 19 Regressionstests aufgenommen; produktive Cookie-/Proxy-/Secret-/Live-DB-Evidenz bleibt offen | Daily Evolution bis Commit `9cfdeea` |
