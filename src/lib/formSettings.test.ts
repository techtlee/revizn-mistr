import { describe, expect, it } from "vitest";
import { mergePinnedDefaultsIntoForm, parseFormSettingsJson } from "./formSettings";

describe("parseFormSettingsJson", () => {
  it("returns defaults for invalid input", () => {
    const d = parseFormSettingsJson(null);
    expect(d.savedCompanies).toEqual([]);
    expect(d.pinnedDefaults).toEqual({});
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
