// Sistema di autorizzazioni basato sulla coppia (deptId, rankId).
// Non confrontare rankId tra dipartimenti diversi.

export interface PermissionRule {
  deptId: number;
  minRankId: number;
}

export interface UserIdentity {
  deptId: number | null;
  rankId: number | null;
}

/**
 * Restituisce true se l'utente soddisfa almeno una delle regole fornite.
 * Usa coercizione numerica esplicita per resistere a type mismatch da JSON/JWT
 * (es. deptId può arrivare come stringa "1" invece di number 1).
 */
export function hasPermission(user: UserIdentity, rules: PermissionRule[]): boolean {
  if (user.deptId == null || user.rankId == null) return false;
  const deptId = Number(user.deptId);
  const rankId = Number(user.rankId);
  if (isNaN(deptId) || isNaN(rankId)) return false;
  return rules.some((rule) => deptId === Number(rule.deptId) && rankId >= Number(rule.minRankId));
}

// ────────────────────────────────────────────────
// Lookup tables
// ────────────────────────────────────────────────

export const DEPARTMENTS: Record<number, string> = {
  1: "Polizia di Stato",
  2: "Carabinieri",
  3: "Guardia di Finanza",
  4: "Procura",
};

export const RANKS: Record<number, Record<number, string>> = {
  1: {
    1: "Allievo Agente",
    2: "Agente",
    3: "Agente Scelto",
    4: "Assistente",
    5: "Assistente Capo",
    6: "Sovrintendente",
    7: "Sovrintendente Capo",
    8: "Ispettore",
    9: "Ispettore Capo",
    10: "Ispettore Superiore",
    11: "Vice Commissario",
    12: "Commissario",
    13: "Commissario Capo",
    14: "Vice Questore Aggiunto",
    15: "Vice Questore",
    16: "Questore",
    17: "Primo Dirigente",
    18: "Commissario",
    19: "Dirigente Superiore",
    20: "Prefetto",
    21: "Capo della Polizia Aggiunto",
    22: "Capo della Polizia",
    23: "Direttore Centrale",
    24: "Dirigente Generale",
  },
  2: {
    1: "Allievo Carabiniere",
    2: "Carabiniere",
    3: "Carabiniere Scelto",
    4: "Appuntato",
    5: "Appuntato Scelto",
    6: "Vice Brigadiere",
    7: "Brigadiere",
    8: "Brigadiere Capo",
    9: "Maresciallo",
    10: "Maresciallo Ordinario",
    11: "Maresciallo Capo",
    12: "Maresciallo Aiutante",
    13: "Maresciallo Aiutante Sostituto Ufficiale di P.S.",
    14: "Sottotenente",
    15: "Tenente",
    16: "Capitano",
    17: "Maggiore",
    18: "Tenente Colonnello",
    19: "Colonnello",
    20: "Brigadiere Generale",
    21: "Generale di Brigata",
    22: "Generale di Divisione",
    23: "Generale di Corpo d'Armata con incarico speciale",
    24: "Generale di Corpo d'Armata",
    25: "Comandante Generale",
    26: "Generale di Corpo D'Armata",
  },
  3: {
    1: "Allievo Finanziere",
    2: "Finanziere",
    3: "Finanziere Scelto",
    4: "Appuntato",
    5: "Appuntato Scelto",
    6: "Vice Brigadiere",
    7: "Brigadiere",
    8: "Brigadiere Capo",
    9: "Maresciallo",
    10: "Maresciallo Ordinario",
    11: "Maresciallo Capo",
    12: "Maresciallo Aiutante",
    13: "Maresciallo Aiutante Sostituto Ufficiale di P.S.",
    14: "Sottotenente",
    15: "Tenente",
    16: "Capitano",
    17: "Maggiore",
    18: "Tenente Colonnello",
    19: "Colonnello",
    20: "Brigadiere Generale",
    21: "Generale di Brigata",
    22: "Generale di Divisione",
    23: "Generale di Corpo d'Armata con incarico speciale",
    24: "Generale di Corpo d'Armata",
    25: "Comandante Generale",
    26: "Generale di Corpo D'Armata",
  },
  4: {
    1: "Sost. Procuratore Tirocinante",
    2: "Sostituto Procuratore",
    3: "Procuratore",
    4: "Procuratore Capo",
  },
};

export function getDeptName(deptId: number): string {
  return DEPARTMENTS[deptId] ?? "Sconosciuto";
}

export function getRankName(deptId: number, rankId: number): string {
  return RANKS[deptId]?.[rankId] ?? "Sconosciuto";
}

// ────────────────────────────────────────────────
// Discord Roles Config (sincronizzata con il bot)
// ────────────────────────────────────────────────

export interface RankConfig {
  rank_id: number;
  rank_name: string;
  role_id: string; // ID ruolo Discord come stringa (evita perdita di precisione su 64-bit); "0" = non configurato
}

export interface DeptRolesConfig {
  dept_id: string;      // Stringificato per evitare perdita di precisione su ID Discord a 64-bit
  dept_role_id: string; // ID ruolo Discord del dipartimento ("0" = non configurato)
  ranks: RankConfig[];
}

export type RolesConfig = Record<string, DeptRolesConfig>;

/** Costruisce la config di default dai RANKS interni (tutti role_id = 0). */
export function buildDefaultRolesConfig(): RolesConfig {
  const config: RolesConfig = {};
  for (const [deptIdStr, deptName] of Object.entries(DEPARTMENTS)) {
    const deptId = Number(deptIdStr);
    const ranks = RANKS[deptId] ?? {};
    config[deptName] = {
      dept_id: String(deptId),
      dept_role_id: "0",
      ranks: Object.entries(ranks).map(([rankIdStr, rankName]) => ({
        rank_id: Number(rankIdStr),
        rank_name: rankName,
        role_id: "0",
      })),
    };
  }
  return config;
}
