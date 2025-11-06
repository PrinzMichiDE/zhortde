'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { data: session } = useSession();
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortUrl('');
    setLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          longUrl, 
          isPublic,
          customCode: customCode.trim() || undefined 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Kürzen der URL');
      }

      const baseUrl = process.env.NEXTAUTH_URL || window.location.origin;
      setShortUrl(`${baseUrl}/s/${data.shortCode}`);
      setLongUrl('');
      setCustomCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
            Verkürzen Sie Ihre URLs
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Schnell, einfach und kostenlos - mit optionalem Account für erweiterte Funktionen
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Lange URL
            </label>
            <input
              type="url"
              id="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://example.com/sehr/lange/url"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
              Individueller Short Code (optional)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">/s/</span>
              <input
                type="text"
                id="customCode"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="mein-link"
                minLength={3}
                maxLength={50}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 transition-colors"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche (a-z, 0-9, -, _)
            </p>
          </div>

          {session && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Öffentlich (für alle sichtbar)
              </span>
              <Switch
                checked={isPublic}
                onChange={setIsPublic}
                className="group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[checked]:bg-indigo-600"
              >
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-data-[checked]:translate-x-5" />
              </Switch>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Wird gekürzt...
              </span>
            ) : 'URL kürzen'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {shortUrl && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-slide-up shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Ihre gekürzte URL:
                </p>
                <a
                  href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
                  className="text-lg font-bold text-indigo-600 hover:text-indigo-700 break-all transition-colors"
                >
                  {shortUrl}
                </a>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex-shrink-0 p-3 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-110"
              >
                {copied ? (
                  <CheckIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ClipboardIcon className="h-6 w-6 text-indigo-600" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4 group-hover:shadow-lg transition-shadow">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Blitzschnell</h3>
            <p className="text-gray-600">Kürzen Sie URLs in Sekundenschnelle</p>
          </div>
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4 group-hover:shadow-lg transition-shadow">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sicher</h3>
            <p className="text-gray-600">Private Links nur für Sie sichtbar</p>
          </div>
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-4 group-hover:shadow-lg transition-shadow">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Statistiken</h3>
            <p className="text-gray-600">Verfolgen Sie Ihre Link-Klicks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
