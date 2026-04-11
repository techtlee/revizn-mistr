-- =============================================================================
-- Consolidated schema for revizn-mistr (final state after all 7 migrations)
-- Paste this into the Supabase SQL Editor on a fresh project.
-- =============================================================================

-- 0) Recreate public schema (needed if it was dropped)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 1) Trigger function (reused by all tables with updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;


-- 2) Main inspection reports table
-- ---------------------------------------------------------------------------
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

  -- Object identification (address split into parts per migration 7)
  adresa_ulice TEXT,
  adresa_obec TEXT,
  adresa_psc TEXT,
  adresa_doplnek TEXT,
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

  -- E1 Inspection checklist
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

  -- Draft support
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('draft', 'complete')),
  draft_step INTEGER,
  created_by UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_inspection_reports_updated_at
  BEFORE UPDATE ON public.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2b) Clients table
-- ---------------------------------------------------------------------------

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ico TEXT,
  address_street TEXT,
  address_city TEXT,
  address_zip TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  notes TEXT,
  client_type TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3) Report child tables (repeatable rows)
-- ---------------------------------------------------------------------------

CREATE TABLE public.report_spd_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  vyrobce TEXT,
  typove_oznaceni TEXT,
  misto_instalace TEXT,
  sort_order INTEGER DEFAULT 0
);

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

CREATE TABLE public.report_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  oznaceni_zkusebni_svorky TEXT,
  odpor_s_vodicem NUMERIC(10, 3),
  odpor_bez_vodice NUMERIC(10, 3),
  prechodovy_odpor NUMERIC(10, 3),
  sort_order INTEGER DEFAULT 0
);


-- 4) User form settings (per-user pinned defaults)
-- ---------------------------------------------------------------------------

CREATE TABLE public.user_form_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  pinned_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_user_form_settings_updated_at
  BEFORE UPDATE ON public.user_form_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 5) Shared library tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.saved_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazev TEXT NOT NULL DEFAULT '',
  ico TEXT NOT NULL DEFAULT '',
  ev_opravneni TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  creator_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_instrument_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazev_pristroje TEXT,
  typ_pristroje TEXT,
  vyrobni_cislo TEXT,
  cislo_kalibracniho_listu TEXT,
  datum_kalibrace TEXT,
  firma_kalibrace TEXT,
  created_by UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  creator_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.technical_description_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  creator_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.common_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_cs TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  creator_display TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_saved_companies_updated_at
  BEFORE UPDATE ON public.saved_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_instrument_templates_updated_at
  BEFORE UPDATE ON public.saved_instrument_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_technical_description_templates_updated_at
  BEFORE UPDATE ON public.technical_description_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_common_defects_updated_at
  BEFORE UPDATE ON public.common_defects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 6) Row Level Security
-- ---------------------------------------------------------------------------

-- Report tables: public access (no auth required)
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_spd_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_measurements ENABLE ROW LEVEL SECURITY;

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

-- User form settings: user-scoped
ALTER TABLE public.user_form_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings"
  ON public.user_form_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own settings"
  ON public.user_form_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own settings"
  ON public.user_form_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own settings"
  ON public.user_form_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Clients: authenticated read, own-row write
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_auth" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Shared library: authenticated read, own-row write
ALTER TABLE public.saved_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_instrument_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_description_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_companies_select_auth" ON public.saved_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "saved_companies_insert_own" ON public.saved_companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "saved_companies_update_own" ON public.saved_companies FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "saved_companies_delete_own" ON public.saved_companies FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "inst_select_auth" ON public.saved_instrument_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "inst_insert_own" ON public.saved_instrument_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "inst_update_own" ON public.saved_instrument_templates FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "inst_delete_own" ON public.saved_instrument_templates FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "tdt_select_auth" ON public.technical_description_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "tdt_insert_own" ON public.technical_description_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tdt_update_own" ON public.technical_description_templates FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "tdt_delete_own" ON public.technical_description_templates FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "def_select_auth" ON public.common_defects FOR SELECT TO authenticated USING (true);
CREATE POLICY "def_insert_own" ON public.common_defects FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "def_update_own" ON public.common_defects FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "def_delete_own" ON public.common_defects FOR DELETE TO authenticated USING (auth.uid() = created_by);


-- 7) Storage bucket for report assets (razítko images, etc.)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-assets', 'report-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'report-assets');
CREATE POLICY "Public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-assets');
