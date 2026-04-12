-- Merge duplicate clients (same ico + name) keeping the oldest record.
-- Re-link reports and then delete the duplicates.

DO $$
DECLARE
  _keep   UUID;
  _dup    UUID;
  _row    RECORD;
BEGIN
  FOR _row IN
    SELECT name, ico,
           array_agg(id ORDER BY created_at ASC) AS ids
    FROM   public.clients
    WHERE  ico IS NOT NULL AND ico <> ''
    GROUP  BY name, ico
    HAVING count(*) > 1
  LOOP
    _keep := _row.ids[1];
    FOR i IN 2 .. array_length(_row.ids, 1) LOOP
      _dup := _row.ids[i];
      UPDATE public.inspection_reports SET client_id = _keep WHERE client_id = _dup;
      DELETE FROM public.clients WHERE id = _dup;
    END LOOP;
  END LOOP;
END;
$$;

-- Partial unique index: prevent future duplicates on (ico, name) when ico is filled
CREATE UNIQUE INDEX IF NOT EXISTS clients_ico_name_unique
  ON public.clients (ico, name)
  WHERE ico IS NOT NULL AND ico <> '';
