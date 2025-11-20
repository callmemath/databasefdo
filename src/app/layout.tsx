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
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-700 py-1.5 px-4 text-center z-50">
          <p className="text-xs text-amber-400">
            ⚠️ Sistema sviluppato per scopi videoludici e roleplay - Tutti i dati sono fittizi
          </p>
        </footer>
      </body>
    </html>
  );
}
