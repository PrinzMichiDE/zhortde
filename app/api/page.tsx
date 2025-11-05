export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
          API Dokumentation
        </h1>
        <p className="text-gray-600 mb-8">
          Verwenden Sie unsere öffentliche API, um URLs programmatisch zu kürzen.
        </p>

        <div className="space-y-8">
          {/* Endpoint */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Endpoint</h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <code className="text-indigo-600 font-mono">
                POST /api/v1/shorten
              </code>
            </div>
          </section>

          {/* Request */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Headers</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <code className="text-sm">Content-Type: application/json</code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Body</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`{
  "url": "https://example.com/sehr/lange/url",
  "customCode": "mein-link" // optional
}`}
                </pre>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>url</strong>: Die zu kürzende URL (erforderlich)</p>
                  <p><strong>customCode</strong>: Individueller Short Code (optional, 3-50 Zeichen, nur a-z, 0-9, -, _)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Response */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Response</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">Erfolg (201)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`{
  "success": true,
  "shortUrl": "https://zhort.app/s/abc12345",
  "shortCode": "abc12345",
  "originalUrl": "https://example.com/sehr/lange/url"
}`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Fehler (403 - Blockiert)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`{
  "success": false,
  "error": "Domain blockiert",
  "message": "Diese Domain steht auf der Blocklist..."
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* Beispiel */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Beispiele</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">cURL</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`# Zufälliger Short Code
curl -X POST https://zhort.app/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/sehr/lange/url"}'

# Mit individuellem Short Code
curl -X POST https://zhort.app/api/v1/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/sehr/lange/url", "customCode": "mein-link"}'`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">JavaScript (fetch)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`const response = await fetch('https://zhort.app/api/v1/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/sehr/lange/url'
  })
});

const data = await response.json();
console.log(data.shortUrl);`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Python (requests)</h3>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`import requests

response = requests.post(
    'https://zhort.app/api/v1/shorten',
    json={'url': 'https://example.com/sehr/lange/url'}
)

data = response.json()
print(data['shortUrl'])`}
                </pre>
              </div>
            </div>
          </section>

          {/* Sicherheit */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Blocklist-Schutz
            </h2>
            <p className="text-gray-700">
              Alle URLs werden automatisch gegen die{' '}
              <a 
                href="https://github.com/hagezi/dns-blocklists"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Hagezi DNS Blocklist
              </a>
              {' '}geprüft. URLs von blockierten Domains werden abgelehnt.
            </p>
          </section>

          {/* Rate Limiting Info */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hinweise</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Die API ist öffentlich und erfordert keine Authentifizierung</li>
              <li>Erstellte Links sind standardmäßig öffentlich</li>
              <li>Links werden nicht automatisch gelöscht</li>
              <li>Nur HTTP und HTTPS URLs sind erlaubt</li>
              <li>Individuelle Short Codes: 3-50 Zeichen, nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche</li>
              <li>Short Codes sind eindeutig und können nur einmal vergeben werden</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

