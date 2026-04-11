-- Add status column to inspection_reports for draft support
ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'complete'
    CHECK (status IN ('draft', 'complete'));

-- Add draft_step to remember where user left off
ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS draft_step INTEGER;

-- Add created_by to track report ownership (needed for draft filtering)
ALTER TABLE public.inspection_reports
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
