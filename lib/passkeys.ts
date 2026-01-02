/**
 * Passkey (WebAuthn) Authentication Library
 * 
 * Implements passwordless authentication using WebAuthn/Passkeys
 * Supports both platform authenticators (TouchID, FaceID, Windows Hello)
 * and cross-platform authenticators (USB security keys)
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';
import { db } from './db';
import { passkeys, users } from './db/schema';
import { eq } from 'drizzle-orm';

// WebAuthn Configuration
function getRpId(): string {
  if (process.env.WEBAUTHN_RP_ID) {
    return process.env.WEBAUTHN_RP_ID;
  }
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      return url.hostname;
    } catch {
      // Fallback
    }
  }
  return 'localhost';
}

const RP_ID = getRpId();
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'Zhort';
const ORIGIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Get registration options for a new Passkey
 */
export async function getRegistrationOptions(userId: number, email: string) {
  // Get existing passkeys for this user
  const existingPasskeys = await db.query.passkeys.findMany({
    where: eq(passkeys.userId, userId),
  });

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(userId.toString()),
    userName: email,
    userDisplayName: email,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map(passkey => ({
      id: Buffer.from(passkey.credentialId, 'base64url'),
      type: 'public-key',
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Prefer platform authenticators (TouchID, FaceID)
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
  };

  const options = await generateRegistrationOptions(opts);

  return options;
}

/**
 * Verify registration response and save Passkey
 */
export async function verifyRegistration(
  userId: number,
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  deviceName?: string
) {
  // Get user's existing passkeys
  const existingPasskeys = await db.query.passkeys.findMany({
    where: eq(passkeys.userId, userId),
  });

  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
  };

  const verification = await verifyRegistrationResponse(opts);

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Passkey verification failed');
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

  // Save Passkey to database
  const [newPasskey] = await db
    .insert(passkeys)
    .values({
      userId,
      credentialId: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      deviceName: deviceName || 'Unknown Device',
      deviceType: response.response.authenticatorAttachment === 'platform' ? 'platform' : 'cross-platform',
    })
    .returning();

  return newPasskey;
}

/**
 * Get authentication options for login
 */
export async function getAuthenticationOptions(email: string) {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get user's passkeys
  const userPasskeys = await db.query.passkeys.findMany({
    where: eq(passkeys.userId, user.id),
  });

  if (userPasskeys.length === 0) {
    throw new Error('No passkeys found for this user');
  }

  const opts: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials: userPasskeys.map(passkey => ({
      id: Buffer.from(passkey.credentialId, 'base64url'),
      type: 'public-key',
      transports: ['internal', 'hybrid'], // Support both internal and external authenticators
    })),
    userVerification: 'preferred',
    rpID: RP_ID,
  };

  const options = await generateAuthenticationOptions(opts);

  return {
    options,
    userId: user.id,
  };
}

/**
 * Verify authentication response and return user
 */
export async function verifyAuthentication(
  email: string,
  response: AuthenticationResponseJSON,
  expectedChallenge: string
) {
  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Find the Passkey used for authentication
  const credentialId = Buffer.from(response.id, 'base64url').toString('base64url');
  const passkey = await db.query.passkeys.findFirst({
    where: eq(passkeys.credentialId, credentialId),
  });

  if (!passkey || passkey.userId !== user.id) {
    throw new Error('Invalid passkey');
  }

  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: Buffer.from(passkey.credentialId, 'base64url'),
      publicKey: Buffer.from(passkey.publicKey, 'base64url'),
      counter: passkey.counter,
    },
    requireUserVerification: true,
  };

  const verification = await verifyAuthenticationResponse(opts);

  if (!verification.verified) {
    throw new Error('Authentication verification failed');
  }

  // Update counter and last used timestamp
  await db
    .update(passkeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(passkeys.id, passkey.id));

  return user;
}

/**
 * Get user's passkeys
 */
export async function getUserPasskeys(userId: number) {
  return db.query.passkeys.findMany({
    where: eq(passkeys.userId, userId),
    orderBy: (passkeys, { desc }) => [desc(passkeys.lastUsedAt), desc(passkeys.createdAt)],
  });
}

/**
 * Delete a Passkey
 */
export async function deletePasskey(userId: number, passkeyId: number) {
  const passkey = await db.query.passkeys.findFirst({
    where: eq(passkeys.id, passkeyId),
  });

  if (!passkey || passkey.userId !== userId) {
    throw new Error('Passkey not found or access denied');
  }

  await db.delete(passkeys).where(eq(passkeys.id, passkeyId));
}
