'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const [endpoint] = useState(() =>
    typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : ''
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline mb-4 inline-block">
            &larr; Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
            Enterprise Integrations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Verbinden Sie Zhort mit Ihren Workflows und AI-Agenten.
          </p>
        </div>

        <div className="space-y-8">
          {/* MCP Server Integration */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">🤖</span>
                  Model Context Protocol (MCP)
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Nutzen Sie Zhort direkt aus Ihrem AI-Editor (wie Cursor) oder anderen MCP-fähigen Tools.
                  Der MCP Server stellt Tools zum Kürzen von Links und Abrufen von Statistiken bereit.
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold uppercase tracking-wide border border-green-200 dark:border-green-800">
                Aktiv
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-border mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Server URL (SSE Endpoint)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 block w-full px-4 py-3 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                  {endpoint || 'Lädt...'}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-card border border-gray-300 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="URL kopieren"
                >
                  {copied ? (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Fügen Sie diese URL in Ihre MCP-Client-Konfiguration ein (z.B. in Cursor Settings &gt; Features &gt; MCP).
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/30">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                Einrichtung in Cursor
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>Öffnen Sie <strong>Cursor Settings</strong> (Strg+, / Cmd+,).</li>
                <li>Navigieren Sie zu <strong>Features &gt; MCP</strong>.</li>
                <li>Klicken Sie auf <strong>Add New MCP Server</strong>.</li>
                <li>Wählen Sie <strong>SSE</strong> als Typ.</li>
                <li>Geben Sie einen Namen ein (z.B. &quot;Zhort&quot;).</li>
                <li>Fügen Sie die oben stehende URL ein.</li>
              </ol>
            </div>
            
            <div className="mt-6 flex justify-end">
               <Link 
                 href="/dashboard/api-keys"
                 className="text-sm font-medium text-primary hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
               >
                 API Key erstellen &rarr;
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
