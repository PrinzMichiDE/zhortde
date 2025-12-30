import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ssoDomains, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
  }

  try {
    const { domain, provider } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Find Config
    const config = await db.query.ssoDomains.findFirst({
      where: and(
        eq(ssoDomains.domain, domain),
        eq(ssoDomains.isVerified, true)
      ),
    });

    if (!config) {
      return NextResponse.redirect(new URL('/login?error=invalid_config', request.url));
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://zhort.de'}/api/auth/sso/callback`;
    
    // Exchange Code for Token
    let tokenEndpoint = config.tokenUrl;
    
    if (provider === 'azure-ad') {
       tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    } else if (!tokenEndpoint && config.issuerUrl) {
       tokenEndpoint = `${config.issuerUrl.replace(/\/$/, '')}/protocol/openid-connect/token`;
    }

    if (!tokenEndpoint) {
       throw new Error('Missing token endpoint');
    }

    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('Token Error', tokenData);
      throw new Error('Failed to get access token');
    }

    // Get User Info (or decode ID token if we trust it, but safer to fetch userinfo)
    // Azure AD usually provides id_token which we can decode, but let's fetch userinfo if possible.
    // Azure AD Graph: https://graph.microsoft.com/oidc/userinfo
    
    let userInfoEndpoint = config.userInfoUrl;
    if (provider === 'azure-ad') {
       userInfoEndpoint = 'https://graph.microsoft.com/oidc/userinfo';
    } else if (!userInfoEndpoint && config.issuerUrl) {
       userInfoEndpoint = `${config.issuerUrl.replace(/\/$/, '')}/protocol/openid-connect/userinfo`;
    }

    if (!userInfoEndpoint) {
       throw new Error('Missing userinfo endpoint');
    }

    const userRes = await fetch(userInfoEndpoint, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    const email = userData.email || userData.preferred_username; // Azure AD often uses preferred_username

    if (!email) {
      throw new Error('No email found in user info');
    }

    // Check if email matches domain (security check)
    if (!email.endsWith(`@${domain}`)) {
      return NextResponse.redirect(new URL('/login?error=email_domain_mismatch', request.url));
    }

    // Login/Create User
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Auto-provision user?
      // "Wenn die Domain nicht geclaimt ist, dann anmelden und Registrierung..."
      // For SSO, we usually auto-provision.
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash: 'sso-user', // Placeholder
        role: 'user',
        createdAt: new Date(),
      }).returning();
      user = newUser;
    }

    // Generate SSO Login Token
    const ssoToken = nanoid(64);
    await db.update(users).set({
      ssoLoginToken: ssoToken,
      ssoLoginExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    }).where(eq(users.id, user.id));

    // Redirect to Magic Login Handler (Client Side will execute signIn)
    // Actually, we can't trigger NextAuth signin from server side easily without a client.
    // So we redirect to a client page that executes signIn('credentials', { sso_token: ... })
    
    return NextResponse.redirect(new URL(`/login/sso-callback?token=${ssoToken}&email=${encodeURIComponent(email)}`, request.url));

  } catch (error) {
    console.error('SSO Callback Error:', error);
    return NextResponse.redirect(new URL('/login?error=sso_failed', request.url));
  }
}
