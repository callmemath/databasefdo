'use client';

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface AuthProviderProps {
  children: ReactNode;
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const JWT_REAUTH_BUFFER_MS = 5000;
const LAST_ACTIVITY_COOKIE_MAX_AGE_SECONDS = 4 * 60 * 60;
const LAST_ACTIVITY_COOKIE = 'fdo_last_activity';

function setLastActivityCookie(timestamp: number) {
  document.cookie = `${LAST_ACTIVITY_COOKIE}=${timestamp}; path=/; max-age=${Math.floor(
    LAST_ACTIVITY_COOKIE_MAX_AGE_SECONDS
  )}; samesite=lax`;
}

function getLastActivityCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LAST_ACTIVITY_COOKIE}=`));

  if (!cookie) {
    return null;
  }

  const value = Number(cookie.split('=')[1]);
  return Number.isFinite(value) ? value : null;
}

function clearLastActivityCookie() {
  document.cookie = `${LAST_ACTIVITY_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

function InactivitySessionGuard() {
  const { status } = useSession();
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (pathname === '/login' || status !== 'authenticated') {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      logoutTriggeredRef.current = false;
      return;
    }

    const triggerLogout = () => {
      if (logoutTriggeredRef.current) {
        return;
      }

      logoutTriggeredRef.current = true;
      clearLastActivityCookie();
      void signOut({ callbackUrl: '/login?reason=idle' });
    };

    const scheduleLogout = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      const lastActivity = getLastActivityCookie() ?? Date.now();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        triggerLogout();
        return;
      }

      timerRef.current = window.setTimeout(triggerLogout, INACTIVITY_TIMEOUT_MS - elapsed);
    };

    const markActivity = () => {
      logoutTriggeredRef.current = false;
      setLastActivityCookie(Date.now());
      scheduleLogout();
    };

    const handleResume = () => {
      const lastActivity = getLastActivityCookie() ?? Date.now();

      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        triggerLogout();
        return;
      }

      markActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleResume();
      }
    };

    if (!getLastActivityCookie()) {
      setLastActivityCookie(Date.now());
    }

    scheduleLogout();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });

      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, status]);

  return null;
}

function JwtExpiryGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);
  const logoutTriggeredRef = useRef(false);

  useEffect(() => {
    if (pathname === '/login' || status !== 'authenticated' || !session?.tokenExpiresAt) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      logoutTriggeredRef.current = false;
      return;
    }

    const triggerLogout = () => {
      if (logoutTriggeredRef.current) {
        return;
      }

      logoutTriggeredRef.current = true;
      clearLastActivityCookie();
      void signOut({ callbackUrl: '/login?reason=expired' });
    };

    const timeUntilExpiry = session.tokenExpiresAt - Date.now() + JWT_REAUTH_BUFFER_MS;

    if (timeUntilExpiry <= 0) {
      triggerLogout();
      return;
    }

    timerRef.current = window.setTimeout(triggerLogout, timeUntilExpiry);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname, session?.tokenExpiresAt, status]);

  return null;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <JwtExpiryGuard />
      <InactivitySessionGuard />
      {children}
    </SessionProvider>
  );
}
