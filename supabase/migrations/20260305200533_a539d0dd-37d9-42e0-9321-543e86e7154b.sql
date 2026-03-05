
-- Create main inspection reports table
CREATE TABLE public.inspection_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Section 1: Identifikace revize
  cislo_revize TEXT,
  datum_provedeni DATE,
  datum_ukonceni DATE,
  datum_vystaveni DATE,
  druh_revize TEXT CHECK (druh_revize IN ('výchozí', 'pravidelná', 'mimořádná')),
  revizni_technik TEXT,
  evidencni_cislo TEXT,
  adresa_technika TEXT,
  telefon_technika TEXT,
  -- Section 3: Identifikace objektu
  objednavatel TEXT,
  nazev_objektu TEXT,
  adresa_objektu TEXT,
  montazni_firma TEXT,
  telefon_montazni_firmy TEXT,
  -- Section 4: Rozsah revize
  rozsah_revize TEXT,
  soucast_revize_neni TEXT[],
  -- Section 5: Základní údaje o objektu
  budova TEXT,
  typ_strechy TEXT,
  krytina_strechy TEXT,
  elektricka_zarizeni_na_strese BOOLEAN DEFAULT FALSE,
  elektricka_zarizeni_popis TEXT,
  trida_lps TEXT CHECK (trida_lps IN ('I', 'II', 'III', 'IV')),
  typ_jimaci_soustavy TEXT,
  pocet_tycovych_jimacu INTEGER,
  pocet_pomocnych_jimacu INTEGER,
  pocet_svodu INTEGER,
  druh_zeminy TEXT,
  poveternostni_podminky TEXT,
  pocasi_behem_revize TEXT,
  zona_ochrany_lpz TEXT,
  -- Section 6: Údaje o dokumentu
  pocet_stran INTEGER,
  pocet_vyhotoveni INTEGER,
  rozdelovnik TEXT,
  -- Section 8: Předmět revize
  predmet_revize TEXT,
  oblasti_kontroly TEXT[],
  -- Section 9: Podklady pro revizi
  podklad_revize TEXT[],
  projektova_dokumentace BOOLEAN DEFAULT FALSE,
  poznamka TEXT,
  -- Section 10: Technický popis
  technicky_popis TEXT,
  vzdalenost_svodu TEXT,
  typ_uzemnovaci_soustavy TEXT,
  ekvipotencialni_pospojeni TEXT,
  -- Section 11: Přechodový odpor
  prechodovy_odpor TEXT,
  -- Section 12: Závady
  byly_zjisteny_zavady BOOLEAN DEFAULT FALSE,
  popis_zavad TEXT,
  -- Section 13: Závěr revize
  zaver_revize TEXT,
  celkovy_posudek TEXT CHECK (celkovy_posudek IN ('Soustava hromosvodu je schopná bezpečného provozu', 'Soustava vyžaduje opravu', 'Soustava není bezpečná')),
  -- Section 14: Podpisy
  podpis_objednavatele TEXT,
  podpis_technika TEXT,
  razitko_url TEXT,
  -- Section 15: Termín další revize
  termin_dalsi_revize DATE,
  termin_vizualni_kontroly DATE,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Standards table (repeatable - Section 2)
CREATE TABLE public.report_standards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  norma TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Instruments table (repeatable - Section 7)
CREATE TABLE public.report_instruments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  nazev_pristroje TEXT,
  typ_pristroje TEXT,
  vyrobni_cislo TEXT,
  cislo_kalibrace TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Earth resistance measurements table (repeatable - Section 11)
CREATE TABLE public.report_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  oznaceni_svodu TEXT,
  odpor_zemnice NUMERIC(10, 3),
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_measurements ENABLE ROW LEVEL SECURITY;

-- Public access policies
CREATE POLICY "Public read access" ON public.inspection_reports FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.inspection_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.inspection_reports FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.inspection_reports FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.report_standards FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.report_standards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.report_standards FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.report_standards FOR DELETE USING (true);

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

-- Storage bucket for razítko images
INSERT INTO storage.buckets (id, name, public) VALUES ('report-assets', 'report-assets', true);
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'report-assets');
CREATE POLICY "Public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-assets');
