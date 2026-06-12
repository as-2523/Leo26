import { describe, expect, it } from "vitest";
import { matchTrackedTeam } from "../teams";

describe("matchTrackedTeam", () => {
  it("matches each tracked team by canonical name", () => {
    expect(matchTrackedTeam("India")?.id).toBe("india-men");
    expect(matchTrackedTeam("India A")?.id).toBe("india-a-men");
    expect(matchTrackedTeam("India Under-19")?.id).toBe("india-u19-men");
    expect(matchTrackedTeam("India Women")?.id).toBe("india-women");
    expect(matchTrackedTeam("India A Women")?.id).toBe("india-a-women");
  });

  it("is exact-match, so 'India' never swallows related sides", () => {
    expect(matchTrackedTeam("India A")?.id).not.toBe("india-men");
    expect(matchTrackedTeam("India Women")?.id).not.toBe("india-men");
    expect(matchTrackedTeam("Board President's XI")).toBeNull();
    expect(matchTrackedTeam("England")).toBeNull();
  });

  it("normalizes case and whitespace", () => {
    expect(matchTrackedTeam("  INDIA  WOMEN ")?.id).toBe("india-women");
    expect(matchTrackedTeam("india u19")?.id).toBe("india-u19-men");
  });

  it("handles empty input", () => {
    expect(matchTrackedTeam("")).toBeNull();
    expect(matchTrackedTeam(undefined)).toBeNull();
    expect(matchTrackedTeam(null)).toBeNull();
  });
});
