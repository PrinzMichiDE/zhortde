/**
 * End-to-End Encryption Library
 * 
 * Implements AES-256-GCM encryption for client-side encryption.
 * Server never sees plaintext passwords or encryption keys.
 * 
 * Security Features:
 * - AES-256-GCM (Galois/Counter Mode) for authenticated encryption
 * - PBKDF2 key derivation (100,000 iterations)
 * - Random IV for each encryption
 * - Authentication tag for integrity verification
 * - Zero-knowledge architecture
 */

import { createHash, randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto';

export interface EncryptedData {
  ciphertext: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for key derivation
  tag: string; // Base64 encoded authentication tag
  algorithm: string; // Always 'aes-256-gcm'
}

export interface EncryptionResult {
  encrypted: EncryptedData;
  keyHash: string; // SHA-256 hash of the encryption key (for verification)
}

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Hash encryption key for verification (server-side check only)
 */
export function hashEncryptionKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Encrypt data with AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param password - Password for key derivation
 * @returns Encrypted data with IV, salt, and tag
 */
export function encrypt(plaintext: string, password: string): EncryptionResult {
  // Generate random salt for key derivation
  const salt = randomBytes(16);
  
  // Derive encryption key from password
  const key = deriveKey(password, salt);
  
  // Generate random IV
  const iv = randomBytes(12); // 12 bytes for GCM
  
  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Create result
  const encrypted: EncryptedData = {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64'),
    algorithm: 'aes-256-gcm',
  };
  
  // Hash the key for verification (server never sees actual key)
  const keyHash = hashEncryptionKey(password);
  
  return {
    encrypted,
    keyHash,
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * 
 * @param encrypted - Encrypted data structure
 * @param password - Password used for encryption
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong password, corrupted data, etc.)
 */
export function decrypt(encrypted: EncryptedData, password: string): string {
  try {
    // Reconstruct buffers
    const salt = Buffer.from(encrypted.salt, 'base64');
    const iv = Buffer.from(encrypted.iv, 'base64');
    const tag = Buffer.from(encrypted.tag, 'base64');
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
    
    // Derive same key from password
    const key = deriveKey(password, salt);
    
    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);
    
    return plaintext.toString('utf8');
  } catch (error) {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

/**
 * Encrypt password with metadata
 * 
 * @param password - Password to encrypt
 * @param metadata - Additional metadata (title, username, notes, etc.)
 * @param encryptionPassword - Password for encryption key derivation
 */
export function encryptPassword(
  password: string,
  metadata: {
    title?: string;
    username?: string;
    notes?: string;
    url?: string;
  },
  encryptionPassword: string
): EncryptionResult {
  const data = JSON.stringify({
    password,
    ...metadata,
    timestamp: Date.now(),
  });
  
  return encrypt(data, encryptionPassword);
}

/**
 * Decrypt password with metadata
 * 
 * @param encrypted - Encrypted data
 * @param encryptionPassword - Password used for encryption
 */
export function decryptPassword(
  encrypted: EncryptedData,
  encryptionPassword: string
): {
  password: string;
  title?: string;
  username?: string;
  notes?: string;
  url?: string;
  timestamp: number;
} {
  const decrypted = decrypt(encrypted, encryptionPassword);
  return JSON.parse(decrypted);
}

/**
 * Generate a secure random password for encryption keys
 */
export function generateEncryptionKey(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

/**
 * Hash access key (for server-side storage)
 * Uses bcrypt for secure hashing
 */
export async function hashAccessKey(accessKey: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(accessKey, 12);
}

/**
 * Verify access key
 */
export async function verifyAccessKey(
  accessKey: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(accessKey, hash);
}

/**
 * Generate a shareable ID (like short code)
 */
export function generateShareId(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
