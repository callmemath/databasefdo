'use client';

"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface AuthProviderProps {
  children: ReactNode;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated' && !isLoginPage) {
      const currentQuery = searchParams.toString();
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname;
      router.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (status === 'authenticated' && isLoginPage) {
      router.replace('/dashboard');
    }
  }, [isLoginPage, pathname, router, searchParams, status]);

  if (status === 'loading' && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-police-blue-dark dark:text-police-text-light">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-police-blue mx-auto" />
          <p className="mt-4 text-sm">Verifica accesso in corso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthGate>{children}</AuthGate>
    </SessionProvider>
  );
}
