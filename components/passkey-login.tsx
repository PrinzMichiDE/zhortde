'use client';

import { useState } from 'react';
import { startAuthentication, finishAuthentication } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Fingerprint, AlertTriangle, Loader2 } from 'lucide-react';

interface PasskeyLoginProps {
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PasskeyLogin({ email, onSuccess, onError }: PasskeyLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get authentication options
      const startResponse = await fetch('/api/passkeys/authenticate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!startResponse.ok) {
        const data = await startResponse.json();
        throw new Error(data.error || 'Failed to start authentication');
      }

      const { options, challenge } = await startResponse.json();

      // Step 2: Authenticate using browser WebAuthn API
      const credential = await startAuthentication(options);

      // Step 3: Verify authentication
      const verifyResponse = await fetch('/api/passkeys/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          response: credential,
          challenge,
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const { user: verifiedUser } = await verifyResponse.json();

      // Step 4: Create NextAuth session using passkey token
      const result = await signIn('credentials', {
        email,
        passkey_token: 'authenticated', // Custom token to indicate passkey auth
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Failed to create session');
      }

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </Alert>
      )}

      <Button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4 mr-2" />
            Sign in with Passkey
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Use your device's biometric authentication or security key
      </p>
    </div>
  );
}
