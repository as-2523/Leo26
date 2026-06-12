import { describe, expect, it } from "vitest";
import { normalizeFormat } from "../formats";

describe("normalizeFormat", () => {
  it("maps international formats", () => {
    expect(normalizeFormat("TEST")).toBe("Test");
    expect(normalizeFormat("odi")).toBe("ODI");
    expect(normalizeFormat("T20I")).toBe("T20");
    expect(normalizeFormat("t20")).toBe("T20");
  });

  it("maps women's format labels to the shared buckets", () => {
    expect(normalizeFormat("WODI")).toBe("ODI");
    expect(normalizeFormat("WT20I")).toBe("T20");
    expect(normalizeFormat("WTEST")).toBe("Test");
  });

  it("maps domestic formats", () => {
    expect(normalizeFormat("FC")).toBe("First-class");
    expect(normalizeFormat("FIRST_CLASS")).toBe("First-class");
    expect(normalizeFormat("LIST_A")).toBe("List A");
    expect(normalizeFormat("List A")).toBe("List A");
  });

  it("maps youth formats", () => {
    expect(normalizeFormat("YOUTH_ODI")).toBe("Youth");
    expect(normalizeFormat("U19 Test")).toBe("Youth");
  });

  it("falls back to Other for unknown or missing labels", () => {
    expect(normalizeFormat("THE_HUNDRED")).toBe("Other");
    expect(normalizeFormat("")).toBe("Other");
    expect(normalizeFormat(undefined)).toBe("Other");
  });
});
