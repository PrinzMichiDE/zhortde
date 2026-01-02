/**
 * P2P File Sharing Library
 * 
 * Peer-to-Peer file sharing using WebRTC
 * Files are never stored on the server - only metadata and signaling
 * 
 * Architecture:
 * 1. Sender creates file share with metadata
 * 2. Signaling server helps establish WebRTC connection
 * 3. File is transferred directly between peers
 * 4. Server only stores metadata and helps with signaling
 */

import { nanoid } from 'nanoid';

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash?: string;
}

export interface P2PShareConfig {
  maxAccesses?: number;
  expiresIn?: string; // '1h', '24h', '7d', '30d'
  accessKey?: string;
}

/**
 * Generate signaling token for WebRTC handshake
 */
export function generateSignalingToken(): string {
  return nanoid(32);
}

/**
 * Generate share ID for P2P file share
 */
export function generateP2PShareId(): string {
  return nanoid(16);
}

/**
 * Calculate file hash (SHA-256) for integrity verification (client-side only)
 */
export async function calculateFileHash(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('File hash calculation must be done in browser context');
  }

  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Chunk file for P2P transfer
 * Splits file into chunks for efficient transfer
 */
export function chunkFile(file: File, chunkSize: number = 64 * 1024): File[] {
  const chunks: File[] = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push(chunk as any);
    offset += chunkSize;
  }

  return chunks;
}

/**
 * Create WebRTC offer for file sharing (client-side only)
 * Note: These functions should be called from browser context
 */
export function createWebRTCOffer(): RTCPeerConnection {
  if (typeof window === 'undefined') {
    throw new Error('WebRTC functions must be called from browser context');
  }

  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  });

  return peerConnection;
}

/**
 * Create WebRTC answer from offer (client-side only)
 */
export function createWebRTCAnswer(): RTCPeerConnection {
  if (typeof window === 'undefined') {
    throw new Error('WebRTC functions must be called from browser context');
  }

  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  });

  return peerConnection;
}

/**
 * Setup data channel for file transfer
 */
export function setupDataChannel(
  peerConnection: RTCPeerConnection,
  onMessage: (data: ArrayBuffer) => void,
  onOpen: () => void,
  onClose: () => void
): RTCDataChannel {
  const dataChannel = peerConnection.createDataChannel('fileTransfer', {
    ordered: true,
  });

  dataChannel.onopen = onOpen;
  dataChannel.onclose = onClose;
  dataChannel.onmessage = (event) => {
    onMessage(event.data);
  };

  return dataChannel;
}

/**
 * Send file through data channel
 */
export async function sendFileThroughDataChannel(
  dataChannel: RTCDataChannel,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (dataChannel.readyState !== 'open') {
      reject(new Error('Data channel not open'));
      return;
    }

    const reader = new FileReader();
    const chunkSize = 64 * 1024; // 64KB chunks
    let offset = 0;

    reader.onload = (e) => {
      const chunk = e.target?.result as ArrayBuffer;
      
      // Send chunk size first
      const sizeBuffer = new ArrayBuffer(4);
      new DataView(sizeBuffer).setUint32(0, chunk.byteLength, true);
      dataChannel.send(sizeBuffer);
      
      // Send chunk data
      dataChannel.send(chunk);
      
      offset += chunk.byteLength;
      
      if (onProgress) {
        onProgress((offset / file.size) * 100);
      }

      if (offset < file.size) {
        // Read next chunk
        const nextChunk = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(nextChunk);
      } else {
        // Send EOF marker
        const eofBuffer = new ArrayBuffer(4);
        new DataView(eofBuffer).setUint32(0, 0, true);
        dataChannel.send(eofBuffer);
        resolve();
      }
    };

    reader.onerror = reject;

    // Start reading first chunk
    const firstChunk = file.slice(0, chunkSize);
    reader.readAsArrayBuffer(firstChunk);
  });
}

/**
 * Receive file through data channel
 */
export async function receiveFileThroughDataChannel(
  dataChannel: RTCDataChannel,
  fileName: string,
  fileSize: number,
  fileType: string,
  onProgress?: (progress: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const chunks: ArrayBuffer[] = [];
    let receivedBytes = 0;
    let expectedChunkSize = 0;
    let receivingChunk = false;

    dataChannel.onmessage = async (event) => {
      if (!receivingChunk) {
        // Read chunk size
        const sizeView = new DataView(event.data);
        expectedChunkSize = sizeView.getUint32(0, true);
        
        if (expectedChunkSize === 0) {
          // EOF marker
          const blob = new Blob(chunks, { type: fileType });
          const file = new File([blob], fileName, { type: fileType });
          resolve(file);
          return;
        }
        
        receivingChunk = true;
      } else {
        // Read chunk data
        chunks.push(event.data);
        receivedBytes += event.data.byteLength;
        
        if (onProgress) {
          onProgress((receivedBytes / fileSize) * 100);
        }
        
        receivingChunk = false;
      }
    };

    dataChannel.onerror = reject;
  });
}
