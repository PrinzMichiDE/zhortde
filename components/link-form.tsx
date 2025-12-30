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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';

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
  const [urlError, setUrlError] = useState('');
  const [customCodeError, setCustomCodeError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUrlError('');
    setCustomCodeError('');
    setShortUrl('');

    // Validierung
    if (!validateUrl(longUrl)) {
      setUrlError('Bitte geben Sie eine gültige URL ein (beginnt mit http:// oder https://)');
      return;
    }

    if (customCode && (customCode.length < 3 || customCode.length > 50)) {
      setCustomCodeError('Der Short Code muss zwischen 3 und 50 Zeichen lang sein');
      return;
    }

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
      setShowAdvanced(false);
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
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 transition-all duration-300 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/5 to-purple-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Input
          id="url"
          type="url"
          label="Lange URL"
          value={longUrl}
          onChange={(e) => {
            setLongUrl(e.target.value);
            setUrlError('');
          }}
          placeholder="https://example.com/sehr/lange/url"
          required
          error={!!urlError}
          errorText={urlError}
        />

        <div>
          <label htmlFor="customCode" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Individueller Short Code (optional)
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold bg-gray-100 dark:bg-gray-700 px-3 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 min-h-[44px] flex items-center">/s/</span>
            <Input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                setCustomCodeError('');
              }}
              placeholder="mein-link"
              minLength={3}
              maxLength={50}
              error={!!customCodeError}
              errorText={customCodeError}
              helperText="Nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche erlaubt"
              className="flex-1"
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="group text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-all duration-200 flex items-center gap-2 hover:gap-3 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-expanded={showAdvanced}
          aria-controls="advanced-options"
        >
          <svg 
            className={`w-4 h-4 transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : 'rotate-0'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Erweiterte Optionen</span>
          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 px-2 py-0.5 rounded-full transition-colors">
            {showAdvanced ? 'Ausblenden' : 'Anzeigen'}
          </span>
        </button>

        {showAdvanced && (
          <div id="advanced-options" className="space-y-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-inner">
            {/* Password Protection */}
            <Input
              id="password"
              type="password"
              label={
                <span className="flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  Passwortschutz (optional)
                </span>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              helperText="Link ist nur mit diesem Passwort zugänglich"
            />

            {/* Expiration */}
            <div>
              <label htmlFor="expiresIn" className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                <ClockIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                Ablaufdatum
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500 font-medium cursor-pointer min-h-[44px]"
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
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Öffentlich sichtbar
                </span>
                <Switch
                  checked={isPublic}
                  onChange={setIsPublic}
                  className={`${
                    isPublic ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-400 dark:bg-gray-600'
                  } relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  aria-label={isPublic ? 'Öffentlich' : 'Privat'}
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
          <Alert variant="error" icon="⚠️">
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          loading={loading}
          fullWidth
          size="lg"
        >
          {loading ? 'Wird gekürzt...' : 'URL kürzen'}
        </Button>
      </form>

      {shortUrl && (
        <Alert variant="success" icon="🎉" className="mt-8 animate-slide-up">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
              Link erfolgreich erstellt!
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-md border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span aria-hidden="true">🔗</span>
                  <span>Ihre Kurz-URL:</span>
                </span>
                <Button
                  variant={copied ? 'success' : 'outline'}
                  size="sm"
                  onClick={copyToClipboard}
                  aria-label={copied ? 'Kopiert' : 'In Zwischenablage kopieren'}
                >
                  {copied ? (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm sm:text-base md:text-lg break-all underline decoration-2 underline-offset-2 hover:decoration-indigo-800 dark:hover:decoration-indigo-400 transition-colors font-semibold"
              >
                {shortUrl}
              </a>
            </div>

            {/* QR Code Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <a
                href={`/api/qr/${shortCode}?format=png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold rounded-lg border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <QrCodeIcon className="h-5 w-5" aria-hidden="true" />
                QR-Code anzeigen
              </a>
              <a
                href={`/api/qr/${shortCode}?format=png&width=600`}
                download={`qr-${shortCode}.png`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold rounded-lg border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 shadow-sm hover:shadow-md min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                QR herunterladen
              </a>
            </div>
          </div>
        </Alert>
      )}
      </div>
    </div>
  );
}

