-- Fresh rebuild: drop all old tables and recreate for CSN EN 62305 form

DROP TABLE IF EXISTS public.report_measurements CASCADE;
DROP TABLE IF EXISTS public.report_instruments CASCADE;
DROP TABLE IF EXISTS public.report_standards CASCADE;
DROP TABLE IF EXISTS public.inspection_reports CASCADE;

-- Main inspection reports table
CREATE TABLE public.inspection_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Header
  ev_cislo_zpravy TEXT,
  vytisk_cislo INTEGER,
  pocet_listu INTEGER,
  pocet_priloh INTEGER,

  -- Revision identification
  typ_revize TEXT CHECK (typ_revize IN ('výchozí', 'pravidelná', 'mimořádná')),
  datum_zahajeni DATE,
  datum_ukonceni DATE,
  datum_vypracovani DATE,
  revizni_technik TEXT,
  adresa_technika TEXT,
  ev_cislo_osvedceni TEXT,
  ev_cislo_opravneni TEXT,
  revizi_pritomni TEXT,

  -- Object identification
  nazev_adresa_objektu TEXT,
  objednatel_revize TEXT,
  majitel_objektu TEXT,
  provozovatel_objektu TEXT,
  montazni_firma_nazev TEXT,
  montazni_firma_ico TEXT,
  montazni_firma_ev_opravneni TEXT,
  katastr_map_url TEXT,
  katastr_annotations TEXT,

  -- Scope & conditions
  rozsah_vnejsi_ochrana BOOLEAN DEFAULT FALSE,
  rozsah_vnitrni_ochrana BOOLEAN DEFAULT FALSE,
  poveternostni_podminky TEXT,

  -- Object data
  typ_objektu TEXT,
  typ_objektu_jiny TEXT,
  el_zarizeni_na_strese TEXT,
  trida_lps TEXT CHECK (trida_lps IN ('I', 'II', 'III', 'IV')),
  typ_jimaci_soustavy TEXT[],
  velikost_ok_mrizove TEXT,
  vyska_tycoveho_jimace TEXT,
  material_strechy TEXT,
  typ_zemnci_soustavy TEXT CHECK (typ_zemnci_soustavy IN ('A', 'B')),
  druh_zeminy TEXT[],
  stav_zeminy TEXT[],
  zony_ochrany_lpz TEXT[],
  potencialove_vyrovnani TEXT[],

  -- Sections A-D
  predmet_revize TEXT,
  predmet_revize_nebylo TEXT,
  rozsah_vnejsi BOOLEAN DEFAULT FALSE,
  rozsah_vnitrni BOOLEAN DEFAULT FALSE,
  rozsah_staticka BOOLEAN DEFAULT FALSE,
  rozsah_uzemneni BOOLEAN DEFAULT FALSE,
  predlozene_doklady JSONB DEFAULT '{}'::jsonb,
  technicky_popis TEXT,

  -- E1 Inspection checklist (JSONB with boolean values keyed by item ID)
  inspection_checklist JSONB DEFAULT '{}'::jsonb,

  -- E2 Measurements
  metoda_mereni TEXT,

  -- F + G Conclusion
  zjistene_zavady TEXT,
  zaver_text TEXT,
  stav_od_posledni_revize TEXT CHECK (stav_od_posledni_revize IN ('stejný', 'zhoršil se')),
  celkovy_posudek TEXT CHECK (celkovy_posudek IN ('v souladu', 'není v souladu')),
  termin_lps_kriticke TEXT,
  termin_lps_ostatni TEXT,
  termin_lps_vybuch TEXT,

  -- Signatures & distribution
  misto_podpisu TEXT,
  datum_predani DATE,
  podpis_objednavatele TEXT,
  podpis_technika TEXT,
  razitko_url TEXT,
  rozdelovnik TEXT,
  seznam_priloh TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SPD devices table (repeatable)
CREATE TABLE public.report_spd_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  vyrobce TEXT,
  typove_oznaceni TEXT,
  misto_instalace TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Instruments table (repeatable)
CREATE TABLE public.report_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  nazev_pristroje TEXT,
  typ_pristroje TEXT,
  vyrobni_cislo TEXT,
  cislo_kalibracniho_listu TEXT,
  datum_kalibrace TEXT,
  firma_kalibrace TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Earth resistance measurements table (repeatable, expanded 5-column)
CREATE TABLE public.report_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  oznaceni_zkusebni_svorky TEXT,
  odpor_s_vodicem NUMERIC(10, 3),
  odpor_bez_vodice NUMERIC(10, 3),
  prechodovy_odpor NUMERIC(10, 3),
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_spd_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_measurements ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public read access" ON public.inspection_reports FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.inspection_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.inspection_reports FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.inspection_reports FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.report_spd_devices FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.report_spd_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.report_spd_devices FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.report_spd_devices FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.report_instruments FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.report_instruments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.report_instruments FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.report_instruments FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.report_measurements FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.report_measurements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.report_measurements FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.report_measurements FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inspection_reports_updated_at
  BEFORE UPDATE ON public.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-assets', 'report-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'report-assets');
CREATE POLICY IF NOT EXISTS "Public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-assets');
