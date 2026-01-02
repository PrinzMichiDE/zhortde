'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { encryptPassword, generateEncryptionKey } from '@/lib/e2e-encryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Password Share Created!</h1>
          
          <div className="space-y-4">
            <div>
              <Label>Share URL</Label>
              <div className="flex gap-2 mt-1">
                <Input value={shareUrl} readOnly className="font-mono" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert('URL copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            {encryptionKey && (
              <div>
                <Label>Encryption Key (Share this securely!)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={encryptionKey} readOnly className="font-mono" />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(encryptionKey);
                      alert('Encryption key copied!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ⚠️ This key is required to decrypt the password. Share it through a secure channel (e.g., encrypted message, in person).
                </p>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
              <p className="text-sm font-semibold mb-2">Security Reminder:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Share the URL and encryption key through different channels</li>
                <li>Never share both in the same message</li>
                <li>The server cannot decrypt your password - only you and the recipient can</li>
              </ul>
            </div>

            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create Encrypted Password Share</h1>

        {error && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Password Share'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm font-semibold mb-2">🔒 End-to-End Encryption</p>
          <p className="text-sm">
            Your password is encrypted client-side before being sent to the server. 
            The server never sees your plaintext password or encryption key.
          </p>
        </div>
      </Card>
    </div>
  );
}
