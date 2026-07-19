'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Switch } from '@headlessui/react';
import {
  CheckIcon,
  ClipboardIcon,
  LockClosedIcon,
  ClockIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { EXPIRATION_OPTIONS } from '@/lib/password-protection';
import type { UtmParameters } from '@/lib/utm-builder';
import { addRecentLink } from '@/lib/recent-links';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';
import { SmartSuggestions } from './smart-suggestions';
import { UtmBuilder } from './utm-builder';
import { RecentLinks } from './recent-links';
import { useTranslations } from 'next-intl';

export function LinkForm() {
  const { data: session } = useSession();
  const urlInputRef = useRef<HTMLInputElement>(null);
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
  const [showUtm, setShowUtm] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [customCodeError, setCustomCodeError] = useState('');
  const [honeyPot, setHoneyPot] = useState('');
  const [utmParams, setUtmParams] = useState<UtmParameters>({});
  const [utmFinalUrl, setUtmFinalUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('linkForm');
  const te = useTranslations('expiration');
  const tc = useTranslations('common');

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUtmChange = useCallback((params: UtmParameters, finalUrl: string) => {
    setUtmParams(params);
    setUtmFinalUrl(finalUrl);
  }, []);

  const copyToClipboard = useCallback((text?: string) => {
    const value = text ?? shortUrl;
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shortUrl]);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && validateUrl(text.trim())) {
        setLongUrl(text.trim());
        setUrlError('');
      }
    } catch {
      setError(t('pasteError'));
      setTimeout(() => setError(''), 3000);
    }
  };

  const submitForm = useCallback(async () => {
    setError('');
    setUrlError('');
    setCustomCodeError('');
    setShortUrl('');

    if (honeyPot) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setLongUrl('');
      }, 1000);
      return;
    }

    const urlToShorten = utmFinalUrl && Object.values(utmParams).some(Boolean)
      ? utmFinalUrl
      : longUrl;

    if (!validateUrl(urlToShorten)) {
      setUrlError(t('validUrlError'));
      return;
    }

    if (customCode && (customCode.length < 3 || customCode.length > 50)) {
      setCustomCodeError(t('customCodeLengthError'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longUrl: urlToShorten,
          isPublic,
          customCode: customCode.trim() || undefined,
          password: password || undefined,
          expiresIn: expiresIn === 'never' ? undefined : expiresIn,
          utmSource: utmParams.source,
          utmMedium: utmParams.medium,
          utmCampaign: utmParams.campaign,
          utmTerm: utmParams.term,
          utmContent: utmParams.content,
          hp: honeyPot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('shorteningError'));
      }

      const baseUrl = window.location.origin;
      const createdShortUrl = `${baseUrl}/s/${data.shortCode}`;
      setShortUrl(createdShortUrl);
      setShortCode(data.shortCode);
      addRecentLink({
        shortCode: data.shortCode,
        shortUrl: createdShortUrl,
        longUrl: urlToShorten,
      });
      copyToClipboard(createdShortUrl);
      setLongUrl('');
      setCustomCode('');
      setPassword('');
      setExpiresIn('never');
      setUtmParams({});
      setUtmFinalUrl('');
      setShowAdvanced(false);
      setShowUtm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'));
    } finally {
      setLoading(false);
    }
  }, [
    honeyPot,
    utmFinalUrl,
    utmParams,
    longUrl,
    customCode,
    isPublic,
    password,
    expiresIn,
    copyToClipboard,
    t,
    tc,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  useEffect(() => {
    setMounted(true);
    urlInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loading && longUrl && validateUrl(longUrl)) {
          void submitForm();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, loading, longUrl, submitForm]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-md p-6 sm:p-8 lg:p-10">
      <RecentLinks />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="opacity-0 absolute top-0 left-0 h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="hp_check">Please leave blank</label>
          <input
            type="text"
            id="hp_check"
            name="hp_check"
            value={honeyPot}
            onChange={(e) => setHoneyPot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Input
            ref={urlInputRef}
            id="url"
            type="url"
            label={t('longUrl')}
            value={longUrl}
            onChange={(e) => {
              setLongUrl(e.target.value);
              setUrlError('');
            }}
            placeholder={t('placeholder')}
            required
            error={!!urlError}
            errorText={urlError}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pasteFromClipboard}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {t('pasteUrl')}
            </Button>
            <span className="text-xs text-muted-foreground">{t('keyboardHint')}</span>
          </div>
        </div>

        {mounted && session && longUrl && longUrl.length > 10 && validateUrl(longUrl) && (
          <SmartSuggestions
            longUrl={longUrl}
            onShortCodeSelect={(code) => {
              setCustomCode(code);
              setCustomCodeError('');
            }}
            onTagsSelect={() => {}}
          />
        )}

        <div>
          <label htmlFor="customCode" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t('customCode')}
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-sm font-medium bg-muted px-3 py-3 rounded-lg border border-border min-h-[44px] flex items-center">/s/</span>
            <Input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
                setCustomCodeError('');
              }}
              placeholder={t('customCodePlaceholder')}
              minLength={3}
              maxLength={50}
              error={!!customCodeError}
              errorText={customCodeError}
              helperText={t('customCodeHelper')}
              className="flex-1"
            />
          </div>
        </div>

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
          <span>{t('advancedOptions')}</span>
          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 px-2 py-0.5 rounded-full transition-colors">
            {showAdvanced ? t('hide') : t('show')}
          </span>
        </button>

        {showAdvanced && (
          <div id="advanced-options" className="space-y-4 p-5 bg-muted/40 rounded-lg border border-border">
            <Input
              id="password"
              type="password"
              label={
                <span className="flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  {t('passwordProtection')}
                </span>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              helperText={t('passwordHelper')}
            />

            <div>
              <label htmlFor="expiresIn" className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                <ClockIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                {t('expiration')}
              </label>
              <select
                id="expiresIn"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-foreground font-medium cursor-pointer min-h-[44px]"
              >
                {EXPIRATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {te(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {mounted && session && (
              <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('publicVisible')}
                </span>
                <Switch
                  checked={isPublic}
                  onChange={setIsPublic}
                  className={`${
                    isPublic ? 'bg-primary' : 'bg-muted-foreground/50'
                  } relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  aria-label={isPublic ? t('publicVisible') : t('privateVisible')}
                >
                  <span
                    className={`${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md`}
                  />
                </Switch>
              </div>
            )}

            {longUrl && validateUrl(longUrl) && (
              <div className="space-y-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowUtm(!showUtm)}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {showUtm ? t('hideUtm') : t('showUtm')}
                </button>
                {showUtm && (
                  <UtmBuilder baseUrl={longUrl} onChange={handleUtmChange} initialParams={utmParams} />
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="error" icon="⚠️">
            {error}
          </Alert>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? t('shortening') : t('shortenUrl')}
        </Button>
      </form>

      {shortUrl && (
        <Alert variant="success" icon="🎉" className="mt-8 animate-slide-up">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
              {t('success')}
            </h3>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="shrink-0 rounded-xl border border-border bg-white p-3 dark:bg-gray-900 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/qr/${shortCode}?format=png&width=180`}
                  alt={t('qrPreviewAlt')}
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>

              <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-md border border-green-200 dark:border-green-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span aria-hidden="true">🔗</span>
                    <span>{t('yourShortUrl')}:</span>
                  </span>
                  <Button
                    variant={copied ? 'success' : 'outline'}
                    size="sm"
                    onClick={() => copyToClipboard()}
                    aria-label={copied ? tc('copied') : tc('copy')}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        {tc('copied')}
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                        {tc('copy')}
                      </>
                    )}
                  </Button>
                </div>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-mono text-sm sm:text-base break-all underline decoration-2 underline-offset-2 font-semibold"
                >
                  {shortUrl}
                </a>
                {copied && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">{t('autoCopied')}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <a
                href={`/api/qr/${shortCode}?format=png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg border-2 border-indigo-200 dark:border-indigo-800 transition-all min-h-[44px]"
              >
                <QrCodeIcon className="h-5 w-5" aria-hidden="true" />
                {t('showQr')}
              </a>
              <a
                href={`/api/qr/${shortCode}?format=png&width=600`}
                download={`qr-${shortCode}.png`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold rounded-lg border-2 border-green-200 dark:border-green-800 transition-all min-h-[44px]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('downloadQr')}
              </a>
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}
