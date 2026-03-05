import type { Tables } from "@/integrations/supabase/types";

type Report = Tables<"inspection_reports">;
type Standard = Tables<"report_standards">;
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;

function safeStr(val: string | null | undefined): string {
  return val || "—";
}

function safeDate(val: string | null | undefined): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

export function generatePDF(
  report: Report,
  standards: Standard[],
  instruments: Instrument[],
  measurements: Measurement[]
) {
  // Build HTML content for print
  const html = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8"/>
  <title>Revizní zpráva LPS – ${report.cislo_revize || "bez čísla"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; line-height: 1.4; }
    .page { max-width: 210mm; margin: 0 auto; padding: 15mm; }
    h1 { font-size: 16pt; font-weight: bold; color: #1a3a5c; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #555; font-size: 9pt; margin-bottom: 20px; }
    .section { margin-bottom: 16px; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; page-break-inside: avoid; }
    .section-title { background: #1a3a5c; color: #fff; padding: 5px 10px; font-weight: bold; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; }
    .section-body { padding: 8px 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 20px; }
    .field { margin-bottom: 4px; }
    .field-label { font-size: 8pt; color: #666; font-weight: bold; }
    .field-value { font-size: 10pt; border-bottom: 1px solid #ddd; padding-bottom: 2px; min-height: 18px; }
    .field-full { grid-column: 1 / -1; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4px; }
    th { background: #e8edf2; text-align: left; padding: 4px 6px; font-size: 8pt; border: 1px solid #ccc; }
    td { padding: 3px 6px; border: 1px solid #ddd; }
    .sig-area { border: 1px solid #ccc; height: 60px; border-radius: 4px; background: #fafafa; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 9pt; margin-top: 4px; }
    .sig-img { max-height: 60px; max-width: 200px; }
    .posudek { font-weight: bold; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    .posudek-ok { background: #d1fae5; color: #065f46; }
    .posudek-warn { background: #fef3c7; color: #92400e; }
    .posudek-bad { background: #fee2e2; color: #991b1b; }
    .tag { display: inline-block; background: #e8edf2; border: 1px solid #c5cfd8; border-radius: 3px; padding: 1px 6px; font-size: 8pt; margin: 1px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <h1>⚡ REVIZNÍ ZPRÁVA – SOUSTAVA HROMOSVODU LPS</h1>
  <div class="subtitle">Lightning Protection System – Inspection Report</div>

  <!-- Section 1 -->
  <div class="section">
    <div class="section-title">1. Identifikace revize</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><div class="field-label">Číslo revize</div><div class="field-value">${safeStr(report.cislo_revize)}</div></div>
        <div class="field"><div class="field-label">Druh revize</div><div class="field-value">${safeStr(report.druh_revize)}</div></div>
        <div class="field"><div class="field-label">Datum provedení revize</div><div class="field-value">${safeDate(report.datum_provedeni)}</div></div>
        <div class="field"><div class="field-label">Datum ukončení revize</div><div class="field-value">${safeDate(report.datum_ukonceni)}</div></div>
        <div class="field"><div class="field-label">Datum vystavení zprávy</div><div class="field-value">${safeDate(report.datum_vystaveni)}</div></div>
        <div class="field"><div class="field-label">Revizní technik</div><div class="field-value">${safeStr(report.revizni_technik)}</div></div>
        <div class="field"><div class="field-label">Evidenční číslo</div><div class="field-value">${safeStr(report.evidencni_cislo)}</div></div>
        <div class="field"><div class="field-label">Telefon technika</div><div class="field-value">${safeStr(report.telefon_technika)}</div></div>
        <div class="field field-full"><div class="field-label">Adresa revizního technika</div><div class="field-value">${safeStr(report.adresa_technika)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 2 -->
  ${standards.length > 0 ? `
  <div class="section">
    <div class="section-title">2. Normy</div>
    <div class="section-body">
      ${standards.map(s => `<div class="tag">${s.norma}</div>`).join("")}
    </div>
  </div>
  ` : ""}

  <!-- Section 3 -->
  <div class="section">
    <div class="section-title">3. Identifikace objektu</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><div class="field-label">Objednavatel</div><div class="field-value">${safeStr(report.objednavatel)}</div></div>
        <div class="field"><div class="field-label">Název objektu</div><div class="field-value">${safeStr(report.nazev_objektu)}</div></div>
        <div class="field field-full"><div class="field-label">Adresa objektu</div><div class="field-value">${safeStr(report.adresa_objektu)}</div></div>
        <div class="field"><div class="field-label">Montážní firma / zřizovatel</div><div class="field-value">${safeStr(report.montazni_firma)}</div></div>
        <div class="field"><div class="field-label">Telefon montážní firmy</div><div class="field-value">${safeStr(report.telefon_montazni_firmy)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 4 -->
  <div class="section">
    <div class="section-title">4. Rozsah revize</div>
    <div class="section-body">
      <div class="field field-full"><div class="field-label">Rozsah revize</div><div class="field-value">${safeStr(report.rozsah_revize)}</div></div>
      ${report.soucast_revize_neni?.length ? `<div class="field field-full" style="margin-top:6px"><div class="field-label">Součástí revize není</div><div style="margin-top:2px">${report.soucast_revize_neni.map(v => `<span class="tag">${v}</span>`).join("")}</div></div>` : ""}
    </div>
  </div>

  <!-- Section 5 -->
  <div class="section">
    <div class="section-title">5. Základní údaje o objektu</div>
    <div class="section-body">
      <div class="grid-3">
        <div class="field"><div class="field-label">Budova</div><div class="field-value">${safeStr(report.budova)}</div></div>
        <div class="field"><div class="field-label">Typ střechy</div><div class="field-value">${safeStr(report.typ_strechy)}</div></div>
        <div class="field"><div class="field-label">Krytina střechy</div><div class="field-value">${safeStr(report.krytina_strechy)}</div></div>
        <div class="field"><div class="field-label">Třída LPS</div><div class="field-value">${safeStr(report.trida_lps)}</div></div>
        <div class="field"><div class="field-label">Typ jímací soustavy</div><div class="field-value">${safeStr(report.typ_jimaci_soustavy)}</div></div>
        <div class="field"><div class="field-label">Druh zeminy</div><div class="field-value">${safeStr(report.druh_zeminy)}</div></div>
        <div class="field"><div class="field-label">Počet tyčových jímačů</div><div class="field-value">${safeStr(String(report.pocet_tycovych_jimacu))}</div></div>
        <div class="field"><div class="field-label">Počet pomocných jímačů</div><div class="field-value">${safeStr(String(report.pocet_pomocnych_jimacu))}</div></div>
        <div class="field"><div class="field-label">Počet svodů</div><div class="field-value">${safeStr(String(report.pocet_svodu))}</div></div>
        <div class="field"><div class="field-label">Povětrnostní podmínky</div><div class="field-value">${safeStr(report.poveternostni_podminky)}</div></div>
        <div class="field"><div class="field-label">Počasí během revize</div><div class="field-value">${safeStr(report.pocasi_behem_revize)}</div></div>
        <div class="field"><div class="field-label">Zóna LPZ</div><div class="field-value">${safeStr(report.zona_ochrany_lpz)}</div></div>
        <div class="field"><div class="field-label">El. zařízení na střeše</div><div class="field-value">${report.elektricka_zarizeni_na_strese ? "Ano" : "Ne"}${report.elektricka_zarizeni_popis ? " – " + report.elektricka_zarizeni_popis : ""}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 6 -->
  <div class="section">
    <div class="section-title">6. Údaje o dokumentu</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><div class="field-label">Počet stran zprávy</div><div class="field-value">${safeStr(String(report.pocet_stran))}</div></div>
        <div class="field"><div class="field-label">Počet vyhotovených zpráv</div><div class="field-value">${safeStr(String(report.pocet_vyhotoveni))}</div></div>
        <div class="field field-full"><div class="field-label">Rozdělovník</div><div class="field-value">${safeStr(report.rozdelovnik)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 7 -->
  ${instruments.length > 0 ? `
  <div class="section">
    <div class="section-title">7. Použité měřicí přístroje</div>
    <div class="section-body">
      <table>
        <thead><tr><th>Název přístroje</th><th>Typ přístroje</th><th>Výrobní číslo</th><th>Číslo kalibrace</th></tr></thead>
        <tbody>
          ${instruments.map(i => `<tr><td>${i.nazev_pristroje || "—"}</td><td>${i.typ_pristroje || "—"}</td><td>${i.vyrobni_cislo || "—"}</td><td>${i.cislo_kalibrace || "—"}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>
  ` : ""}

  <!-- Section 8 -->
  <div class="section">
    <div class="section-title">8. Předmět revize</div>
    <div class="section-body">
      <div class="field field-full"><div class="field-label">Předmět revize</div><div class="field-value">${safeStr(report.predmet_revize)}</div></div>
      ${report.oblasti_kontroly?.length ? `<div class="field field-full" style="margin-top:6px"><div class="field-label">Oblasti kontroly</div><div style="margin-top:2px">${report.oblasti_kontroly.map(v => `<span class="tag">${v}</span>`).join("")}</div></div>` : ""}
    </div>
  </div>

  <!-- Section 9 -->
  <div class="section">
    <div class="section-title">9. Podklady pro revizi</div>
    <div class="section-body">
      ${report.podklad_revize?.length ? `<div class="field"><div class="field-label">Podklad revize</div><div style="margin-top:2px">${report.podklad_revize.map(v => `<span class="tag">${v}</span>`).join("")}</div></div>` : ""}
      <div class="grid" style="margin-top:6px">
        <div class="field"><div class="field-label">Projektová dokumentace předložena</div><div class="field-value">${report.projektova_dokumentace ? "Ano" : "Ne"}</div></div>
        <div class="field field-full"><div class="field-label">Poznámka</div><div class="field-value">${safeStr(report.poznamka)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 10 -->
  <div class="section">
    <div class="section-title">10. Technický popis zařízení</div>
    <div class="section-body">
      <div class="field field-full"><div class="field-label">Technický popis zařízení</div><div class="field-value">${safeStr(report.technicky_popis)}</div></div>
      <div class="grid" style="margin-top:6px">
        <div class="field"><div class="field-label">Vzdálenost mezi svody</div><div class="field-value">${safeStr(report.vzdalenost_svodu)}</div></div>
        <div class="field"><div class="field-label">Typ uzemňovací soustavy</div><div class="field-value">${safeStr(report.typ_uzemnovaci_soustavy)}</div></div>
        <div class="field field-full"><div class="field-label">Ekvipotenciální pospojení</div><div class="field-value">${safeStr(report.ekvipotencialni_pospojeni)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 11 -->
  <div class="section">
    <div class="section-title">11. Měření zemních odporů</div>
    <div class="section-body">
      ${measurements.length > 0 ? `
      <table>
        <thead><tr><th>Označení svodu</th><th>Odpor zemniče (Ω)</th></tr></thead>
        <tbody>
          ${measurements.map(m => `<tr><td>${m.oznaceni_svodu || "—"}</td><td>${m.odpor_zemnice != null ? m.odpor_zemnice : "—"}</td></tr>`).join("")}
        </tbody>
      </table>
      ` : ""}
      <div class="field" style="margin-top:8px"><div class="field-label">Přechodový odpor spojů</div><div class="field-value">${safeStr(report.prechodovy_odpor)}</div></div>
    </div>
  </div>

  <!-- Section 12 -->
  <div class="section">
    <div class="section-title">12. Zjištěné závady</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><div class="field-label">Byly zjištěny závady</div><div class="field-value">${report.byly_zjisteny_zavady ? "Ano" : "Ne"}</div></div>
        <div class="field field-full"><div class="field-label">Popis závad</div><div class="field-value">${safeStr(report.popis_zavad)}</div></div>
      </div>
    </div>
  </div>

  <!-- Section 13 -->
  <div class="section">
    <div class="section-title">13. Závěr revize</div>
    <div class="section-body">
      <div class="field field-full"><div class="field-label">Závěr revize</div><div class="field-value">${safeStr(report.zaver_revize)}</div></div>
      ${report.celkovy_posudek ? `
      <div style="margin-top:8px">
        <div class="field-label">Celkový posudek</div>
        <div class="posudek ${report.celkovy_posudek === "Soustava hromosvodu je schopná bezpečného provozu" ? "posudek-ok" : report.celkovy_posudek === "Soustava vyžaduje opravu" ? "posudek-warn" : "posudek-bad"}">
          ${report.celkovy_posudek}
        </div>
      </div>
      ` : ""}
    </div>
  </div>

  <!-- Section 14 -->
  <div class="section">
    <div class="section-title">14. Podpisy</div>
    <div class="section-body">
      <div class="grid">
        <div class="field">
          <div class="field-label">Podpis objednavatele</div>
          ${report.podpis_objednavatele ? `<img src="${report.podpis_objednavatele}" class="sig-img" alt="Podpis objednavatele"/>` : '<div class="sig-area">Podpis</div>'}
        </div>
        <div class="field">
          <div class="field-label">Podpis revizního technika</div>
          ${report.podpis_technika ? `<img src="${report.podpis_technika}" class="sig-img" alt="Podpis technika"/>` : '<div class="sig-area">Podpis</div>'}
        </div>
        ${report.razitko_url ? `<div class="field"><div class="field-label">Razítko</div><img src="${report.razitko_url}" style="max-height:80px;max-width:150px;margin-top:4px" alt="Razítko"/></div>` : ""}
      </div>
    </div>
  </div>

  <!-- Section 15 -->
  <div class="section">
    <div class="section-title">15. Termín další revize</div>
    <div class="section-body">
      <div class="grid">
        <div class="field"><div class="field-label">Termín další revize</div><div class="field-value">${safeDate(report.termin_dalsi_revize)}</div></div>
        <div class="field"><div class="field-label">Termín vizuální kontroly</div><div class="field-value">${safeDate(report.termin_vizualni_kontroly)}</div></div>
      </div>
    </div>
  </div>

</div>
</body>
</html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}
