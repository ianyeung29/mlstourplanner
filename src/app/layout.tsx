import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/context/ThemeContext';

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mlstourplanner.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'MLS Tour Planner — Turn Messy Listings into Conflict-Free Showing Days',
  description: 'Automated showing tour optimizer for real estate agents. Sequences property stops, calculates travel buffers, handles open houses, and dispatches client itineraries in 2 minutes.',
  keywords: ['MLS tour planner', 'real estate showing tour', 'property route optimizer', 'showing schedule planner', 'buyer agent itinerary'],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'MLS Tour Planner — Showing Day Itinerary & Route Optimizer',
    description: 'Turn messy listing sheets into a conflict-aware, client-ready showing day in under 2 minutes.',
    url: BASE_URL,
    siteName: 'MLS Tour Planner',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MLS Tour Planner',
    description: 'Conflict-aware showing tour planning & client itinerary dispatches for real estate agents.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <Header />
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
