import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Tables } from "@/integrations/supabase/types";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { CHECKLIST_E11, CHECKLIST_E12 } from "@/components/InspectionChecklist";

type Report = Tables<"inspection_reports">;
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;
type SpdDevice = Tables<"report_spd_devices">;

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

function checkRow(label: string, reference: string, passed: boolean): string {
  const badge = passed
    ? '<span class="badge-ok">ODPOVÍDÁ</span>'
    : '<span class="badge-na">—</span>';
  return `<tr><td style="width:40%">${label}</td><td style="width:45%" class="ref">${reference}</td><td style="width:15%;text-align:center">${badge}</td></tr>`;
}

async function renderAnnotationsToDataUrl(json: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const data = JSON.parse(json);
    if (!data.objects || data.objects.length === 0) return null;
    const w = data.width || 800;
    const h = data.height || 400;
    const { Canvas: FabricCanvas } = await import("fabric");
    const canvasEl = document.createElement("canvas");
    canvasEl.width = w;
    canvasEl.height = h;
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;left:-10000px;top:0;";
    wrapper.appendChild(canvasEl);
    document.body.appendChild(wrapper);
    const fc = new FabricCanvas(canvasEl, { width: w, height: h, backgroundColor: "transparent" });
    await fc.loadFromJSON(json);
    fc.renderAll();
    const dataUrl = fc.toDataURL({ format: "png", multiplier: 2 });
    fc.dispose();
    document.body.removeChild(wrapper);
    return { dataUrl, width: w, height: h };
  } catch {
    return null;
  }
}

function buildChecklistHTML(checklist: Record<string, boolean>, groups: typeof CHECKLIST_E11): string {
  return groups.map(g => `
    <div class="ck-group"><div class="ck-title">${g.title}</div>
    <table class="ck"><thead><tr><th>Parametr</th><th>Norma / článek</th><th>Stav</th></tr></thead>
    <tbody>${g.items.map(i => checkRow(i.label, i.reference, !!checklist[i.id])).join("")}</tbody></table></div>
  `).join("");
}

function buildHTML(
  report: Report,
  instruments: Instrument[],
  measurements: Measurement[],
  spdDevices: SpdDevice[],
  annotationResult?: { dataUrl: string; width: number; height: number } | null
): string {
  const cl = (report.inspection_checklist || {}) as Record<string, boolean>;
  const dok = (report.predlozene_doklady || {}) as Record<string, unknown>;
  const posudekClass = report.celkovy_posudek === "v souladu" ? "posudek-ok" : "posudek-bad";

  return `
<style>
  :root {
    --space-1: 4px;
    --space-2: 6px;
    --space-3: 8px;
    --space-4: 10px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .doc-flow {
    width: 794px;
  }
  .page {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111;
    line-height: 1.4;
    padding: 48px 52px;
    background: #fff;
    width: 794px;
    height: 1122px; /* A4 ratio at 794px width */
    overflow: hidden;
  }
  .page * {
    font-family: Arial, Helvetica, sans-serif !important;
  }
  h1 { font-size: 14pt; font-weight: bold; color: #004ffe; text-align: center; margin-bottom: 2px; }
  .subtitle { text-align: center; color: #555; font-size: 8pt; margin-bottom: 16px; }
  .sec { margin-bottom: var(--space-4); border: 1px solid #cfd6de; border-radius: 3px; overflow: hidden; break-inside: avoid; }
  .st { background: #004ffe; color: #fff; padding: 4px 8px; font-weight: bold; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.04em; }
  .sb { padding: var(--space-3) var(--space-4); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2) 14px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2) 14px; }
  .field { margin-bottom: 2px; break-inside: avoid; }
  .fl { font-size: 7pt; color: #666; font-weight: bold; margin-bottom: 3px; line-height: 1.15; }
  .fv { font-size: 9.5pt; line-height: 1.25; border-bottom: 1px solid #d9e0e8; padding: 3px 0 5px; min-height: 24px; overflow-wrap: anywhere; }
  .field-full { grid-column: 1 / -1; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; margin-top: 4px; line-height: 1.4; }
  th { background: #e8edf2; text-align: left; padding: 5px 6px; font-size: 8pt; border: 1px solid #cfd6de; vertical-align: middle; overflow-wrap: anywhere; }
  td { padding: 5px 6px; border: 1px solid #d9e0e8; vertical-align: middle; min-height: 22px; overflow-wrap: anywhere; }
  .sig-area { border: 1px solid #ccc; height: 50px; border-radius: 3px; background: #fafafa; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 8pt; margin-top: 3px; }
  .sig-img { max-height: 50px; max-width: 160px; margin-top: 3px; }
  .posudek { font-weight: bold; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 3px; font-size: 9pt; }
  .posudek-ok { background: #d1fae5; color: #065f46; }
  .posudek-bad { background: #fee2e2; color: #991b1b; }
  .tag { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; background: transparent; border: 0; border-radius: 0; padding: 0; min-height: 0; font-size: 8pt; line-height: 1.2; margin: 0 0 2px 0; }
  .badge-ok { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; background: transparent; color: #065f46; padding: 0; min-height: 0; border-radius: 0; font-size: 7.5pt; line-height: 1.2; font-weight: bold; }
  .badge-na { display: inline-flex; align-items: center; justify-content: center; min-height: 20px; color: #999; font-size: 8pt; line-height: 1; vertical-align: middle; }
  .ck-group { margin-bottom: var(--space-3); }
  .ck-title { font-weight: bold; font-size: 8.5pt; margin-bottom: 2px; color: #333; break-inside: avoid; }
  .ck th:last-child, .ck td:last-child { text-align: center; vertical-align: middle; }
  .ref { font-size: 7.5pt; color: #555; }
  tr { break-inside: avoid; }
</style>
<div class="doc-flow">
  <h1>ZPRÁVA O REVIZI LPS</h1>
  <div class="subtitle">Revize provedena v souladu s NV 190/2022 Sb., ČSN 33 1500 a ČSN EN 62305-1 až 4 ed.2</div>

  <div class="sec">
    <div class="st">Identifikace revize</div>
    <div class="sb"><div class="grid">
      ${field("Ev. č. zprávy", s(report.ev_cislo_zpravy))}
      ${field("Typ revize", s(report.typ_revize))}
      ${field("Výtisk č.", sNum(report.vytisk_cislo))}
      ${field("Počet listů", sNum(report.pocet_listu))}
      ${field("Datum zahájení", sDate(report.datum_zahajeni))}
      ${field("Datum ukončení", sDate(report.datum_ukonceni))}
      ${field("Datum vypracování", sDate(report.datum_vypracovani))}
      ${field("Počet příloh", sNum(report.pocet_priloh))}
      ${field("Revizní technik", s(report.revizni_technik))}
      ${field("Adresa technika", s(report.adresa_technika))}
      ${field("Ev. č. osvědčení", s(report.ev_cislo_osvedceni))}
      ${field("Ev. č. oprávnění", s(report.ev_cislo_opravneni))}
      ${field("Revizi byli přítomni", s(report.revizi_pritomni), true)}
    </div></div>
  </div>

  <div class="sec">
    <div class="st">Objekt a objednatel</div>
    <div class="sb"><div class="grid">
      ${field("Název a adresa objektu", s(formatObjektAdresaOneLine(report)), true)}
      ${field("Objednatel revize", s(report.objednatel_revize))}
      ${field("Majitel objektu", s(report.majitel_objektu))}
      ${field("Provozovatel objektu", s(report.provozovatel_objektu))}
      ${field("Montážní firma", s(report.montazni_firma_nazev))}
      ${field("IČ", s(report.montazni_firma_ico))}
      ${field("Ev. č. oprávnění M,O", s(report.montazni_firma_ev_opravneni))}
      ${field("Rozsah – vnější ochrana", report.rozsah_vnejsi_ochrana ? "Ano" : "Ne")}
      ${field("Rozsah – vnitřní ochrana", report.rozsah_vnitrni_ochrana ? "Ano" : "Ne")}
      ${field("Povětrnostní podmínky", s(report.poveternostni_podminky), true)}
    </div>
    ${report.katastr_map_url ? (() => {
      const ar = annotationResult;
      const aspectRatio = ar ? `${ar.width}/${ar.height}` : "2/1";
      return `<div style="margin-top:8px"><div class="fl">Katastrální mapa</div>
        <div style="position:relative;margin-top:3px;border:1px solid #ccc;border-radius:3px;overflow:hidden;width:100%;aspect-ratio:${aspectRatio};background:#fff">
          <img src="${report.katastr_map_url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill" alt=""/>
          ${ar ? `<img src="${ar.dataUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill" alt=""/>` : ""}
        </div></div>`;
    })() : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">Základní údaje o objektu</div>
    <div class="sb"><div class="grid-3">
      ${field("Typ objektu", s(report.typ_objektu) + (report.typ_objektu_jiny ? ` (${report.typ_objektu_jiny})` : ""))}
      ${field("Třída LPS (LPL)", s(report.trida_lps))}
      ${field("Materiál střechy", s(report.material_strechy))}
      ${field("Výška tyčového jímače", s(report.vyska_tycoveho_jimace))}
      ${field("Velikost ok mřížové soustavy", s(report.velikost_ok_mrizove))}
      ${field("Typ zemnící soustavy", report.typ_zemnci_soustavy ? `Typ ${report.typ_zemnci_soustavy}` : "—")}
    </div>
    ${(report.typ_jimaci_soustavy?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:4px"><div class="fl">Typ jímací soustavy</div><div style="margin-top:1px">${tags(report.typ_jimaci_soustavy!)}</div></div>` : ""}
    ${(report.druh_zeminy?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:4px"><div class="fl">Druh zeminy</div><div style="margin-top:1px">${tags(report.druh_zeminy!)}</div></div>` : ""}
    ${(report.stav_zeminy?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:2px"><div class="fl">Stav zeminy</div><div style="margin-top:1px">${tags(report.stav_zeminy!)}</div></div>` : ""}
    ${(report.zony_ochrany_lpz?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:2px"><div class="fl">Zóny LPZ</div><div style="margin-top:1px">${tags(report.zony_ochrany_lpz!)}</div></div>` : ""}
    ${(report.potencialove_vyrovnani?.length ?? 0) > 0 ? `<div class="field field-full" style="margin-top:2px"><div class="fl">Potenciálové vyrovnání</div><div style="margin-top:1px">${tags(report.potencialove_vyrovnani!)}</div></div>` : ""}
    ${report.el_zarizeni_na_strese ? `<div class="field field-full" style="margin-top:2px"><div class="fl">Zařízení na střeše</div><div class="fv">${report.el_zarizeni_na_strese}</div></div>` : ""}
    </div>
  </div>

  ${spdDevices.length > 0 ? `
  <div class="sec">
    <div class="st">Osazené typy SPD</div>
    <div class="sb"><table>
      <thead><tr><th>Výrobce</th><th>Typové označení</th><th>Místo instalace</th></tr></thead>
      <tbody>${spdDevices.map(d => `<tr><td>${s(d.vyrobce)}</td><td>${s(d.typove_oznaceni)}</td><td>${s(d.misto_instalace)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>` : ""}

  ${instruments.length > 0 ? `
  <div class="sec">
    <div class="st">Soupis použitých měřicích přístrojů</div>
    <div class="sb"><table>
      <thead><tr><th>Typ a název</th><th>Výrobní číslo</th><th>Č. kalibračního listu</th><th>Datum kalibrace</th><th>Firma</th></tr></thead>
      <tbody>${instruments.map(i => `<tr><td>${s(i.nazev_pristroje)}</td><td>${s(i.vyrobni_cislo)}</td><td>${s(i.cislo_kalibracniho_listu)}</td><td>${s(i.datum_kalibrace)}</td><td>${s(i.firma_kalibrace)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>` : ""}

  <div class="sec">
    <div class="st">A. Předmět revize</div>
    <div class="sb">
      ${field("Předmět revize", s(report.predmet_revize), true)}
      ${report.predmet_revize_nebylo ? field("Nebylo předmětem revize", report.predmet_revize_nebylo, true) : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">B. Rozsah revize</div>
    <div class="sb"><div class="grid">
      ${field("Vnější ochrana před bleskem", report.rozsah_vnejsi ? "Ano" : "Ne")}
      ${field("Vnitřní ochrana před bleskem", report.rozsah_vnitrni ? "Ano" : "Ne")}
      ${field("Ochrana před statickou elektřinou", report.rozsah_staticka ? "Ano" : "Ne")}
      ${field("Uzemnění", report.rozsah_uzemneni ? "Ano" : "Ne")}
    </div></div>
  </div>

  <div class="sec">
    <div class="st">C. Předložené doklady</div>
    <div class="sb">
      ${[
      ["protokol_vnejsi_vlivy", "Protokol o určení vnějších vlivů"],
      ["projektova_dokumentace", "Projektová dokumentace LPS"],
      ["dokumentace_rizika", "Dokumentace o určení rizika"],
      ["certifikaty", "Certifikáty a prohlášení o shodě"],
      ["pokyny_montaz", "Pokyny pro montáž a údržbu"],
      ["pozadavky_obsluha", "Požadavky na obsluhu"],
      ["dalsi_dokumentace", "Další dodavatelská dokumentace"],
    ].map(([k, l]) => `<div class="field"><div class="fv">${dok[k] ? "✓" : "—"} ${l}</div></div>`).join("")}
      ${dok.protokol_nazev ? `<div style="margin-top:4px" class="grid">${field("Protokol – název", s(dok.protokol_nazev as string))}${field("Zpracovatel", s(dok.protokol_zpracovatel as string))}${field("Datum", s(dok.protokol_datum as string))}${field("Klasifikace", s(dok.protokol_klasifikace as string))}</div>` : ""}
      ${dok.projekt_zpracovatel ? `<div style="margin-top:4px" class="grid">${field("Projekt – zpracovatel", s(dok.projekt_zpracovatel as string))}${field("Datum", s(dok.projekt_datum as string))}</div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">D. Technický popis</div>
    <div class="sb">${field("Technický popis", s(report.technicky_popis), true)}</div>
  </div>

  <div class="sec">
    <div class="st">E1.1. Prohlídka – Vnější ochrana před bleskem</div>
    <div class="sb">${buildChecklistHTML(cl, CHECKLIST_E11)}</div>
  </div>

  <div class="sec">
    <div class="st">E1.2. Prohlídka – Vnitřní ochrana před bleskem</div>
    <div class="sb">${buildChecklistHTML(cl, CHECKLIST_E12)}</div>
  </div>

  <div class="sec">
    <div class="st">E2. Měření</div>
    <div class="sb">
      ${field("Metoda měření", s(report.metoda_mereni), true)}
      ${measurements.length > 0 ? `
      <table style="margin-top:6px">
        <thead><tr><th>P.č.</th><th>Označení zkušební svorky</th><th>Odpor s ochranným vodičem (Ω)</th><th>Odpor bez ochranného vodiče (Ω)</th><th>Přechodový odpor (Ω)</th></tr></thead>
        <tbody>${measurements.map((m, i) => `<tr><td>${i + 1}</td><td>${s(m.oznaceni_zkusebni_svorky)}</td><td>${sNum(m.odpor_s_vodicem)}</td><td>${sNum(m.odpor_bez_vodice)}</td><td>${sNum(m.prechodovy_odpor)}</td></tr>`).join("")}</tbody>
      </table>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">F. Soupis zjištěných závad</div>
    <div class="sb">${field("Zjištěné závady", s(report.zjistene_zavady), true)}</div>
  </div>

  <div class="sec">
    <div class="st">G. Závěr a vyhodnocení – Celkový posudek</div>
    <div class="sb">
      ${field("Závěr", s(report.zaver_text), true)}
      ${field("Stav od poslední revize", s(report.stav_od_posledni_revize))}
      <div class="grid" style="margin-top:4px">
        ${field("Termín – kritické systémy", s(report.termin_lps_kriticke))}
        ${field("Termín – ostatní objekty", s(report.termin_lps_ostatni))}
        ${field("Termín – nebezpečí výbuchu", s(report.termin_lps_vybuch))}
      </div>
      ${report.celkovy_posudek ? `<div style="margin-top:8px"><div class="fl">Celkový posudek</div><div class="posudek ${posudekClass}">${report.celkovy_posudek === "v souladu" ? "Provedení ochrany před bleskem a přepětím JE v souladu s právními předpisy a normami" : "Provedení ochrany před bleskem a přepětím NENÍ v souladu s právními předpisy a normami"}</div></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <div class="st">Podpisy</div>
    <div class="sb"><div class="grid">
      ${field("Místo", s(report.misto_podpisu))}
      ${field("Předáno dne", sDate(report.datum_predani))}
      <div class="field">
        <div class="fl">Podpis objednavatele</div>
        ${report.podpis_objednavatele ? `<img src="${report.podpis_objednavatele}" class="sig-img" alt=""/>` : '<div class="sig-area">Podpis</div>'}
      </div>
      <div class="field">
        <div class="fl">Podpis revizního technika</div>
        ${report.podpis_technika ? `<img src="${report.podpis_technika}" class="sig-img" alt=""/>` : '<div class="sig-area">Podpis</div>'}
      </div>
      ${report.razitko_url ? `<div class="field"><div class="fl">Razítko</div><img src="${report.razitko_url}" style="max-height:60px;max-width:120px;margin-top:3px" alt=""/></div>` : ""}
    </div></div>
  </div>

  ${report.rozdelovnik ? `<div class="sec"><div class="st">Rozdělovník</div><div class="sb"><div class="fv" style="white-space:pre-line">${report.rozdelovnik}</div></div></div>` : ""}

  ${(report.seznam_priloh?.length ?? 0) > 0 ? `<div class="sec"><div class="st">Seznam příloh</div><div class="sb">${report.seznam_priloh!.map((p, i) => `<div class="fv">${i + 1}. ${p}</div>`).join("")}</div></div>` : ""}
</div>`;
}

const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1122;

function createPageContainer(): HTMLDivElement {
  const page = document.createElement("div");
  page.className = "page";
  page.style.width = `${PAGE_WIDTH_PX}px`;
  page.style.height = `${PAGE_HEIGHT_PX}px`;
  return page;
}

function paginateFlow(flow: HTMLElement, measureHost: HTMLElement): HTMLDivElement[] {
  const sourceBlocks = Array.from(flow.children) as HTMLElement[];
  const pages: HTMLDivElement[] = [];
  let currentPage = createPageContainer();
  measureHost.appendChild(currentPage);

  for (const sourceBlock of sourceBlocks) {
    const block = sourceBlock.cloneNode(true) as HTMLElement;
    currentPage.appendChild(block);

    if (currentPage.scrollHeight <= PAGE_HEIGHT_PX + 1) continue;

    currentPage.removeChild(block);

    // If this block does not fit an empty page, keep it alone to avoid data loss.
    if (currentPage.childElementCount === 0) {
      currentPage.appendChild(block);
      pages.push(currentPage);
      currentPage = createPageContainer();
      measureHost.appendChild(currentPage);
      continue;
    }

    pages.push(currentPage);
    currentPage = createPageContainer();
    measureHost.appendChild(currentPage);
    currentPage.appendChild(block);

    if (currentPage.scrollHeight > PAGE_HEIGHT_PX + 1) {
      pages.push(currentPage);
      currentPage = createPageContainer();
      measureHost.appendChild(currentPage);
    }
  }

  if (currentPage.childElementCount > 0) {
    pages.push(currentPage);
  } else if (currentPage.parentElement === measureHost) {
    measureHost.removeChild(currentPage);
  }

  return pages;
}

export async function generatePDF(
  report: Report,
  instruments: Instrument[],
  measurements: Measurement[],
  spdDevices: SpdDevice[]
): Promise<void> {
  let annotationResult: { dataUrl: string; width: number; height: number } | null = null;
  if (report.katastr_annotations) {
    annotationResult = await renderAnnotationsToDataUrl(report.katastr_annotations);
  }

  const html = buildHTML(report, instruments, measurements, spdDevices, annotationResult);

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-10000px;top:0;";
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  const flow = wrapper.querySelector(".doc-flow") as HTMLElement | null;
  if (!flow) {
    document.body.removeChild(wrapper);
    throw new Error("PDF template root not found");
  }

  const renderHost = document.createElement("div");
  renderHost.style.cssText = "position:fixed;left:-10000px;top:0;";
  document.body.appendChild(renderHost);

  const pages = paginateFlow(flow, renderHost);

  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.82);
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    }

    if (pages.length === 0) {
      pdf.text("PDF template is empty", 20, 20);
    }

    const name = (report.ev_cislo_zpravy || "navrh").replace(/[/\\]/g, "-");
    pdf.save(`revizni-zprava-lps-${name}.pdf`);
  } finally {
    document.body.removeChild(renderHost);
    document.body.removeChild(wrapper);
  }
}
