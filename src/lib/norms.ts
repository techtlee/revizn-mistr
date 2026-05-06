import type { Tables } from "@/integrations/supabase/types";

export type Norm = Tables<"norms">;
export type ReportNorm = Tables<"report_norms">;

export type NormCategory = "newest" | "current" | "old";

export interface NormsByCategory {
  newest: Norm[];
  current: Norm[];
  old: Norm[];
}

export const CATEGORY_ORDER: NormCategory[] = ["newest", "current", "old"];

export function groupNormsByCategory(norms: Norm[]): NormsByCategory {
  return {
    newest: norms.filter((n) => n.category === "newest").sort((a, b) => a.sort_order - b.sort_order),
    current: norms.filter((n) => n.category === "current").sort((a, b) => a.sort_order - b.sort_order),
    old: norms.filter((n) => n.category === "old").sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function getCategoryLabel(category: NormCategory): string {
  switch (category) {
    case "newest":
      return "Nejnovější normy";
    case "current":
      return "Normy stále platné, ale budou končit";
    case "old":
      return "Předchozí staré normy";
  }
}

export function transformNormReference(reference: string, category: NormCategory | null): string {
  if (!category || category === "old") {
    return reference;
  }

  if (category === "newest") {
    return reference
      .replace(/ČSN EN 62305[–-](\d)/g, "ČSN EN IEC 62305-$1 ed.3")
      .replace(/ČSN EN 62305-(\d)/g, "ČSN EN IEC 62305-$1 ed.3")
      .replace(/ČSN 33 2000-5-54 ed\.2/g, "ČSN 33 2000-5-54 ed.3");
  }

  if (category === "current") {
    return reference
      .replace(/ČSN EN 62305[–-](\d)/g, "ČSN EN 62305-$1 ed.2")
      .replace(/ČSN EN 62305-(\d)/g, "ČSN EN 62305-$1 ed.2");
  }

  return reference;
}
