import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2">
              API Dokumentation
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Integration für Entwickler & AI-Agenten
            </p>
          </div>
          <Link href="/dashboard/api-keys" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            API Key erstellen
          </Link>
        </div>

        <div className="space-y-12">
          
          {/* Authentifizierung */}
          <section className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border-2 border-indigo-100 dark:border-indigo-900/30">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              🔐 Authentifizierung
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Öffentlicher Zugriff</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Für einfache Anwendungsfälle ohne Account.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Kein API Key notwendig</li>
                  <li>Rate Limit: 60 Requests / Minute (IP-basiert)</li>
                  <li>Keine Analytics oder Verwaltung</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Mit API Key</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Für professionelle Integrationen.
                </p>
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 mb-3">
                  <code className="font-mono text-sm text-gray-300">
                    Authorization: Bearer <span className="text-indigo-400">sk_live_...</span>
                  </code>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Höhere Rate Limits (1000+ Req/Min)</li>
                  <li>Links sind dem Account zugeordnet</li>
                  <li>Zugriff auf Analytics & Management API</li>
                </ul>
              </div>
            </div>
          </section>

          {/* MCP Info */}
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
              🤖 AI Integration (MCP)
            </h2>
            <p className="text-indigo-800 dark:text-indigo-200 mb-4">
              Verbinden Sie Claude, Cursor oder andere AI-Agenten direkt via Model Context Protocol.
              <br/><span className="text-sm font-bold opacity-80">*Erfordert API Key</span>
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800 font-mono text-sm text-indigo-600 dark:text-indigo-300 break-all">
              SSE Endpoint: https://zhort.de/api/mcp
            </div>
          </section>

          {/* Endpoints */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Endpoints</h2>
            
            <div className="space-y-8">
              {/* Shorten */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-bold text-sm border border-green-200 dark:border-green-800">POST</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">/api/v1/shorten</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Erstellt einen neuen gekürzten Link.</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Request Body</h4>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm border border-gray-800">
{`{
  "url": "https://example.com",
  "customCode": "my-link", // optional
  "password": "secret",    // optional
  "expiresIn": "24h"       // optional
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-gray-500 mb-2">Response (201)</h4>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm border border-gray-800">
{`{
  "shortCode": "my-link",
  "shortUrl": "https://zhort.de/s/my-link",
  "originalUrl": "https://example.com"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-bold text-sm border border-blue-200 dark:border-blue-800">GET</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">/api/analytics/{'{linkId}'}</h3>
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">Auth Required</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Ruft detaillierte Statistiken für einen Link ab.</p>
              </div>

            </div>
          </section>

          {/* Sicherheit */}
          <section className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
            <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Sicherheit & Abuse Prevention
            </h2>
            <p className="text-sm text-yellow-800/80 dark:text-yellow-200/70">
              Alle URLs werden automatisch gegen globale Threat-Intelligence-Listen (Google Safe Browsing & Hagezi) geprüft. 
              Wir blockieren Malware, Phishing und Spam proaktiv.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
