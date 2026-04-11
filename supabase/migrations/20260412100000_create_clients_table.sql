-- Clients table for CRM functionality
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

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_auth" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link inspection_reports to clients (nullable for backward compatibility)
ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);
