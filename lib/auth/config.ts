import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        sso_token: { label: 'SSO Token', type: 'text' },
      },
      async authorize(credentials) {
        // 1. SSO Token Login
        if (credentials?.sso_token && credentials?.email) {
          const user = await db.query.users.findFirst({
            where: and(
              eq(users.email, credentials.email),
              eq(users.ssoLoginToken, credentials.sso_token),
              gt(users.ssoLoginExpiresAt, new Date())
            ),
          });

          if (user) {
            // Invalidate token
            await db.update(users)
              .set({ ssoLoginToken: null, ssoLoginExpiresAt: null })
              .where(eq(users.id, user.id));
              
            return {
              id: user.id.toString(),
              email: user.email,
              role: user.role, // Pass role to session
            };
          }
          return null;
        }

        // 2. Standard Password Login
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

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
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
};
