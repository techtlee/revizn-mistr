-- Shared templates (visible to all authenticated users) + per-user pinned defaults only in user_form_settings

-- 1) Shared tables
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

-- RLS: everyone authenticated can read; create as self; update/delete own rows
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

CREATE TRIGGER update_saved_companies_updated_at
  BEFORE UPDATE ON public.saved_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_instrument_templates_updated_at
  BEFORE UPDATE ON public.saved_instrument_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_technical_description_templates_updated_at
  BEFORE UPDATE ON public.technical_description_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_common_defects_updated_at
  BEFORE UPDATE ON public.common_defects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) user_form_settings: pinned_defaults column + migrate from settings JSON + drop settings
ALTER TABLE public.user_form_settings ADD COLUMN IF NOT EXISTS pinned_defaults JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.user_form_settings
SET pinned_defaults = COALESCE(settings->'pinnedDefaults', '{}'::jsonb)
WHERE settings IS NOT NULL;

-- Copy old per-user JSON lists into shared tables (each row attributed to that user).
-- Use gen_random_uuid() when stored id is not a valid UUID (legacy client ids).
INSERT INTO public.saved_companies (id, nazev, ico, ev_opravneni, created_by, creator_display)
SELECT
  CASE
    WHEN (elem->>'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN (elem->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  COALESCE(elem->>'nazev', ''),
  COALESCE(elem->>'ico', ''),
  COALESCE(elem->>'ev_opravneni', ''),
  ufs.user_id,
  NULL
FROM public.user_form_settings ufs,
  jsonb_array_elements(COALESCE(ufs.settings->'savedCompanies', '[]'::jsonb)) AS elem
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.saved_instrument_templates (
  id, nazev_pristroje, typ_pristroje, vyrobni_cislo, cislo_kalibracniho_listu, datum_kalibrace, firma_kalibrace, created_by, creator_display
)
SELECT
  CASE
    WHEN (elem->>'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN (elem->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  NULLIF(elem->>'nazev_pristroje', ''),
  NULLIF(elem->>'typ_pristroje', ''),
  NULLIF(elem->>'vyrobni_cislo', ''),
  NULLIF(elem->>'cislo_kalibracniho_listu', ''),
  NULLIF(elem->>'datum_kalibrace', ''),
  NULLIF(elem->>'firma_kalibrace', ''),
  ufs.user_id,
  NULL
FROM public.user_form_settings ufs,
  jsonb_array_elements(COALESCE(ufs.settings->'savedMeasuringInstruments', '[]'::jsonb)) AS elem
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.technical_description_templates (id, name, body, created_by, creator_display)
SELECT
  CASE
    WHEN (elem->>'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN (elem->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  COALESCE(elem->>'name', ''),
  COALESCE(elem->>'body', ''),
  ufs.user_id,
  NULL
FROM public.user_form_settings ufs,
  jsonb_array_elements(COALESCE(ufs.settings->'technicalDescriptionTemplates', '[]'::jsonb)) AS elem
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.common_defects (id, label_cs, created_by, creator_display)
SELECT
  CASE
    WHEN (elem->>'id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN (elem->>'id')::uuid
    ELSE gen_random_uuid()
  END,
  COALESCE(elem->>'labelCs', COALESCE(elem->>'label_cs', '')),
  ufs.user_id,
  NULL
FROM public.user_form_settings ufs,
  jsonb_array_elements(COALESCE(ufs.settings->'commonDefects', '[]'::jsonb)) AS elem
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_form_settings DROP COLUMN IF EXISTS settings;
