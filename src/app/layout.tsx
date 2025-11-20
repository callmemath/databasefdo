import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import AuthProvider from '../components/auth/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema FDO - Database Forze Dell\'Ordine',
  description: 'Sistema di gestione per le forze dell\'ordine del server FiveM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
