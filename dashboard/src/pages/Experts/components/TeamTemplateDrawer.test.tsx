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
      {
        id: "general-office",
        label: "总经办",
        description: "统筹",
        icon: null,
        color: null,
        suggested_roles: [],
      },
    ]),
  },
}));

describe("TeamTemplateDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists templates in company order with corner ordinals", async () => {
    render(<TeamTemplateDrawer open onClose={() => {}} onCreated={() => {}} />);
    await waitFor(() => expect(screen.getByText("总经办")).toBeInTheDocument());
    const officeCard = screen
      .getByText("总经办")
      .closest("div[class*=templateCard]");
    const financeCard = screen
      .getByText("财务部")
      .closest("div[class*=templateCard]");
    // Company order: general-office (001) before finance (003).
    expect(officeCard).toHaveTextContent("001");
    expect(financeCard).toHaveTextContent("003");
    expect(officeCard!.compareDocumentPosition(financeCard!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
