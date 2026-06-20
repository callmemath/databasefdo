'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SITE_ACCESS_COOKIE, clearSiteAccessCookie } from "@/lib/auth-access";

interface AuthProviderProps {
  children: ReactNode;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sessionValidated, setSessionValidated] = useState(false);

  const isLoginPage = pathname === '/login';

  const hasSiteAccessCookie = () => {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${SITE_ACCESS_COOKIE}=`));
  };

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    let cancelled = false;

    const validateSession = async () => {
      if (status !== 'authenticated') {
        setSessionValidated(false);
        return;
      }

      const hasAccess = hasSiteAccessCookie();

      if (!hasAccess) {
        setSessionValidated(false);
        if (!isLoginPage) {
          router.replace(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        }
        return;
      }

      try {
        const response = await fetch('/api/auth/validate', { cache: 'no-store' });

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          document.cookie = clearSiteAccessCookie();
          setSessionValidated(false);
          await router.replace(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }

        setSessionValidated(true);
      } catch {
        if (!cancelled) {
          setSessionValidated(false);
        }
      }
    };

    void validateSession();

    const intervalId = window.setInterval(() => {
      void validateSession();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoginPage, pathname, router, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    const hasAccess = hasSiteAccessCookie();

    if (hasAccess && sessionValidated && isLoginPage) {
      router.replace('/dashboard');
    }
  }, [isLoginPage, router, sessionValidated, status]);

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

  if (status === 'authenticated' && !sessionValidated && !isLoginPage) {
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
