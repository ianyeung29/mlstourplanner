'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Compass, Calendar, PlusCircle, User, Users, Settings, Home, LayoutDashboard, LogIn, LogOut, Menu, X, Sparkles, HelpCircle, Sun, Moon } from 'lucide-react';
import { getUserProfile, logoutUser } from '@/services/storage';
import { useTheme } from '@/context/ThemeContext';
import AuthModal from './AuthModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState(getUserProfile());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const publicRoutes = ['/', '/about', '/contact', '/privacy', '/terms'];
  const isPublicRoute = publicRoutes.includes(pathname || '');

  const refreshProfile = useCallback(() => {
    const user = getUserProfile();
    setProfile(user);
    setIsLoggedIn(!!user && !!user.email && !!user.id);
  }, []);

  useEffect(() => {
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

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // HIDE ALL HEADERS FOR CLIENT ITINERARY PRINT VIEW
  if (pathname && pathname.includes('/print')) {
    return null;
  }

  const handleOpenAuth = () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logoutUser();
    router.push('/');
  };

  const showWorkspaceNav = isLoggedIn && !isPublicRoute;

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm font-sans">
        <div className="max-w-[1600px] mx-auto px-3 h-12 sm:h-10 flex items-center justify-between">
          {/* Left Brand Logo & Primary Navigation */}
          <div className="flex items-center space-x-4">
            <Link
              href={showWorkspaceNav ? "/dashboard" : "/"}
              title={showWorkspaceNav ? "Agent Workspace Dashboard" : "MLS Tour Planner Home"}
              className="flex items-center space-x-1.5 group"
            >
              <div className="w-6 h-6 sm:w-5 sm:h-5 rounded bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <Compass className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-white" />
              </div>
              <span className="text-xs sm:text-xs font-black tracking-tight text-white">
                MLS Tour Planner
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {showWorkspaceNav ? (
              /* Authenticated Agent Workspace Header */
              <nav className="hidden md:flex items-center space-x-1 pl-2 border-l border-slate-800 text-[11px] font-medium text-slate-300">
                <Link
                  href="/dashboard"
                  className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 font-bold ${
                    pathname === '/dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300'
                  }`}
                >
                  <LayoutDashboard className="w-3 h-3 text-emerald-400" />
                  <span>Workspace</span>
                </Link>
                <Link
                  href="/contacts"
                  className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                    pathname === '/contacts' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <Users className="w-3 h-3 text-blue-400" />
                  <span>Contacts</span>
                </Link>
                <Link
                  href="/profile"
                  className={`px-2 py-0.5 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                    pathname === '/profile' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <Settings className="w-3 h-3 text-purple-400" />
                  <span>Settings</span>
                </Link>
              </nav>
            ) : (
              /* Authentication-Neutral Public Marketing Navigation */
              <nav className="hidden md:flex items-center space-x-3 pl-2 border-l border-slate-800 text-xs font-semibold text-slate-400">
                <Link href="/#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
                <Link href="/#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/about" className={`hover:text-white transition-colors ${pathname === '/about' ? 'text-white font-bold' : ''}`}>
                  About
                </Link>
                <Link href="/contact" className={`hover:text-white transition-colors ${pathname === '/contact' ? 'text-white font-bold' : ''}`}>
                  Contact
                </Link>
              </nav>
            )}
          </div>

          {/* Right Controls (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>

            {showWorkspaceNav ? (
              <>
                <div
                  title="Active Signed-In Agent Account"
                  className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]"
                >
                  <User className="w-3 h-3 text-indigo-400" />
                  <span className="font-bold text-white max-w-[120px] truncate">{profile?.full_name}</span>
                  <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-bold">Agent</span>
                </div>

                <Link
                  href="/tours/new"
                  className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Tour</span>
                </Link>

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
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleOpenAuth}
                  className="px-3 py-1 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={handleOpenAuth}
                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1 rounded text-xs font-bold transition-all shadow cursor-pointer active:scale-95 z-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Build Tour Free</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>

            {showWorkspaceNav ? (
              <>
                <Link
                  href="/tours/new"
                  className="px-2 py-1 rounded text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Tour</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800 border border-slate-700 focus:outline-none"
                  aria-label="Toggle Mobile Menu"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleOpenAuth}
                  className="flex items-center space-x-1 bg-indigo-600 text-white px-2.5 py-1 rounded text-xs font-bold"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800 border border-slate-700 focus:outline-none"
                  aria-label="Toggle Public Menu"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-3 animate-fadeIn shadow-2xl">
            {showWorkspaceNav ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white">{profile?.full_name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    Agent Active
                  </span>
                </div>

                <nav className="flex flex-col space-y-1 text-xs font-medium text-slate-300">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      pathname === '/dashboard' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    <span>Workspace Dashboard</span>
                  </Link>

                  <Link
                    href="/contacts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      pathname === '/contacts' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Buyer Client Contacts</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      pathname === '/profile' ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span>Agent Settings & Profile</span>
                  </Link>
                </nav>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <nav className="flex flex-col space-y-2 text-xs font-medium text-slate-300">
                <Link
                  href="/#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 font-semibold"
                >
                  How It Works
                </Link>
                <Link
                  href="/#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 font-semibold"
                >
                  Pricing
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 font-semibold"
                >
                  About MLSTourPlanner
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-200 font-semibold"
                >
                  Contact Support
                </Link>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleOpenAuth();
                    }}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                    <span>Build Tour Free — No Card Required</span>
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
      </header>

      {/* Render Authentication Modal globally */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
