# Datenschutzkonzept und DSGVO-Verzeichnis
## Einleitung
Dieses Dokument verbindet das interne Verzeichnis von Verarbeitungstaetigkeiten (VVT), die Datenschutzkontrollen und die nach Repository-Stand erkennbare Lueckenanalyse fuer Zhort. Es basiert auf dem Code- und Datenbankschema vom 20.07.2026, Commit `58c06b7`.

Die oeffentliche Seite `app/datenschutz/page.tsx` beschreibt unter anderem anonymisierte Analytics. Der Code speichert jedoch in `link_clicks` die vollstaendige IP-Adresse und uebermittelt sie in `lib/analytics.ts` ueber HTTP an `ip-api.com`. Diese Abweichung ist materiell: Die oeffentliche Information ist ohne technische Aenderung oder korrigierte Transparenz nicht durch den Code belegt.

Rechtsgrundlagen in diesem Dokument sind eine interne Zuordnung und muessen durch die datenschutzverantwortliche Rolle fuer das konkrete Geschaeftsmodell, den Nutzervertrag und die produktive Konfiguration freigegeben werden. Eine solche Freigabe ist derzeit klaerungsbeduerftige Information.

## Geltungsbereich
Das Konzept gilt fuer:

- Besucher, anonyme Inhaltsersteller, registrierte Nutzer, Teammitglieder, Administratoren und Empfaenger geteilter Inhalte;
- Konten, Credentials, JWT-Sessions, SSO und Passkeys;
- Links, Pastes, Bio-Profile, Teams, Kommentare, Webhooks, API-Schluessel und benutzerdefinierte Domains;
- Klick- und Nutzungsanalytics, Rate Limits, Security- und Auditdaten;
- verschluesselte Passwortfreigaben und P2P-Dateifreigabemetadaten;
- PostgreSQL, Anwendungslaufzeit, Logs, Build-/Deploymentdienste und externe Empfaenger.

Nicht als Ist-Verarbeitung belegt ist die Nutzung von Vercel Blob: Das Paket ist installiert, im Anwendungscode wurde keine Verwendung gefunden. Ebenfalls nicht belegt sind ein Kontaktformular-Backend, Marketing-Cookies oder ein produktiv aktiviertes Tracking-Pixel; Konfigurationsfelder und Verwaltungsrouten allein belegen noch keine Ausfuehrung.

## Begriffe und Definitionen
| Begriff | Definition |
|---|---|
| Verantwortlicher | Stelle, die ueber Zwecke und Mittel der Verarbeitung entscheidet. |
| Auftragsverarbeiter | Dienstleister, der personenbezogene Daten im Auftrag verarbeitet. |
| Betroffener | Identifizierte oder identifizierbare natuerliche Person. |
| VVT | Verzeichnis nach Art. 30 DSGVO mit Zweck, Kategorien, Empfaengern, Fristen und TOM. |
| Rechtsgrundlage | Erlaubnistatbestand, insbesondere Art. 6 Abs. 1 DSGVO. |
| Loeschfrist | Zeitpunkt, zu dem Daten physisch geloescht oder wirksam anonymisiert werden. Eine blosse Zugriffssperre nach Ablauf ist keine Loeschung. |
| TOM | Technische und organisatorische Massnahmen nach Art. 32 DSGVO. |
| DSFA | Datenschutz-Folgenabschaetzung nach Art. 35 DSGVO bei voraussichtlich hohem Risiko. |
| Drittlandtransfer | Uebermittlung ausserhalb EU/EWR, die Kapitel V DSGVO unterliegt. |
| Klaerungsbeduerftige Information | Nicht im Repository belegte operative, rechtliche oder vertragliche Tatsache mit zugewiesenem Owner und Kontrollnachweis. |

## Verantwortlichkeiten
`app/datenschutz/page.tsx` nennt Michel Fritzsch als verantwortliche Stelle und verweist fuer Kontaktdaten auf ein externes Impressum. Rechtsform, ladungsfaehige Anschrift, Datenschutzkontakt und gegebenenfalls ein Datenschutzbeauftragter sind im Repository nicht vollstaendig belegt. Owner ist die Leitung; Kontrolle ist eine rechtlich gepruefte Anbieter- und Kontaktakte vor Produktivbetrieb.

| Aktivitaet | Leitung / Verantwortlicher | Datenschutz | Technischer Betrieb | Entwicklung | Informationssicherheit |
|---|---|---|---|---|---|
| Zwecke und Rechtsgrundlagen freigeben | A | R | C | C | C |
| VVT und Datenschutzhinweise pflegen | I | A/R | C | C | C |
| Betroffenenanfragen bearbeiten | A | R | C | C | I |
| Loeschung und Aufbewahrung umsetzen | I | A | R | R | C |
| Auftragsverarbeiter und Transfers pruefen | A | R | C | I | C |
| TOM definieren und testen | I | C | R | R | A |
| DSFA-Screening und DSFA | A | R | C | C | C |
| Datenschutzverletzung bewerten/melden | A | R | R | C | R |

R = ausfuehrend, A = rechenschaftspflichtig, C = konsultiert, I = informiert. Namentliche Rollenbesetzung und Stellvertretung sind klaerungsbeduerftig; Kontrolle ist ein quartalsweise bestaetigtes Rollenregister.

## Detailbeschreibung
### VVT
| Verarbeitung | Betroffene / Datenkategorien | Zweck | Vorgesehene Rechtsgrundlage | Empfaenger | Ist-Aufbewahrung und Kontrolle |
|---|---|---|---|---|---|
| Registrierung und Konto | Nutzer; E-Mail, bcrypt-Passwort-Hash, Rolle, Erstellzeit | Konto und Vertrag/Dienst | Art. 6 Abs. 1 lit. b; Sicherheitsanteile lit. f | Hosting/DB-Anbieter, intern Berechtigte | Bis Admin-Loeschung; Selbstloeschprozess und konkrete Frist sind nicht belegt. FK-Kaskaden loeschen viele Kinddaten. |
| JWT-Session und Login | Nutzer; E-Mail, User-ID, Rolle, JWT, IP, Erfolgs-/Fehlerdetails | Authentisierung, Missbrauchsschutz | Art. 6 Abs. 1 lit. b und lit. f | NextAuth-Laufzeit, Plattformlogs | JWT maximal 24 Stunden; stdout-Logfristen klaerungsbeduerftig. |
| Passkeys | Nutzer; Credential-ID, oeffentlicher Schluessel, Counter, Geraetename/-typ, Nutzung, Challenge/Token-Hash | Passwortlose Authentisierung | Art. 6 Abs. 1 lit. b; Sicherheit lit. f | DB-Anbieter | Challenge 5 Minuten nutzbar, Login-Token 2 Minuten nutzbar und bei Erfolg Single-Use; abgelaufene Feldwerte werden nicht nachweisbar zeitgesteuert bereinigt. |
| SSO | Organisationsnutzer; Domain, E-Mail, IdP-Profil, Providerkonfiguration, Client-Secret, Kurzzeittoken | Unternehmensanmeldung | Art. 6 Abs. 1 lit. b; gegebenenfalls Vereinbarung mit Organisation | Konfigurierter OIDC/Azure-AD-Provider | Login-Token 5 Minuten nutzbar und bei Erfolg geloescht; abgelaufene Werte, Secrets und Providerfristen klaerungsbeduerftig. |
| URL-Shortener | Ersteller, Zielseiteninhaber, Klickende; Ziel-URL, Shortcode, Owner-ID, UTM, Schutz-/Ablaufdaten | Linkbereitstellung | Art. 6 Abs. 1 lit. b; anonym lit. f nach Interessenabwaegung | Oeffentlichkeit bei oeffentlichen Links, Hosting/DB, Webhookempfaenger | Optionales Ablaufdatum sperrt Zugriff, loescht Datensatz aber nicht; sonst bis Einzel- oder Kontoloeschung. |
| Pastebin | Ersteller/Betroffene im Inhalt; Paste-Inhalt, Sprache, Owner-ID, Schutz-/Ablaufdaten | Inhaltsfreigabe | Art. 6 Abs. 1 lit. b; anonym lit. f nach Interessenabwaegung | Oeffentlichkeit bei oeffentlichen Pastes, Hosting/DB | Optionales Ablaufdatum; kein Purge belegt. Die Hauptansicht akzeptiert bei geschuetzten Pastes jedes nichtleere Passwort ohne Hashvergleich; die Raw-Route prueft weder Ablauf noch Passwort. |
| Link-Analytics | Klickende; volle IP, User-Agent, Referer, Zeit, Land/Stadt, Geraet, Browser, OS | Statistik, Missbrauchserkennung, Produktanalyse | Lit. f nur nach dokumentierter Interessenabwaegung und Erforderlichkeit; fuer nicht erforderliche Analyse gegebenenfalls Einwilligung lit. a und Endgeraeterecht | Linkinhaber, DB, `ip-api.com`, Webhookempfaenger | Bis Linkloeschung per Kaskade, sonst unbefristet; keine IP-Anonymisierung oder separate Loeschfrist implementiert. |
| Security, Rate Limit, Blocklist | Besucher/Nutzer; IP oder User-ID, Aktion, Zeit, URL bei Ereignis | Verfuegbarkeit, Missbrauchs- und Phishingschutz | Art. 6 Abs. 1 lit. f, dokumentierte Interessenabwaegung | DB, Plattformlogs, optional Google Safe Browsing | DB-Rate-Limit-Zeilen werden nur anlassbezogen fuer denselben Identifier bereinigt; Logfrist nicht belegt. |
| Teams, Kommentare, Audit und Aktivitaet | Nutzer; Mitgliedschaft, Rolle, Berechtigungen, Inhalte, Aenderungen, IP/User-Agent optional | Zusammenarbeit, Nachvollziehbarkeit | Art. 6 Abs. 1 lit. b; Audit/Sicherheit lit. f | Teammitglieder, intern Berechtigte | Teilweise Kaskade/Set-null; keine feste Auditfrist belegt. Linkhistorie wird bei Linkloeschung mitgeloescht. |
| API-Schluessel und Webhooks | Nutzer; Schluesselhash/-prefix, Name, Nutzung, Webhook-URL/-Secret, Ereignisse; bei Klick-Webhooks IP/User-Agent/Referer | API-Zugang und Nutzerintegration | Art. 6 Abs. 1 lit. b | Nutzerdefinierte Webhookempfaenger | Bis Widerruf/Loeschung oder optionales Ablaufdatum; Webhookempfaenger und deren Rolle muessen vom Nutzer transparent gemacht werden. |
| Verschluesselte Passwortfreigabe | Ersteller/Empfaenger; verschluesselter Payload, verschluesselte Metadaten, Key-Hash, Access-Key-Hash, Zugriffszahl/-zeit | Sichere Geheimnisfreigabe | Art. 6 Abs. 1 lit. b | Hosting/DB, Empfaenger mit Freigabelink | Ablauf sperrt Zugriff, loescht aber nicht; Owner kann loeschen. Inhalt wird laut API bereits verschluesselt angeliefert. |
| P2P-Dateifreigabe | Ersteller/Empfaenger; Dateiname, Groesse, MIME-Typ, Hash, Signalisierungsdaten, Netzwerkmetadaten, Zugriff | Direkte Dateiuebertragung | Art. 6 Abs. 1 lit. b; STUN-Transfer gesondert pruefen | DB, Gegenpeer, Google-STUN | Datei selbst wird laut Code nicht serverseitig gespeichert; Metadaten/Offer/Answer bleiben trotz Ablauf ohne nachgewiesenen Purge. Die Signalisierungs-POST-Route prueft weder Token, Access-Key noch Ablauf. |
| Safe-Browsing-/Blocklistabfrage | Linkersteller; Ziel-URL und Server-Abrufmetadaten | Schutz vor Malware/Phishing | Art. 6 Abs. 1 lit. f | Google Safe Browsing bei konfiguriertem Key; jsDelivr/Hagezi | Providerfristen und Vertrage klaerungsbeduerftig; Safe Browsing arbeitet bei Fehler fail-open. |
| Build und Betrieb | Entwickler, Administratoren, gegebenenfalls Nutzer in Logs; Git-Metadaten, Artefakte, Logs | Entwicklung, Deployment, Fehleranalyse | Art. 6 Abs. 1 lit. b/f bzw. Beschaeftigtenkontext | GitHub/GHCR, tatsaechlicher Hoster | GitHub-/Registry-/Hosterfristen und Zugriffe sind klaerungsbeduerftig. |

Besondere Kategorien nach Art. 9 DSGVO sind nicht als strukturiertes Feld vorgesehen. Freie Paste-, Kommentar-, Bio-, URL- und verschluesselte Metadatenfelder koennen sie dennoch enthalten. Der Dienst darf solche Inhalte nicht fuer eigene Profilbildung auswerten; Missbrauchsmeldung, Loeschung und DSFA-Screening muessen dieses Risiko beruecksichtigen.

### Aufbewahrungs- und Loeschkonzept
Die folgenden Soll-Fristen sind Kontrollziele und keine Behauptung der aktuellen technischen Umsetzung. Ihre rechtliche und betriebliche Freigabe ist klaerungsbeduerftige Information; Owner sind Datenschutz und Leitung.

| Datenklasse | Nachweisbarer Ist-Stand | Soll-Kontrolle |
|---|---|---|
| Passkey-Login-Token | 2 Minuten gueltig, Hash, atomare Einmalverwendung | Abgelaufene Felder spaetestens taeglich physisch bereinigen; Verbrauch protokollieren ohne Token. |
| Passkey-Login-Challenge | 5 Minuten gueltig, atomare Einmalverwendung | Abgelaufene Felder spaetestens taeglich bereinigen. |
| SSO-Login-Token | 5 Minuten gueltig, nach erfolgreichem Login geloescht | Hash statt Klartext und taegliche Bereinigung abgelaufener Werte. |
| JWT-Session | 24 Stunden Maximalalter | Keine serverseitige Langzeitspeicherung; Widerrufskonzept fuer kompromittierte Sessions. |
| Rate-Limit-Daten | Fenster 15 Minuten oder 1 Stunde; anlassbezogene Bereinigung | Globaler taeglicher Purge nach Ende des laengsten Fensters plus kurzer Fehlerpuffer. |
| Links/Pastes/Freigaben/P2P | Ablauf sperrt teils Zugriff, loescht nicht | Taeglicher Purge nach Ablauf; bei „never“ bis Nutzerloeschung oder dokumentiertem Zweckwegfall. |
| Klick-Analytics mit IP | Unbefristet bis Linkloeschung | Volle IP nur bei nachgewiesener Erforderlichkeit, sonst sofort kuerzen/hashbasiert minimieren; konkrete kurze Frist nach Interessenabwaegung freigeben. |
| Security- und Plattformlogs | stdout, Plattformfrist unbekannt | Zweckgebundene, dokumentierte Frist; danach Loeschung/Anonymisierung und Zugriffsschutz. |
| Auditdaten | Keine feste Frist; teils Kaskaden | Frist nach Nachweis-, Vertrags- und Missbrauchszweck festlegen; Legal Hold getrennt dokumentieren. |
| Konto | Admin-Loeschung vorhanden, Selbstloeschung nicht belegt | Verifizierter Self-Service oder Supportprozess; Kaskaden pruefen, Set-null-Daten und Backups einbeziehen. |
| Backups | Nicht belegt | Loeschung muss nach definiertem Backupzyklus wirksam werden; Restore darf geloeschte Daten nicht unkontrolliert reaktivieren. |

### Betroffenenrechte
Anfragen nach Art. 15 bis 22 DSGVO werden zentral registriert, identitaetsgeprueft, nach Datenquellen aufgeteilt und grundsaetzlich innerhalb eines Monats beantwortet. Eine Verlaengerung darf nur unter den gesetzlichen Voraussetzungen dokumentiert und rechtzeitig mitgeteilt werden.

| Recht | Repository-Unterstuetzung | Erforderlicher Prozess |
|---|---|---|
| Information, Art. 13/14 | `app/datenschutz/page.tsx` vorhanden | Mit realen Empfaengern, Voll-IP-Analytics, SSO, Webhooks, STUN, Fristen und Transfers korrigieren; Versionen archivieren. |
| Auskunft, Art. 15 | Linkexport als CSV/JSON | Vollstaendiger Export fuer Konto, Pastes, Klickdaten, Teams, Passkeys, Freigaben, Logs und Empfaenger fehlt; manuelles Verfahren bis Automatisierung. |
| Berichtigung, Art. 16 | Einzelne Inhalte sind aenderbar | Verifizierter Support-/Self-Service-Prozess fuer E-Mail und alle Profildaten. |
| Loeschung, Art. 17 | Einzelne Links/Pastes/Passwortfreigaben und Admin-Kontoloeschung | Self-Service/Annahmeweg, Kaskaden-, Audit-, Empfaenger- und Backupnachweis; Ausnahmen dokumentieren. |
| Einschraenkung, Art. 18 | Kein technischer Status belegt | Sperrkennzeichen oder dokumentiertes manuelles Verfahren ohne unzulaessige Weiterverarbeitung. |
| Datenuebertragbarkeit, Art. 20 | Nur Links exportierbar | Strukturiertes Gesamtformat fuer bereitgestellte Vertragsdaten. |
| Widerspruch, Art. 21 | Kein Workflow belegt | Analytics-/Interessenabwaegungsverarbeitung sperren und Entscheidung dokumentieren. |
| Widerruf | Cookiepraeferenz lokal im Browser | Serververarbeitungen und Empfaenger an Consent koppeln; Widerruf und Nachweis synchronisieren. |
| Keine ausschliesslich automatisierte Entscheidung, Art. 22 | Keine rechtliche Wirkung durch Profiling belegt | Vor Smart-Redirect-, A/B- oder Risikoscore-Erweiterungen erneut pruefen. |

**Klaerungsbeduerftige Information:** Eingangskanal, Identitaetspruefung, Ticketregister, verantwortliche Person und Nachweisarchiv. Owner: Datenschutz. Kontrolle: getesteter Betroffenenrechte-Runbook und jaehrliche Probeauskunft.

### TOM nach Art. 32 DSGVO
| Schutzziel | Implementierter Nachweis | Luecke / verbindliche Kontrolle |
|---|---|---|
| Zutrittskontrolle | Nicht aus Repository ableitbar | Hosting-/Rechenzentrumsnachweise durch Betrieb/Lieferantenmanagement. |
| Zugangskontrolle | bcrypt, JWT-Cookie, SSO, Passkeys, API-Key-Hash | MFA fuer privilegierte Rollen, Sessionwiderruf, SSO-State und Zugriffsreview belegen. |
| Zugriffskontrolle | `requireAuth`, Owner-Filter, Teamrollen, `SUPER_ADMINS` | Zentrale Berechtigungsmatrix, negative Integrationstests, quartalsweise Rezertifizierung. |
| Weitergabekontrolle | HMAC-Webhooks, HTTPS-Sollheader | ip-api-HTTP stoppen; TLS fuer DB/Provider, Empfaengerregister und Transferpruefung belegen. |
| Eingabekontrolle | Drizzle, Zod, Linkhistorie/Audittabellen | Audit ist nicht flaechendeckend, teils fail-open oder bei Loeschung verloren; manipulationsgeschuetzte Logs. |
| Auftragskontrolle | Nicht belegt | AV-Vertraege, Weisungen, TOM-Anlagen, Subprozessoren und Kontrollen dokumentieren. |
| Verfuegbarkeit | Docker, Standalone-Build, DB-Verbindungszeitlimits | Backup, Redundanz, DDoS, RTO/RPO und Restore-Test belegen. |
| Trennung | `NODE_ENV`, kontobezogene IDs | Getrennte Konten/DBs/Secrets fuer Entwicklung, Test und Produktion belegen; keine Produktivdaten in Tests. |
| Verschluesselung/Pseudonymisierung | bcrypt, SHA-256-Token/API-Key-Hash, WebAuthn, AES-256-GCM-Payload | At-rest/Backup-Verschluesselung, Secret-Vault und IP-Minimierung belegen; SSO-Secrets nicht im Klartextfeld. |
| Belastbarkeit und Wirksamkeitspruefung | 7 Passkey-Unit-Tests erfolgreich | CI erzwingt Tests nicht; Datenschutz-, Restore-, Rechte- und Zugriffstests regelmaessig ausfuehren. |

### Auftragsverarbeiter, Empfaenger und Drittlandtransfers
| Stelle / Kategorie | Nachweisbarer Datenfluss | Rolle/Transferstatus | Erforderliche Kontrolle |
|---|---|---|---|
| Produktiver Hoster/Vercel oder Docker-Betreiber | Anwendung, Logs, moeglicherweise alle Daten | Tatsaechlicher Anbieter/Region nicht belegt | AVV Art. 28, TOM, Subprozessoren, Region, Loeschung und Transfergrundlage dokumentieren. |
| PostgreSQL-Anbieter | Alle persistierten Daten | Anbieter/Region nicht belegt | AVV, Verschluesselung, Backup, Zugriff und Transfergrundlage. |
| GitHub/GHCR | Repository, Buildmetadaten, Images | Lieferant; Endnutzerdaten nur bei Fehlkonfiguration/Logs moeglich | Vertrag, Region, Zugriffs- und Secretkontrolle, Aufbewahrung. |
| ip-api.com | Client-IP im URL-Pfad | Externer Empfaenger; Region/Vertrag unbekannt | Verarbeitung aussetzen, bis HTTPS, Rolle, Rechtsgrundlage, DPA/Transfer und Minimierung freigegeben sind. |
| Google Safe Browsing | Zu pruefende Ziel-URL | Externer Empfaenger, optional | Produktbedingungen, Datenminimierung, Transparenz und Transferpruefung. |
| Microsoft/OIDC/Keycloak | SSO-Code, Token, Profil/E-Mail | Je Kundenkonfiguration | Verantwortlichkeiten, DPA, Region, Scopes, Transfer und Loeschung pro Provider. |
| Google-STUN | IP-/ICE-Netzwerkmetadaten | Externer Empfaenger | Transparenz, Erforderlichkeit, Alternative und Drittlandgrundlage pruefen. |
| jsDelivr/Hagezi | Server-Abrufmetadaten | Lieferant/Quelle | Lizenz, Integritaet, Verfuegbarkeit und Datenschutzbedingungen pruefen. |
| Nutzerdefinierte Webhooks | Link-/Klickdaten, optional IP/User-Agent/Referer | Vom Nutzer bestimmter Empfaenger | Granulare Datenauswahl, Empfaengerhinweis, SSRF-Schutz, Verantwortlichkeitsklausel. |

Fuer jeden Transfer ausserhalb EU/EWR sind Angemessenheitsbeschluss oder geeignete Garantien, gegebenenfalls Standardvertragsklauseln, Transfer Impact Assessment und technische Zusatzmassnahmen zu dokumentieren. Der Repository-Stand belegt keinen dieser Nachweise.

### DSFA-Schwelle
Vor Produktivfreigabe und vor jeder wesentlichen Erweiterung ist ein dokumentiertes DSFA-Screening erforderlich. Eine vollstaendige DSFA ist durchzufuehren, wenn die konkrete Konfiguration voraussichtlich ein hohes Risiko erzeugt. Ausloeser sind insbesondere:

- systematische, umfangreiche Beobachtung von Klickenden mit voller IP, Referer, User-Agent und Geolokation;
- Verknuepfung von Tracking-Pixeln, A/B-Tests, Smart Redirects und Profilmerkmalen;
- umfangreiche freie Inhalte, die besondere Kategorien oder hochvertrauliche Daten enthalten koennen;
- neue Empfaenger oder Drittlandtransfers ohne wirksame Zusatzmassnahmen;
- Verarbeitung vulnerabler Personengruppen oder erhebliche Skalierung;
- biometrische Verarbeitung durch den Dienst. Passkeys allein belegen keine serverseitige Biometrieverarbeitung, da das Repository nur Credential-ID, oeffentlichen Schluessel und Metadaten speichert.

Ob die Schwelle aktuell erreicht ist, ist wegen fehlender Angaben zu Nutzerzahl, Umfang, Produktivkonfiguration und Empfaengerregionen klaerungsbeduerftige Information. Owner: Datenschutz; Kontrolle: signiertes Screening vor Betrieb. Bis dahin duerfen Voll-IP-Geoanalytics und optionale Trackingfunktionen nicht als datenschutzrechtlich freigegeben gelten.

### Datenschutzverletzungen
Jeder Verdacht wird mit Zeitpunkt, Datenarten, Betroffenen, Systemen, Ursache und Eindammung registriert. Datenschutz und Informationssicherheit bewerten unverzueglich Risiko, Meldepflicht an die Aufsicht innerhalb von 72 Stunden ab Kenntnis und gegebenenfalls Benachrichtigung der Betroffenen. Beweise werden zugriffsgeschuetzt gesichert; Tokens/Secrets werden rotiert; Empfaenger und Auftragsverarbeiter werden einbezogen.

Ein Incident-Runbook, Meldekanal, Aufsichtsbehoerde, Rufbereitschaft und Uebungsnachweise sind klaerungsbeduerftige Informationen. Owner: Informationssicherheit und Datenschutz; Kontrolle: jaehrliche Tabletop-Uebung und dokumentierte Nachbereitung.

## Nachweise und Artefakte
- `lib/db/schema.ts`, `drizzle/*.sql`: personenbezogene Datenfelder, Beziehungen und Loeschregeln.
- `lib/auth/config.ts`, `lib/auth/actions.ts`, `lib/passkeys.ts`: Authentisierungs- und Sessionverarbeitung.
- `lib/auth/passkey-challenge.ts`, `lib/auth/passkey-login-token.ts`, `drizzle/0004_secure_passkey_auth.sql`: Laufzeiten und Einmalverwendung.
- `app/s/[shortCode]/route.ts`, `lib/analytics.ts`: Klicktracking und Uebermittlung an ip-api.com.
- `app/protected/paste/[slug]/page.tsx`, `app/p/[slug]/page.tsx`, `app/p/[slug]/raw/route.ts`: das eingegebene Passwort gelangt in die URL, wird in der Hauptansicht nicht verifiziert und in der Raw-Route gar nicht geprueft.
- `app/api/links/export/route.ts`: nur auf Links beschraenkter Datenexport.
- `app/api/admin/users/[id]/route.ts`: administrative Kontoloeschung.
- `lib/e2e-encryption.ts`, `app/api/passwords/*`, `app/api/p2p/files/*`: verschluesselte Freigaben und P2P-Metadaten.
- `lib/webhooks.ts`, `lib/phishing-check.ts`, `lib/db/blocklist-service.ts`: externe Empfaenger.
- `app/datenschutz/page.tsx`: aktuelle oeffentliche Information und Abweichung zur Voll-IP-Speicherung.
- Zukuenftig erforderliche, derzeit klaerungsbeduerftige Artefakte: genehmigtes VVT, Interessenabwaegungen, Consent-Nachweise, AVV, Transferakte, Loeschprotokolle, DSFA-Screening, Rechte- und Incident-Register.

## Risiken und Kontrollen
| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| Voll-IP-Geoabfrage ueber HTTP | Offenlegung und unzulaessige Uebermittlung | Hoch | Sofort aussetzen oder datensparsamen HTTPS-Dienst nach Rechts- und Transferpruefung nutzen | Datenschutzfreigabe und technischer Integrationstest | `lib/analytics.ts` |
| Datenschutzhinweis behauptet Anonymisierung, Code speichert volle IP | Transparenzverstoss, falsche Rechtsgrundlagenbewertung | Hoch | Code minimieren und Hinweis korrigieren | Abgleich Datenschutzhinweis gegen VVT je Release | `app/datenschutz/page.tsx`, Schema |
| Paste-Passwortschutz ist in Haupt- und Raw-Ansicht unwirksam | Unbefugte Inhaltsweitergabe | Hoch | Serverseitigen Hashvergleich und identische Ablauf-/Ownerpruefung in allen Ansichten erzwingen | Negative Integrationstests mit richtigem, falschem, leerem und abgelaufenem Passwort | Paste-Page-, Protected- und Raw-Routen |
| Link-/Paste-Passwoerter und Freigabe-Access-Keys werden als Queryparameter uebergeben | Offenlegung in Browserhistorie, Logs oder Telemetrie | Mittel | Geheimnis per POST pruefen und kurzlebiges, gebundenes Zugriffstoken verwenden | Test, dass keine Geheimnisse in URLs/Logs erscheinen | Protected-Seiten, Link-/Paste- und Passwortfreigabe-Routen |
| P2P-Signalisierung ohne Token-/Access-Key-/Ablaufpruefung | Offenlegung oder Manipulation von Verbindungsmetadaten | Hoch | Signalisierungszugriff an Token, Access-Key und Gueltigkeit binden | Negative API-Tests und Auditereignis | `app/api/p2p/files/[shareId]/route.ts` |
| Ablaufdaten fuehren nicht zur Loeschung | Verstoss gegen Speicherbegrenzung | Hoch | Zentralen Purge fuer alle ablaufbaren Tabellen implementieren | Taeglicher Lauf, Alarm und monatliche Stichprobe | Schema/Routes; kein Purge gefunden |
| Unvollstaendiger Betroffenenauszug | Verletzung Art. 15/20 | Hoch | Gesamt-Export und manuellen Uebergangsprozess einrichten | Jaehrliche Probeauskunft | Nur Linkexport vorhanden |
| Ungeklaerte Auftragsverarbeiter/Transfers | Art.-28-/Kapitel-V-Verstoss | Hoch | Anbieterregister, AVV, SCC/TIA und Subprozessoren freigeben | Lieferanten-Gate vor Datenfluss | Repository belegt keine Vertraege |
| SSO-Secrets im Klartextfeld | Zugangsdatenoffenlegung | Mittel | Vault oder anwendungsseitige Feldverschluesselung, Rotation | Secret-Inventar und Rotationstest | `sso_domains.client_secret` |
| Voll-IP und freie Inhalte ohne DSFA-Screening | Unerkannt hohes Betroffenenrisiko | Mittel | DSFA-Screening vor Betrieb/Skalierung | Signierte Entscheidung Datenschutz | Umfang/Skalierung klaerungsbeduerftig |
| Keine nachgewiesene Backup-Loeschkette | Geloeschte Daten bleiben oder kehren zurueck | Mittel | Backupfristen und Restore-Loeschabgleich definieren | Restore-Test mit geloeschtem Testdatensatz | Betriebskonfiguration klaerungsbeduerftig |
| Cookie-Consent ist nur lokal, Analytics serverseitig | Einwilligung steuert Verarbeitung nicht | Hoch | Serververarbeitung an belastbare Rechtsgrundlage/Consent koppeln | End-to-End-Consent-Test | `lib/cookie-consent.ts`, Redirect-Tracking |

## Pflegeprozess
Das VVT wird mindestens jaehrlich und vor jeder neuen Datenkategorie, Zweckveraenderung, Empfaengeranbindung, Trackingfunktion, Hostingregion oder Authentisierungsart aktualisiert.

Der Pflegezyklus umfasst:

1. Datenbankschema, API-Routen, externe `fetch`-Ziele und Logs erneut inventarisieren;
2. Zweck, Rechtsgrundlage, Interessenabwaegung, Empfaenger und Frist je Verarbeitung bestaetigen;
3. oeffentliche Datenschutzhinweise und Consent-Steuerung gegen den realen Code testen;
4. Loeschjobs, Probeauskunft, Restore-Loeschkette und Zugriffskontrollen pruefen;
5. Auftragsverarbeiter, Subprozessoren und Drittlandtransfers neu bewerten;
6. DSFA-Screening dokumentieren und bei Schwellenueberschreitung vor Verarbeitung eine DSFA abschliessen;
7. Abweichungen mit Owner, Frist und Eskalation im Risikoregister fuehren.

Produktive Konfiguration und Vertraege muessen als separate, zugriffsgeschuetzte Nachweise archiviert werden; geheime Werte gehoeren nicht in dieses Repository.

## Revisionshistorie
| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 20.07.2026 | Compliance-Dokumentation | Ersterstellung mit VVT, Rechtsgrundlagen, Loeschung, Rechten, TOM, Empfaengern, Transfers und DSFA-Schwelle | Fehlendes internes Datenschutzkonzept |
