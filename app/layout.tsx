import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Console',
  icons: { icon: '/icon.svg' },
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = { themeColor: '#070b1a', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers(); // per-request rendering so the CSP nonce can be applied
  return (
    <html lang="en">
      <body>
        <div className="sky-bg" aria-hidden />
        {children}
      </body>
    </html>
  );
}
