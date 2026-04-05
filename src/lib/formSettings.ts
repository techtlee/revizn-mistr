import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

type ReportRow = Tables<"inspection_reports">;

const savedCompanySchema = z.object({
  id: z.string(),
  nazev: z.string(),
  ico: z.string(),
  ev_opravneni: z.string(),
});

const savedInstrumentTemplateSchema = z.object({
  id: z.string(),
  nazev_pristroje: z.string().nullable().optional(),
  typ_pristroje: z.string().nullable().optional(),
  vyrobni_cislo: z.string().nullable().optional(),
  cislo_kalibracniho_listu: z.string().nullable().optional(),
  datum_kalibrace: z.string().nullable().optional(),
  firma_kalibrace: z.string().nullable().optional(),
});

const technicalDescriptionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(),
});

const commonDefectSchema = z.object({
  id: z.string(),
  labelCs: z.string(),
});

/** Keys from inspection_reports that may be stored as pinned defaults for new revisions. */
export const PINNABLE_REPORT_KEYS = [
  "typ_revize",
  "trida_lps",
  "revizni_technik",
  "adresa_technika",
  "ev_cislo_osvedceni",
  "ev_cislo_opravneni",
  "revizi_pritomni",
  "metoda_mereni",
  "poveternostni_podminky",
  "rozsah_vnejsi_ochrana",
  "rozsah_vnitrni_ochrana",
] as const satisfies readonly (keyof ReportRow)[];

export type PinnableReportKey = (typeof PINNABLE_REPORT_KEYS)[number];

export type PinnedDefaults = Partial<Pick<ReportRow, PinnableReportKey>>;

const pinnedDefaultsInnerSchema = z
  .object({
    typ_revize: z.string().nullable().optional(),
    trida_lps: z.string().nullable().optional(),
    revizni_technik: z.string().nullable().optional(),
    adresa_technika: z.string().nullable().optional(),
    ev_cislo_osvedceni: z.string().nullable().optional(),
    ev_cislo_opravneni: z.string().nullable().optional(),
    revizi_pritomni: z.string().nullable().optional(),
    metoda_mereni: z.string().nullable().optional(),
    poveternostni_podminky: z.string().nullable().optional(),
    rozsah_vnejsi_ochrana: z.boolean().optional(),
    rozsah_vnitrni_ochrana: z.boolean().optional(),
  })
  .partial();

export const formSettingsDocumentSchema = z.object({
  savedCompanies: z.array(savedCompanySchema).default([]),
  savedMeasuringInstruments: z.array(savedInstrumentTemplateSchema).default([]),
  technicalDescriptionTemplates: z.array(technicalDescriptionTemplateSchema).default([]),
  commonDefects: z.array(commonDefectSchema).default([]),
  pinnedDefaults: pinnedDefaultsInnerSchema.default({}),
});

export type SavedCompany = z.infer<typeof savedCompanySchema>;
export type SavedInstrumentTemplate = z.infer<typeof savedInstrumentTemplateSchema>;
export type TechnicalDescriptionTemplate = z.infer<typeof technicalDescriptionTemplateSchema>;
export type CommonDefectItem = z.infer<typeof commonDefectSchema>;
export type FormSettingsDocument = z.infer<typeof formSettingsDocumentSchema>;

export const emptyFormSettingsDocument = (): FormSettingsDocument => ({
  savedCompanies: [],
  savedMeasuringInstruments: [],
  technicalDescriptionTemplates: [],
  commonDefects: [],
  pinnedDefaults: {},
});

export function parseFormSettingsJson(raw: unknown): FormSettingsDocument {
  const parsed = formSettingsDocumentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return emptyFormSettingsDocument();
}

/** Merge only whitelisted pinned keys onto the base form (new report). */
export function mergePinnedDefaultsIntoForm<T extends Partial<ReportRow>>(
  base: T,
  pinned: PinnedDefaults | undefined | null,
): T {
  if (!pinned || typeof pinned !== "object") return base;
  const next = { ...base } as Record<string, unknown>;
  for (const key of PINNABLE_REPORT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(pinned, key)) {
      const v = pinned[key as PinnableReportKey];
      if (v !== undefined) next[key] = v;
    }
  }
  return next as T;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
