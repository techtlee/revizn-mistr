-- Create norms table for storing available technical standards
CREATE TABLE public.norms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT,
  category TEXT NOT NULL CHECK (category IN ('newest', 'current', 'old')),
  category_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for report-norm relationship (many-to-many)
CREATE TABLE public.report_norms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  norm_id UUID NOT NULL REFERENCES public.norms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, norm_id)
);

-- Enable RLS
ALTER TABLE public.norms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_norms ENABLE ROW LEVEL SECURITY;

-- Norms are read-only for all authenticated users (admin manages via Supabase dashboard)
CREATE POLICY "norms_select_all" ON public.norms
  FOR SELECT USING (true);

-- Report norms follow same pattern as inspection_reports (public access)
CREATE POLICY "report_norms_select" ON public.report_norms FOR SELECT USING (true);
CREATE POLICY "report_norms_insert" ON public.report_norms FOR INSERT WITH CHECK (true);
CREATE POLICY "report_norms_update" ON public.report_norms FOR UPDATE USING (true);
CREATE POLICY "report_norms_delete" ON public.report_norms FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX report_norms_report_id_idx ON public.report_norms(report_id);
CREATE INDEX report_norms_norm_id_idx ON public.report_norms(norm_id);
CREATE INDEX norms_category_idx ON public.norms(category);
CREATE INDEX norms_is_active_idx ON public.norms(is_active);

-- Seed data: Nejnovější normy (newest)
INSERT INTO public.norms (code, name, category, category_label, sort_order) VALUES
  ('ČSN 33 2000-5-54 ed.3', 'Elektrické instalace nízkého napětí - Uzemnění a ochranné vodiče', 'newest', 'Nejnovější normy', 1),
  ('ČSN EN IEC 62305-1 ed.3', 'Ochrana před bleskem - Část 1: Obecné principy', 'newest', 'Nejnovější normy', 2),
  ('ČSN EN IEC 62305-2 ed.3', 'Ochrana před bleskem - Část 2: Řízení rizika', 'newest', 'Nejnovější normy', 3),
  ('ČSN EN IEC 62305-3 ed.3', 'Ochrana před bleskem - Část 3: Hmotné škody na stavbách a ohrožení života', 'newest', 'Nejnovější normy', 4),
  ('ČSN EN IEC 62305-4 ed.3', 'Ochrana před bleskem - Část 4: Elektrické a elektronické systémy ve stavbách', 'newest', 'Nejnovější normy', 5);

-- Seed data: Normy stále platné, ale budou končit (current)
INSERT INTO public.norms (code, name, category, category_label, sort_order) VALUES
  ('ČSN EN 62305-1 ed. 2:2011', 'Ochrana před bleskem - Část 1: Obecné principy', 'current', 'Normy stále platné, ale budou končit', 1),
  ('ČSN EN 62305-2 ed. 2:2011', 'Ochrana před bleskem - Část 2: Řízení rizika', 'current', 'Normy stále platné, ale budou končit', 2),
  ('ČSN EN 62305-3 ed. 2:2011', 'Ochrana před bleskem - Část 3: Hmotné škody na stavbách a ohrožení života', 'current', 'Normy stále platné, ale budou končit', 3),
  ('ČSN EN 62305-4 ed. 2:2011', 'Ochrana před bleskem - Část 4: Elektrické a elektronické systémy ve stavbách', 'current', 'Normy stále platné, ale budou končit', 4),
  ('ČSN 33 2000-5-54 ed.2', 'Elektrické instalace nízkého napětí - Uzemnění a ochranné vodiče', 'current', 'Normy stále platné, ale budou končit', 5);

-- Seed data: Předchozí staré normy (old)
INSERT INTO public.norms (code, name, category, category_label, sort_order) VALUES
  ('ČSN 33 1500', 'Elektrotechnické předpisy - Revize elektrických zařízení', 'old', 'Předchozí staré normy', 1),
  ('ČSN 34 1390', 'Předpisy pro ochranu před bleskem', 'old', 'Předchozí staré normy', 2);
