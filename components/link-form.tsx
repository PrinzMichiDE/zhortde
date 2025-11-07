'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';
import { 
  CheckIcon, 
  ClipboardIcon, 
  LockClosedIcon,
  ClockIcon,
  QrCodeIcon 
} from '@heroicons/react/24/outline';
import { EXPIRATION_OPTIONS } from '@/lib/password-protection';

export function LinkForm() {
  const { data: session } = useSession();
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [shortUrl, setShortUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
          customCode: customCode.trim() || undefined,
          password: password || undefined,
          expiresIn: expiresIn === 'never' ? undefined : expiresIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Kürzen der URL');
      }

      const baseUrl = window.location.origin;
      setShortUrl(`${baseUrl}/s/${data.shortCode}`);
      setShortCode(data.shortCode);
      setLongUrl('');
      setCustomCode('');
      setPassword('');
      setExpiresIn('never');
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
    <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-semibold text-gray-800 mb-2">
            Lange URL
          </label>
          <input
            type="url"
            id="url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="https://example.com/sehr/lange/url"
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 hover:border-indigo-400 font-medium"
          />
        </div>

        <div>
          <label htmlFor="customCode" className="block text-sm font-semibold text-gray-800 mb-2">
            Individueller Short Code (optional)
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 text-sm font-semibold bg-gray-100 px-3 py-3 rounded-lg border-2 border-gray-300">/s/</span>
            <input
              type="text"
              id="customCode"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              placeholder="mein-link"
              minLength={3}
              maxLength={50}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 hover:border-indigo-400 font-medium"
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="group text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-all duration-200 flex items-center gap-2 hover:gap-3 px-4 py-2 rounded-lg hover:bg-indigo-50"
        >
          <svg 
            className={`w-4 h-4 transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : 'rotate-0'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Erweiterte Optionen</span>
          <span className="text-xs bg-indigo-100 group-hover:bg-indigo-200 px-2 py-0.5 rounded-full transition-colors">
            {showAdvanced ? 'Ausblenden' : 'Anzeigen'}
          </span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-inner">
            {/* Password Protection */}
            <div>
              <label htmlFor="password" className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                <LockClosedIcon className="h-4 w-4 mr-2 text-indigo-600" />
                Passwortschutz (optional)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 hover:border-indigo-400 font-medium"
              />
              <p className="text-xs text-gray-600 mt-1.5 font-medium">
                Link ist nur mit diesem Passwort zugänglich
              </p>
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="expiresIn" className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                <ClockIcon className="h-4 w-4 mr-2 text-indigo-600" />
                Ablaufdatum
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 transition-all duration-300 hover:border-indigo-400 font-medium cursor-pointer"
              >
                {EXPIRATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Public/Private Toggle (nur für eingeloggte User) */}
            {session && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Öffentlich sichtbar
                </span>
                <Switch
                  checked={isPublic}
                  onChange={setIsPublic}
                  className={`${
                    isPublic ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-400'
                  } relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner`}
                >
                  <span
                    className={`${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md`}
                  />
                </Switch>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700 font-semibold text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? 'Wird gekürzt...' : 'URL kürzen'}
        </button>
      </form>

      {shortUrl && (
        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-300 animate-slide-in shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
          {/* Success confetti effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
          
          <h3 className="text-xl font-bold text-green-800 mb-5 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 rounded-full animate-bounce">
              <CheckIcon className="h-5 w-5 text-white" />
            </span>
            <span>Link erfolgreich erstellt! 🎉</span>
          </h3>
          
          <div className="bg-white rounded-xl p-5 mb-5 shadow-md border border-green-200 hover:border-green-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🔗</span>
                <span>Ihre Kurz-URL:</span>
              </span>
              <button
                onClick={copyToClipboard}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                  copied 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span className="text-sm">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-4 w-4" />
                    <span className="text-sm">Kopieren</span>
                  </>
                )}
              </button>
            </div>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-mono text-base md:text-lg break-all underline decoration-2 underline-offset-2 hover:decoration-indigo-800 transition-colors font-semibold"
            >
              {shortUrl}
            </a>
          </div>

          {/* QR Code Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <a
              href={`/api/qr/${shortCode}?format=png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 font-semibold rounded-lg border-2 border-indigo-200 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <QrCodeIcon className="h-5 w-5" />
              <span>QR-Code anzeigen</span>
            </a>
            <a
              href={`/api/qr/${shortCode}?format=png&width=600`}
              download={`qr-${shortCode}.png`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-green-50 text-green-600 hover:text-green-700 font-semibold rounded-lg border-2 border-green-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>QR herunterladen</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

