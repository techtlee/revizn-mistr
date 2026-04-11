import { describe, expect, it } from "vitest";
import {
  formatObjektAdresaOneLine,
  buildGeocodeQuery,
  objectAddressSearchText,
} from "./objectAddress";

describe("formatObjektAdresaOneLine", () => {
  it("skládá český tvar ulice, PSČ a obec", () => {
    expect(
      formatObjektAdresaOneLine({
        adresa_ulice: "Luční 12",
        adresa_psc: "60200",
        adresa_obec: "Brno",
        adresa_doplnek: null,
      })
    ).toBe("Luční 12, 60200 Brno");
  });

  it("přidá doplňující údaje", () => {
    expect(
      formatObjektAdresaOneLine({
        adresa_ulice: "A",
        adresa_obec: "B",
        adresa_psc: null,
        adresa_doplnek: "část obce: X",
      })
    ).toBe("A, B, část obce: X");
  });
});

describe("buildGeocodeQuery", () => {
  it("spojí ulici a obec", () => {
    expect(
      buildGeocodeQuery({
        adresa_ulice: "Luční 12",
        adresa_obec: "Brno",
        adresa_psc: "60200",
      })
    ).toBe("Luční 12, 60200 Brno");
  });

  it("normalizuje mezery v PSČ", () => {
    expect(
      buildGeocodeQuery({
        adresa_ulice: "Luční 12",
        adresa_obec: "Brno",
        adresa_psc: "602 00",
      })
    ).toBe("Luční 12, 60200 Brno");
  });
});

describe("objectAddressSearchText", () => {
  it("spojí dílčí řetězce pro vyhledávání", () => {
    expect(
      objectAddressSearchText({
        adresa_ulice: "Luční",
        adresa_obec: "Brno",
        adresa_psc: "60200",
        adresa_doplnek: "",
      }).includes("brno")
    ).toBe(true);
  });
});
