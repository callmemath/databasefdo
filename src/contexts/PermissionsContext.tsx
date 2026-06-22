'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PermissionRule } from '@/lib/permissions';

export type RouteRulesMap = Record<string, PermissionRule[]>;
export type ActionRulesMap = Record<string, PermissionRule[]>;

interface PermissionsContextValue {
  rules: RouteRulesMap;
  actionRules: ActionRulesMap;
  loading: boolean;
  reload: () => void;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  rules: {},
  actionRules: {},
  loading: true,
  reload: () => {},
});

function coerceRules(raw: Record<string, PermissionRule[]>): Record<string, PermissionRule[]> {
  const coerced: Record<string, PermissionRule[]> = {};
  for (const [key, arr] of Object.entries(raw)) {
    coerced[key] = arr.map((r) => ({
      deptId: Number(r.deptId),
      minRankId: Number(r.minRankId),
    }));
  }
  return coerced;
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<RouteRulesMap>({});
  const [actionRules, setActionRules] = useState<ActionRulesMap>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/config/permissions').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/config/action-permissions').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([permData, actionData]) => {
        if (permData?.rules) setRules(coerceRules(permData.rules));
        if (actionData?.rules) setActionRules(coerceRules(actionData.rules));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tick]);

  const reload = () => setTick((t) => t + 1);

  return (
    <PermissionsContext.Provider value={{ rules, actionRules, loading, reload }}>
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
