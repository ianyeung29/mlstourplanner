'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, Calendar, PlusCircle, User, Users, Settings, Home, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { getUserProfile, logoutUser } from '@/services/storage';
import AuthModal from './AuthModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = React.useState(getUserProfile());
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const refreshProfile = React.useCallback(() => {
    const user = getUserProfile();
    setProfile(user);
    setIsLoggedIn(!!user && !!user.email && user.email !== 'guest@sideluxury.com' && !!user.id);
  }, []);

  React.useEffect(() => {
    refreshProfile();

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
        setIsLoggedIn(!!e.detail && !!e.detail.email && !!e.detail.id);
      } else {
        refreshProfile();
      }
    };

    const handleOpenAuthModal = () => {
      setIsAuthModalOpen(true);
    };

    window.addEventListener('profile_updated', handleProfileUpdate);
    window.addEventListener('storage', refreshProfile);
    window.addEventListener('open_auth_modal', handleOpenAuthModal);

    return () => {
      window.removeEventListener('profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', refreshProfile);
      window.removeEventListener('open_auth_modal', handleOpenAuthModal);
    };
  }, [refreshProfile]);

  // HIDE ALL HEADERS FOR CLIENT ITINERARY PRINT VIEW
  if (pathname && pathname.includes('/print')) {
    return null;
  }

  const handleOpenAuth = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/');
  };

  const targetDashboardOrHome = isLoggedIn ? '/dashboard' : '/';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-[1600px] mx-auto px-3 h-10 flex items-center justify-between">
          {/* Left Brand & Nav */}
          <div className="flex items-center space-x-3">
            <Link
              href={targetDashboardOrHome}
              title={isLoggedIn ? "Agent Workspace Dashboard" : "Company Introduction"}
              className="flex items-center space-x-1.5 group"
            >
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <Compass className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-black tracking-tight text-white">
                MLS Tour Planner
              </span>
            </Link>

            {/* Navigation links - Visible ONLY when logged in */}
            {isLoggedIn && (
              <nav className="hidden sm:flex items-center space-x-1 pl-2 border-l border-slate-800 text-[11px] font-medium text-slate-300">
                <Link
                  href="/dashboard"
                  className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1 font-bold text-white"
                >
                  <Home className="w-3 h-3 text-indigo-400" />
                  <span>Company</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1 font-bold text-white"
                >
                  <LayoutDashboard className="w-3 h-3 text-emerald-400" />
                  <span>Workspace</span>
                </Link>
                <Link
                  href="/contacts"
                  className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Users className="w-3 h-3 text-blue-400" />
                  <span>Contacts</span>
                </Link>
                <Link
                  href="/profile"
                  className="px-2 py-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3 h-3 text-purple-400" />
                  <span>Settings</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right User Badge & Auth Control */}
          <div className="flex items-center space-x-2">
            {!isLoggedIn ? (
              /* Single Sign-In button for unauthenticated users */
              <button
                type="button"
                onClick={handleOpenAuth}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded text-xs font-bold transition-all shadow cursor-pointer active:scale-95 z-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              /* Logged In Agent Bar: Active Profile Badge + Log Out Button */
              <>
                <div
                  title="Active Signed-In Agent Account"
                  className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]"
                >
                  <User className="w-3 h-3 text-indigo-400" />
                  <span className="font-bold text-white">{profile.full_name}</span>
                  <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300">Agent</span>
                </div>

                <Link
                  href="/tours/new"
                  className="px-2 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Tour</span>
                </Link>

                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log Out of Active Session"
                  className="px-2.5 py-1 rounded text-xs font-bold bg-slate-800 hover:bg-rose-600 hover:text-white border border-slate-700 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Single Central Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
