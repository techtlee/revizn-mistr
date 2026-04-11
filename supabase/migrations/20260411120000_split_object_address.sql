-- Rozdělení adresy objektu na ulice / obec / PSČ / doplňující údaje

ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS adresa_ulice TEXT,
  ADD COLUMN IF NOT EXISTS adresa_obec TEXT,
  ADD COLUMN IF NOT EXISTS adresa_psc TEXT,
  ADD COLUMN IF NOT EXISTS adresa_doplnek TEXT;

UPDATE public.inspection_reports
SET adresa_ulice = nazev_adresa_objektu
WHERE nazev_adresa_objektu IS NOT NULL;

ALTER TABLE public.inspection_reports DROP COLUMN IF EXISTS nazev_adresa_objektu;
