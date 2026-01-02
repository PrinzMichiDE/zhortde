'use client';

import { useState, useEffect } from 'react';
import { PasskeyRegister } from '@/components/passkey-register';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Fingerprint, Trash2, Smartphone, Key, AlertTriangle, Plus } from 'lucide-react';

interface Passkey {
  id: number;
  deviceName: string | null;
  deviceType: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export default function PasskeysPage() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      const response = await fetch('/api/passkeys/list');
      if (!response.ok) throw new Error('Failed to load passkeys');
      const data = await response.json();
      setPasskeys(data.passkeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passkeys');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Passkey?')) return;

    try {
      const response = await fetch(`/api/passkeys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete passkey');
      
      setPasskeys(passkeys.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete passkey');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Passkeys
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your passwordless authentication devices
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
          </Alert>
        )}

        {!showRegister && (
          <div className="mb-6">
            <Button
              onClick={() => setShowRegister(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Passkey
            </Button>
          </div>
        )}

        {showRegister && (
          <Card className="p-6 mb-6 border-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Register New Passkey</h2>
              <Button
                variant="outline"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </Button>
            </div>
            <PasskeyRegister
              onSuccess={() => {
                setShowRegister(false);
                loadPasskeys();
              }}
              onError={(err) => setError(err)}
            />
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : passkeys.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Fingerprint className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No Passkeys</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add a Passkey to enable passwordless sign-in
            </p>
            <Button
              onClick={() => setShowRegister(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Passkey
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {passkeys.map((passkey) => (
              <Card key={passkey.id} className="p-6 border-2 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg">
                      {passkey.deviceType === 'platform' ? (
                        <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Key className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {passkey.deviceName || 'Unknown Device'}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          Type: {passkey.deviceType === 'platform' ? 'Platform Authenticator' : 'Security Key'}
                        </p>
                        <p>Last used: {formatDate(passkey.lastUsedAt)}</p>
                        <p>Created: {formatDate(passkey.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(passkey.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
            About Passkeys
          </h3>
          <ul className="text-sm text-indigo-800 dark:text-indigo-400 space-y-2 list-disc list-inside">
            <li>Sign in securely without passwords using biometric authentication</li>
            <li>Works with TouchID, FaceID, Windows Hello, and security keys</li>
            <li>More secure than passwords - protected by your device</li>
            <li>You can add multiple Passkeys for different devices</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
