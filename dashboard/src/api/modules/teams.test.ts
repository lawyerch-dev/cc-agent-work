import { describe, expect, it, vi } from "vitest";
import { teamsApi } from "./teams";
import { request } from "../request";

vi.mock("../request", () => ({ request: vi.fn().mockResolvedValue([]) }));

describe("teamsApi templates", () => {
  it("lists templates", async () => {
    await teamsApi.listTemplates();
    expect(request).toHaveBeenCalledWith("/team-templates");
  });

  it("creates from template", async () => {
    await teamsApi.createFromTemplate("finance");
    expect(request).toHaveBeenCalledWith(
      "/teams/from-template/finance",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("seeds defaults", async () => {
    await teamsApi.seedDefaults();
    expect(request).toHaveBeenCalledWith(
      "/teams/seed-defaults",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
