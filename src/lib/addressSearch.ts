/** OpenStreetMap Nominatim — tlačítko „Najít na mapě“ (KatastrMap). */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimRow = { lat: string; lon: string };

async function fetchNominatim(
  params: URLSearchParams,
  signal?: AbortSignal
): Promise<NominatimRow[] | null> {
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { "Accept-Language": "cs" },
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("json")) return null;
  try {
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data as NominatimRow[];
  } catch {
    return null;
  }
}

export type CzechAddressParts = {
  adresa_ulice: string | null | undefined;
  adresa_obec: string | null | undefined;
  adresa_psc?: string | null;
};

/**
 * Geokódování z dílčích polí — několik strategií (volný dotaz „ulice, obec“ často u českých ulic selže).
 */
export async function geocodeCzechAddressParts(
  parts: CzechAddressParts,
  opts?: { signal?: AbortSignal }
): Promise<[number, number] | null> {
  const street = (parts.adresa_ulice || "").trim();
  const city = (parts.adresa_obec || "").trim();
  if (!street || !city) return null;

  const pscRaw = (parts.adresa_psc || "").replace(/\s/g, "").trim();
  const hasPsc = /^\d{5}$/.test(pscRaw);

  const strategies: URLSearchParams[] = [
    new URLSearchParams({
      street,
      city,
      countrycodes: "cz",
      format: "json",
      limit: "5",
    }),
    ...(hasPsc
      ? [
          new URLSearchParams({
            street,
            city,
            postalcode: pscRaw,
            countrycodes: "cz",
            format: "json",
            limit: "5",
          }),
        ]
      : []),
    new URLSearchParams({
      q: `${street}, ${city}`,
      countrycodes: "cz",
      format: "json",
      limit: "5",
    }),
    new URLSearchParams({
      q: `${street} ${city}`,
      countrycodes: "cz",
      format: "json",
      limit: "5",
    }),
    new URLSearchParams({
      q: `${city}, ${street}`,
      countrycodes: "cz",
      format: "json",
      limit: "5",
    }),
  ];

  for (const params of strategies) {
    const rows = await fetchNominatim(params, opts?.signal);
    if (rows?.length) {
      return [parseFloat(rows[0].lat), parseFloat(rows[0].lon)];
    }
  }
  return null;
}

/** Z jednoho řetězce (např. starší volání) — zkusí rozdělit na ulici / zbytek. */
export async function geocodeAddress(
  address: string,
  opts?: { signal?: AbortSignal }
): Promise<[number, number] | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const comma = trimmed.indexOf(",");
  if (comma > 0) {
    const street = trimmed.slice(0, comma).trim();
    const rest = trimmed.slice(comma + 1).trim();
    if (street && rest) {
      const fromParts = await geocodeCzechAddressParts(
        { adresa_ulice: street, adresa_obec: rest },
        opts
      );
      if (fromParts) return fromParts;
    }
  }

  const rows = await fetchNominatim(
    new URLSearchParams({
      q: trimmed,
      countrycodes: "cz",
      format: "json",
      limit: "5",
    }),
    opts?.signal
  );
  if (!rows?.length) return null;
  return [parseFloat(rows[0].lat), parseFloat(rows[0].lon)];
}
