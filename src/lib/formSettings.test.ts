import { describe, expect, it } from "vitest";
import { mergePinnedDefaultsIntoForm, parsePinnedDefaultsJson } from "./formSettings";

describe("parsePinnedDefaultsJson", () => {
  it("returns empty object for invalid input", () => {
    const d = parsePinnedDefaultsJson(null);
    expect(d).toEqual({});
  });
});

describe("mergePinnedDefaultsIntoForm", () => {
  it("merges only defined pinned keys", () => {
    const base = {
      typ_revize: "pravidelná" as const,
      trida_lps: "III" as const,
      revizni_technik: null,
    };
    const out = mergePinnedDefaultsIntoForm(base, {
      revizni_technik: "Jan Test",
      typ_revize: "mimořádná",
    });
    expect(out.revizni_technik).toBe("Jan Test");
    expect(out.typ_revize).toBe("mimořádná");
    expect(out.trida_lps).toBe("III");
  });
});
