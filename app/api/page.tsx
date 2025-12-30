export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4">
          API Dokumentation
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Verwenden Sie unsere öffentliche API oder das Model Context Protocol (MCP), um Zhort in Ihre Workflows zu integrieren.
        </p>

        <div className="space-y-12">
          
          {/* MCP Info */}
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Integration (MCP)
            </h2>
            <p className="text-indigo-800 dark:text-indigo-200 mb-4">
              Zhort unterstützt das Model Context Protocol nativ. Verbinden Sie Cursor oder andere AI-Agenten direkt mit Zhort.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800 font-mono text-sm text-indigo-600 dark:text-indigo-300 break-all">
              SSE Endpoint: https://zhort.de/api/mcp
            </div>
            <p className="text-sm mt-2 text-indigo-700 dark:text-indigo-400">
              Weitere Informationen finden Sie im <a href="/dashboard/integrations" className="underline hover:text-indigo-900 dark:hover:text-indigo-200">Integrations Dashboard</a>.
            </p>
          </section>

          {/* Endpoint */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-bold text-sm border border-green-200 dark:border-green-800">POST</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Link erstellen</h2>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                https://zhort.de/api/v1/shorten
              </code>
            </div>
          </section>

          {/* Request */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Request Body</h2>
            <div className="space-y-4">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-800 shadow-inner">
{`{
  "url": "https://example.com/sehr/lange/url",
  "customCode": "mein-link" // optional
}`}
              </pre>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">url</code> (string, required): Die zu kürzende URL.</p>
                <p><code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">customCode</code> (string, optional): Individueller Alias (3-50 Zeichen, a-z, 0-9, -, _).</p>
              </div>
            </div>
          </section>

          {/* Response */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Response</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">Erfolg (201)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm h-full border border-gray-800 shadow-inner">
{`{
  "success": true,
  "shortUrl": "https://zhort.de/s/abc12345",
  "shortCode": "abc12345",
  "originalUrl": "https://example.com/..."
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Fehler (400/403)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm h-full border border-gray-800 shadow-inner">
{`{
  "success": false,
  "error": "Domain blockiert",
  "message": "Domain steht auf der Blocklist"
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Code Examples */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Code Beispiele</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">cURL</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-800 shadow-inner">
{`curl -X POST https://zhort.de/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://google.com"}'`}
                </pre>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">JavaScript / Node.js</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto border border-gray-800 shadow-inner">
{`const res = await fetch('https://zhort.de/api/v1/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://google.com' })
});
const data = await res.json();
console.log(data.shortUrl);`}
                </pre>
              </div>
            </div>
          </section>

          {/* Sicherheit & Limits */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
              <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Sicherheit
              </h2>
              <p className="text-sm text-yellow-800/80 dark:text-yellow-200/70">
                Alle URLs werden automatisch gegen globale Threat-Intelligence-Listen (Hagezi DNS Blocklist) geprüft. Phishing- und Malware-Domains werden sofort abgelehnt.
              </p>
            </section>

            <section className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-6">
              <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Limits
              </h2>
              <ul className="text-sm text-blue-800/80 dark:text-blue-200/70 space-y-1 list-disc list-inside">
                <li>Rate Limit: 60 Requests / Minute pro IP</li>
                <li>Maximal 50 Zeichen pro Short-Code</li>
                <li>Links verfallen standardmäßig nicht</li>
              </ul>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
