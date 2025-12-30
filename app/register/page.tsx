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
              {t('register')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('createAccount')}</p>
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

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('hasAccount')}{' '}
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors duration-200 relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
                {t('loginNow')}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

