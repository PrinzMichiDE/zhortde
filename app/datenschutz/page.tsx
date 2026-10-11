import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung - Zhort",
  description: "Datenschutzerklärung für Zhort - URL Shortener & Pastebin",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Datenschutzerklärung</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-foreground">
            <p className="text-muted-foreground">
              <strong>Stand:</strong> 11. Oktober 2026
            </p>

            {/* ============ 1. AUF EINEN BLICK ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">1. Datenschutz auf einen Blick</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Datenschutzerklärung beschreibt, welche personenbezogenen Daten wir bei der Nutzung von Zhort
                („die Website“, „wir“, „uns“) erheben, wofür wir sie verwenden und welche Rechte Sie als betroffene
                Person haben. Sie gilt für die Nutzung unserer Website und unserer Dienste (URL-Verkürzung,
                Pastebin, Benutzerkonto, API).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Wer ist verantwortlich für die Datenerfassung?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber Michel Fritzsch.
                Die vollständigen Kontaktdaten finden Sie im Abschnitt „Hinweis zur verantwortlichen Stelle“
                sowie in unserem{" "}
                <a
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Impressum
                </a>
                .
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Welche Daten werden erhoben?</h3>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li><strong>Beim Aufruf der Website:</strong> technische Zugriffsdaten (u. a. IP-Adresse, Browsertyp, Referrer) in den Server-Log-Dateien.</li>
                <li><strong>Beim Klicken auf verkürzte Links:</strong> IP-Adresse, User-Agent, Referrer-URL, Land und Stadt (abgeleitet aus der IP-Adresse), Gerät, Browser, Betriebssystem und Zeitstempel.</li>
                <li><strong>Bei Registrierung/Login:</strong> E-Mail-Adresse, gehashtes Passwort (bei E-Mail-Registrierung) bzw. die vom Anbieter bestätigte E-Mail-Adresse (bei Login mit Google, Discord oder Twitch).</li>
                <li><strong>Cookies:</strong> ausschließlich technisch notwendige Session-Cookies (Anmeldestatus). Wir setzen keine Analyse- oder Marketing-Cookies ein.</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Wofür nutzen wir Ihre Daten?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wir verarbeiten Ihre Daten zur Bereitstellung und Abrechnung unserer Dienste (z. B. Weiterleitung
                verkürzter Links, Benutzerkonto), zur Statistikerstellung für Linkbesitzer, zum Schutz vor Missbrauch
                und Betrug sowie zur Erfüllung rechtlicher Verpflichtungen. Wir verwenden Ihre Daten nicht für
                Profilbildung, Werbung oder die Weitergabe an Dritte zu Vermarktungszwecken.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Welche Rechte haben Sie?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben u. a. Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung
                (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO),
                Widerspruch gegen die Verarbeitung (Art. 21 DSGVO) sowie auf Widerruf erteilter Einwilligungen
                (Art. 7 Abs. 3 DSGVO). Zudem besteht ein Beschwerderecht bei der zuständigen Aufsichtsbehörde
                (Art. 77 DSGVO). Details finden Sie im Abschnitt „Ihre Rechte als betroffene Person“.
              </p>
            </section>

            {/* ============ 2. VERANTWORTLICHE STELLE ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">2. Hinweis zur verantwortlichen Stelle</h2>
              <p className="text-muted-foreground leading-relaxed">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Michel Fritzsch<br />
                vollständige Kontaktdaten (Postanschrift, E-Mail) finden Sie im{" "}
                <a
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Impressum
                </a>
                .
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit
                anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen,
                E-Mail-Adressen o. Ä.) entscheidet.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ein Datenschutzbeauftragter ist nicht bestellt, da die Voraussetzungen des Art. 37 DSGVO für
                unsere Verarbeitungstätigkeiten nicht vorliegen.
              </p>
            </section>

            {/* ============ 3. ALLGEMEINE HINWEISE ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">3. Allgemeine Hinweise und Pflichtinformationen</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Datenschutz</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln
                Ihre personenbezogenen Daten vertraulich und entsprechend der Europäischen Datenschutz-Grundverordnung
                (DSGVO), dem Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz (TDDUG) sowie dieser
                Datenschutzerklärung.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene
                Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende
                Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch,
                wie und zu welchem Zweck das geschieht.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail)
                Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist
                nicht möglich.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Speicherdauer</h3>
              <p className="text-muted-foreground leading-relaxed">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben
                Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein
                berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen,
                werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung
                Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen);
                im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Rechtsgrundlagen der Datenverarbeitung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten
                auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO. Sind Ihre Daten zur Vertragserfüllung oder zur
                Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir sie auf Grundlage des
                Art. 6 Abs. 1 lit. b DSGVO. Sofern die Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung
                erforderlich ist, erfolgt sie auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Verarbeitung kann
                ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen;
                die einschlägigen Interessen werden in den jeweiligen Abschnitten dieser Datenschutzerklärung
                benannt.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Für die Speicherung technisch notwendiger Cookies und vergleichbarer Technologien auf Ihrem Endgerät
                ist keine Einwilligung erforderlich, da diese zur Bereitstellung ausdrücklich angeforderter
                Funktionen unseres Dienstes unerlässlich ist (Art. 6 Abs. 1 lit. f DSGVO in Verbindung mit
                § 25 Abs. 2 Nr. 1 TDDUG).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können
                eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf
                erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Widerspruchsrecht (Art. 21 DSGVO)</h3>
              <p className="text-muted-foreground leading-relaxed">
                WERDEN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO DURCHGEFÜHRT, HABEN SIE
                JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG
                IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES
                PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH
                EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN
                ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN
                ÜBERWIEGEN, ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN
                (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p className="text-muted-foreground leading-relaxed">
                Im Falle von Verstößen gegen die DSGVO steht Ihnen ein Beschwerderecht bei einer Aufsichtsbehörde zu,
                insbesondere bei der Datenschutz-Aufsichtsbehörde des Bundeslandes, in dem unser Unternehmen seinen
                Sitz hat, oder bei der Behörde des Landes, in dem Sie sich befinden (Art. 77 DSGVO). Das
                Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher
                Rechtsbehelfe.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Recht auf Datenübertragbarkeit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags
                automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format
                aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen
                verlangen, erfolgt dies nur, soweit es technisch machbar ist (Art. 20 DSGVO).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">SSL- bzw. TLS-Verschlüsselung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie
                zum Beispiel Anmeldedaten oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine
                TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des
                Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                Wenn die TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von
                Dritten mitgelesen werden.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Auskunft, Löschung und Berichtigung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche
                Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck
                der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten (Art. 15, 16,
                17 DSGVO). Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit
                an uns wenden (Kontaktdaten siehe Abschnitt „Kontakt“).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Recht auf Einschränkung der Verarbeitung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen
                (Art. 18 DSGVO). Das Recht besteht in folgenden Fällen:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir
                in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung
                der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
                <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der
                Löschung die Einschränkung der Datenverarbeitung verlangen.</li>
                <li>Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder
                Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der
                Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
                <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und
                unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das
                Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von
                ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder
                Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder
                juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union
                oder eines Mitgliedstaats verarbeitet werden.
              </p>
            </section>

            {/* ============ 4. DATENERFASSUNG ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">4. Datenerfassung auf dieser Website</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Server-Log-Dateien</h3>
              <p className="text-muted-foreground leading-relaxed">
                Der Provider der Seiten (Hosting-Anbieter) erhebt und speichert automatisch Informationen in
                sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>IP-Adresse</li>
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>angefragte Ressource und Antwortstatus</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung
                dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein
                berechtigtes Interesse an der technisch fehlerfreien Darstellung, Sicherheit und Optimierung seiner
                Website – hierzu müssen die Server-Log-Files erfasst werden. Die Log-Dateien werden gelöscht, sobald
                kein Bedürfnis für die Speicherung mehr besteht (bei unserem Hosting-Anbieter: in der Regel nach
                spätestens 30 Tagen).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Website verwendet teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen
                Schaden an und enthalten keine Viren. Cookies sind kleine Textdateien, die auf Ihrem Rechner
                abgelegt und von Ihrem Browser gespeichert werden.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Wir setzen ausschließlich technisch notwendige Cookies ein</strong>, die für die
                Bereitstellung unseres Dienstes und die von Ihnen ausdrücklich angeforderte Funktion (Login und
                Session-Beibehaltung) erforderlich sind:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>
                  <strong>Session-Cookie für den Anmeldestatus</strong> („__Secure-next-auth.session-token“,
                  httpOnly, Secure, Ablauf: 24 Stunden): speichert, dass Sie angemeldet sind, und ermöglicht die
                  Funktion Ihres Benutzerkontos.
                </li>
                <li>
                  <strong>Supabase-Session-Cookie</strong> („sb-…-auth-token“): wird im Rahmen der Anmeldung über
                  Supabase (siehe Abschnitt „Login mit Google, Discord oder Twitch“) gesetzt und hält Ihre
                  Authentifizierungssitzung aufrecht.
                </li>
                <li>
                  <strong>CSRF-Schutz-Cookie</strong> („next-auth.csrf-token“, kurze Lebensdauer): dient dem
                  Schutz vor Cross-Site-Request-Forgery-Angriffen beim Anmeldevorgang.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Diese technisch notwendigen Cookies werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO in
                Verbindung mit § 25 Abs. 2 Nr. 1 TDDUG gespeichert; für sie ist keine Einwilligung erforderlich.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Wir verwenden keine Analyse-Cookies, keine Marketing-Cookies und keine Cookies von
                Drittanbietern zur Verfolgung Ihres Verhaltens</strong> (kein Google Analytics, kein Matomo, keine
                vergleichbaren Dienste).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ihre Einstellungen unseres Cookie-Banners (z. B. Ihre Einwilligung oder Ablehnung) werden nur lokal
                in Ihrem Browser (localStorage) gespeichert und nicht auf unseren Servern übertragen. Sie können
                Ihre Einstellungen jederzeit über das Cookie-Banner bzw. die Cookie-Einstellungen ändern oder über
                die Browser-Funktionen zur Löschung von Website-Daten vollständig entfernen. Bei der Deaktivierung
                von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Sicherheitsprotokollierung (Security-Events)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Zur Abwehr von Missbrauch, Betrug und unbefugtem Zugriff protokollieren wir sicherheitsrelevante
                Ereignisse, insbesondere erfolgreiche und fehlgeschlagene Anmeldeversuche (E-Mail-Login,
                Passkey-Login, OAuth-Login), überschrittene Zugriffsrate-Limits und verdächtige Anfragen. Diese
                Sicherheitsereignisse werden in den Server-Logs unseres Hosting-Anbieters protokolliert und können
                die IP-Adresse, den User-Agent und – bei Anmeldeversuchen – die E-Mail-Adresse umfassen.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse
                besteht in der Sicherstellung der Sicherheit unserer informationstechnischen Systeme, der
                Schutz vor Missbrauch und Betrug sowie der Erfüllung unserer Pflichten zur Aufklärung von
                Sicherheitsvorfällen. Die Daten werden gelöscht, sobald der Hosting-Anbieter die Server-Logs
                löscht (spätestens nach 30 Tagen).
              </p>
            </section>

            {/* ============ 5. VERKÜRZTE LINKS & STATISTIK ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">5. Nutzung verkürzter Links und Statistiken</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">URL-Verkürzung (als Linkbesitzer)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bei der Nutzung unserer URL-Verkürzungsfunktion wird die von Ihnen eingegebene Ziel-URL zusammen mit
                einem kurzen Code, optionalen Einstellungen (Passwort, Ablaufdatum, Planung, Maskierung) und – bei
                Benutzern – Ihrer Benutzerkennung gespeichert. Diese Daten werden zur Bereitstellung des Dienstes
                benötigt und gespeichert, solange der verkürzte Link existiert; bei Löschung des Links werden die
                zugehörigen Daten gelöscht. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO
                (Bereitstellung des von Ihnen in Anspruch genommenen Dienstes) bzw. Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse an der Bereitstellung und Verbesserung des Dienstes).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Bitte beachten Sie: Veröffentlichen Sie URLs, die personenbezogene Daten Dritter enthalten
                (z. B. im Namen oder in Pfadsegmenten), sind Sie als für diese Daten Verantwortlicher selbst für
                deren Rechtmäßigkeit verantwortlich.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Zugriffsstatistik verkürzter Links (als Besucher)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie einen verkürzten Link aufrufen, werden zur Bereitstellung der Weiterleitung und zur
                Erstellung von Statistiken für den Linkbesitzer folgende Daten gespeichert:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>IP-Adresse (vollständig, <strong>nicht</strong> gekürzt oder anonymisiert)</li>
                <li>Browser-Information (User-Agent) und daraus abgeleitete Angaben zu Gerät, Browser und Betriebssystem</li>
                <li>Referrer-URL (Seite, von der aus Sie den Link aufgerufen haben)</li>
                <li>Land und Stadt (abgeleitet aus Ihrer IP-Adresse, siehe unten „Geolokalisierung“)</li>
                <li>Zeitstempel des Aufrufs</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Zweck und Rechtsgrundlage:</strong> Die Speicherung erfolgt auf Grundlage von Art. 6 Abs. 1
                lit. f DSGVO. Unser berechtigtes Interesse besteht in der Bereitstellung des Kernprodukts
                (Zählung von Link-Klicks und Nutzungsstatistiken für Linkbesitzer) sowie in dem Schutz vor Missbrauch
                und Betrug (z. B. Klickbetrug, Missbrauch passwortgeschützter Links).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Speicherdauer:</strong> Die Zugriffsdaten werden so lange gespeichert, wie der zugehörige
                verkürzte Link existiert. Wird der Link gelöscht, werden die zugehörigen Zugriffsdaten automatisch
                gelöscht. Unabhängig davon können Sie jederzeit die Löschung Ihrer Daten verlangen (Recht auf
                Löschung, Art. 17 DSGVO).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Geolokalisierung (externer Dienst)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Zur Bestimmung von Land und Stadt aus Ihrer IP-Adresse übermitteln wir Ihre IP-Adresse an einen
                externen Geolokalisierungsdienst (ip-api.com). Dieser Dienst erhält ausschließlich Ihre
                IP-Adresse und die abgefragten Felder (Land, Stadt); keine weiteren personenbezogenen Daten werden
                an ihn übermittelt. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse in der Bereitstellung nutzungsbezogener Statistiken für Linkbesitzer).
                Hinweise zur Übermittlung in Drittländer finden Sie im Abschnitt „Übermittlung in Drittländer“.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Pastebin</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie einen Text (Paste) ablegen, wird der Inhalt so lange gespeichert, wie die Paste existiert;
                bei Löschung der Paste wird der Inhalt gelöscht. Der Inhalt kann personenbezogene Daten enthalten –
                dafür sind Sie als Anbieter selbst verantwortlich. Die Verarbeitung erfolgt auf Grundlage von
                Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </section>

            {/* ============ 6. KONTO & LOGIN ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">6. Benutzerkonto und Anmeldung</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Registrierung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie sich auf unserer Website registrieren, speichern wir die von Ihnen angegebenen Daten
                (E-Mail-Adresse) sowie Ihr Passwort – dieses wird nicht im Klartext, sondern als gesalzener
                kryptographischer Hash (bcrypt) gespeichert. Zusätzlich werden technische Metadaten (Konto-ID,
                Rolle, Zeitstempel) verwaltet. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b
                DSGVO (Bereitstellung Ihres Benutzerkontos und der damit verbundenen Dienste).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sie können Ihr Benutzerkonto jederzeit löschen; dabei werden alle damit verbundenen Daten
                (Konto, Links, Pasts, Statistiken) gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten
                (z. B. steuer- oder handelsrechtlicher Natur) der Löschung entgegenstehen, für deren Dauer die Daten
                weiterhin gespeichert bzw. gesperrt werden.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Anmeldung mit E-Mail und Passwort</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bei der Anmeldung mit E-Mail-Adresse und Passwort prüfen wir die Übereinstimmung Ihres
                Passworts (Hash-Vergleich) mit dem gespeicherten Hash. Es werden keine weiteren Daten an Dritte
                übermittelt. Die Anmeldung führt zur Erzeugung einer Session (Session-Cookie, siehe Abschnitt
                „Cookies“). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                Login mit Google, Discord oder Twitch (über Supabase)
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie können sich alternativ mit Ihrem bestehenden Google-, Discord- oder Twitch-Konto anmelden.
                Dabei wird der Login-Prozess über die Plattform <strong>Supabase</strong> abgewickelt:
              </p>
              <ol className="list-decimal pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>
                  Nach Klick auf den entsprechenden Button werden Sie zur Anmeldeseite des jeweiligen Anbieters
                  (Google, Discord oder Twitch) weitergeleitet. Dort können Sie sich in Ihrem bestehenden Konto
                  anmelden. Dabei gelten die jeweils geltenden Datenschutzbestimmungen des Anbieters, die wir Ihnen
                  nachstehend verlinken.
                </li>
                <li>
                  Nach erfolgreicher Anmeldung beim Anbieter bestätigt dieser Supabase Ihre E-Mail-Adresse.
                  Supabase leitet die verifizierte E-Mail-Adresse an uns zurück.
                </li>
                <li>
                  Wir verknüpfen Ihre E-Mail-Adresse mit Ihrem Zhort-Benutzerkonto. Existiert noch kein Konto,
                  wird eines automatisch angelegt. Es werden <strong>keine weiteren Profildaten</strong> (Name,
                  Avatar, Freundschaften etc.) vom Anbieter abgerufen oder gespeichert.
                </li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Verarbeitete Daten:</strong> E-Mail-Adresse, provider-interne Benutzerkennung (bei
                Supabase), Authentifizierungs-Tokens und Sitzungsdaten.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Auftragsverarbeiter:</strong> Die technische Abwicklung der Anmeldung erfolgt durch
                <strong>Supabase Inc., 625 Brickell Ave, 12th Floor, Miami, FL 33131, USA</strong> als unseren
                Auftragsverarbeiter (Art. 28 DSGVO). Supabase speichert zu diesem Zweck Ihre E-Mail-Adresse und die
                Authentifizierungsdaten in ihrer Datenbank.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Rechtsgrundlage:</strong> Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b
                DSGVO (erforderlich für die Bereitstellung des von Ihnen in Anspruch genommenen Login-Features)
                und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer komfortablen und sicheren
                Authentifizierung).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Übermittlung in die USA:</strong> Supabase Inc. ist unter dem EU-U.S. Data Privacy
                Framework zertifiziert (Angemessenheitsbeschluss der Europäischen Kommission vom 10. Juli 2023);
                zusätzlich gelten die Standardvertragsklauseln der Europäischen Kommission (Art. 46 Abs. 2 lit. c
                DSGVO). Details im Abschnitt „Übermittlung in Drittländer“.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Datenverarbeitung durch die Anbieter:</strong>
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>
                  <strong>Google LLC</strong>, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA –{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Datenschutzerklärung von Google</a>
                </li>
                <li>
                  <strong>Discord Inc.</strong>, 3655 California Street, San Francisco, CA 94118, USA –{" "}
                  <a href="https://discord.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Datenschutzerklärung von Discord</a>
                </li>
                <li>
                  <strong>Twitch Interactive, Inc.</strong> (Amazon), 555 West 5th Street, Seattle, WA 98104, USA –{" "}
                  <a href="https://www.twitch.tv/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Datenschutzerklärung von Twitch</a>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Diese Anbieter verarbeiten Ihre Daten im Rahmen des Anmeldevorgangs nach ihren jeweiligen
                Richtlinien; bei Übermittlung in die USA gelten das EU-U.S. Data Privacy Framework bzw. die
                Standardvertragsklauseln (siehe „Übermittlung in Drittländer“).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Passkey-Anmeldung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie sich mit einem Passkey (WebAuthn/FIDO2) anmelden, werden die kryptographischen
                Schlüsselmaterialien ausschließlich auf Ihrem Gerät bzw. in Ihrem sicheren Schlüsselbund (z. B.
                TouchID, Windows Hello) gespeichert und nie auf unsere Server übertragen. In unserem System wird
                nur die Verknüpfung mit Ihrer E-Mail-Adresse gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
                DSGVO.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Enterprise-SSO</h3>
              <p className="text-muted-foreground leading-relaxed">
                Für Geschäftskunden steht ein SSO-Login per einmalig verwendetem, zeitlich befristetem Token bereit.
                Der Token wird nach Verwendung sofort ungültig. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
                (vertragliche Leistungserbringung gegenüber Unternehmen).
              </p>
            </section>

            {/* ============ 7. WEITERE FUNKTIONEN ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">7. Weitere Funktionen der Website</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Webhooks (für Linkbesitzer)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Als Linkbesitzer können Sie eigene Webhook-Endpunkte konfigurieren, die bei Ereignissen (z. B.
                Link-Klick, Link-Abgelaufen) automatisch benachrichtigt werden. Die Benachrichtigung enthält
                u. a. die URL des Links sowie <strong>Daten des aufrufenden Besuchers: IP-Adresse, User-Agent und
                Referrer-URL</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Ab dem Zeitpunkt der Weiterleitung an Ihren Endpunkt verarbeiten Sie diese Daten als
                <strong>eigenständiger Verantwortlicher</strong> nach Ihrer eigenen Rechtsgrundlage und Ihren
                eigenen Datenschutzbestimmungen. Wir weisen darauf hin, dass die Übermittlung von IP-Adressen an
                Dritte nur zulässig ist, wenn Sie hierfür eine angemessene Rechtsgrundlage (z. B. Art. 6 Abs. 1 lit. b,
                c oder f DSGVO) und die betroffene Person ggf. informieren.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Tracking-Pixel von Linkbesitzern</h3>
              <p className="text-muted-foreground leading-relaxed">
                Linkbesitzer können in die Zwischenseite (Splash-/Masking-Seite) eines verkürzten Links eigene
                Tracking-Pixel einbetten, z. B. den Meta-Pixel (Facebook) oder Google Tag Manager. Diese Pixel
                werden von den Servern des jeweiligen Pixel-Betreibers geladen, wenn ein Besucher die
                Zwischenseite aufruft.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Für die durch den Pixel ausgelöste Datenverarbeitung ist <strong>der Linkbesitzer als
                eigenständiger Verantwortlicher</strong> verantwortlich; wir stellen lediglich die technische
                Funktion zur Verfügung. Der Linkbesitzer hat sicherzustellen, dass er die betroffenen Besucher
                ordnungsgemäß informiert und – soweit erforderlich – eine Einwilligung einholt.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">API und API-Schlüssel</h3>
              <p className="text-muted-foreground leading-relaxed">
                Für die Nutzung unserer API erzeugen wir API-Schlüssel, die kryptographisch signiert und nur als
                Hash gespeichert werden. Über die API verarbeitete Daten unterliegen den gleichen Bestimmungen wie
                die entsprechende Funktion im Frontend. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </section>

            {/* ============ 8. HOSTING ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">8. Hosting</h2>
              <p className="text-muted-foreground leading-relaxed">
                Unsere Website und die zugehörige PostgreSQL-Datenbank werden über die Plattform{" "}
                <strong>Vercel Inc.</strong>, 355 S. Welly Court, San Mateo, CA 94402, USA betrieben (Frontend-Hosting
                und „Vercel Postgres“ als managed Database-Service).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Die personenbezogenen Daten, die im Rahmen unserer Website erfasst werden (z. B. Benutzerkonten,
                Links, Zugriffsstatistiken, Server-Logs), werden auf den Servern des Hosting-Anbieters gespeichert.
                Je nach Konfiguration können die Daten in Rechenzentren in der Europäischen Union und in den
                Vereinigten Staaten verarbeitet werden.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren Nutzern (Art. 6 Abs. 1
                lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres
                Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wir haben mit dem Hosting-Anbieter einen <strong>Auftragsverarbeitungsvertrag</strong> im Sinne des
                Art. 28 DSGVO geschlossen. Vercel Inc. ist unter dem <strong>EU-U.S. Data Privacy Framework</strong>{" "}
                zertifiziert; zusätzlich gelten die Standardvertragsklauseln der Europäischen Kommission
                (Art. 46 Abs. 2 lit. c DSGVO).
              </p>
            </section>

            {/* ============ 9. DRITTLÄNDER ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">9. Übermittlung in Drittländer</h2>
              <p className="text-muted-foreground leading-relaxed">
                Im Rahmen unseres Dienstes werden personenbezogene Daten an Dienstleister in den Vereinigten
                Staaten (und ggf. anderen Ländern außerhalb des EWR) übermittelt. Eine Übersicht der betroffenen
                Empfänger:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-3 text-muted-foreground">
                <li>
                  <strong>Vercel Inc. (USA)</strong> – Hosting und Datenbank (siehe Abschnitt „Hosting“)
                </li>
                <li>
                  <strong>Supabase Inc. (USA)</strong> – technische Abwicklung der Anmeldung (siehe Abschnitt
                  „Benutzerkonto und Anmeldung“)
                </li>
                <li>
                  <strong>Google LLC (USA)</strong>, <strong>Discord Inc. (USA)</strong>,{" "}
                  <strong>Twitch Interactive, Inc. (USA)</strong> – nur im Rahmen Ihrer aktiven Anmeldung über
                  deren Plattformen (siehe oben)
                </li>
                <li>
                  <strong>ip-api.com</strong> – Geolokalisierung Ihrer IP-Adresse (siehe Abschnitt „Geolokalisierung“)
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Rechtsgrundlage und Schutzmaßnahmen:</strong> Die Übermittlung in die Vereinigten Staaten
                erfolgt auf Grundlage des <strong>EU-U.S. Data Privacy Framework</strong> (Angemessenheitsbeschluss
                der Europäischen Kommission vom 10. Juli 2023), soweit der jeweilige Anbieter auf der
                Zertifizierungsliste des U.S. Department of Commerce aufgeführt ist. Ergänzend bzw. alternativ
                gelten die <strong>Standardvertragsklauseln der Europäischen Kommission</strong> (Art. 46 Abs. 2 lit. c
                DSGVO). Für die Übermittlung der IP-Adresse an den Geolokalisierungsdienst ip-api.com stützen wir uns
                auf Art. 49 Abs. 1 lit. f DSGVO (berechtigtes
                Interesse an der Bereitstellung von Nutzungsstatistiken für Linkbesitzer) unter Beachtung der
                dortigen Voraussetzungen.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sie haben das Recht, eine Kopie der getroffenen Schutzmaßnahmen (z. B. der Standardvertragsklauseln)
                von uns anzufordern.
              </p>
            </section>

            {/* ============ 10. IHRE RECHTE ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">10. Ihre Rechte als betroffene Person</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer
                gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO). Sie haben außerdem ein Recht auf
                Berichtigung (Art. 16 DSGVO) oder Löschung (Art. 17 DSGVO) Ihrer personenbezogenen Daten sowie,
                unter den in dieser Datenschutzerklärung beschriebenen Voraussetzungen, ein Recht auf Einschränkung
                der Verarbeitung (Art. 18 DSGVO). Sofern Sie die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. a
                oder 9 Abs. 2 lit. a DSGVO gestattet haben, haben Sie das Recht, Ihre Einwilligung jederzeit zu
                widerrufen (Art. 7 Abs. 3 DSGVO).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Zudem steht Ihnen das Recht auf Datenübertragbarkeit (Art. 20 DSGVO) sowie – soweit die Verarbeitung
                auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt – das Recht auf Widerspruch (Art. 21
                DSGVO) zu. Im Falle von Verstößen gegen die DSGVO besteht ein Beschwerderecht bei der zuständigen
                Aufsichtsbehörde (Art. 77 DSGVO).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an die im Abschnitt „Kontakt“ angegebenen
                Kontaktdaten. Wir werden Ihr Anliegen unverzüglich, in der Regel innerhalb eines Monats, bearbeiten.
                Bei Auskunftsanfragen mehrerer betroffener Personen können wir zur Wahrung unserer berechtigten
                Interessen die Identität des Anfragenden prüfen.
              </p>
            </section>

            {/* ============ 11. GOOGLE FONTS ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">11. Schriftarten (Fonts)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten sogenannte Web-Fonts. Die
                Schriftartendateien werden bereits beim Build-Prozess lokal auf unseren Servern gespeichert und
                ausschließlich von dort ausgeliefert; eine Verbindung zu den Servern des Schriftarten-Anbieters
                (z. B. Google) findet dabei zur Laufzeit <strong>nicht</strong> statt.
              </p>
            </section>

            {/* ============ 12. ÄNDERUNGEN ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">12. Änderungen dieser Datenschutzerklärung</h2>
              <p className="text-muted-foreground leading-relaxed">
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen
                rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der
                Datenschutzerklärung umzusetzen, z. B. bei der Einführung neuer Services oder der Änderung unserer
                Datenschutzmaßnahmen. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Diese Datenschutzerklärung wurde mit Unterstützung der aktuellen datenschutzrechtlichen
                Anforderungen (DSGVO, TDDUG, EU-U.S. Data Privacy Framework) erstellt und wird regelmäßig überprüft.
              </p>
            </section>

            {/* ============ 13. KONTAKT ============ */}
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">13. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich jederzeit an uns wenden.
                Die Kontaktdaten finden Sie in unserem{" "}
                <a
                  href="https://www.michelfritzsch.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Impressum
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
