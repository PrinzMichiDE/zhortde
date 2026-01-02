'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { encryptPassword, generateEncryptionKey } from '@/lib/e2e-encryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Lock, Shield, Key, Copy, Check, AlertTriangle, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreatePasswordSharePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    password: '',
    title: '',
    username: '',
    url: '',
    notes: '',
    accessKey: '',
    maxAccesses: '',
    expiresIn: '7d',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate encryption key if not provided
      const encryptionKeyValue = encryptionKey || generateEncryptionKey();
      if (!encryptionKey) {
        setEncryptionKey(encryptionKeyValue);
      }

      // Encrypt password and metadata client-side
      const encrypted = encryptPassword(
        formData.password,
        {
          title: formData.title || undefined,
          username: formData.username || undefined,
          url: formData.url || undefined,
          notes: formData.notes || undefined,
        },
        encryptionKeyValue
      );

      // Create password share
      const response = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedPassword: JSON.stringify(encrypted.encrypted),
          encryptionKeyHash: encrypted.keyHash,
          accessKey: formData.accessKey,
          maxAccesses: formData.maxAccesses ? parseInt(formData.maxAccesses) : undefined,
          expiresIn: formData.expiresIn,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create password share');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);

      // Show encryption key to user (they need to share this separately!)
      alert(`IMPORTANT: Share this encryption key securely:\n\n${encryptionKeyValue}\n\nWithout this key, the password cannot be decrypted!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (shareUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Card className="p-8 shadow-2xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Password Share Created!
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Your password has been encrypted and is ready to share securely
            </p>
          
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                    <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <Label className="text-base font-semibold">Share URL</Label>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="font-mono bg-white dark:bg-gray-800 border-2" 
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('URL copied to clipboard!');
                    }}
                    className="px-6"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {encryptionKey && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <Label className="text-base font-semibold">Encryption Key</Label>
                    <span className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                      CRITICAL
                    </span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Input 
                      value={encryptionKey} 
                      readOnly 
                      className="font-mono bg-white dark:bg-gray-800 border-2" 
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(encryptionKey);
                        alert('Encryption key copied!');
                      }}
                      className="px-6"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Share this key securely!
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-400">
                        This key is required to decrypt the password. Share it through a secure channel (encrypted message, Signal, or in person). Never share both URL and key in the same message.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Security Reminder</p>
                </div>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
                  <li>Share the URL and encryption key through <strong>different channels</strong></li>
                  <li>Never share both in the same message or email</li>
                  <li>The server <strong>cannot decrypt</strong> your password - only you and the recipient can</li>
                  <li>Use encrypted messaging apps (Signal, WhatsApp) for the encryption key</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => router.push('/dashboard')} 
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={() => {
                    setShareUrl(null);
                    setEncryptionKey(null);
                    router.push('/passwords/create');
                  }}
                  className="flex-1"
                >
                  Create Another
                </Button>
              </div>
            </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Create Encrypted Password Share
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Share passwords securely with end-to-end encryption. The server never sees your password.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter password to share"
            />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Gmail Account"
            />
          </div>

          <div>
            <Label htmlFor="username">Username/Email</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Associated username or email"
            />
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="accessKey">Access Key (Password to access share) *</Label>
            <Input
              id="accessKey"
              type="password"
              value={formData.accessKey}
              onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
              required
              placeholder="Password to unlock the share"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This is different from the encryption key. Share this with the recipient.
            </p>
          </div>

          <div>
            <Label htmlFor="maxAccesses">Max Accesses</Label>
            <Input
              id="maxAccesses"
              type="number"
              min="1"
              max="1000"
              value={formData.maxAccesses}
              onChange={(e) => setFormData({ ...formData, maxAccesses: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div>
            <Label htmlFor="expiresIn">Expires In</Label>
            <select
              id="expiresIn"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.expiresIn}
              onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
            >
              <option value="1-hour">1 Hour</option>
              <option value="24-hour">24 Hours</option>
              <option value="7-day">7 Days</option>
              <option value="30-day">30 Days</option>
              <option value="never">Never</option>
            </select>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Encrypting...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Create Encrypted Password Share
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                🔒 End-to-End Encryption
              </p>
              <p className="text-sm text-indigo-800 dark:text-indigo-400">
                Your password is encrypted <strong>client-side</strong> before being sent to the server. 
                The server never sees your plaintext password or encryption key. Only you and the recipient can decrypt it.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
