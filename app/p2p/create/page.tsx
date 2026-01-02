'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { calculateFileHash, generateP2PShareId } from '@/lib/p2p-filesharing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Share2, Upload, Copy, Check, AlertTriangle, ArrowLeft, Globe, File, Shield } from 'lucide-react';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <Card className="p-8 shadow-2xl border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              P2P File Share Created!
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Your file will be transferred peer-to-peer when someone accesses the share link
            </p>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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

            {selectedFile && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <Label className="text-base font-semibold">File Information</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.type || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                    How P2P File Sharing Works
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-disc list-inside">
                    <li>The file is <strong>never stored on the server</strong></li>
                    <li>When someone accesses the share link, a direct peer-to-peer connection is established</li>
                    <li>The file is transferred directly between your browser and the recipient's browser</li>
                    <li><strong>Keep this page open</strong> until the transfer is complete</li>
                  </ul>
                </div>
              </div>
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
                  setSelectedFile(null);
                  router.push('/p2p/create');
                }}
                className="flex-1"
              >
                Share Another File
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Create P2P File Share
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Share files directly between browsers. No server storage - files are transferred peer-to-peer.
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
            <Label htmlFor="file" className="text-base font-semibold mb-3 block">
              Select File *
            </Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors bg-gray-50 dark:bg-gray-900/50"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Click to select a file or drag and drop
              </p>
              {selectedFile ? (
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Maximum file size: 2GB
                </p>
              )}
            </div>
            <Input
              id="file"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              required
              className="hidden"
            />
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

          <Button 
            type="submit" 
            disabled={loading || !selectedFile} 
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Share...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 mr-2" />
                Create P2P File Share
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                🌐 Peer-to-Peer File Sharing
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-400">
                Files are transferred <strong>directly between browsers</strong> using WebRTC. 
                The server only stores metadata and helps establish the connection. Your files are never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
