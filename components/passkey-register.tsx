'use client';

import { useState } from 'react';
import { startRegistration, finishRegistration } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Fingerprint, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface PasskeyRegisterProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PasskeyRegister({ onSuccess, onError }: PasskeyRegisterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get registration options
      const startResponse = await fetch('/api/passkeys/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: deviceName || undefined }),
      });

      if (!startResponse.ok) {
        const data = await startResponse.json();
        throw new Error(data.error || 'Failed to start registration');
      }

      const { options, challenge } = await startResponse.json();

      // Step 2: Create Passkey using browser WebAuthn API
      const credential = await startRegistration(options);

      // Step 3: Verify registration
      const verifyResponse = await fetch('/api/passkeys/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: credential,
          challenge,
          deviceName: deviceName || undefined,
        }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-green-900 dark:text-green-300">
              Passkey registered successfully!
            </p>
            <p className="text-sm text-green-800 dark:text-green-400">
              You can now use this device to sign in without a password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Device Name (Optional)
        </label>
        <Input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="e.g., iPhone 15, Chrome on Windows"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Give your device a name to easily identify it later
        </p>
      </div>

      {error && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </Alert>
      )}

      <Button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Passkey...
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4 mr-2" />
            Create Passkey
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        You'll be prompted to use your device's biometric authentication (TouchID, FaceID, Windows Hello) or a security key
      </p>
    </div>
  );
}
