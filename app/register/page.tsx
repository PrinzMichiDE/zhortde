'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from '@/lib/auth/actions';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (password.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen lang sein');
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwörter stimmen nicht überein');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(email, password);

      if (!result.success) {
        setError(result.error || 'Registrierung fehlgeschlagen');
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
      setError('Ein Fehler ist aufgetreten');
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
              Registrieren
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Erstellen Sie Ihr kostenloses Konto 🚀</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="email"
              type="email"
              label="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre.email@beispiel.de"
              required
            />

            <Input
              id="password"
              type="password"
              label="Passwort"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="••••••••"
              required
              minLength={8}
              error={!!passwordError}
              errorText={passwordError}
              helperText="Mindestens 8 Zeichen"
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Passwort bestätigen"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              placeholder="••••••••"
              required
              error={!!confirmPasswordError}
              errorText={confirmPasswordError}
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
              {loading ? 'Wird registriert...' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bereits ein Account?{' '}
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors duration-200 relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded">
                Jetzt anmelden
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

