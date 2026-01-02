'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser, checkPasswordStrength } from '@/lib/auth/actions';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useTranslations } from 'next-intl';
import { PasskeyRegister } from '@/components/passkey-register';
import { Fingerprint } from 'lucide-react';

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, label: 'Mindestens 8 Zeichen' },
  { regex: /[A-Z]/, label: 'Mindestens ein Großbuchstabe' },
  { regex: /[a-z]/, label: 'Mindestens ein Kleinbuchstabe' },
  { regex: /[0-9]/, label: 'Mindestens eine Zahl' },
  { regex: /[^A-Za-z0-9]/, label: 'Mindestens ein Sonderzeichen' },
];

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot field
  const [showPasskeyOption, setShowPasskeyOption] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Calculate password strength in real-time
  const passwordStrength = useMemo(() => {
    const met = PASSWORD_REQUIREMENTS.filter(req => req.regex.test(password));
    const score = met.length;
    const percentage = (score / PASSWORD_REQUIREMENTS.length) * 100;
    
    let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    let color = 'bg-red-500';
    
    if (score >= 5) {
      level = 'strong';
      color = 'bg-green-500';
    } else if (score >= 4) {
      level = 'good';
      color = 'bg-blue-500';
    } else if (score >= 3) {
      level = 'fair';
      color = 'bg-yellow-500';
    }
    
    return { score, percentage, level, color, met };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Anti-bot: Check honeypot field
    if (honeypot) {
      // Silently fail for bots
      return;
    }

    let hasError = false;

    // Validate password strength (all requirements must be met)
    if (passwordStrength.score < PASSWORD_REQUIREMENTS.length) {
      setPasswordError(t('passwordMinLength'));
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(t('passwordMismatch'));
      hasError = true;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(email, password);

      if (!result.success) {
        setError(result.error || t('registrationFailed'));
      } else {
        // Automatisch einloggen nach erfolgreicher Registrierung
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        setRegistrationSuccess(true);
        // Don't redirect immediately - show Passkey option
        // router.push('/dashboard');
        // router.refresh();
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 border-2 border-gray-200 dark:border-gray-800 animate-fade-in hover:shadow-3xl transition-shadow duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
              {t('register')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('createAccount')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Honeypot field - hidden from humans, visible to bots */}
            <div className="absolute left-[-9999px] opacity-0 pointer-events-none" aria-hidden="true">
              <label htmlFor="website_url">Website URL</label>
              <input
                type="text"
                id="website_url"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            
            <Input
              id="email"
              type="email"
              label={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              autoComplete="email"
            />

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                label={t('password')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setShowPasswordStrength(true);
                }}
                onFocus={() => setShowPasswordStrength(true)}
                placeholder={t('passwordPlaceholder')}
                required
                minLength={8}
                error={!!passwordError}
                errorText={passwordError}
                autoComplete="new-password"
              />
              
              {/* Password Strength Indicator */}
              {showPasswordStrength && password.length > 0 && (
                <div className="space-y-2 animate-fade-in">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize min-w-[50px]">
                      {passwordStrength.level === 'weak' && 'Weak'}
                      {passwordStrength.level === 'fair' && 'Fair'}
                      {passwordStrength.level === 'good' && 'Good'}
                      {passwordStrength.level === 'strong' && 'Strong'}
                    </span>
                  </div>
                  
                  {/* Requirements Checklist */}
                  <ul className="text-xs space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req, index) => {
                      const isMet = req.regex.test(password);
                      return (
                        <li 
                          key={index} 
                          className={`flex items-center gap-1.5 transition-colors ${
                            isMet 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center">
                            {isMet ? '✓' : '○'}
                          </span>
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              type="password"
              label={t('confirmPassword')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              placeholder={t('passwordPlaceholder')}
              required
              error={!!confirmPasswordError}
              errorText={confirmPasswordError}
              autoComplete="new-password"
            />

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
              {loading ? t('registering') : t('register')}
            </Button>
          </form>

          {registrationSuccess && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Optional
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Add a Passkey (Optional)
                  </h3>
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-4">
                  Create a Passkey to sign in without a password using your device's biometric authentication.
                </p>
                <PasskeyRegister
                  onSuccess={() => {
                    router.push('/dashboard');
                    router.refresh();
                  }}
                />
              </div>
            </div>
          )}

          {!registrationSuccess && (
            <div className="mt-6">
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
                onClick={() => setShowPasskeyOption(true)}
                variant="outline"
                fullWidth
                className="mt-6"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Register with Passkey Only
              </Button>
            </div>
          )}

          {showPasskeyOption && !registrationSuccess && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-4">
                Note: To register with Passkey only, you need to create an account first with email and password, then add a Passkey.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('hasAccount')}{' '}
                <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors duration-200 relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
                  {t('loginNow')}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              </p>
            </div>
            
            {/* Privacy Notice */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center leading-relaxed">
                🔒 <strong>Minimale Datenerfassung:</strong> Wir benötigen nur Ihre E-Mail-Adresse und ein sicheres Passwort. 
                Keine persönlichen Daten, keine Tracking-Cookies, keine Werbung. 
                Ihre Daten bleiben bei uns und werden nicht an Dritte weitergegeben.{' '}
                <Link href="/datenschutz" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Datenschutzerklärung
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

