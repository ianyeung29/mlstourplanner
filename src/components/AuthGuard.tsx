'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserProfile } from '@/services/storage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const profile = getUserProfile();
    const loggedIn = !!profile && !!profile.email && profile.email !== 'guest@sideluxury.com' && !!profile.id;

    if (!loggedIn) {
      setIsAuthorized(false);
      // Redirect to home landing page
      router.push('/?auth=required');

      // Dispatch event after slight delay to ensure home page opens auth modal
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
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">
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
