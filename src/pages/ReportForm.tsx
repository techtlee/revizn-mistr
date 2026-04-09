import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Save, Download, Zap, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import RepeatableTable from "@/components/RepeatableTable";
import RepeatableList from "@/components/RepeatableList";
import MultiSelectCheckbox from "@/components/MultiSelectCheckbox";
import SignatureField from "@/components/SignatureField";
import KatastrMap from "@/components/KatastrMap";
import FormStepper, { type Step } from "@/components/FormStepper";
import InspectionChecklist, { CHECKLIST_E11, CHECKLIST_E12 } from "@/components/InspectionChecklist";
import { generatePDF } from "@/lib/pdfExport";
import { useAuth } from "@/hooks/useAuth";
import { usePinnedDefaultsQuery } from "@/hooks/usePinnedDefaults";
import {
  useSavedCompaniesQuery,
  useSavedInstrumentsQuery,
  useTechTemplatesQuery,
  useCommonDefectsQuery,
  useUpsertCompany,
} from "@/hooks/useLibrary";
import CompanyCombobox from "@/components/CompanyCombobox";
import { mergePinnedDefaultsIntoForm } from "@/lib/formSettings";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Report = Tables<"inspection_reports">;
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;
type SpdDevice = Tables<"report_spd_devices">;

const STEPS: Step[] = [
  { id: "hlavicka", title: "Hlavička a identifikace", shortTitle: "Hlavička" },
  { id: "objekt", title: "Objekt a objednatel", shortTitle: "Objekt" },
  { id: "udaje", title: "Údaje o objektu", shortTitle: "Údaje" },
  { id: "spd", title: "SPD a přístroje", shortTitle: "SPD" },
  { id: "predmet", title: "Předmět a rozsah", shortTitle: "Předmět" },
  { id: "doklady", title: "Předložené doklady", shortTitle: "Doklady" },
  { id: "popis", title: "Technický popis", shortTitle: "Popis" },
  { id: "e11", title: "Prohlídka – vnější", shortTitle: "Vnější" },
  { id: "e12", title: "Prohlídka – vnitřní", shortTitle: "Vnitřní" },
  { id: "mereni", title: "Měření", shortTitle: "Měření" },
  { id: "zaver", title: "Závěr a podpisy", shortTitle: "Závěr" },
];

const EMPTY_INSTRUMENT: Record<string, string | number | null> = {
  nazev_pristroje: null, typ_pristroje: null, vyrobni_cislo: null,
  cislo_kalibracniho_listu: null, datum_kalibrace: null, firma_kalibrace: null, sort_order: 0,
};
const EMPTY_MEASUREMENT: Record<string, string | number | null> = {
  oznaceni_zkusebni_svorky: null, odpor_s_vodicem: null, odpor_bez_vodice: null, prechodovy_odpor: null, sort_order: 0,
};
const EMPTY_SPD: Record<string, string | number | null> = {
  vyrobce: null, typove_oznaceni: null, misto_instalace: null, sort_order: 0,
};

function instrumentRowFromTemplate(t: Tables<"saved_instrument_templates">): Record<string, string | number | null> {
  return {
    nazev_pristroje: t.nazev_pristroje,
    typ_pristroje: t.typ_pristroje,
    vyrobni_cislo: t.vyrobni_cislo,
    cislo_kalibracniho_listu: t.cislo_kalibracniho_listu,
    datum_kalibrace: t.datum_kalibrace,
    firma_kalibrace: t.firma_kalibrace,
    sort_order: 0,
  };
}

const TYP_OBJEKTU_OPTIONS = [
  "pro bytové účely",
  "pro administrativní účely",
  "průmyslový objekt",
  "objekt s nebezpečím požáru",
  "objekt s nebezpečím výbuchu",
  "jiný typ objektu",
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-3.5">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
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

function getDefaultReportForm(): Partial<Report> {
  return {
    typ_revize: "pravidelná",
    trida_lps: "III",
    rozsah_vnejsi_ochrana: false,
    rozsah_vnitrni_ochrana: false,
    rozsah_vnejsi: false,
    rozsah_vnitrni: false,
    rozsah_staticka: false,
    rozsah_uzemneni: false,
    typ_jimaci_soustavy: [],
    druh_zeminy: [],
    stav_zeminy: [],
    zony_ochrany_lpz: [],
    potencialove_vyrovnani: [],
    seznam_priloh: [],
    inspection_checklist: {},
    predlozene_doklady: {},
  };
}

export default function ReportForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Report>>(getDefaultReportForm);
  const pinnedMergedRef = useRef(false);
  const libCompanyMergedRef = useRef(false);
  const libTechMergedRef = useRef(false);
  const libInstMergedRef = useRef(false);
  const libDefectMergedRef = useRef(false);
  const { data: pinnedDefaults } = usePinnedDefaultsQuery();
  const savedCompaniesQuery = useSavedCompaniesQuery();
  const savedCompanies = savedCompaniesQuery.data ?? [];
  const techTemplatesQuery = useTechTemplatesQuery();
  const techTemplates = techTemplatesQuery.data ?? [];
  const instrumentTemplatesQuery = useSavedInstrumentsQuery();
  const instrumentTemplates = instrumentTemplatesQuery.data ?? [];
  const commonDefectsQuery = useCommonDefectsQuery();
  const commonDefects = commonDefectsQuery.data ?? [];
  const upsertCompany = useUpsertCompany();

  const [libraryCompanyId, setLibraryCompanyId] = useState<string | null>(null);
  const [libraryTechId, setLibraryTechId] = useState<string | null>(null);
  const [libraryInstrumentId, setLibraryInstrumentId] = useState<string | null>(null);
  const [libraryDefectId, setLibraryDefectId] = useState<string | null>(null);

  const [instruments, setInstruments] = useState<Record<string, string | number | null>[]>([]);
  const [measurements, setMeasurements] = useState<Record<string, string | number | null>[]>([]);
  const [spdDevices, setSpdDevices] = useState<Record<string, string | number | null>[]>([]);

  useEffect(() => {
    if (isEdit && !authLoading && !user) navigate("/login");
  }, [isEdit, authLoading, user, navigate]);

  useEffect(() => {
    if (isEdit || !user || pinnedDefaults === undefined || pinnedMergedRef.current) return;
    pinnedMergedRef.current = true;
    setForm(f => mergePinnedDefaultsIntoForm({ ...f }, pinnedDefaults));
  }, [isEdit, user, pinnedDefaults]);

  useEffect(() => {
    if (isEdit || !user || !savedCompaniesQuery.isSuccess || libCompanyMergedRef.current) return;
    libCompanyMergedRef.current = true;
    if (savedCompanies.length === 0) return;
    const c = savedCompanies[0];
    setForm(f => ({
      ...f,
      montazni_firma_nazev: c.nazev,
      montazni_firma_ico: c.ico ?? "",
      montazni_firma_ev_opravneni: c.ev_opravneni ?? "",
    }));
    if (savedCompanies.length > 1) setLibraryCompanyId(c.id);
  }, [isEdit, user, savedCompaniesQuery.isSuccess, savedCompanies]);

  useEffect(() => {
    if (isEdit || !user || !techTemplatesQuery.isSuccess || libTechMergedRef.current) return;
    libTechMergedRef.current = true;
    if (techTemplates.length === 0) return;
    const t = techTemplates[0];
    setForm(f => ({ ...f, technicky_popis: t.body }));
    if (techTemplates.length > 1) setLibraryTechId(t.id);
  }, [isEdit, user, techTemplatesQuery.isSuccess, techTemplates]);

  useEffect(() => {
    if (isEdit || !user || !instrumentTemplatesQuery.isSuccess || libInstMergedRef.current) return;
    libInstMergedRef.current = true;
    if (instrumentTemplates.length === 0) return;
    const t = instrumentTemplates[0];
    setInstruments([instrumentRowFromTemplate(t)]);
    if (instrumentTemplates.length > 1) setLibraryInstrumentId(t.id);
  }, [isEdit, user, instrumentTemplatesQuery.isSuccess, instrumentTemplates]);

  useEffect(() => {
    if (isEdit || !user || !commonDefectsQuery.isSuccess || libDefectMergedRef.current) return;
    libDefectMergedRef.current = true;
    if (commonDefects.length === 0) return;
    const d = commonDefects[0];
    setForm(f => ({ ...f, zjistene_zavady: d.label_cs }));
    if (commonDefects.length > 1) setLibraryDefectId(d.id);
  }, [isEdit, user, commonDefectsQuery.isSuccess, commonDefects]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: report } = await supabase.from("inspection_reports").select("*").eq("id", id).single();
        if (report) setForm(report);

        const { data: inst } = await supabase.from("report_instruments").select("*").eq("report_id", id).order("sort_order");
        if (inst) setInstruments(inst.map(({ id: _id, report_id: _rid, ...rest }) => rest as Record<string, string | number | null>));

        const { data: meas } = await supabase.from("report_measurements").select("*").eq("report_id", id).order("sort_order");
        if (meas) setMeasurements(meas.map(({ id: _id, report_id: _rid, ...rest }) => rest as Record<string, string | number | null>));

        const { data: spd } = await supabase.from("report_spd_devices").select("*").eq("report_id", id).order("sort_order");
        if (spd) setSpdDevices(spd.map(({ id: _id, report_id: _rid, ...rest }) => rest as Record<string, string | number | null>));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const set = (key: keyof Report, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const applyLibraryCompany = (id: string) => {
    const c = savedCompanies.find(x => x.id === id);
    if (!c) return;
    setLibraryCompanyId(id);
    setForm(f => ({
      ...f,
      montazni_firma_nazev: c.nazev,
      montazni_firma_ico: c.ico ?? "",
      montazni_firma_ev_opravneni: c.ev_opravneni ?? "",
    }));
  };

  const applyLibraryTechTemplate = (id: string) => {
    const t = techTemplates.find(x => x.id === id);
    if (!t) return;
    setLibraryTechId(id);
    set("technicky_popis", t.body);
  };

  const applyLibraryInstrumentTemplate = (id: string) => {
    const t = instrumentTemplates.find(x => x.id === id);
    if (!t) return;
    setLibraryInstrumentId(id);
    setInstruments(prev => {
      const row = instrumentRowFromTemplate(t);
      if (prev.length === 0) return [row];
      return [row, ...prev.slice(1)];
    });
  };

  const applyLibraryDefect = (id: string) => {
    const d = commonDefects.find(x => x.id === id);
    if (!d) return;
    setLibraryDefectId(id);
    set("zjistene_zavady", d.label_cs);
  };

  const setChecklist = (vals: Record<string, boolean>) => set("inspection_checklist", vals);
  const checklist = (form.inspection_checklist || {}) as Record<string, boolean>;

  const setDoklady = (key: string, val: unknown) => {
    const prev = (form.predlozene_doklady || {}) as Record<string, unknown>;
    set("predlozene_doklady", { ...prev, [key]: val });
  };
  const doklady = (form.predlozene_doklady || {}) as Record<string, unknown>;

  const handleSave = async () => {
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

      await supabase.from("report_instruments").delete().eq("report_id", reportId);
      if (instruments.length > 0) {
        await supabase.from("report_instruments").insert(
          instruments.map((inst, i) => ({ report_id: reportId!, ...inst, sort_order: i }))
        );
      }

      await supabase.from("report_measurements").delete().eq("report_id", reportId);
      if (measurements.length > 0) {
        await supabase.from("report_measurements").insert(
          measurements.map((m, i) => ({ report_id: reportId!, ...m, sort_order: i }))
        );
      }

      await supabase.from("report_spd_devices").delete().eq("report_id", reportId);
      if (spdDevices.length > 0) {
        await supabase.from("report_spd_devices").insert(
          spdDevices.map((s, i) => ({ report_id: reportId!, ...s, sort_order: i }))
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
      const reportData = (isEdit && id)
        ? (await supabase.from("inspection_reports").select("*").eq("id", id).single()).data!
        : { ...form, id: "", created_at: "", updated_at: "" } as Report;
      const rid = id || "";
      const inst = instruments.map((r, i) => ({ id: "", report_id: rid, ...r, sort_order: i })) as Instrument[];
      const meas = measurements.map((r, i) => ({ id: "", report_id: rid, ...r, sort_order: i })) as Measurement[];
      const spd = spdDevices.map((r, i) => ({ id: "", report_id: rid, ...r, sort_order: i })) as SpdDevice[];
      await generatePDF(reportData, inst, meas, spd);
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
    if (error) { toast({ title: "Chyba", description: "Nepodařilo se nahrát razítko.", variant: "destructive" }); return; }
    const { data } = supabase.storage.from("report-assets").getPublicUrl(path);
    set("razitko_url", data.publicUrl);
  };

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0));

  const skipInitialStepScroll = useRef(true);
  useEffect(() => {
    if (skipInitialStepScroll.current) {
      skipInitialStepScroll.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleSaveCompanyToSettings = () => {
    if (!user) {
      toast({
        title: "Přihlášení vyžadováno",
        description: "Pro uložení firmy do knihovny se přihlaste.",
        variant: "destructive",
      });
      return;
    }
    const nazev = (form.montazni_firma_nazev || "").trim();
    if (!nazev) {
      toast({
        title: "Chybí název",
        description: "Vyplňte název montážní firmy.",
        variant: "destructive",
      });
      return;
    }
    upsertCompany.mutate(
      {
        nazev,
        ico: (form.montazni_firma_ico || "").trim(),
        ev_opravneni: (form.montazni_firma_ev_opravneni || "").trim(),
      },
      {
        onSuccess: () =>
          toast({ title: "Uloženo", description: "Firma byla přidána do společné knihovny." }),
        onError: () =>
          toast({ title: "Chyba", description: "Nepodařilo se uložit firmu.", variant: "destructive" }),
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepNavigation = (placement: "top" | "bottom") => (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        placement === "top" ? "border-b border-border pb-4 -mt-1" : "pt-4 pb-8",
      )}
    >
      <Button variant="outline" onClick={goPrev} disabled={currentStep === 0}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Předchozí
      </Button>
      <span className="text-sm text-muted-foreground shrink-0">
        {currentStep + 1} / {STEPS.length}
      </span>
      {currentStep < STEPS.length - 1 ? (
        <Button onClick={goNext}>
          Další <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      ) : (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {isEdit ? "Uložit změny" : "Uložit zprávu"}
        </Button>
      )}
    </div>
  );

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "hlavicka": return renderHlavicka();
      case "objekt": return renderObjekt();
      case "udaje": return renderUdaje();
      case "spd": return renderSpd();
      case "predmet": return renderPredmet();
      case "doklady": return renderDoklady();
      case "popis": return renderPopis();
      case "e11": return renderE11();
      case "e12": return renderE12();
      case "mereni": return renderMereni();
      case "zaver": return renderZaver();
      default: return null;
    }
  };

  function renderHlavicka() {
    return (
      <SectionCard title="Hlavička a identifikace revize">
        <div className="form-grid">
          <FField label="Ev. č. zprávy">
            <Input value={form.ev_cislo_zpravy || ""} onChange={e => set("ev_cislo_zpravy", e.target.value)} />
          </FField>
          <FField label="Typ revize">
            <Select value={form.typ_revize || ""} onValueChange={v => set("typ_revize", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="výchozí">Výchozí</SelectItem>
                <SelectItem value="pravidelná">Pravidelná</SelectItem>
                <SelectItem value="mimořádná">Mimořádná</SelectItem>
              </SelectContent>
            </Select>
          </FField>
          <FField label="Výtisk č.">
            <Input type="number" min={1} value={form.vytisk_cislo ?? ""} onChange={e => set("vytisk_cislo", e.target.value === "" ? null : Number(e.target.value))} />
          </FField>
          <FField label="Počet listů">
            <Input type="number" min={1} value={form.pocet_listu ?? ""} onChange={e => set("pocet_listu", e.target.value === "" ? null : Number(e.target.value))} />
          </FField>
          <FField label="Počet příloh">
            <Input type="number" min={0} value={form.pocet_priloh ?? ""} onChange={e => set("pocet_priloh", e.target.value === "" ? null : Number(e.target.value))} />
          </FField>
          <FField label="Datum zahájení revize">
            <Input type="date" value={form.datum_zahajeni || ""} onChange={e => set("datum_zahajeni", e.target.value)} />
          </FField>
          <FField label="Datum ukončení revize">
            <Input type="date" value={form.datum_ukonceni || ""} onChange={e => set("datum_ukonceni", e.target.value)} />
          </FField>
          <FField label="Datum vypracování revizní zprávy">
            <Input type="date" value={form.datum_vypracovani || ""} onChange={e => set("datum_vypracovani", e.target.value)} />
          </FField>
          <FField label="Revizní technik">
            <Input value={form.revizni_technik || ""} onChange={e => set("revizni_technik", e.target.value)} />
          </FField>
          <FField label="Adresa revizního technika" full>
            <Input value={form.adresa_technika || ""} onChange={e => set("adresa_technika", e.target.value)} />
          </FField>
          <FField label="Ev. č. osvědčení pro provádění revizí">
            <Input value={form.ev_cislo_osvedceni || ""} onChange={e => set("ev_cislo_osvedceni", e.target.value)} />
          </FField>
          <FField label="Ev. č. oprávnění pro provádění revizí">
            <Input value={form.ev_cislo_opravneni || ""} onChange={e => set("ev_cislo_opravneni", e.target.value)} />
          </FField>
          <FField label="Revizi byli přítomni" full>
            <Input value={form.revizi_pritomni || ""} onChange={e => set("revizi_pritomni", e.target.value)} />
          </FField>
        </div>
      </SectionCard>
    );
  }

  function renderObjekt() {
    return (
      <SectionCard title="Objekt a objednatel">
        <div className="space-y-6">
          <div className="form-grid">
            <FField label="Název a adresa objektu" full>
              <Input value={form.nazev_adresa_objektu || ""} onChange={e => set("nazev_adresa_objektu", e.target.value)} />
            </FField>
          </div>
          <KatastrMap
            address={form.nazev_adresa_objektu}
            imageUrl={form.katastr_map_url}
            annotations={form.katastr_annotations}
            onImageChange={(url) => set("katastr_map_url", url)}
            onAnnotationsChange={(json) => set("katastr_annotations", json)}
          />
          <div className="form-grid">
            <FField label="Objednatel revize">
              <Input value={form.objednatel_revize || ""} onChange={e => set("objednatel_revize", e.target.value)} />
            </FField>
            <FField label="Majitel objektu">
              <Input value={form.majitel_objektu || ""} onChange={e => set("majitel_objektu", e.target.value)} />
            </FField>
            <FField label="Provozovatel objektu">
              <Input value={form.provozovatel_objektu || ""} onChange={e => set("provozovatel_objektu", e.target.value)} />
            </FField>
            {savedCompanies.length > 1 && (
              <FField label="Šablona montážní firmy z knihovny" full>
                <Select
                  value={libraryCompanyId ?? savedCompanies[0]?.id ?? ""}
                  onValueChange={applyLibraryCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte záznam z knihovny…" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedCompanies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nazev}
                        {c.creator_display ? ` (${c.creator_display})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FField>
            )}
            <FField label="Montážní firma – název" full>
              <CompanyCombobox
                value={form.montazni_firma_nazev || ""}
                onValueChange={v => set("montazni_firma_nazev", v)}
                companies={savedCompanies.map(c => ({
                  id: c.id,
                  nazev: c.nazev,
                  ico: c.ico,
                  ev_opravneni: c.ev_opravneni,
                }))}
                onPickCompany={c => {
                  set("montazni_firma_nazev", c.nazev);
                  set("montazni_firma_ico", c.ico);
                  set("montazni_firma_ev_opravneni", c.ev_opravneni);
                }}
              />
              {user ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCompanyToSettings}
                    disabled={upsertCompany.isPending}
                  >
                    Uložit firmu do nastavení
                  </Button>
                </div>
              ) : null}
            </FField>
            <FField label="Montážní firma – IČ">
              <Input value={form.montazni_firma_ico || ""} onChange={e => set("montazni_firma_ico", e.target.value)} />
            </FField>
            <FField label="Montážní firma – Ev. č. oprávnění">
              <Input value={form.montazni_firma_ev_opravneni || ""} onChange={e => set("montazni_firma_ev_opravneni", e.target.value)} />
            </FField>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Rozsah prohlídky</div>
            <div className="flex items-center gap-3">
              <Switch checked={form.rozsah_vnejsi_ochrana || false} onCheckedChange={v => set("rozsah_vnejsi_ochrana", v)} />
              <Label className="text-sm">Vnější ochrana před bleskem</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.rozsah_vnitrni_ochrana || false} onCheckedChange={v => set("rozsah_vnitrni_ochrana", v)} />
              <Label className="text-sm">Vnitřní ochrana před bleskem</Label>
            </div>
          </div>
          <FField label="Povětrnostní podmínky" full>
            <Input value={form.poveternostni_podminky || ""} onChange={e => set("poveternostni_podminky", e.target.value)} />
          </FField>
        </div>
      </SectionCard>
    );
  }

  function renderUdaje() {
    return (
      <SectionCard title="Základní údaje o objektu">
        <div className="space-y-6">
          <div className="form-grid">
            <FField label="Typ objektu">
              <Select value={form.typ_objektu || ""} onValueChange={v => set("typ_objektu", v)}>
                <SelectTrigger><SelectValue placeholder="Vyberte..." /></SelectTrigger>
                <SelectContent>
                  {TYP_OBJEKTU_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </FField>
            {form.typ_objektu === "jiný typ objektu" && (
              <FField label="Konkrétně uveďte">
                <Input value={form.typ_objektu_jiny || ""} onChange={e => set("typ_objektu_jiny", e.target.value)} />
              </FField>
            )}
            <FField label="El. a neelektrická zařízení na střeše" full>
              <Input value={form.el_zarizeni_na_strese || ""} onChange={e => set("el_zarizeni_na_strese", e.target.value)} placeholder="STA, anténa, klimatizace, solární panely, apod." />
            </FField>
            <FField label="Třída LPS (hladina ochrany – LPL)">
              <Select value={form.trida_lps || ""} onValueChange={v => set("trida_lps", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["I", "II", "III", "IV"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </FField>
          </div>

          <MultiSelectCheckbox
            label="Typ jímací soustavy"
            options={[
              "tyče",
              "závěsná lana",
              "vodiče mřížové soustavy",
              "izolovaná jímací soustava",
              "aktivní jímací soustava",
            ]}
            selected={form.typ_jimaci_soustavy || []}
            onChange={v => set("typ_jimaci_soustavy", v)}
          />

          <div className="form-grid">
            <FField label="Velikost ok mřížové soustavy">
              <Select value={form.velikost_ok_mrizove || ""} onValueChange={v => set("velikost_ok_mrizove", v)}>
                <SelectTrigger><SelectValue placeholder="Vyberte..." /></SelectTrigger>
                <SelectContent>
                  {["5x5m", "10x10m", "15x15m", "20x20m", "jiné"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </FField>
            <FField label="Výška tyčového jímače (m)">
              <Input value={form.vyska_tycoveho_jimace || ""} onChange={e => set("vyska_tycoveho_jimace", e.target.value)} />
            </FField>
            <FField label="Materiál střechy">
              <Input value={form.material_strechy || ""} onChange={e => set("material_strechy", e.target.value)} />
            </FField>
            <FField label="Typ uspořádání zemnící soustavy">
              <Select value={form.typ_zemnci_soustavy || ""} onValueChange={v => set("typ_zemnci_soustavy", v)}>
                <SelectTrigger><SelectValue placeholder="Vyberte..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Uspořádání typu A</SelectItem>
                  <SelectItem value="B">Uspořádání typu B</SelectItem>
                </SelectContent>
              </Select>
            </FField>
          </div>

          <MultiSelectCheckbox
            label="Druh zeminy"
            options={["písčitá", "štěrk", "rašelina", "kamenitá", "beton", "jíl", "ornice"]}
            selected={form.druh_zeminy || []}
            onChange={v => set("druh_zeminy", v)}
          />

          <MultiSelectCheckbox
            label="Stav zeminy"
            options={["suchá", "vlhká", "zmrzlá"]}
            selected={form.stav_zeminy || []}
            onChange={v => set("stav_zeminy", v)}
          />

          <MultiSelectCheckbox
            label="Zóny ochrany před bleskem (LPZ)"
            options={["LPZ0", "LPZ0A", "LPZ0B", "LPZ1", "LPZ2"]}
            selected={form.zony_ochrany_lpz || []}
            onChange={v => set("zony_ochrany_lpz", v)}
          />

          <MultiSelectCheckbox
            label="Potenciálové vyrovnání silnoproudých elektroinstalací"
            options={["TT", "TN", "IT"]}
            selected={form.potencialove_vyrovnani || []}
            onChange={v => set("potencialove_vyrovnani", v)}
          />
        </div>
      </SectionCard>
    );
  }

  function renderSpd() {
    return (
      <div className="space-y-6">
        <SectionCard title="Osazené typy SPD">
          <RepeatableTable
            columns={[
              { key: "vyrobce", label: "Výrobce" },
              { key: "typove_oznaceni", label: "Typové označení" },
              { key: "misto_instalace", label: "Místo instalace" },
            ]}
            rows={spdDevices}
            onChange={setSpdDevices}
            emptyRow={EMPTY_SPD}
          />
        </SectionCard>
        <SectionCard title="Soupis použitých měřicích přístrojů">
          <div className="space-y-4">
            {instrumentTemplates.length > 1 && (
              <FField label="Šablona měřicího přístroje z knihovny" full>
                <Select
                  value={libraryInstrumentId ?? instrumentTemplates[0]?.id ?? ""}
                  onValueChange={applyLibraryInstrumentTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte šablonu…" />
                  </SelectTrigger>
                  <SelectContent>
                    {instrumentTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {(t.nazev_pristroje || t.typ_pristroje || "Přístroj").trim()}
                        {t.creator_display ? ` (${t.creator_display})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FField>
            )}
            {instrumentTemplates.length === 1 && (
              <p className="text-sm text-muted-foreground">
                První řádek předvyplněn šablonou z knihovny (údaje můžete upravit).
              </p>
            )}
            <RepeatableTable
              columns={[
                { key: "nazev_pristroje", label: "Typ a název přístroje" },
                { key: "vyrobni_cislo", label: "Výrobní (evidenční) číslo" },
                { key: "cislo_kalibracniho_listu", label: "Číslo kalibračního listu" },
                { key: "datum_kalibrace", label: "Datum kalibrace" },
                { key: "firma_kalibrace", label: "Firma provádějící kalibraci" },
              ]}
              rows={instruments}
              onChange={setInstruments}
              emptyRow={EMPTY_INSTRUMENT}
            />
          </div>
        </SectionCard>
      </div>
    );
  }

  function renderPredmet() {
    return (
      <SectionCard title="A. Předmět revize / B. Rozsah revize">
        <div className="space-y-6">
          <FField label="A. Předmět revize – přesná specifikace" full>
            <Textarea rows={4} value={form.predmet_revize || ""} onChange={e => set("predmet_revize", e.target.value)} />
          </FField>
          <FField label="Co předmětem revize nebylo / nemohlo být revidováno" full>
            <Textarea rows={3} value={form.predmet_revize_nebylo || ""} onChange={e => set("predmet_revize_nebylo", e.target.value)} />
          </FField>
          <div className="text-sm font-medium text-foreground">B. Rozsah revize</div>
          <div className="space-y-3">
            {[
              { key: "rozsah_vnejsi" as const, label: "Vnější ochrana před bleskem" },
              { key: "rozsah_vnitrni" as const, label: "Vnitřní ochrana před bleskem" },
              { key: "rozsah_staticka" as const, label: "Ochrana před statickou elektřinou" },
              { key: "rozsah_uzemneni" as const, label: "Uzemnění" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <Checkbox
                  id={item.key}
                  checked={(form[item.key] as boolean) || false}
                  onCheckedChange={v => set(item.key, !!v)}
                />
                <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  function renderDoklady() {
    const dokItems = [
      { key: "protokol_vnejsi_vlivy", label: "Protokol o určení vnějších vlivů dle ČSN 33 2000-51 ed.3" },
      { key: "projektova_dokumentace", label: "Projektová dokumentace LPS (technická a výkresová)" },
      { key: "dokumentace_rizika", label: "Dokumentace o určení rizika ČSN EN 62305-2 ed.2" },
      { key: "certifikaty", label: "Certifikáty a prohlášení o shodě na použitá zařízení" },
      { key: "pokyny_montaz", label: "Pokyny pro montáž, uvádění do provozu a údržba zařízení" },
      { key: "pozadavky_obsluha", label: "Požadavky na obsluhu" },
      { key: "dalsi_dokumentace", label: "Další dodavatelská dokumentace" },
    ];

    return (
      <SectionCard title="C. Předložené doklady">
        <div className="space-y-4">
          {dokItems.map(item => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`dok_${item.key}`}
                  checked={!!(doklady[item.key] as boolean)}
                  onCheckedChange={v => setDoklady(item.key, !!v)}
                />
                <Label htmlFor={`dok_${item.key}`} className="text-sm font-normal cursor-pointer">{item.label}</Label>
              </div>
              {item.key === "protokol_vnejsi_vlivy" && doklady[item.key] && (
                <div className="ml-7 form-grid">
                  <FField label="Název">
                    <Input value={(doklady.protokol_nazev as string) || ""} onChange={e => setDoklady("protokol_nazev", e.target.value)} />
                  </FField>
                  <FField label="Datum zpracování">
                    <Input type="date" value={(doklady.protokol_datum as string) || ""} onChange={e => setDoklady("protokol_datum", e.target.value)} />
                  </FField>
                  <FField label="Zpracovatel">
                    <Input value={(doklady.protokol_zpracovatel as string) || ""} onChange={e => setDoklady("protokol_zpracovatel", e.target.value)} />
                  </FField>
                  <FField label="Klasifikace prostorů" full>
                    <Input value={(doklady.protokol_klasifikace as string) || ""} onChange={e => setDoklady("protokol_klasifikace", e.target.value)} />
                  </FField>
                </div>
              )}
              {item.key === "projektova_dokumentace" && doklady[item.key] && (
                <div className="ml-7 form-grid">
                  <FField label="Zpracovatel">
                    <Input value={(doklady.projekt_zpracovatel as string) || ""} onChange={e => setDoklady("projekt_zpracovatel", e.target.value)} />
                  </FField>
                  <FField label="Datum zpracování">
                    <Input type="date" value={(doklady.projekt_datum as string) || ""} onChange={e => setDoklady("projekt_datum", e.target.value)} />
                  </FField>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  function renderPopis() {
    return (
      <SectionCard title="D. Technický popis revidovaného zařízení">
        <div className="space-y-4">
          {techTemplates.length > 1 && (
            <FField label="Šablona technického popisu z knihovny" full>
              <Select
                value={libraryTechId ?? techTemplates[0]?.id ?? ""}
                onValueChange={applyLibraryTechTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte šablonu…" />
                </SelectTrigger>
                <SelectContent>
                  {techTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {t.creator_display ? ` (${t.creator_display})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FField>
          )}
          {techTemplates.length === 1 && (
            <p className="text-sm text-muted-foreground">
              Předvyplněno šablonou „{techTemplates[0].name}“ z knihovny.
            </p>
          )}
          <FField label="Technický popis" full>
            <Textarea rows={8} value={form.technicky_popis || ""} onChange={e => set("technicky_popis", e.target.value)} />
          </FField>
        </div>
      </SectionCard>
    );
  }

  function renderE11() {
    return (
      <SectionCard title="E1.1. Prohlídka – Vnější ochrana před bleskem">
        <InspectionChecklist
          groups={CHECKLIST_E11}
          values={checklist}
          onChange={setChecklist}
        />
      </SectionCard>
    );
  }

  function renderE12() {
    return (
      <SectionCard title="E1.2. Prohlídka – Vnitřní ochrana před bleskem">
        <InspectionChecklist
          groups={CHECKLIST_E12}
          values={checklist}
          onChange={setChecklist}
        />
      </SectionCard>
    );
  }

  function renderMereni() {
    return (
      <SectionCard title="E2. Měření">
        <div className="space-y-6">
          <FField label="Metoda měření" full>
            <Textarea rows={3} value={form.metoda_mereni || ""} onChange={e => set("metoda_mereni", e.target.value)} />
          </FField>
          <div>
            <div className="text-sm font-medium text-foreground mb-3">Měření zemních odporů zemničů</div>
            <p className="text-xs text-muted-foreground mb-3">
              Minimální hodnota zemního odporu jednoho zemniče je menší rovna 10Ω (ČSN EN 62305–3, čl. 5.4.1).
              Přechodový odpor ≤ 0,2Ω (ČSN EN 62305–3, čl. 5.3.5).
            </p>
            <RepeatableTable
              columns={[
                { key: "oznaceni_zkusebni_svorky", label: "Označení zkušební svorky" },
                { key: "odpor_s_vodicem", label: "Odpor s ochranným vodičem (Ω)", type: "number" },
                { key: "odpor_bez_vodice", label: "Odpor bez ochranného vodiče (Ω)", type: "number" },
                { key: "prechodovy_odpor", label: "Přechodový odpor (Ω)", type: "number" },
              ]}
              rows={measurements}
              onChange={setMeasurements}
              emptyRow={EMPTY_MEASUREMENT}
            />
          </div>
        </div>
      </SectionCard>
    );
  }

  function renderZaver() {
    return (
      <div className="space-y-6">
        <SectionCard title="F. Soupis zjištěných závad">
          <div className="space-y-4">
            {commonDefects.length > 1 && (
              <FField label="Šablona závady z knihovny" full>
                <Select
                  value={libraryDefectId ?? commonDefects[0]?.id ?? ""}
                  onValueChange={applyLibraryDefect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte záznam…" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDefects.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label_cs}
                        {d.creator_display ? ` (${d.creator_display})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FField>
            )}
            {commonDefects.length === 1 && (
              <p className="text-sm text-muted-foreground">
                Předvyplněno textem z knihovny závad (můžete upravit).
              </p>
            )}
            <FField label="Zjištěné závady (přesně specifikovat s odkazem na normu)" full>
              <Textarea rows={5} value={form.zjistene_zavady || ""} onChange={e => set("zjistene_zavady", e.target.value)} />
            </FField>
          </div>
        </SectionCard>

        <SectionCard title="G. Závěr a vyhodnocení">
          <div className="space-y-6">
            <FField label="Závěr revize" full>
              <Textarea rows={5} value={form.zaver_text || ""} onChange={e => set("zaver_text", e.target.value)} />
            </FField>
            <FField label="Stav od poslední revize">
              <Select value={form.stav_od_posledni_revize || ""} onValueChange={v => set("stav_od_posledni_revize", v)}>
                <SelectTrigger><SelectValue placeholder="Vyberte..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stejný">Zůstal stejný</SelectItem>
                  <SelectItem value="zhoršil se">Zhoršil se</SelectItem>
                </SelectContent>
              </Select>
            </FField>

            <div className="form-grid">
              <FField label="Termín revize – LPS chránící kritické systémy">
                <Input value={form.termin_lps_kriticke || ""} onChange={e => set("termin_lps_kriticke", e.target.value)} placeholder="např. 2 roky" />
              </FField>
              <FField label="Termín revize – LPS chránící ostatní objekty">
                <Input value={form.termin_lps_ostatni || ""} onChange={e => set("termin_lps_ostatni", e.target.value)} placeholder="např. 4 roky" />
              </FField>
              <FField label="Termín revize – LPS s nebezpečím výbuchu">
                <Input value={form.termin_lps_vybuch || ""} onChange={e => set("termin_lps_vybuch", e.target.value)} placeholder="např. 1 rok" />
              </FField>
            </div>

            <FField label="Celkový posudek" full>
              <Select value={form.celkovy_posudek || ""} onValueChange={v => set("celkovy_posudek", v)}>
                <SelectTrigger><SelectValue placeholder="Vyberte posudek..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="v souladu">V souladu s právními předpisy a normami – zařízení je způsobilé</SelectItem>
                  <SelectItem value="není v souladu">Není v souladu s právními předpisy a normami</SelectItem>
                </SelectContent>
              </Select>
            </FField>
          </div>
        </SectionCard>

        <SectionCard title="Podpisy a rozdělovník">
          <div className="space-y-6">
            <div className="form-grid">
              <FField label="Místo">
                <Input value={form.misto_podpisu || ""} onChange={e => set("misto_podpisu", e.target.value)} placeholder="V ..." />
              </FField>
              <FField label="Revizní zprávu předal dne">
                <Input type="date" value={form.datum_predani || ""} onChange={e => set("datum_predani", e.target.value)} />
              </FField>
            </div>
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
            </div>
            <div>
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
                <Input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleRazitkoUpload} />
              </div>
            </div>
            <FField label="Rozdělovník" full>
              <Textarea rows={3} value={form.rozdelovnik || ""} onChange={e => set("rozdelovnik", e.target.value)}
                placeholder="Výtisk č. 1: Provozovatel&#10;Výtisk č. 2: Dodavatel zařízení&#10;Výtisk č. 3: Revizní technik" />
            </FField>
            <RepeatableList
              label="Seznam příloh"
              placeholder="např. Protokol o určení vnějších vlivů"
              items={form.seznam_priloh || []}
              onChange={v => set("seznam_priloh", v)}
            />
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="nav-bar">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Zpět</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm text-foreground tracking-wide uppercase">Vitmajer</span>
            <span className="text-[9px] text-muted-foreground tracking-widest hidden sm:block">Hromosvody</span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="px-2 sm:px-3">
            {exporting ? <Loader2 className="w-4 h-4 sm:mr-1 animate-spin" /> : <Download className="w-4 h-4 sm:mr-1" />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="px-2 sm:px-3">
            {saving ? <Loader2 className="w-4 h-4 sm:mr-1 animate-spin" /> : <Save className="w-4 h-4 sm:mr-1" />}
            <span className="hidden sm:inline">{isEdit ? "Uložit změny" : "Uložit zprávu"}</span>
          </Button>
        </div>
      </nav>

      <div className="page-content space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? "Upravit revizní zprávu" : "Nová revizní zpráva"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Zpráva o revizi LPS dle ČSN EN 62305</p>
        </div>

        <FormStepper steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

        {stepNavigation("top")}

        {renderStep()}

        {stepNavigation("bottom")}
      </div>
    </div>
  );
}
