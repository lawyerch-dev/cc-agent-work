import type { OctopAgent } from "../../context/AgentContext";

/**
 * Order teams by the user's saved `team_order`, then by stable `team_code`,
 * then by creation (`id`). Teams missing from `order` go last (kept stable).
 */
export function sortTeams(teams: OctopAgent[], order: string[]): OctopAgent[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...teams].sort((a, b) => {
    const ra = rank.get(a.agent_id);
    const rb = rank.get(b.agent_id);
    if (ra !== undefined || rb !== undefined) {
      return (ra ?? Number.MAX_SAFE_INTEGER) - (rb ?? Number.MAX_SAFE_INTEGER);
    }
    const ca = a.team_code ?? "";
    const cb = b.team_code ?? "";
    if (ca !== cb) return ca.localeCompare(cb);
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

/** Numeric part of a `team-NNN` code, for the ordinal badge. */
export function teamCodeNumber(code: string | null | undefined): string | null {
  const match = /^team-(\d+)$/.exec((code ?? "").trim());
  return match ? match[1].padStart(3, "0") : null;
}

/** Company-structure order for bundled team templates (人财物: 管理/人/财/业务/物). */
export const TEAM_TEMPLATE_ORDER: readonly string[] = [
  "general-office",
  "hr-admin",
  "finance",
  "sales",
  "operations",
];

/** Sort templates into company-structure order (unknown ids last, then id). */
export function sortTeamTemplates<T extends { id: string }>(
  templates: T[],
): T[] {
  const rank = new Map(TEAM_TEMPLATE_ORDER.map((id, index) => [id, index]));
  return [...templates].sort((a, b) => {
    const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.id.localeCompare(b.id);
  });
}

/** Stable ordinal from company-structure position (`001`…), or null if unknown. */
export function templateOrdinal(id: string): string | null {
  const index = TEAM_TEMPLATE_ORDER.indexOf(id);
  return index >= 0 ? String(index + 1).padStart(3, "0") : null;
}
