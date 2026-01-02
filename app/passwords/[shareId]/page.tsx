'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { decryptPassword } from '@/lib/e2e-encryption';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

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

  if (decryptedData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Password Retrieved</h1>

          <div className="space-y-4">
            {decryptedData.title && (
              <div>
                <Label>Title</Label>
                <Input value={decryptedData.title} readOnly />
              </div>
            )}

            {decryptedData.username && (
              <div>
                <Label>Username/Email</Label>
                <div className="flex gap-2">
                  <Input value={decryptedData.username} readOnly />
                  <Button onClick={() => copyToClipboard(decryptedData.username!)}>
                    Copy
                  </Button>
                </div>
              </div>
            )}

            <div>
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input type="password" value={decryptedData.password} readOnly className="font-mono" />
                <Button onClick={() => copyToClipboard(decryptedData.password)}>
                  Copy
                </Button>
              </div>
            </div>

            {decryptedData.url && (
              <div>
                <Label>URL</Label>
                <div className="flex gap-2">
                  <Input value={decryptedData.url} readOnly />
                  <Button onClick={() => copyToClipboard(decryptedData.url!)}>
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {decryptedData.notes && (
              <div>
                <Label>Notes</Label>
                <textarea
                  value={decryptedData.notes}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            )}

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
              <p className="text-sm">
                ✅ Password successfully decrypted. The password was never visible to the server.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Access Password Share</h1>

        {error && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="accessKey">Access Key *</Label>
            <Input
              id="accessKey"
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter access key"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              The password to unlock this share (provided by the sender).
            </p>
          </div>

          <div>
            <Label htmlFor="encryptionKey">Encryption Key *</Label>
            <Input
              id="encryptionKey"
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Enter encryption key"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              The encryption key used to decrypt the password (shared separately by the sender).
            </p>
          </div>

          <Button onClick={handleAccess} disabled={loading || !accessKey || !encryptionKey} className="w-full">
            {loading ? 'Decrypting...' : 'Decrypt Password'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm font-semibold mb-2">🔒 Zero-Knowledge Architecture</p>
          <p className="text-sm">
            Decryption happens entirely in your browser. The server never sees your encryption key or the decrypted password.
          </p>
        </div>
      </Card>
    </div>
  );
}
