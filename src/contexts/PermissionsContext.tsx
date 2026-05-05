'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PermissionRule } from '@/lib/permissions';

export type RouteRulesMap = Record<string, PermissionRule[]>;

interface PermissionsContextValue {
  rules: RouteRulesMap;
  loading: boolean;
  reload: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  rules: {},
  loading: true,
  reload: () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<RouteRulesMap>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch('/api/config/permissions')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRules(data.rules ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tick]);

  const reload = () => setTick((t) => t + 1);

  return (
    <PermissionsContext.Provider value={{ rules, loading, reload }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  return useContext(PermissionsContext);
}

/** Returns the rules for the most-specific matching route prefix, or null if none. */
export function findRouteRules(
  pathname: string,
  rulesMap: RouteRulesMap
): PermissionRule[] | null {
  const sorted = Object.keys(rulesMap).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return rulesMap[route];
    }
  }
  return null;
}
