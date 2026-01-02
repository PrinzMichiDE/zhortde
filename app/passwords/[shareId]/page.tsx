'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decryptPassword } from '@/lib/e2e-encryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Lock, Key, Copy, Check, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';

export default function AccessPasswordSharePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [decryptedData, setDecryptedData] = useState<{
    password: string;
    title?: string;
    username?: string;
    notes?: string;
    url?: string;
  } | null>(null);

  const handleAccess = async () => {
    if (!accessKey || !encryptionKey) {
      setError('Both access key and encryption key are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch encrypted data
      const response = await fetch(`/api/passwords/${shareId}?accessKey=${encodeURIComponent(accessKey)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to access password share');
      }

      const data = await response.json();

      // Decrypt client-side
      const encrypted = JSON.parse(data.encryptedPassword);
      const decrypted = decryptPassword(encrypted, encryptionKey);

      setDecryptedData({
        password: decrypted.password,
        title: decrypted.title,
        username: decrypted.username,
        notes: decrypted.notes,
        url: decrypted.url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt password');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const [showPassword, setShowPassword] = useState(false);

  if (decryptedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Card className="p-8 shadow-2xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Password Retrieved
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Password successfully decrypted. The server never saw your encryption key.
            </p>

          <div className="space-y-6">
            {decryptedData.title && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Title</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{decryptedData.title}</p>
              </div>
            )}

            {decryptedData.username && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Username/Email</Label>
                <div className="flex gap-2">
                  <Input value={decryptedData.username} readOnly className="bg-white dark:bg-gray-800" />
                  <Button onClick={() => copyToClipboard(decryptedData.username!)} className="px-4">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
              <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={decryptedData.password} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800 pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={() => copyToClipboard(decryptedData.password)} className="px-4">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {decryptedData.url && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">URL</Label>
                <div className="flex gap-2">
                  <Input value={decryptedData.url} readOnly className="bg-white dark:bg-gray-800" />
                  <Button onClick={() => copyToClipboard(decryptedData.url!)} className="px-4">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {decryptedData.notes && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
                <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Notes</Label>
                <textarea
                  value={decryptedData.notes}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  rows={4}
                />
              </div>
            )}

            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    ✅ Successfully Decrypted
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-400">
                    The password was decrypted entirely in your browser. The server never saw your encryption key or the decrypted password.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Access Password Share
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your access key and encryption key to decrypt the password
          </p>
        </div>

        <Card className="p-8 shadow-xl border-2">
          {error && (
          <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
            </div>
          </Alert>
          )}

          <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <Label htmlFor="accessKey" className="text-base font-semibold">Access Key *</Label>
            </div>
            <Input
              id="accessKey"
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter access key"
              required
              className="bg-white dark:bg-gray-800"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              The password to unlock this share (provided by the sender).
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <Label htmlFor="encryptionKey" className="text-base font-semibold">Encryption Key *</Label>
            </div>
            <Input
              id="encryptionKey"
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Enter encryption key"
              required
              className="bg-white dark:bg-gray-800"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              The encryption key used to decrypt the password (shared separately by the sender).
            </p>
          </div>

          <Button 
            onClick={handleAccess} 
            disabled={loading || !accessKey || !encryptionKey} 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Decrypting...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Decrypt Password
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                🔒 Zero-Knowledge Architecture
              </p>
              <p className="text-sm text-indigo-800 dark:text-indigo-400">
                Decryption happens entirely in your browser. The server never sees your encryption key or the decrypted password.
              </p>
            </div>
          </div>
          </div>
        </Card>
        </div>
      </div>
    );
  }
