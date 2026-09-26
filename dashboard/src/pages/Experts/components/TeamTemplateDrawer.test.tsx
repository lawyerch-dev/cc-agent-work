import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TeamTemplateDrawer from "./TeamTemplateDrawer";

vi.mock("../../../api/modules/teams", () => ({
  teamsApi: {
    listTemplates: vi.fn().mockResolvedValue([
      {
        id: "finance",
        label: "财务部",
        description: "记账",
        icon: null,
        color: null,
        suggested_roles: [],
      },
    ]),
  },
}));

describe("TeamTemplateDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists templates", async () => {
    render(
      <TeamTemplateDrawer open onClose={() => {}} onCreated={() => {}} />,
    );
    await waitFor(() =>
      expect(screen.getByText("财务部")).toBeInTheDocument(),
    );
  });
});
