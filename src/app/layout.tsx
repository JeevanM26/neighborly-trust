import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '../context/AppContext';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Neighborly Trust — Rural Service Connect',
  description: 'Production-ready, mobile-first, localized on-demand service marketplace for rural communities.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-100 antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
