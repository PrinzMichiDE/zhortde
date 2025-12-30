'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramError = searchParams.get('error');
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(paramError ? t('authFailed') : '');

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

      // Not SSO -> Show Password
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-16 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 animate-fade-in hover:shadow-3xl transition-shadow duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              {t('login')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('welcomeBack')}</p>
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors duration-200">
                {t('registerNow')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
