import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { emailSchema, logSecurityEvent } from '@/lib/security';

// Session configuration for security
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours
const JWT_MAX_AGE = 24 * 60 * 60; // 24 hours

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        sso_token: { label: 'SSO Token', type: 'text' },
        passkey_token: { label: 'Passkey Token', type: 'text' },
      },
      async authorize(credentials, req) {
        const clientIp = req?.headers?.['x-forwarded-for'] || 
                         req?.headers?.['x-real-ip'] || 
                         'unknown';
        
        // 1. SSO Token Login
        if (credentials?.sso_token && credentials?.email) {
          // Validate email format
          const emailResult = emailSchema.safeParse(credentials.email);
          if (!emailResult.success) {
            logSecurityEvent({
              type: 'auth_failure',
              ip: clientIp as string,
              details: { reason: 'invalid_email_format', method: 'sso' },
              timestamp: new Date(),
            });
            return null;
          }
          
          const user = await db.query.users.findFirst({
            where: and(
              eq(users.email, emailResult.data),
              eq(users.ssoLoginToken, credentials.sso_token),
              gt(users.ssoLoginExpiresAt, new Date())
            ),
          });

          if (user) {
            // Invalidate token immediately (single use)
            await db.update(users)
              .set({ ssoLoginToken: null, ssoLoginExpiresAt: null })
              .where(eq(users.id, user.id));
            
            logSecurityEvent({
              type: 'auth_success',
              userId: user.id,
              ip: clientIp as string,
              details: { method: 'sso' },
              timestamp: new Date(),
            });
              
            return {
              id: user.id.toString(),
              email: user.email,
              role: user.role,
            };
          }
          
          logSecurityEvent({
            type: 'auth_failure',
            ip: clientIp as string,
            details: { reason: 'invalid_sso_token', email: credentials.email },
            timestamp: new Date(),
          });
          return null;
        }

        // 2. Passkey Login
        if (credentials?.passkey_token && credentials?.email) {
          // Passkey authentication was already verified via API
          // Just return the user
          const emailResult = emailSchema.safeParse(credentials.email);
          if (!emailResult.success) {
            logSecurityEvent({
              type: 'auth_failure',
              ip: clientIp as string,
              details: { reason: 'invalid_email_format', method: 'passkey' },
              timestamp: new Date(),
            });
            return null;
          }

          const user = await db.query.users.findFirst({
            where: eq(users.email, emailResult.data),
          });

          if (user) {
            logSecurityEvent({
              type: 'auth_success',
              userId: user.id,
              ip: clientIp as string,
              details: { method: 'passkey' },
              timestamp: new Date(),
            });
            
            return {
              id: user.id.toString(),
              email: user.email,
              role: user.role,
            };
          }

          logSecurityEvent({
            type: 'auth_failure',
            ip: clientIp as string,
            details: { reason: 'user_not_found', email: emailResult.data, method: 'passkey' },
            timestamp: new Date(),
          });
          return null;
        }

        // 3. Standard Password Login
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Validate email format
        const emailResult = emailSchema.safeParse(credentials.email);
        if (!emailResult.success) {
          logSecurityEvent({
            type: 'auth_failure',
            ip: clientIp as string,
            details: { reason: 'invalid_email_format', method: 'password' },
            timestamp: new Date(),
          });
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, emailResult.data),
        });

        if (!user) {
          // Timing-safe: Still do a password comparison to prevent timing attacks
          await bcrypt.compare(credentials.password, '$2b$12$invalidhashfortiminginvalidhashforti');
          
          logSecurityEvent({
            type: 'auth_failure',
            ip: clientIp as string,
            details: { reason: 'user_not_found', email: emailResult.data },
            timestamp: new Date(),
          });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          logSecurityEvent({
            type: 'auth_failure',
            userId: user.id,
            ip: clientIp as string,
            details: { reason: 'invalid_password' },
            timestamp: new Date(),
          });
          return null;
        }

        logSecurityEvent({
          type: 'auth_success',
          userId: user.id,
          ip: clientIp as string,
          details: { method: 'password' },
          timestamp: new Date(),
        });

        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60, // Update session every hour
  },
  jwt: {
    maxAge: JWT_MAX_AGE,
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.iat = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
  // Security options
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Debug only in development
  debug: process.env.NODE_ENV === 'development',
};
