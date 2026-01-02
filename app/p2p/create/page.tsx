'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { calculateFileHash, generateP2PShareId } from '@/lib/p2p-filesharing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function CreateP2PSharePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    accessKey: '',
    maxAccesses: '',
    expiresIn: '7d',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);

    // Calculate file hash
    try {
      const hash = await calculateFileHash(file);
      setFileHash(hash);
    } catch (err) {
      console.error('Error calculating file hash:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create file share (metadata only)
      const response = await fetch('/api/p2p/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          fileHash: fileHash || undefined,
          accessKey: formData.accessKey || undefined,
          maxAccesses: formData.maxAccesses ? parseInt(formData.maxAccesses) : undefined,
          expiresIn: formData.expiresIn,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create file share');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);

      // Note: Actual file transfer happens P2P when recipient accesses the share
      alert('File share created! The file will be transferred peer-to-peer when someone accesses the share link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (shareUrl) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">P2P File Share Created!</h1>

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

            {selectedFile && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-sm font-semibold mb-2">File Information:</p>
                <ul className="text-sm space-y-1">
                  <li>Name: {selectedFile.name}</li>
                  <li>Size: {formatFileSize(selectedFile.size)}</li>
                  <li>Type: {selectedFile.type || 'Unknown'}</li>
                </ul>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
              <p className="text-sm font-semibold mb-2">How P2P File Sharing Works:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>The file is never stored on the server</li>
                <li>When someone accesses the share link, a direct peer-to-peer connection is established</li>
                <li>The file is transferred directly between your browser and the recipient's browser</li>
                <li>Keep this page open until the transfer is complete</li>
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
        <h1 className="text-2xl font-bold mb-6">Create P2P File Share</h1>

        {error && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">Select File *</Label>
            <Input
              id="file"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              required
              className="mt-1"
            />
            {selectedFile && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-sm">
                  <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
                </p>
                {fileHash && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Hash: {fileHash.substring(0, 16)}...
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="accessKey">Access Key (Optional)</Label>
            <Input
              id="accessKey"
              type="password"
              value={formData.accessKey}
              onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
              placeholder="Password to protect the share"
            />
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

          <Button type="submit" disabled={loading || !selectedFile} className="w-full">
            {loading ? 'Creating...' : 'Create P2P File Share'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm font-semibold mb-2">🌐 Peer-to-Peer File Sharing</p>
          <p className="text-sm">
            Files are transferred directly between browsers using WebRTC. 
            The server only stores metadata and helps establish the connection.
          </p>
        </div>
      </Card>
    </div>
  );
}
