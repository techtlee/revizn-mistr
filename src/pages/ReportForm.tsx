import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Download, Zap, Loader2 } from "lucide-react";
import RepeatableList from "@/components/RepeatableList";
import RepeatableTable from "@/components/RepeatableTable";
import MultiSelectCheckbox from "@/components/MultiSelectCheckbox";
import SignatureField from "@/components/SignatureField";
import KatastrMap from "@/components/KatastrMap";
import { generatePDF } from "@/lib/pdfExport";
import type { Tables } from "@/integrations/supabase/types";

type Report = Tables<"inspection_reports">;
type Standard = Tables<"report_standards">;
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;

const EMPTY_INSTRUMENT = { id: "", report_id: "", nazev_pristroje: null, typ_pristroje: null, vyrobni_cislo: null, cislo_kalibrace: null, sort_order: 0 };
const EMPTY_MEASUREMENT = { id: "", report_id: "", oznaceni_svodu: null, odpor_zemnice: null, sort_order: 0 };

function SectionCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="section-card">
      <div className="section-header">
        {number}. {title}
      </div>
      <div className="section-body">
        {children}
      </div>
    </div>
  );
}

function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-sm font-medium text-foreground">
      {children}{required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
}

function FField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-full" : ""}>
      <FLabel>{label}</FLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<Partial<Report>>({
    druh_revize: "pravidelná",
    trida_lps: "III",
    elektricka_zarizeni_na_strese: false,
    projektova_dokumentace: false,
    byly_zjisteny_zavady: false,
    soucast_revize_neni: [],
    oblasti_kontroly: [],
    podklad_revize: [],
  });

  const [standards, setStandards] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<Omit<Instrument, "id" | "report_id">[]>([]);
  const [measurements, setMeasurements] = useState<Omit<Measurement, "id" | "report_id">[]>([]);

  // Load existing report
  useEffect(() => {
    if (!isEdit || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: report } = await supabase.from("inspection_reports").select("*").eq("id", id).single();
        if (report) setForm(report);

        const { data: std } = await supabase.from("report_standards").select("*").eq("report_id", id).order("sort_order");
        if (std) setStandards(std.map(s => s.norma));

        const { data: inst } = await supabase.from("report_instruments").select("*").eq("report_id", id).order("sort_order");
        if (inst) setInstruments(inst.map(({ id: _id, report_id: _rid, ...rest }) => rest));

        const { data: meas } = await supabase.from("report_measurements").select("*").eq("report_id", id).order("sort_order");
        if (meas) setMeasurements(meas.map(({ id: _id, report_id: _rid, ...rest }) => rest));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const set = (key: keyof Report, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const formatPhone = (value: string): string => {
    const digits = value.replace(/[^\d]/g, "").slice(0, 12);
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `+${digits}`;
    return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  };

  const isValidPhone = (value: string | null | undefined): boolean => {
    if (!value || value.trim() === "") return true;
    return /^\+\d{3} \d{9}$/.test(value);
  };

  const handleSave = async () => {
    if (!isValidPhone(form.telefon_technika) || !isValidPhone(form.telefon_montazni_firmy)) {
      toast({ title: "Chyba", description: "Telefonní číslo musí být ve formátu +XXX XXXXXXXXX.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let reportId = id;

      const payload = { ...form };
      delete (payload as Record<string, unknown>).id;
      delete (payload as Record<string, unknown>).created_at;
      delete (payload as Record<string, unknown>).updated_at;

      if (isEdit && id) {
        const { error } = await supabase.from("inspection_reports").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("inspection_reports").insert(payload).select().single();
        if (error) throw error;
        reportId = data.id;
      }

      if (!reportId) throw new Error("No report id");

      // Upsert standards
      await supabase.from("report_standards").delete().eq("report_id", reportId);
      if (standards.length > 0) {
        await supabase.from("report_standards").insert(
          standards.filter(s => s.trim()).map((norma, i) => ({ report_id: reportId!, norma, sort_order: i }))
        );
      }

      // Upsert instruments
      await supabase.from("report_instruments").delete().eq("report_id", reportId);
      if (instruments.length > 0) {
        await supabase.from("report_instruments").insert(
          instruments.map((inst, i) => ({ report_id: reportId!, ...inst, sort_order: i }))
        );
      }

      // Upsert measurements
      await supabase.from("report_measurements").delete().eq("report_id", reportId);
      if (measurements.length > 0) {
        await supabase.from("report_measurements").insert(
          measurements.map((meas, i) => ({ report_id: reportId!, ...meas, sort_order: i }))
        );
      }

      toast({ title: "Uloženo", description: "Revizní zpráva byla úspěšně uložena." });
      navigate("/");
    } catch (err) {
      console.error(err);
      toast({ title: "Chyba", description: "Nepodařilo se uložit zprávu.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      let reportData: Report;
      if (isEdit && id) {
        const { data } = await supabase.from("inspection_reports").select("*").eq("id", id).single();
        if (!data) throw new Error("Report not found");
        reportData = data;
      } else {
        reportData = { ...form, id: "", created_at: "", updated_at: "" } as Report;
      }
      const rid = id || "";
      const std = standards.map((norma, i) => ({ id: "", report_id: rid, norma, sort_order: i }));
      const inst = instruments.map((r, i) => ({ id: "", report_id: rid, ...r, sort_order: i }));
      const meas = measurements.map((r, i) => ({ id: "", report_id: rid, ...r, sort_order: i }));
      await generatePDF(reportData, std, inst, meas);
      toast({ title: "PDF staženo", description: "Revizní zpráva byla exportována do PDF." });
    } catch (err) {
      console.error(err);
      toast({ title: "Chyba", description: "Nepodařilo se vygenerovat PDF.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleRazitkoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `razitko/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("report-assets").upload(path, file);
    if (error) {
      toast({ title: "Chyba", description: "Nepodařilo se nahrát razítko.", variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("report-assets").getPublicUrl(path);
    set("razitko_url", data.publicUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zpět</span>
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">LPS Revize</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {isEdit ? "Uložit změny" : "Uložit zprávu"}
          </Button>
        </div>
      </nav>

      <div className="page-content space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Upravit revizní zprávu" : "Nová revizní zpráva"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">LPS – Soustava hromosvodu</p>
        </div>

        {/* Section 1 */}
        <SectionCard number={1} title="Identifikace revize">
          <div className="form-grid">
            <FField label="Číslo revize">
              <Input value={form.cislo_revize || ""} onChange={e => set("cislo_revize", e.target.value)} placeholder="např. 2025/001" />
            </FField>
            <FField label="Druh revize">
              <Select value={form.druh_revize || ""} onValueChange={v => set("druh_revize", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="výchozí">Výchozí</SelectItem>
                  <SelectItem value="pravidelná">Pravidelná</SelectItem>
                  <SelectItem value="mimořádná">Mimořádná</SelectItem>
                </SelectContent>
              </Select>
            </FField>
            <FField label="Datum provedení revize">
              <Input type="date" value={form.datum_provedeni || ""} onChange={e => set("datum_provedeni", e.target.value)} />
            </FField>
            <FField label="Datum ukončení revize">
              <Input type="date" value={form.datum_ukonceni || ""} onChange={e => set("datum_ukonceni", e.target.value)} />
            </FField>
            <FField label="Datum vystavení revizní zprávy">
              <Input type="date" value={form.datum_vystaveni || ""} onChange={e => set("datum_vystaveni", e.target.value)} />
            </FField>
            <FField label="Revizní technik">
              <Input value={form.revizni_technik || ""} onChange={e => set("revizni_technik", e.target.value)} />
            </FField>
            <FField label="Evidenční číslo revizního technika">
              <Input value={form.evidencni_cislo || ""} onChange={e => set("evidencni_cislo", e.target.value)} />
            </FField>
            <FField label="Telefon revizního technika">
              <Input type="tel" inputMode="numeric" value={form.telefon_technika || ""} onChange={e => set("telefon_technika", formatPhone(e.target.value))} placeholder="+420 123456789" maxLength={14} />
              {form.telefon_technika && !isValidPhone(form.telefon_technika) && (
                <p className="text-xs text-destructive mt-1">Formát: +XXX XXXXXXXXX (předvolba + 9 číslic)</p>
              )}
            </FField>
            <FField label="Adresa revizního technika" full>
              <Input value={form.adresa_technika || ""} onChange={e => set("adresa_technika", e.target.value)} />
            </FField>
          </div>
        </SectionCard>

        {/* Section 2 */}
        <SectionCard number={2} title="Normy">
          <RepeatableList
            label="Použité normy"
            placeholder="např. ČSN EN 62305-3"
            items={standards}
            onChange={setStandards}
          />
        </SectionCard>

        {/* Section 3 */}
        <SectionCard number={3} title="Identifikace objektu">
          <div className="form-grid">
            <FField label="Objednavatel">
              <Input value={form.objednavatel || ""} onChange={e => set("objednavatel", e.target.value)} />
            </FField>
            <FField label="Název objektu">
              <Input value={form.nazev_objektu || ""} onChange={e => set("nazev_objektu", e.target.value)} />
            </FField>
            <FField label="Adresa objektu" full>
              <Input value={form.adresa_objektu || ""} onChange={e => set("adresa_objektu", e.target.value)} />
            </FField>
            <FField label="Montážní firma / zřizovatel hromosvodu">
              <Input value={form.montazni_firma || ""} onChange={e => set("montazni_firma", e.target.value)} />
            </FField>
            <FField label="Telefon montážní firmy">
              <Input type="tel" inputMode="numeric" value={form.telefon_montazni_firmy || ""} onChange={e => set("telefon_montazni_firmy", formatPhone(e.target.value))} placeholder="+420 123456789" maxLength={14} />
              {form.telefon_montazni_firmy && !isValidPhone(form.telefon_montazni_firmy) && (
                <p className="text-xs text-destructive mt-1">Formát: +XXX XXXXXXXXX (předvolba + 9 číslic)</p>
              )}
            </FField>
          </div>
          <div className="mt-4">
            <KatastrMap
              address={form.adresa_objektu}
              imageUrl={form.katastr_map_url}
              annotations={form.katastr_annotations}
              onImageChange={(url) => set("katastr_map_url", url)}
              onAnnotationsChange={(json) => set("katastr_annotations", json)}
            />
          </div>
        </SectionCard>

        {/* Section 4 */}
        <SectionCard number={4} title="Rozsah revize">
          <div className="space-y-4">
            <FField label="Rozsah revize" full>
              <Textarea rows={3} value={form.rozsah_revize || ""} onChange={e => set("rozsah_revize", e.target.value)} />
            </FField>
            <MultiSelectCheckbox
              label="Součástí revize není"
              options={["Vnější ochrana před bleskem", "Elektrická instalace uvnitř objektu", "Uzemnění"]}
              selected={form.soucast_revize_neni || []}
              onChange={v => set("soucast_revize_neni", v)}
            />
          </div>
        </SectionCard>

        {/* Section 5 */}
        <SectionCard number={5} title="Základní údaje o objektu">
          <div className="form-grid">
            <FField label="Budova">
              <Input value={form.budova || ""} onChange={e => set("budova", e.target.value)} />
            </FField>
            <FField label="Typ střechy">
              <Input value={form.typ_strechy || ""} onChange={e => set("typ_strechy", e.target.value)} />
            </FField>
            <FField label="Krytina střechy">
              <Input value={form.krytina_strechy || ""} onChange={e => set("krytina_strechy", e.target.value)} />
            </FField>
            <FField label="Třída LPS">
              <Select value={form.trida_lps || ""} onValueChange={v => set("trida_lps", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">I</SelectItem>
                  <SelectItem value="II">II</SelectItem>
                  <SelectItem value="III">III</SelectItem>
                  <SelectItem value="IV">IV</SelectItem>
                </SelectContent>
              </Select>
            </FField>
            <FField label="Typ jímací soustavy">
              <Input value={form.typ_jimaci_soustavy || ""} onChange={e => set("typ_jimaci_soustavy", e.target.value)} />
            </FField>
            <FField label="Počet tyčových jímačů">
              <Input type="number" min={0} value={form.pocet_tycovych_jimacu ?? ""} onChange={e => set("pocet_tycovych_jimacu", e.target.value === "" ? null : Number(e.target.value))} />
            </FField>
            <FField label="Počet pomocných jímačů">
              <Input type="number" min={0} value={form.pocet_pomocnych_jimacu ?? ""} onChange={e => set("pocet_pomocnych_jimacu", e.target.value === "" ? null : Number(e.target.value))} />
            </FField>
            <FField label="Počet svodů">
              <Input type="number" min={0} value={form.pocet_svodu ?? ""} onChange={e => set("pocet_svodu", e.target.value === "" ? null : Number(e.target.value))} />
            </FField>
            <FField label="Druh zeminy">
              <Input value={form.druh_zeminy || ""} onChange={e => set("druh_zeminy", e.target.value)} />
            </FField>
            <FField label="Povětrnostní podmínky">
              <Input value={form.poveternostni_podminky || ""} onChange={e => set("poveternostni_podminky", e.target.value)} />
            </FField>
            <FField label="Počasí během revize">
              <Input value={form.pocasi_behem_revize || ""} onChange={e => set("pocasi_behem_revize", e.target.value)} />
            </FField>
            <FField label="Zóna ochrany před bleskem LPZ">
              <Input value={form.zona_ochrany_lpz || ""} onChange={e => set("zona_ochrany_lpz", e.target.value)} />
            </FField>
            <div className="col-span-full space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.elektricka_zarizeni_na_strese || false}
                  onCheckedChange={v => set("elektricka_zarizeni_na_strese", v)}
                />
                <Label className="text-sm">Elektrická zařízení na střeše</Label>
              </div>
              {form.elektricka_zarizeni_na_strese && (
                <Input
                  placeholder="Popis elektrických zařízení na střeše..."
                  value={form.elektricka_zarizeni_popis || ""}
                  onChange={e => set("elektricka_zarizeni_popis", e.target.value)}
                />
              )}
            </div>
          </div>
        </SectionCard>

        {/* Section 6 */}
        <SectionCard number={6} title="Údaje o dokumentu">
          <div className="form-grid">
            <FField label="Počet stran zprávy">
              <Input type="number" min={1} value={form.pocet_stran ?? ""} onChange={e => set("pocet_stran", e.target.value === "" ? null : Number(e.target.value))} />
            </FField>
            <FField label="Počet vyhotovených zpráv">
              <Input type="number" min={1} value={form.pocet_vyhotoveni ?? ""} onChange={e => set("pocet_vyhotoveni", e.target.value === "" ? null : Number(e.target.value))} />
            </FField>
            <FField label="Rozdělovník" full>
              <Input value={form.rozdelovnik || ""} onChange={e => set("rozdelovnik", e.target.value)} />
            </FField>
          </div>
        </SectionCard>

        {/* Section 7 */}
        <SectionCard number={7} title="Použité měřicí přístroje">
          <RepeatableTable
            columns={[
              { key: "nazev_pristroje", label: "Název přístroje" },
              { key: "typ_pristroje", label: "Typ přístroje" },
              { key: "vyrobni_cislo", label: "Výrobní číslo" },
              { key: "cislo_kalibrace", label: "Číslo kalibrace" },
            ]}
            rows={instruments as Record<string, string | number | null>[]}
            onChange={(rows) => setInstruments(rows as Omit<Instrument, "id" | "report_id">[])}
            emptyRow={EMPTY_INSTRUMENT as unknown as Record<string, string | number | null>}
          />
        </SectionCard>

        {/* Section 8 */}
        <SectionCard number={8} title="Předmět revize">
          <div className="space-y-4">
            <FField label="Předmět revize" full>
              <Textarea rows={4} value={form.predmet_revize || ""} onChange={e => set("predmet_revize", e.target.value)} />
            </FField>
            <MultiSelectCheckbox
              label="Oblasti kontroly"
              options={["LPZ0a – vnější ochrana", "LPZ0b – vnější ochrana", "Uzemnění"]}
              selected={form.oblasti_kontroly || []}
              onChange={v => set("oblasti_kontroly", v)}
            />
          </div>
        </SectionCard>

        {/* Section 9 */}
        <SectionCard number={9} title="Podklady pro revizi">
          <div className="space-y-4">
            <MultiSelectCheckbox
              label="Podklad revize"
              options={["Měření", "Prohlídka"]}
              selected={form.podklad_revize || []}
              onChange={v => set("podklad_revize", v)}
            />
            <div className="flex items-center gap-3">
              <Switch
                checked={form.projektova_dokumentace || false}
                onCheckedChange={v => set("projektova_dokumentace", v)}
              />
              <Label className="text-sm">Projektová dokumentace předložena</Label>
            </div>
            <FField label="Poznámka" full>
              <Textarea rows={3} value={form.poznamka || ""} onChange={e => set("poznamka", e.target.value)} />
            </FField>
          </div>
        </SectionCard>

        {/* Section 10 */}
        <SectionCard number={10} title="Technický popis zařízení">
          <div className="space-y-4">
            <FField label="Technický popis zařízení" full>
              <Textarea rows={4} value={form.technicky_popis || ""} onChange={e => set("technicky_popis", e.target.value)} />
            </FField>
            <div className="form-grid">
              <FField label="Vzdálenost mezi svody">
                <Input value={form.vzdalenost_svodu || ""} onChange={e => set("vzdalenost_svodu", e.target.value)} placeholder="např. 10 m" />
              </FField>
              <FField label="Typ uzemňovací soustavy">
                <Input value={form.typ_uzemnovaci_soustavy || ""} onChange={e => set("typ_uzemnovaci_soustavy", e.target.value)} />
              </FField>
              <FField label="Ekvipotenciální pospojení" full>
                <Input value={form.ekvipotencialni_pospojeni || ""} onChange={e => set("ekvipotencialni_pospojeni", e.target.value)} />
              </FField>
            </div>
          </div>
        </SectionCard>

        {/* Section 11 */}
        <SectionCard number={11} title="Měření zemních odporů">
          <div className="space-y-4">
            <RepeatableTable
              columns={[
                { key: "oznaceni_svodu", label: "Označení svodu" },
                { key: "odpor_zemnice", label: "Odpor zemniče (Ω)", type: "number" },
              ]}
              rows={measurements as Record<string, string | number | null>[]}
              onChange={(rows) => setMeasurements(rows as Omit<Measurement, "id" | "report_id">[])}
              emptyRow={EMPTY_MEASUREMENT as unknown as Record<string, string | number | null>}
            />
            <FField label="Přechodový odpor spojů">
              <Input value={form.prechodovy_odpor || ""} onChange={e => set("prechodovy_odpor", e.target.value)} placeholder="např. < 0,2 Ω" />
            </FField>
          </div>
        </SectionCard>

        {/* Section 12 */}
        <SectionCard number={12} title="Zjištěné závady">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.byly_zjisteny_zavady || false}
                onCheckedChange={v => set("byly_zjisteny_zavady", v)}
              />
              <Label className="text-sm font-medium">Byly zjištěny závady</Label>
            </div>
            {form.byly_zjisteny_zavady && (
              <FField label="Popis závad" full>
                <Textarea rows={4} value={form.popis_zavad || ""} onChange={e => set("popis_zavad", e.target.value)} />
              </FField>
            )}
          </div>
        </SectionCard>

        {/* Section 13 */}
        <SectionCard number={13} title="Závěr revize">
          <div className="space-y-4">
            <FField label="Závěr revize" full>
              <Textarea rows={4} value={form.zaver_revize || ""} onChange={e => set("zaver_revize", e.target.value)} />
            </FField>
            <FField label="Celkový posudek" full>
              <Select value={form.celkovy_posudek || ""} onValueChange={v => set("celkovy_posudek", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte posudek..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Soustava hromosvodu je schopná bezpečného provozu">
                    ✅ Soustava hromosvodu je schopná bezpečného provozu
                  </SelectItem>
                  <SelectItem value="Soustava vyžaduje opravu">
                    ⚠️ Soustava vyžaduje opravu
                  </SelectItem>
                  <SelectItem value="Soustava není bezpečná">
                    ❌ Soustava není bezpečná
                  </SelectItem>
                </SelectContent>
              </Select>
            </FField>
          </div>
        </SectionCard>

        {/* Section 14 */}
        <SectionCard number={14} title="Podpisy">
          <div className="form-grid">
            <SignatureField
              label="Podpis objednavatele"
              value={form.podpis_objednavatele}
              onChange={v => set("podpis_objednavatele", v)}
            />
            <SignatureField
              label="Podpis revizního technika"
              value={form.podpis_technika}
              onChange={v => set("podpis_technika", v)}
            />
            <div className="col-span-full">
              <Label className="text-sm font-medium">Razítko</Label>
              <div className="mt-1 flex items-center gap-4">
                {form.razitko_url && (
                  <img src={form.razitko_url} alt="Razítko" className="h-16 object-contain border rounded" />
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {form.razitko_url ? "Změnit razítko" : "Nahrát razítko"}
                </Button>
                {form.razitko_url && (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => set("razitko_url", null)}>
                    Odstranit
                  </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRazitkoUpload} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section 15 */}
        <SectionCard number={15} title="Termín další revize">
          <div className="form-grid">
            <FField label="Termín další revize">
              <Input type="date" value={form.termin_dalsi_revize || ""} onChange={e => set("termin_dalsi_revize", e.target.value)} />
            </FField>
            <FField label="Termín vizuální kontroly">
              <Input type="date" value={form.termin_vizualni_kontroly || ""} onChange={e => set("termin_vizualni_kontroly", e.target.value)} />
            </FField>
          </div>
        </SectionCard>

        {/* Save button at bottom */}
        <div className="flex justify-end gap-3 pt-4 pb-8">
          <Button variant="outline" onClick={() => navigate("/")} disabled={saving}>
            Zrušit
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} Exportovat PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {isEdit ? "Uložit změny" : "Uložit zprávu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
