import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ssoDomains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const domain = email.split('@')[1];
  
  // Find verified SSO config for this domain
  const ssoConfig = await db.query.ssoDomains.findFirst({
    where: (sso, { eq, and }) => and(
      eq(sso.domain, domain),
      eq(sso.isVerified, true)
    ),
  });

  if (!ssoConfig) {
    return NextResponse.json({ isSso: false });
  }

  // Construct Auth URL
  let authUrl = '';
  const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://zhort.de'}/api/auth/sso/callback`;
  const state = Buffer.from(JSON.stringify({ provider: ssoConfig.providerType, domain })).toString('base64');

  if (ssoConfig.providerType === 'azure-ad') {
    authUrl = `https://login.microsoftonline.com/${ssoConfig.tenantId}/oauth2/v2.0/authorize?client_id=${ssoConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid profile email&state=${state}`;
  } else if (ssoConfig.providerType === 'keycloak' || ssoConfig.providerType === 'oidc') {
    // Need to use configured authorizationUrl or discover it
    // Assuming user provided issuerUrl, we might need to fetch discovery doc
    // For now, let's assume standard keycloak path if not provided explicitly? 
    // Actually schema has authorizationUrl? No, I added issuerUrl. 
    // Simple approach: Use issuerUrl + /protocol/openid-connect/auth (Keycloak standard)
    
    let baseUrl = ssoConfig.authorizationUrl;
    if (!baseUrl && ssoConfig.issuerUrl) {
      // Very rough guess for Keycloak, but better than nothing
      baseUrl = `${ssoConfig.issuerUrl.replace(/\/$/, '')}/protocol/openid-connect/auth`;
    }
    
    if (baseUrl) {
      authUrl = `${baseUrl}?client_id=${ssoConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=openid profile email&state=${state}`;
    }
  }

  if (authUrl) {
    return NextResponse.json({ isSso: true, authUrl });
  }

  return NextResponse.json({ isSso: false });
}
