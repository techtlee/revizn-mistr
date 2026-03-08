import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Tables } from "@/integrations/supabase/types";

type Report = Tables<"inspection_reports">;
type Standard = Tables<"report_standards">;
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;

function s(val: string | null | undefined): string {
  return val || "—";
}

function sNum(val: number | null | undefined): string {
  return val != null ? String(val) : "—";
}

function sDate(val: string | null | undefined): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

function tags(items: string[]): string {
  return items.map((v) => `<span class="tag">${v}</span>`).join("");
}

function field(label: string, value: string, full = false): string {
  return `<div class="field${full ? " field-full" : ""}"><div class="fl">${label}</div><div class="fv">${value}</div></div>`;
}

async function renderAnnotationsToDataUrl(json: string): Promise<string | null> {
  try {
    const data = JSON.parse(json);
    if (!data.objects || data.objects.length === 0) return null;

    const w = data.width || 800;
    const h = data.height || 400;

    const { Canvas } = await import("fabric");
    const canvasEl = document.createElement("canvas");
    canvasEl.width = w;
    canvasEl.height = h;
    canvasEl.style.cssText = "position:fixed;left:-10000px;top:0;";
    document.body.appendChild(canvasEl);

    const fc = new Canvas(canvasEl, {
      width: w,
      height: h,
      backgroundColor: "transparent",
    });

    await fc.loadFromJSON(json);
    fc.renderAll();

    const dataUrl = canvasEl.toDataURL("image/png");
    fc.dispose();
    document.body.removeChild(canvasEl);
    return dataUrl;
  } catch {
    return null;
  }
}

function buildHTML(
  report: Report,
  standards: Standard[],
  instruments: Instrument[],
  measurements: Measurement[],
  annotationsDataUrl?: string | null
): string {
  const posudekClass = report.celkovy_posudek?.includes("schopná")
    ? "posudek-ok"
    : report.celkovy_posudek?.includes("opravu")
      ? "posudek-warn"
      : "posudek-bad";

  return `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .page {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111;
    line-height: 1.45;
    padding: 56px;
    background: #fff;
    width: 794px;
  }
  h1 { font-size: 15pt; font-weight: bold; color: #1a3a5c; text-align: center; margin-bottom: 3px; }
  .subtitle { text-align: center; color: #666; font-size: 8.5pt; margin-bottom: 22px; }
  .sec { margin-bottom: 14px; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
  .st { background: #1a3a5c; color: #fff; padding: 5px 10px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .sb { padding: 8px 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 18px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px 18px; }
  .field { margin-bottom: 3px; }
  .fl { font-size: 7.5pt; color: #666; font-weight: bold; }
  .fv { font-size: 9.5pt; border-bottom: 1px solid #ddd; padding-bottom: 2px; min-height: 16px; word-break: break-word; }
  .field-full { grid-column: 1 / -1; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4px; }
  th { background: #e8edf2; text-align: left; padding: 4px 6px; font-size: 8pt; border: 1px solid #ccc; }
  td { padding: 3px 6px; border: 1px solid #ddd; }
  .sig-area { border: 1px solid #ccc; height: 56px; border-radius: 4px; background: #fafafa; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 8.5pt; margin-top: 4px; }
  .sig-img { max-height: 56px; max-width: 180px; margin-top: 4px; }
  .posudek { font-weight: bold; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; font-size: 9.5pt; }
  .posudek-ok { background: #d1fae5; color: #065f46; }
  .posudek-warn { background: #fef3c7; color: #92400e; }
  .posudek-bad { background: #fee2e2; color: #991b1b; }
  .tag { display: inline-block; background: #e8edf2; border: 1px solid #c5cfd8; border-radius: 3px; padding: 1px 6px; font-size: 8pt; margin: 1px 2px; }
</style>
<div class="page">
  <h1>REVIZNÍ ZPRÁVA – SOUSTAVA HROMOSVODU LPS</h1>
  <div class="subtitle">Lightning Protection System – Inspection Report</div>

  <div class="sec">
    <div class="st">1. Identifikace revize</div>
    <div class="sb"><div class="grid">
      ${field("Číslo revize", s(report.cislo_revize))}
      ${field("Druh revize", s(report.druh_revize))}
      ${field("Datum provedení revize", sDate(report.datum_provedeni))}
      ${field("Datum ukončení revize", sDate(report.datum_ukonceni))}
      ${field("Datum vystavení zprávy", sDate(report.datum_vystaveni))}
      ${field("Revizní technik", s(report.revizni_technik))}
      ${field("Evidenční číslo", s(report.evidencni_cislo))}
      ${field("Telefon technika", s(report.telefon_technika))}
      ${field("Adresa revizního technika", s(report.adresa_technika), true)}
    </div></div>
  </div>

  ${standards.length > 0 ? `
  <div class="sec">
    <div class="st">2. Normy</div>
    <div class="sb">${tags(standards.map((st) => st.norma))}</div>
  </div>` : ""}

  <div class="sec">
    <div class="st">3. Identifikace objektu</div>
    <div class="sb"><div class="grid">
      ${field("Objednavatel", s(report.objednavatel))}
      ${field("Název objektu", s(report.nazev_objektu))}
      ${field("Adresa objektu", s(report.adresa_objektu), true)}
      ${field("Montážní firma / zřizovatel", s(report.montazni_firma))}
      ${field("Telefon montážní firmy", s(report.telefon_montazni_firmy))}
    </div>
    ${report.katastr_map_url ? `<div style="margin-top:10px"><div class="fl">Katastrální mapa</div><div style="position:relative;margin-top:4px;border:1px solid #ccc;border-radius:4px;overflow:hidden"><img src="${report.katastr_map_url}" style="width:100%;display:block" alt="Katastrální mapa"/>${annotationsDataUrl ? `<img src="${annotationsDataUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none" alt=""/>` : ""}</div></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">4. Rozsah revize</div>
    <div class="sb">
      ${field("Rozsah revize", s(report.rozsah_revize), true)}
      ${(report.soucast_revize_neni?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:6px"><div class="fl">Součástí revize není</div><div style="margin-top:2px">${tags(report.soucast_revize_neni!)}</div></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">5. Základní údaje o objektu</div>
    <div class="sb"><div class="grid-3">
      ${field("Budova", s(report.budova))}
      ${field("Typ střechy", s(report.typ_strechy))}
      ${field("Krytina střechy", s(report.krytina_strechy))}
      ${field("Třída LPS", s(report.trida_lps))}
      ${field("Typ jímací soustavy", s(report.typ_jimaci_soustavy))}
      ${field("Druh zeminy", s(report.druh_zeminy))}
      ${field("Počet tyčových jímačů", sNum(report.pocet_tycovych_jimacu))}
      ${field("Počet pomocných jímačů", sNum(report.pocet_pomocnych_jimacu))}
      ${field("Počet svodů", sNum(report.pocet_svodu))}
      ${field("Povětrnostní podmínky", s(report.poveternostni_podminky))}
      ${field("Počasí během revize", s(report.pocasi_behem_revize))}
      ${field("Zóna LPZ", s(report.zona_ochrany_lpz))}
      ${field("El. zařízení na střeše", (report.elektricka_zarizeni_na_strese ? "Ano" : "Ne") + (report.elektricka_zarizeni_popis ? " – " + report.elektricka_zarizeni_popis : ""), true)}
    </div></div>
  </div>

  <div class="sec">
    <div class="st">6. Údaje o dokumentu</div>
    <div class="sb"><div class="grid">
      ${field("Počet stran zprávy", sNum(report.pocet_stran))}
      ${field("Počet vyhotovených zpráv", sNum(report.pocet_vyhotoveni))}
      ${field("Rozdělovník", s(report.rozdelovnik), true)}
    </div></div>
  </div>

  ${instruments.length > 0 ? `
  <div class="sec">
    <div class="st">7. Použité měřicí přístroje</div>
    <div class="sb">
      <table>
        <thead><tr><th>Název přístroje</th><th>Typ přístroje</th><th>Výrobní číslo</th><th>Číslo kalibrace</th></tr></thead>
        <tbody>${instruments.map((i) => `<tr><td>${s(i.nazev_pristroje)}</td><td>${s(i.typ_pristroje)}</td><td>${s(i.vyrobni_cislo)}</td><td>${s(i.cislo_kalibrace)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </div>` : ""}

  <div class="sec">
    <div class="st">8. Předmět revize</div>
    <div class="sb">
      ${field("Předmět revize", s(report.predmet_revize), true)}
      ${(report.oblasti_kontroly?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:6px"><div class="fl">Oblasti kontroly</div><div style="margin-top:2px">${tags(report.oblasti_kontroly!)}</div></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">9. Podklady pro revizi</div>
    <div class="sb">
      ${(report.podklad_revize?.length ?? 0) > 0 ? `<div class="field"><div class="fl">Podklad revize</div><div style="margin-top:2px">${tags(report.podklad_revize!)}</div></div>` : ""}
      ${field("Projektová dokumentace předložena", report.projektova_dokumentace ? "Ano" : "Ne")}
      ${field("Poznámka", s(report.poznamka), true)}
    </div>
  </div>

  <div class="sec">
    <div class="st">10. Technický popis zařízení</div>
    <div class="sb">
      ${field("Technický popis zařízení", s(report.technicky_popis), true)}
      <div class="grid" style="margin-top:6px">
        ${field("Vzdálenost mezi svody", s(report.vzdalenost_svodu))}
        ${field("Typ uzemňovací soustavy", s(report.typ_uzemnovaci_soustavy))}
        ${field("Ekvipotenciální pospojení", s(report.ekvipotencialni_pospojeni), true)}
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="st">11. Měření zemních odporů</div>
    <div class="sb">
      ${measurements.length > 0 ? `
      <table>
        <thead><tr><th>Označení svodu</th><th>Odpor zemniče (Ω)</th></tr></thead>
        <tbody>${measurements.map((m) => `<tr><td>${s(m.oznaceni_svodu)}</td><td>${m.odpor_zemnice != null ? m.odpor_zemnice : "—"}</td></tr>`).join("")}</tbody>
      </table>` : ""}
      <div style="margin-top:8px">${field("Přechodový odpor spojů", s(report.prechodovy_odpor))}</div>
    </div>
  </div>

  <div class="sec">
    <div class="st">12. Zjištěné závady</div>
    <div class="sb">
      ${field("Byly zjištěny závady", report.byly_zjisteny_zavady ? "Ano" : "Ne")}
      ${report.byly_zjisteny_zavady ? field("Popis závad", s(report.popis_zavad), true) : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">13. Závěr revize</div>
    <div class="sb">
      ${field("Závěr revize", s(report.zaver_revize), true)}
      ${report.celkovy_posudek ? `<div style="margin-top:8px"><div class="fl">Celkový posudek</div><div class="posudek ${posudekClass}">${report.celkovy_posudek}</div></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">14. Podpisy</div>
    <div class="sb"><div class="grid">
      <div class="field">
        <div class="fl">Podpis objednavatele</div>
        ${report.podpis_objednavatele ? `<img src="${report.podpis_objednavatele}" class="sig-img" alt="Podpis"/>` : '<div class="sig-area">Podpis</div>'}
      </div>
      <div class="field">
        <div class="fl">Podpis revizního technika</div>
        ${report.podpis_technika ? `<img src="${report.podpis_technika}" class="sig-img" alt="Podpis"/>` : '<div class="sig-area">Podpis</div>'}
      </div>
      ${report.razitko_url ? `<div class="field"><div class="fl">Razítko</div><img src="${report.razitko_url}" style="max-height:70px;max-width:140px;margin-top:4px" alt="Razítko"/></div>` : ""}
    </div></div>
  </div>

  <div class="sec">
    <div class="st">15. Termín další revize</div>
    <div class="sb"><div class="grid">
      ${field("Termín další revize", sDate(report.termin_dalsi_revize))}
      ${field("Termín vizuální kontroly", sDate(report.termin_vizualni_kontroly))}
    </div></div>
  </div>
</div>`;
}

export async function generatePDF(
  report: Report,
  standards: Standard[],
  instruments: Instrument[],
  measurements: Measurement[]
): Promise<void> {
  let annotationsDataUrl: string | null = null;
  if (report.katastr_annotations) {
    annotationsDataUrl = await renderAnnotationsToDataUrl(report.katastr_annotations);
  }

  const html = buildHTML(report, standards, instruments, measurements, annotationsDataUrl);

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-10000px;top:0;";
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const element = wrapper.querySelector(".page") as HTMLElement;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const name = (report.cislo_revize || "navrh").replace(/[/\\]/g, "-");
    pdf.save(`revizni-zprava-${name}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}
