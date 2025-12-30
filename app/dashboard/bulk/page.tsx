'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardIcon, DocumentArrowUpIcon, CheckIcon } from '@heroicons/react/24/outline';

interface BulkResult {
  success: boolean;
  longUrl: string;
  shortCode?: string;
  shortUrl?: string;
  error?: string;
}

interface BulkResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: BulkResult[];
}

export default function BulkShorteningPage() {
  const [mode, setMode] = useState<'text' | 'csv'>('text');
  const [textInput, setTextInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      return;
    }

    setLoading(true);
    try {
      const urls = textInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(url => ({ url }));

      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data: BulkResponse = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Bulk shortening error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('format', 'csv');

      const response = await fetch('/api/links/bulk', {
        method: 'PUT',
        body: formData,
      });

      const data: BulkResponse = await response.json();
      setResults(data);
    } catch (error) {
      console.error('CSV upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportResults = () => {
    if (!results) return;

    const csv = [
      'Long URL,Short Code,Short URL,Status',
      ...results.results.map(r =>
        `"${r.longUrl}","${r.shortCode || ''}","${r.shortUrl || ''}","${r.success ? 'Success' : 'Failed: ' + (r.error || 'Unknown')}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-links-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Bulk URL Shortening
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kürzen Sie mehrere URLs gleichzeitig - perfekt für Marketing-Kampagnen und Newsletter
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Input-Methode wählen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Button
                  variant={mode === 'text' ? 'default' : 'outline'}
                  onClick={() => setMode('text')}
                  fullWidth
                >
                  Text-Input
                </Button>
                <Button
                  variant={mode === 'csv' ? 'default' : 'outline'}
                  onClick={() => setMode('csv')}
                  fullWidth
                >
                  CSV Upload
                </Button>
              </div>

              {mode === 'text' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      URLs (eine pro Zeile)
                    </label>
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 font-mono text-sm min-h-[200px]"
                      rows={10}
                    />
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Geben Sie eine URL pro Zeile ein. Maximal 100 URLs pro Batch.
                    </p>
                  </div>
                  <Button
                    onClick={handleTextSubmit}
                    loading={loading}
                    fullWidth
                    disabled={!textInput.trim()}
                  >
                    URLs kürzen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      CSV-Datei hochladen
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="cursor-pointer inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Datei auswählen
                      </label>
                      {csvFile && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {csvFile.name}
                        </p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      CSV-Format: url,customCode,password,expiresIn,isPublic (optional)
                    </p>
                  </div>
                  <Button
                    onClick={handleCSVUpload}
                    loading={loading}
                    fullWidth
                    disabled={!csvFile}
                  >
                    CSV verarbeiten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Anleitung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Text-Input Modus:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Eine URL pro Zeile eingeben</li>
                  <li>Maximal 100 URLs pro Batch</li>
                  <li>Automatische Short-Code-Generierung</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  CSV-Format:
                </h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`url,customCode,password,expiresIn,isPublic
https://example.com,my-link,,never,true
https://example2.com,link2,secret123,7-day,false`}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Tipps:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>CSV kann optional Header-Zeile enthalten</li>
                  <li>Passwörter werden sicher gehasht</li>
                  <li>Ergebnisse können als CSV exportiert werden</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Ergebnisse ({results.successful}/{results.total} erfolgreich)
                </CardTitle>
                {results.successful > 0 && (
                  <Button variant="outline" onClick={exportResults} size="sm">
                    <ClipboardIcon className="h-4 w-4 mr-2" />
                    Als CSV exportieren
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {results.failed > 0 && (
                <Alert variant="warning" className="mb-4">
                  {results.failed} Link(s) konnten nicht erstellt werden. Bitte prüfen Sie die Fehlermeldungen.
                </Alert>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Long URL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Short Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Short URL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Aktion
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.results.map((result, index) => (
                      <tr key={index} className={result.success ? '' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {result.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Erfolg
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              Fehler
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">
                            {result.longUrl}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                            {result.shortCode || '-'}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-indigo-600 dark:text-indigo-400 max-w-md truncate">
                            {result.shortUrl || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {result.success && result.shortUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(result.shortUrl!, index)}
                              aria-label="Kopieren"
                            >
                              {copiedIndex === index ? (
                                <CheckIcon className="h-4 w-4 text-green-600" />
                              ) : (
                                <ClipboardIcon className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {!result.success && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {result.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
