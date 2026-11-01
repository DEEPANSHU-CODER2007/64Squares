import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: '64Squares — Think Ahead. Play Smart.',
  description: 'A clean, modern, distraction-free chess platform. Play Stockfish AI, challenge friends in private rooms, solve tactics, and analyze games.',
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F6F2' },
    { media: '(prefers-color-scheme: dark)', color: '#111412' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const PRELOAD_PIECES = [
  'wp', 'wn', 'wb', 'wr', 'wq', 'wk',
  'bp', 'bn', 'bb', 'br', 'bq', 'bk',
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {PRELOAD_PIECES.map((p) => (
          <link
            key={p}
            rel="preload"
            href={`/pieces/neo/${p}.png`}
            as="image"
            type="image/png"
          />
        ))}
      </head>
      <body className="min-h-screen flex flex-col bg-[#F7F6F2] dark:bg-[#111412] text-[#1C201D] dark:text-[#F4F3EA] antialiased selection:bg-[#557F39]/20 dark:selection:bg-[#81B64C]/30 selection:text-inherit">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
          <BottomNav />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
