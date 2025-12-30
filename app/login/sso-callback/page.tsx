'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (token && email) {
      signIn('credentials', {
        email,
        sso_token: token,
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } else {
      router.push('/login?error=invalid_sso_callback');
    }
  }, [token, email, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing secure sign-in...</p>
      </div>
    </div>
  );
}
