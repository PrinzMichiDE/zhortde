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
              <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
                passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
                persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen 
                Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Datenerfassung auf dieser Website</h3>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>

              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Wie erfassen wir Ihre Daten?</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um 
                Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch oder nach Ihrer 
                Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten 
                (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt 
                automatisch, sobald Sie diese Website betreten.
              </p>

              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Wofür nutzen wir Ihre Daten?</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
                Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>

              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
                gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder 
                Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, 
                können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, 
                unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. 
                Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">2. Hosting</h2>
              <p className="text-muted-foreground leading-relaxed">
                Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, 
                die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Hierbei kann es 
                sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
                Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und 
                bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und 
                effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Datenschutz</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzbestimmungen sowie 
                dieser Datenschutzerklärung.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene 
                Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung 
                erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck 
                das geschieht.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) 
                Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Michel Fritzsch<br />
                Weitere Kontaktdaten finden Sie im{' '}
                <a 
                  href="https://www.michelfritzsch.de/impressum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Impressum
                </a>.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen 
                über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) 
                entscheidet.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Speicherdauer</h3>
              <p className="text-muted-foreground leading-relaxed">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
                Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
                berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden 
                Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer 
                personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten 
                Fall erfolgt die Löschung nach Fortfall dieser Gründe.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf 
                Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien 
                nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung 
                personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endgerät (z. B. via 
                Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25 
                Abs. 1 TTDSG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur 
                Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung 
                erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf 
                Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im 
                Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine 
                bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten 
                Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
              <p className="text-muted-foreground leading-relaxed">
                WERDEN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO DURCHGEFÜHRT, HABEN SIE 
                JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG 
                IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES 
                PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER 
                DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN 
                NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, 
                DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, 
                AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, 
                JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER 
                WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. 
                WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG 
                VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p className="text-muted-foreground leading-relaxed">
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, 
                insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des 
                mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder 
                gerichtlicher Rechtsbehelfe.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Recht auf Datenübertragbarkeit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags 
                automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format 
                aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen 
                verlangen, erfolgt dies nur, soweit es technisch machbar ist.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">SSL- bzw. TLS-Verschlüsselung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum 
                Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. 
                Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf „https://" 
                wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht 
                von Dritten mitgelesen werden.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Auskunft, Löschung und Berichtigung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft 
                über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung 
                und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema 
                personenbezogene Daten können Sie sich jederzeit an uns wenden.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Recht auf Einschränkung der Verarbeitung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu 
                können Sie sich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:
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
                Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer 
                Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von 
                Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus 
                Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden 
                an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu 
                machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Die meisten der von uns verwendeten Cookies sind so genannte „Session-Cookies". Sie werden nach Ende Ihres 
                Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. 
                Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies 
                nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das 
                automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies 
                kann die Funktionalität dieser Website eingeschränkt sein.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur Bereitstellung bestimmter, von 
                Ihnen erwünschter Funktionen (z. B. für die Warenkorbfunktion) oder zur Optimierung der Website (z. B. Cookies 
                zur Messung des Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 
                lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird. Der Websitebetreiber hat ein 
                berechtigtes Interesse an der Speicherung von notwendigen Cookies zur technisch fehlerfreien und optimierten 
                Bereitstellung seiner Dienste. Sofern eine Einwilligung zur Speicherung von Cookies und vergleichbaren 
                Wiedererkennungstechnologien abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage dieser 
                Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TTDSG); die Einwilligung ist jederzeit widerrufbar.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Server-Log-Dateien</h3>
              <p className="text-muted-foreground leading-relaxed">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
                die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten 
                erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an 
                der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files 
                erfasst werden.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Kontaktformular</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular 
                inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von 
                Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit 
                der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. 
                In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung 
                der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) 
                sofern diese abgefragt wurde.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, 
                Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach 
                abgeschlossener Bearbeitung Ihrer Anfrage). Zwingende gesetzliche Bestimmungen – insbesondere Aufbewahrungsfristen – 
                bleiben unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">5. Plugins und Tools</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Google Fonts (lokales Hosting)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die lokal gehostet werden. 
                Eine Verbindung zu Servern von Google findet dabei nicht statt.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">6. Spezielle Funktionen dieser Website</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">URL-Verkürzung</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bei der Nutzung unserer URL-Verkürzungsfunktion werden die von Ihnen eingegebenen URLs gespeichert und mit einem 
                kurzen Code verknüpft. Diese Daten werden zur Bereitstellung des Dienstes benötigt und gespeichert, solange der 
                verkürzte Link aktiv ist oder Sie ihn löschen. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO 
                (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bereitstellung des Dienstes).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Analytics und Statistiken</h3>
              <p className="text-muted-foreground leading-relaxed">
                Zur Verbesserung unseres Dienstes erheben wir anonymisierte Statistiken über die Nutzung der verkürzten Links. 
                Hierzu werden technische Daten wie IP-Adressen, Browser-Informationen und Zugriffszeiten gespeichert. Die IP-Adressen 
                werden dabei anonymisiert, sodass keine Rückschlüsse auf einzelne Personen möglich sind. Die Verarbeitung erfolgt 
                auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Verbesserung des Dienstes).
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Registrierung und Benutzerkonten</h3>
              <p className="text-muted-foreground leading-relaxed">
                Wenn Sie sich auf unserer Website registrieren, speichern wir die von Ihnen angegebenen Daten (E-Mail-Adresse, 
                Benutzername, Passwort-Hash) zur Bereitstellung Ihres Benutzerkontos. Die Verarbeitung erfolgt auf Grundlage von 
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Sie können Ihr Benutzerkonto jederzeit löschen, wodurch alle 
                damit verbundenen Daten gelöscht werden, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">7. Änderungen dieser Datenschutzerklärung</h2>
              <p className="text-muted-foreground leading-relaxed">
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen 
                Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, 
                z. B. bei der Einführung neuer Services. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">8. Kontakt</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bei Fragen zum Datenschutz können Sie sich jederzeit an uns wenden. Kontaktdaten finden Sie im{' '}
                <a 
                  href="https://www.michelfritzsch.de/impressum" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Impressum
                </a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
