import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'MLS Tour Planner — Real Estate Multi-Listing Showing Tour Optimizer',
  description: 'Desktop and mobile web application for planning, optimizing, and scheduling multi-property showing tours for buyer agents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <Header />
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-500">
          MLS Tour Planner · Optimized Desktop & Mobile Workspace for OneKey MLS Showing Tours
        </footer>
      </body>
    </html>
  );
}
