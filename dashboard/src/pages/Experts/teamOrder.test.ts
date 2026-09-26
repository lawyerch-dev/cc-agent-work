import { describe, expect, it } from "vitest";

import type { OctopAgent } from "../../context/AgentContext";
import {
  sortTeamTemplates,
  sortTeams,
  teamCodeNumber,
  templateOrdinal,
} from "./teamOrder";

function team(
  agent_id: string,
  team_code: string | null,
  id: number,
): OctopAgent {
  return { agent_id, team_code, id, kind: "team" } as unknown as OctopAgent;
}

describe("sortTeams", () => {
  it("follows the saved order, then code, then creation", () => {
    const a = team("a", "team-001", 1);
    const b = team("b", "team-002", 2);
    const c = team("c", "team-003", 3);
    expect(
      sortTeams([a, b, c], ["c", "a", "b"]).map((t) => t.agent_id),
    ).toEqual(["c", "a", "b"]);
    expect(sortTeams([c, a, b], []).map((t) => t.agent_id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps unlisted teams last", () => {
    const a = team("a", "team-001", 1);
    const b = team("b", "team-002", 2);
    expect(sortTeams([a, b], ["b"]).map((t) => t.agent_id)).toEqual(["b", "a"]);
  });
});

describe("teamCodeNumber", () => {
  it("extracts the padded number", () => {
    expect(teamCodeNumber("team-7")).toBe("007");
    expect(teamCodeNumber("team-042")).toBe("042");
    expect(teamCodeNumber(null)).toBeNull();
    expect(teamCodeNumber("x")).toBeNull();
  });
});

describe("sortTeamTemplates", () => {
  it("orders by company structure, unknown ids last", () => {
    const rows = [
      { id: "sales" },
      { id: "zz-extra" },
      { id: "general-office" },
      { id: "finance" },
      { id: "hr-admin" },
      { id: "operations" },
    ];
    expect(sortTeamTemplates(rows).map((r) => r.id)).toEqual([
      "general-office",
      "hr-admin",
      "finance",
      "sales",
      "operations",
      "zz-extra",
    ]);
  });
});

describe("templateOrdinal", () => {
  it("uses the stable company-structure position", () => {
    expect(templateOrdinal("general-office")).toBe("001");
    expect(templateOrdinal("hr-admin")).toBe("002");
    expect(templateOrdinal("finance")).toBe("003");
    expect(templateOrdinal("sales")).toBe("004");
    expect(templateOrdinal("operations")).toBe("005");
    expect(templateOrdinal("zz-extra")).toBeNull();
  });
});
