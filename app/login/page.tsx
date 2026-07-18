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
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-16">
      <div className="auth-panel">
          <div className="text-center mb-8">
            <div className="auth-panel-icon mx-auto">
              <Lock className="w-6 h-6" aria-hidden />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {t('login')}
            </h1>
            <p className="text-muted-foreground text-sm">{t('welcomeBack')}</p>
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
                  className="text-primary hover:text-primary/80"
                >
                  {t('change')}
                </button>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    Sign in with Passkey
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
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
                  <span className="px-2 bg-card text-muted-foreground">
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
                    className="text-primary hover:text-primary/80"
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
              <p className="text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  {t('registerNow')}
                </Link>
              </p>
            </div>
            
            {/* Privacy Notice */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center leading-relaxed">
                🔒 <strong>Datenschutzfreundlich:</strong> Wir speichern nur Ihre E-Mail-Adresse und ein verschlüsseltes Passwort. 
                Keine Tracking-Cookies, keine Werbung, keine Datenweitergabe an Dritte.{' '}
                <Link href="/datenschutz" className="text-primary hover:underline">
                  Mehr erfahren
                </Link>
              </p>
            </div>
          </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center">
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
