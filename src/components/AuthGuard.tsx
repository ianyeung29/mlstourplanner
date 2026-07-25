'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserProfile, saveUserProfile, upgradeToPro } from '@/services/storage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for Google OAuth callback parameters in URL
    const searchParams = new URLSearchParams(window.location.search);
    const googleLogin = searchParams.get('google_login');
    const googleEmail = searchParams.get('email');
    const googleName = searchParams.get('name');
    const paymentSuccess = searchParams.get('payment_success');

    if (googleLogin === 'true' && googleEmail) {
      const currentProfile = getUserProfile();
      const newProfile = {
        ...currentProfile,
        id: `g_${googleEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: googleEmail,
        full_name: googleName || googleEmail.split('@')[0],
        subscription_tier: currentProfile?.subscription_tier || 'FREE_TRIAL',
        is_verified: true
      };
      saveUserProfile(newProfile);
      setIsAuthorized(true);
      return;
    }

    if (paymentSuccess === 'true') {
      upgradeToPro();
    }

    // Standard profile login check
    const profile = getUserProfile();
    const loggedIn = !!profile && !!profile.email && profile.email !== 'guest@sideluxury.com' && !!profile.id;

    if (!loggedIn) {
      setIsAuthorized(false);
      // Redirect to home landing page with auth=required prompt
      router.push('/?auth=required');

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open_auth_modal'));
        }
      }, 150);
    } else {
      setIsAuthorized(true);
    }
  }, [router, pathname]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400 font-sans">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying agent credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
