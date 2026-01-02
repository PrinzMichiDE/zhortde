'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  receiveFileThroughDataChannel, 
  setupDataChannel,
  createWebRTCAnswer 
} from '@/lib/p2p-filesharing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function AccessP2PSharePage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState('');
  const [fileMetadata, setFileMetadata] = useState<{
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloadedFile, setDownloadedFile] = useState<File | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup WebRTC connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const handleAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get file share metadata
      const url = `/api/p2p/files/${shareId}${accessKey ? `?accessKey=${encodeURIComponent(accessKey)}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to access file share');
      }

      const data = await response.json();
      setFileMetadata({
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
      });

      // TODO: Implement full WebRTC connection
      // This is a simplified version - in production, you'd need:
      // 1. WebSocket for real-time signaling
      // 2. ICE candidate exchange
      // 3. Proper data channel setup
      
      alert('P2P file transfer requires WebSocket signaling. This is a simplified demo. Full implementation would establish a direct peer-to-peer connection.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access file share');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!downloadedFile) return;

    const url = URL.createObjectURL(downloadedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (downloadedFile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">File Downloaded!</h1>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm font-semibold mb-2">Download Complete</p>
              <p className="text-sm">
                {downloadedFile.name} ({formatFileSize(downloadedFile.size)})
              </p>
            </div>

            <Button onClick={handleDownload} className="w-full">
              Download File
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (fileMetadata) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">P2P File Share</h1>

          <div className="space-y-4">
            <div>
              <Label>File Name</Label>
              <Input value={fileMetadata.fileName} readOnly />
            </div>

            <div>
              <Label>File Size</Label>
              <Input value={formatFileSize(fileMetadata.fileSize)} readOnly />
            </div>

            {progress > 0 && (
              <div>
                <Label>Download Progress</Label>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}%</p>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
              <p className="text-sm">
                ⚠️ Full P2P file transfer requires WebSocket signaling server for real-time connection establishment.
                This demo shows the metadata retrieval. Full implementation would establish a direct peer-to-peer connection.
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
        <h1 className="text-2xl font-bold mb-6">Access P2P File Share</h1>

        {error && (
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="accessKey">Access Key (if required)</Label>
            <Input
              id="accessKey"
              type="password"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="Enter access key if required"
            />
          </div>

          <Button onClick={handleAccess} disabled={loading} className="w-full">
            {loading ? 'Connecting...' : 'Access File Share'}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm font-semibold mb-2">🌐 Peer-to-Peer Transfer</p>
          <p className="text-sm">
            The file will be transferred directly from the sender's browser to yours.
            No server storage is used.
          </p>
        </div>
      </Card>
    </div>
  );
}
