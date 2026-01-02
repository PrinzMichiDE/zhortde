'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowRight, Lock, Mail, Fingerprint } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PasskeyLogin } from '@/components/passkey-login';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramError = searchParams.get('error');
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [step, setStep] = useState<'email' | 'password' | 'passkey'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(paramError ? t('authFailed') : '');
  const [hasPasskeys, setHasPasskeys] = useState(false);

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/sso/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (data.isSso && data.authUrl) {
        // Redirect to SSO Provider
        window.location.href = data.authUrl;
        return;
      }

      // Check if user has Passkeys
      try {
        const passkeyCheck = await fetch('/api/passkeys/authenticate/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        if (passkeyCheck.ok) {
          setHasPasskeys(true);
          setStep('passkey');
          return;
        }
      } catch (err) {
        // No passkeys, continue to password
      }

      // Not SSO and no Passkeys -> Show Password
      setStep('password');
    } catch (err) {
      console.error(err);
      setStep('password'); // Fallback to password on error
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(tc('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center px-4 py-16 transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 border-2 border-gray-200 dark:border-gray-800 animate-fade-in hover:shadow-3xl transition-shadow duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              {t('login')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('welcomeBack')}</p>
          </div>

          {step === 'email' ? (
            <form onSubmit={checkEmail} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <Alert variant="error" icon="⚠️">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={loading} fullWidth size="lg">
                {t('continue')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : step === 'passkey' ? (
            <div className="space-y-6">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-medium">{email}</span>
                <button 
                  type="button" 
                  onClick={() => { setStep('email'); setError(''); }}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  {t('change')}
                </button>
              </div>

              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Sign in with Passkey
                  </h3>
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-4">
                  Use your device's biometric authentication or security key to sign in securely.
                </p>
                <PasskeyLogin
                  email={email}
                  onSuccess={() => {
                    router.push('/dashboard');
                    router.refresh();
                  }}
                  onError={(err) => setError(err)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep('password')}
                variant="outline"
                fullWidth
              >
                <Lock className="w-4 h-4 mr-2" />
                Sign in with Password
              </Button>

              {error && (
                <Alert variant="error" icon="⚠️">
                  {error}
                </Alert>
              )}
            </div>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
               <div className="mb-4 flex items-center justify-between text-sm">
                 <span className="font-medium">{email}</span>
                 <button 
                    type="button" 
                    onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {t('change')}
                  </button>
               </div>

               <div>
                <label className="block text-sm font-medium mb-1">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <Alert variant="error" icon="⚠️">
                  {error}
                </Alert>
              )}

              <Button type="submit" loading={loading} fullWidth size="lg">
                {t('signIn')}
              </Button>
            </form>
          )}

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors duration-200">
                  {t('registerNow')}
                </Link>
              </p>
            </div>
            
            {/* Privacy Notice */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center leading-relaxed">
                🔒 <strong>Datenschutzfreundlich:</strong> Wir speichern nur Ihre E-Mail-Adresse und ein verschlüsseltes Passwort. 
                Keine Tracking-Cookies, keine Werbung, keine Datenweitergabe an Dritte.{' '}
                <Link href="/datenschutz" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Mehr erfahren
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
