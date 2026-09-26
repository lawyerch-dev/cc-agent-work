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
