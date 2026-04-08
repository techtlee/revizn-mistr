-- Per-user JSON settings for reusable form data (companies, templates, pinned defaults, etc.)

CREATE TABLE public.user_form_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

CREATE TRIGGER update_user_form_settings_updated_at
  BEFORE UPDATE ON public.user_form_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
