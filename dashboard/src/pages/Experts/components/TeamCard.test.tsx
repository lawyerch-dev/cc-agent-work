import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TeamCard } from "./TeamCard";
import type { OctopAgent } from "../../../context/AgentContext";

vi.mock("../../../context/AgentContext", () => ({
  useAgent: () => ({ setActiveAgent: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../Agent/Workspace/components/WorkspaceDrawer", () => ({
  default: () => null,
}));
vi.mock("./ChannelCatalogDrawer", () => ({ default: () => null }));
vi.mock("./MemoryCatalogDrawer", () => ({ default: () => null }));
vi.mock("../../../api/modules/teams", () => ({
  teamsApi: { remove: vi.fn() },
}));
vi.mock("../../../api/request", () => ({ request: vi.fn() }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const agent = {
  agent_id: "t1",
  name: "财务部",
  state: "stopped",
  member_ids: [],
  description: null,
} as unknown as OctopAgent;

describe("TeamCard", () => {
  it("shows the pending-members badge when the roster is empty", () => {
    render(
      <TeamCard
        agent={agent}
        experts={[]}
        onEdit={() => {}}
        onDeleted={() => {}}
        onStateChange={() => {}}
      />,
    );
    expect(
      screen.getByText("experts.teams.pendingMembers"),
    ).toBeInTheDocument();
  });

  it("toggles selection on card click in select mode", () => {
    const onToggleSelect = vi.fn();
    render(
      <TeamCard
        agent={agent}
        experts={[]}
        onEdit={() => {}}
        onDeleted={() => {}}
        onStateChange={() => {}}
        selectMode
        selected={false}
        onToggleSelect={onToggleSelect}
      />,
    );
    const card = screen.getByRole("button", { name: /财务部/ });
    fireEvent.click(card);
    expect(onToggleSelect).toHaveBeenCalledWith("t1");
    expect(card).toHaveAttribute("aria-pressed", "false");
  });
});
