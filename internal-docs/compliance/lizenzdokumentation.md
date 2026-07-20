# Lizenzdokumentation fuer Software und Abhaengigkeiten
## Einleitung
Diese Dokumentation inventarisiert die im Zhort-Repository deklarierten Open-Source-Abhaengigkeiten und beschreibt die daraus folgenden Freigabe- und Nachweispflichten. Primaerquellen sind `package.json` und `package-lock.json` (Lockfile-Version 3) am 20.07.2026; der unveraenderte Paketstand wurde gegen den Repository-HEAD `8611a8d` abgeglichen.

Das Repository ist in `package.json` als `private: true` markiert. Das README nennt unter „Lizenz“ lediglich „MIT“. Im Repository wurden keine Dateien `LICENSE`, `COPYING` oder `NOTICE` gefunden. Damit ist weder ein vollstaendiger eigener Lizenztext noch ein auslieferbares Third-Party-Notice-Bundle nachgewiesen. Die README-Angabe allein darf nicht als abgeschlossene Lizenzierung oder als Erfuellung der Hinweispflichten behandelt werden.

## Geltungsbereich
Erfasst sind:

- 29 in `dependencies` deklarierte direkte Pakete;
- 11 in `devDependencies` deklarierte direkte Pakete;
- 773 versionierte Paket-Eintraege im Lockfile einschliesslich transitiver, optionaler, plattformspezifischer und mehrfach verschachtelter Eintraege;
- Nutzung in Quellcode, Build, Test, Docker-Image und GitHub Actions;
- Lizenz-, Notice-, Quellcodebereitstellungs-, Copyleft- und Schwachstellenpflichten.

Nicht erfasst als bestaetigte Rechtsauffassung sind individuelle kommerzielle Doppellizenzen, Rechte an Marken, Inhalten, Icons oder extern geladenen Blocklisten. Solche Rechte sind klaerungsbeduerftige Informationen und muessen durch eine rechtsverantwortliche Rolle belegt werden.

## Begriffe und Definitionen
| Begriff | Definition |
|---|---|
| Direkte Abhaengigkeit | Paket, das unmittelbar in `package.json` deklariert ist. |
| Transitive Abhaengigkeit | Paket, das durch eine andere Abhaengigkeit in das Lockfile gelangt. |
| Permissive Lizenz | Lizenz mit typischerweise geringen Bedingungen wie Erhalt von Copyright- und Lizenzhinweisen. |
| Copyleft | Lizenzbedingung, die bei bestimmten Nutzungs- oder Weitergabeformen Quellcode- oder Lizenzpflichten ausloesen kann. |
| Network Copyleft | Copyleft, das wie bei AGPL auch bei Bereitstellung ueber ein Netzwerk relevant sein kann. |
| SBOM | Maschinenlesbare Software Bill of Materials mit Komponenten, Versionen und Beziehungen. |
| Notice-Bundle | Mit dem Artefakt ausgelieferte Lizenztexte, Copyright- und Attributionshinweise. |
| SCA | Software Composition Analysis fuer Lizenzen und bekannte Schwachstellen. |
| Klaerungsbeduerftige Information | Nicht durch Repository-Artefakte belegte Lizenz- oder Betriebsinformation, die einem Owner und einer Kontrolle zugeordnet wird. |

## Verantwortlichkeiten
Die namentliche Besetzung der Rollen ist klaerungsbeduerftig. Owner ist die Leitung; Kontrolle ist ein freigegebenes Rollenregister vor einer externen Auslieferung und danach quartalsweise.

| Aktivitaet | Leitung / Rechteinhaber | Entwicklung | Release / Betrieb | Recht / Compliance | Informationssicherheit |
|---|---|---|---|---|---|
| Lizenz des eigenen Projekts festlegen | A | C | I | R | I |
| Abhaengigkeit einfuehren oder aktualisieren | I | R | C | C | A |
| Copyleft- und Doppellizenzpruefung | A | C | I | R | C |
| SBOM und Notice-Bundle erzeugen | I | R | A | C | C |
| Schwachstellen bewerten | I | R | C | I | A |
| Release-Freigabe bei Lizenzabweichung | A | C | R | R | C |
| Nachweise archivieren | I | C | R | A | C |

R = ausfuehrend, A = rechenschaftspflichtig, C = konsultiert, I = informiert.

## Detailbeschreibung
### Direkt deklarierte Laufzeitabhaengigkeiten
Die Gruppierung folgt ausschliesslich `package.json`; insbesondere sind `drizzle-kit` und mehrere `@types/*`-Pakete dort unter `dependencies` und damit nicht als reine Entwicklungspakete deklariert.

| Paket | Gesperrte Version | Lizenz laut Lockfile | Bewertung / Pflicht |
|---|---:|---|---|
| `@headlessui/react` | 2.2.9 | MIT | Lizenz- und Copyright-Hinweis erhalten. |
| `@heroicons/react` | 2.2.0 | MIT | Lizenz- und Copyright-Hinweis erhalten; Icon-Attribution pruefen. |
| `@simplewebauthn/browser` | 13.2.2 | MIT | Lizenzhinweis erhalten. |
| `@simplewebauthn/server` | 13.2.2 | MIT | Lizenzhinweis erhalten. |
| `@simplewebauthn/typescript-types` | 8.3.4 | MIT | Lizenzhinweis erhalten. |
| `@types/qrcode` | 1.5.6 | MIT | Lizenzhinweis erhalten. |
| `@types/ua-parser-js` | 0.7.39 | MIT | Lizenzhinweis erhalten. |
| `@vercel/blob` | 2.6.1 | Apache-2.0 | Lizenz/NOTICE und Patentklauseln beachten; keine Code-Nutzung gefunden. |
| `bcryptjs` | 3.0.3 | BSD-3-Clause | Lizenz- und Copyright-Hinweis erhalten. |
| `class-variance-authority` | 0.7.1 | Apache-2.0 | Lizenz/NOTICE und Patentklauseln beachten. |
| `clsx` | 2.1.1 | MIT | Lizenzhinweis erhalten. |
| `drizzle-kit` | 0.31.10 | MIT | Build-/Migrationswerkzeug; im Docker-Runner installiert, daher im Artefaktinventar fuehren. |
| `drizzle-orm` | 0.45.2 | Apache-2.0 | Lizenz/NOTICE und Patentklauseln beachten. |
| `js-yaml` | 4.3.0 | MIT | Lizenzhinweis erhalten. |
| `lucide-react` | 0.553.0 | ISC | Lizenz- und Copyright-Hinweis erhalten. |
| `nanoid` | 5.1.6 | MIT | Lizenzhinweis erhalten. |
| `next` | 16.2.10 | MIT | Lizenzhinweis und transitive/native Bestandteile im SBOM erfassen. |
| `next-auth` | 4.24.14 | ISC | Lizenz- und Copyright-Hinweis erhalten. |
| `next-intl` | 4.13.2 | MIT | Lizenzhinweis erhalten. |
| `next-themes` | 0.4.6 | MIT | Lizenzhinweis erhalten. |
| `postgres` | 3.4.7 | Unlicense | Lizenztext bzw. Gemeinfreiheitserklaerung erhalten. |
| `qrcode` | 1.5.4 | MIT | Lizenzhinweis erhalten. |
| `react` | 19.2.3 | MIT | Lizenzhinweis erhalten. |
| `react-dom` | 19.2.3 | MIT | Lizenzhinweis erhalten. |
| `react-syntax-highlighter` | 16.1.0 | MIT | Lizenzhinweis sowie eingebundene Sprach-/Theme-Komponenten pruefen. |
| `recharts` | 3.3.0 | MIT | Lizenzhinweis erhalten. |
| `tailwind-merge` | 3.4.0 | MIT | Lizenzhinweis erhalten. |
| `ua-parser-js` | 2.0.10 | AGPL-3.0-or-later | Network-Copyleft-Risiko; wird in `lib/analytics.ts` zur Laufzeit importiert. Vor Betrieb oder Distribution Rechtspruefung, Quellcode-/Lizenzpflichten oder kommerzielle Alternative belegen. |
| `zod` | 4.2.1 | MIT | Lizenzhinweis erhalten. |

Die Versionen in der Tabelle sind Lockfile-Versionen des Arbeitsbaums. Der Docker-Runner kopiert kein `package-lock.json` und fuehrt `npm install drizzle-kit@0.31.8 postgres drizzle-orm --no-save --omit=dev` aus. Damit weicht `drizzle-kit` im finalen Image mindestens von der gesperrten Version 0.31.10 ab; die dort tatsaechlich installierten Versionen und Lizenzen von `postgres` und `drizzle-orm` sind nur durch eine SBOM aus dem gebauten Image belastbar nachweisbar.

### Direkt deklarierte Entwicklungsabhaengigkeiten
| Paket | Gesperrte Version | Lizenz laut Lockfile | Bewertung / Pflicht |
|---|---:|---|---|
| `@tailwindcss/postcss` | 4.1.16 | MIT | Build-SBOM und Lizenzhinweis. |
| `@types/bcryptjs` | 2.4.6 | MIT | Build-SBOM und Lizenzhinweis. |
| `@types/node` | 20.19.24 | MIT | Build-SBOM und Lizenzhinweis. |
| `@types/react` | 19.2.2 | MIT | Build-SBOM und Lizenzhinweis. |
| `@types/react-dom` | 19.2.2 | MIT | Build-SBOM und Lizenzhinweis. |
| `@types/react-syntax-highlighter` | 15.5.13 | MIT | Build-SBOM und Lizenzhinweis. |
| `eslint` | 9.39.1 | MIT | Build-SBOM und Lizenzhinweis. |
| `eslint-config-next` | 16.0.1 | MIT | Build-SBOM und Lizenzhinweis. |
| `tailwindcss` | 4.1.16 | MIT | Build-SBOM und Lizenzhinweis. |
| `typescript` | 5.9.3 | Apache-2.0 | Lizenz/NOTICE und Patentklauseln beachten. |
| `vitest` | 4.1.10 | MIT | Build-SBOM und Lizenzhinweis. |

### Transitive Lizenzlandschaft
Die 773 Lockfile-Eintraege verteilen sich laut `license`-Metadaten wie folgt. Die Zahl bezeichnet Paket-Eintraege, nicht zwingend eindeutige Projekte oder tatsaechlich in jedem Plattformartefakt enthaltene Dateien.

| Lizenzangabe | Eintraege | Behandlung |
|---|---:|---|
| MIT | 605 | Hinweise beibehalten. |
| Apache-2.0 | 52 | Lizenz, NOTICE und Patentbedingungen pruefen. |
| ISC | 43 | Hinweise beibehalten. |
| MPL-2.0 | 25 | Modifikationen MPL-lizenzierter Dateien und Quellcodebereitstellung pruefen. |
| LGPL-3.0-or-later | 10 | Linking, Austauschbarkeit und Quellcodepflichten pruefen. |
| Apache-2.0 AND MIT | 9 | Beide Bedingungen im Notice-Prozess beruecksichtigen. |
| BSD-3-Clause | 8 | Hinweise und Nichtbefuerwortungsklausel erhalten. |
| BSD-2-Clause | 7 | Hinweise erhalten. |
| Apache-2.0 AND LGPL-3.0-or-later | 3 | Kombinierte Pflichten pruefen. |
| CC0-1.0 | 2 | Lizenztext erfassen. |
| 0BSD | 2 | Lizenztext erfassen. |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | 1 | Kombinierte Pflichten pruefen. |
| Python-2.0 | 1 | Lizenztext und Weitergabebedingungen erfassen. |
| CC-BY-4.0 | 1 | Attribution fuer `caniuse-lite` pruefen. |
| Unlicense | 1 | Lizenztext/Gemeinfreiheitserklaerung erfassen. |
| AGPL-3.0-or-later | 1 | Laufzeitnutzung von `ua-parser-js` rechtlich freigeben. |
| MIT AND ISC | 1 | Beide Hinweise erfassen. |
| Unbekannt | 1 | `format@0.2.2` vor Release manuell pruefen. |

Besonders zu pruefen sind die LGPL-lizenzierten plattformspezifischen `@img/sharp-libvips-*`-Pakete, die MPL-lizenzierten `lightningcss*`-Pakete und `axe-core`, `caniuse-lite` unter CC-BY-4.0, `ua-parser-js` unter AGPL-3.0-or-later sowie `format@0.2.2` ohne Lockfile-Lizenzangabe.

### Eigene Projektlizenz und Fremdhinweise
**Klaerungsbeduerftige Information:** Wer Rechteinhaber ist, ob Zhort extern verteilt oder nur als Dienst betrieben wird und ob „MIT“ die autorisierte Lizenzentscheidung ist. Owner: Leitung/Rechteinhaber. Kontrolle: signierte Lizenzentscheidung, vollstaendige `LICENSE`-Datei, Copyright-Zeile und Abgleich mit Beitraegen vor der naechsten externen Auslieferung.

Ein Release muss ein aus dem tatsaechlichen Produktionsartefakt erzeugtes SBOM und ein Notice-Bundle enthalten. Lockfile-Metadaten allein ersetzen die Original-Lizenztexte nicht. Fuer jedes Paket sind Name, Version, Quelle, Integritaet, Lizenztext, Copyright und Abhaengigkeitsbeziehung aufzubewahren.

### Schwachstellenstatus mit Lizenzbezug
`npm audit --json` meldete am 20.07.2026 9 moderate, 0 hohe und 0 kritische Findings. Betroffen sind vier direkte Eintraege (`drizzle-kit`, `next`, `next-auth`, `next-intl`) und fuenf transitive Eintraege (`@esbuild-kit/core-utils`, `@esbuild-kit/esm-loader`, `esbuild`, `postcss`, `uuid`). `npm audit --omit=dev --json` meldete dieselben neun Findings. Sie koennen daher auf Basis des Manifests nicht als ausschliesslich dev-only geschlossen werden: `drizzle-kit` steht unter `dependencies` und wird im finalen Docker-Image installiert; Next.js, NextAuth und next-intl sind Laufzeitabhaengigkeiten.

Die von npm angebotenen automatischen Fixes verweisen auf inkompatible Downgrades (`next` 9.3.3, `next-auth` 3.29.10, `next-intl` 0.0.1, `drizzle-kit` 0.18.1). Deshalb ist eine advisory-spezifische Expositionsbewertung und kein blindes `npm audit fix --force` erforderlich.

### Freigabeverfahren
1. Neue oder aktualisierte Pakete nur ueber `package.json` und Lockfile aufnehmen.
2. SCA, Lizenzscan und Schwachstellenscan auf dem vollstaendigen sowie dem Produktionsbaum ausfuehren.
3. Copyleft, unbekannte oder nicht erlaubte Lizenzen blockieren, bis Recht/Compliance dokumentiert freigibt.
4. Nutzung im Code und Aufnahme in das finale Container-/Serverless-Artefakt pruefen.
5. SBOM und Notice-Bundle mit Artefakt-Hash archivieren.
6. Sicherheitsabweichungen mit Ausnutzbarkeit, kompensierender Kontrolle, Owner und Ablaufdatum freigeben.

## Nachweise und Artefakte
- `package.json`: deklarierte direkte Abhaengigkeiten und Kennzeichnung `private`.
- `package-lock.json`: gesperrte Versionen, Integritaetswerte, transitive Beziehungen und Lizenzmetadaten.
- `README.md`: nicht ausreichend hinterlegte Angabe „MIT“.
- Fehlende `LICENSE`-, `COPYING`- und `NOTICE`-Dateien: Repository-Suche am 20.07.2026.
- `lib/analytics.ts`: tatsaechlicher Laufzeitimport von `ua-parser-js`.
- `Dockerfile`: `npm ci` im Build und zusaetzliche Installation von `drizzle-kit`, `postgres` und `drizzle-orm` im Runner.
- `.github/workflows/docker-image.yml`: Container-Build und GHCR-Publikation ohne SBOM-/Lizenzschritt.
- `npm audit --json` und `npm audit --omit=dev --json`, ausgefuehrt am 20.07.2026.
- Bei zukuenftigen Releases verpflichtend: SBOM, Notice-Bundle, Scanbericht, Freigaben und Artefakt-Hash; derzeit klaerungsbeduerftige Nachweise mit Owner Release/Compliance.

## Risiken und Kontrollen
| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
|---|---|---|---|---|---|
| AGPL-Laufzeitabhaengigkeit `ua-parser-js` | Offenlegungspflichten, Unterlassungs- oder Lizenzkostenrisiko | Hoch | Rechtspruefung, Pflichten erfuellen, kommerziell lizenzieren oder geeignete Alternative einsetzen | Blockierende Copyleft-Freigabe vor Release | `package-lock.json`, `lib/analytics.ts` |
| Keine vollstaendige eigene Lizenzdatei | Unklare Nutzungsrechte und fehlerhafte Distribution | Hoch | Autorisierte Lizenzentscheidung und `LICENSE` bereitstellen | Release-Gate durch Leitung/Recht | README nennt nur MIT; Datei fehlt |
| Kein Third-Party-Notice-Bundle | Verletzte Hinweis- und Attributionspflichten | Hoch | Automatisiert erzeugen und manuell fuer Sonderlizenzen pruefen | Artefakt darf ohne Notice-Nachweis nicht freigegeben werden | Workflow enthaelt keinen Schritt |
| Unbekannte Lizenz bei `format@0.2.2` | Nicht bewertbare Weitergabepflichten | Mittel | Originalpaket und Lizenztext pruefen, andernfalls entfernen | SCA-Allowlist blockiert „unknown“ | Lockfile-Lizenzfeld fehlt |
| LGPL/MPL-Komponenten im transitiven Baum | Nicht erfuellte Quellcode-/Austauschpflicht | Mittel | Tatsaechliches Artefakt und Modifikationen pruefen | SBOM- und Notice-Review pro Release | `@img/sharp-libvips-*`, `lightningcss*`, `axe-core` |
| Lockfile-Metadaten sind fehlerhaft oder unvollstaendig | Falsche Lizenzbewertung | Mittel | Original-Lizenztexte und Paketarchive verifizieren | Stichprobe bei jedem Release, Vollpruefung bei Sonderlizenzen | Lockfile ist nur Primaerinventar |
| Keine SBOM im CI | Unvollstaendige Lieferkettennachweise | Hoch | CycloneDX- oder SPDX-SBOM aus finalem Artefakt erzeugen | Blockierender CI-Check und Archivierung | `.github/workflows/docker-image.yml` |
| Neun moderate Audit-Findings | Sicherheits- und Haftungsrisiko | Mittel | Advisory-spezifische Bewertung und getestete Updates | Monatliches SCA, 30-Tage-Behandlung oder befristete Ausnahme | Audit vom 20.07.2026 |
| Build- und Laufzeitbaum weichen ab | Notice/SBOM bildet Auslieferung nicht ab | Mittel | SBOM im finalen Docker-Layer erzeugen | Vergleich Build-SBOM gegen Runtime-SBOM | Runner installiert Pakete erneut |

## Pflegeprozess
Die Lizenzdokumentation ist bei jeder Aenderung von `package.json` oder `package-lock.json`, vor jedem externen Release und mindestens quartalsweise zu aktualisieren.

Verbindlich sind:

1. Differenzanalyse der direkten und transitiven Pakete;
2. Erneuerung von SBOM, Notice-Bundle und Auditbericht;
3. manuelle Pruefung aller neuen Copyleft-, Mehrfach-, Inhalts- und unbekannten Lizenzen;
4. Abgleich mit dem finalen Laufzeitartefakt und allen optionalen Plattformpaketen;
5. befristete, begruendete Ausnahmefreigabe mit Owner und kompensierender Kontrolle;
6. Archivierung mit Commit-ID, Artefakt-Digest und Freigabedatum.

Eine Lizenzangabe darf erst als freigegeben gelten, wenn Originaltext und tatsaechliche Nutzung geprueft wurden. Klaerungsbeduerftige Informationen bleiben release-blockierend, sofern Recht/Compliance nicht dokumentiert anders entscheidet.

## Revisionshistorie
| Datum | Autor/Rolle | Aenderung | Anlass |
|---|---|---|---|
| 20.07.2026 | Compliance-Dokumentation | Ersterstellung mit direktem Inventar, Lockfile-Lizenzverteilung, Copyleft- und Auditbewertung | Fehlende interne Lizenzdokumentation |
| 20.07.2026 | Compliance-Dokumentation | Paketstand gegen Commit `6618792` abgeglichen; keine paket- oder lizenzbezogene Aenderung durch die Passkey-Reviewfixes | Aktualisierung auf aktuellen Repository-HEAD |
| 20.07.2026 | Compliance-Dokumentation | Unveraenderten Paketstand gegen Commit `8611a8d` abgeglichen; finales Passkey-Hardening aendert keine Paket- oder Lizenzdaten | Aktualisierung auf aktuellen Repository-HEAD |
