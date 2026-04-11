import type { Tables } from "@/integrations/supabase/types";

export type ObjectAddressFields = Pick<
  Tables<"inspection_reports">,
  "adresa_ulice" | "adresa_obec" | "adresa_psc" | "adresa_doplnek"
>;

/** Jedna řádka pro tabulku / vyhledávání (PSČ + obec za sebou). */
export function formatObjektAdresaOneLine(r: Partial<ObjectAddressFields>): string {
  const ulice = r.adresa_ulice?.trim();
  const obec = r.adresa_obec?.trim();
  const psc = r.adresa_psc?.trim();
  const dopl = r.adresa_doplnek?.trim();
  const mesto = [psc, obec].filter(Boolean).join(" ");
  const parts = [ulice, mesto || undefined, dopl].filter(Boolean) as string[];
  return parts.join(", ");
}

/** PSČ bez mezer — lepší pro Nominatim („60200“ místo „602 00“ vprostřed dotazu). */
function pscCompact(psc: string | null | undefined): string {
  return (psc || "").replace(/\s/g, "").trim();
}

/** Dotaz pro geokódování (mapa „Najít“) — může zahrnout PSČ (bez mezer). */
export function buildGeocodeQuery(r: Partial<ObjectAddressFields>): string {
  const ulice = r.adresa_ulice?.trim();
  const obec = r.adresa_obec?.trim();
  const p = pscCompact(r.adresa_psc);
  if (ulice && obec) {
    return p ? `${ulice}, ${p} ${obec}` : `${ulice}, ${obec}`;
  }
  return ulice || [p, obec].filter(Boolean).join(" ") || "";
}

/** Pro filtrování — všechny dílčí řetězce dohromady. */
export function objectAddressSearchText(r: Partial<ObjectAddressFields>): string {
  return [r.adresa_ulice, r.adresa_obec, r.adresa_psc, r.adresa_doplnek]
    .map(s => (s || "").toLowerCase())
    .join(" ");
}
