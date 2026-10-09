'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// ─── Google Icon ─────────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Discord Icon ────────────────────────────────────────────────────────────
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

// ─── Twitch Icon ─────────────────────────────────────────────────────────────
function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

// ─── Client-side Supabase OAuth flow ─────────────────────────────────────────
function useSupabaseAuth() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromSupabase = searchParams.get('fromSupabaseOAuth');
    if (fromSupabase && !session) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl) {
        router.push('/login?error=supabase_not_configured');
        return;
      }

      setLoading(true);
      try {
        const tokenKey = `sb-${supabaseUrl.split('.supabase.co')[1]}-auth-token`;
        const raw = localStorage.getItem(tokenKey);
        if (raw) {
          const tokenData = JSON.parse(raw);
          const accessToken = tokenData?.access_token;
          if (accessToken) {
            fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
              .then((r) => r.json())
              .then((user) => {
                if (user?.email) {
                  return signIn('credentials', {
                    email: user.email,
                    sso_token: '__supabase_oauth__',
                    redirect: false,
                  });
                }
              })
              .then((result) => {
                if (!result?.error) {
                  router.replace('/dashboard');
                } else {
                  router.push('/login?error=auth_failed');
                }
              })
              .catch(() => {
                router.push('/login?error=auth_failed');
              })
              .finally(() => setLoading(false));
          } else {
            router.push('/login?error=auth_failed');
          }
        } else {
          router.push('/login?error=auth_failed');
        }
      } catch {
        router.push('/login?error=auth_failed');
      }
    }
  }, [session, searchParams, router]);

  return { loading };
}

// ─── Redirect to Supabase OAuth ──────────────────────────────────────────────
function handleOAuthLogin(provider: string, router: ReturnType<typeof useRouter>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return;

  const callbackUrl = `${window.location.origin}/api/auth/supabase/callback?provider=${provider}`;
  const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callbackUrl)}`;

  window.location.href = authorizeUrl;
}

// ─── Login Content ───────────────────────────────────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramError = searchParams.get('error');
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(paramError ? t('authFailed') : '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useSupabaseAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError(t('invalidEmail'));
      return;
    }
    setLoading(true);

    try {
      // Check if user has Passkeys first
      try {
        const passkeyCheck = await fetch('/api/passkeys/authenticate/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (passkeyCheck.ok) {
          // Show passkey login option
          router.push(`/login/passkey?email=${encodeURIComponent(email)}`);
          return;
        }
      } catch {
        // No passkeys, continue to password
      }

      // Check SSO
      const res = await fetch('/api/auth/sso/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (data.isSso && data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      // No passkey or SSO -> show password
      setShowPasswordForm(true);
    } catch {
      setError(tc('error'));
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
    } catch {
      setError(tc('error'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while creating NextAuth session from Supabase OAuth
  if (loading && !showPasswordForm) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4 py-16">
        <div className="auth-panel text-center">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">{t('signIn')}</p>
        </div>
      </div>
    );
  }

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

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className={cn('w-full')}
            size="lg"
            onClick={() => handleOAuthLogin('google', router)}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            {t('loginWithGoogle')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className={cn('w-full')}
            size="lg"
            onClick={() => handleOAuthLogin('discord', router)}
          >
            <DiscordIcon className="w-5 h-5 mr-2" />
            {t('loginWithDiscord')}
          </Button>

          <Button
            type="button"
            variant="outline"
            className={cn('w-full')}
            size="lg"
            onClick={() => handleOAuthLogin('twitch', router)}
          >
            <TwitchIcon className="w-5 h-5 mr-2" />
            {t('loginWithTwitch')}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-muted-foreground">
              {tc('or')}
            </span>
          </div>
        </div>

        {/* Email Submit (shown when password form is hidden) */}
        {!showPasswordForm ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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

            <Button type="submit" isLoading={loading} className={cn('w-full')} size="lg">
              {t('continue')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={cn('w-full')}
              onClick={() => setShowPasswordForm(true)}
            >
              {t('loginWithEmail')}
            </Button>
          </form>
        ) : (
          /* Password Form */
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate">{email}</span>
              <button 
                type="button" 
                onClick={() => { setShowPasswordForm(false); setError(''); }}
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

            <Button type="submit" isLoading={loading} className={cn('w-full')} size="lg">
              {t('signIn')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={cn('w-full')}
              onClick={() => { setShowPasswordForm(false); setError(''); }}
            >
              ← {t('back')}
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
              🔒 <strong>Datenschutzfreundlich:</strong> Wir speichern nur Ihre E-Mail-Adresse. 
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
