CREATE TABLE public.technician_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  certificate_number TEXT,
  authorization_number TEXT,
  signature_data TEXT,
  stamp_url TEXT,
  phone TEXT,
  email TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "technician_profiles_select_own" ON public.technician_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "technician_profiles_insert_own" ON public.technician_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "technician_profiles_update_own" ON public.technician_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "technician_profiles_delete_own" ON public.technician_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_technician_profiles_updated_at
  BEFORE UPDATE ON public.technician_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one default profile per user via partial unique index
CREATE UNIQUE INDEX technician_profiles_one_default_per_user
  ON public.technician_profiles (user_id) WHERE is_default = true;
