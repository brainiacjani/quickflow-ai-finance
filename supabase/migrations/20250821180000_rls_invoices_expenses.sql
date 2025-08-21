-- Add created_by and created_at columns and apply RLS policies for invoices & expenses

-- Add created_by columns referencing profiles (if they don't already exist)
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.expenses
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add created_at timestamps
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.expenses
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;

-- Owner policy: allow authenticated users to manage rows they created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.polname = 'owners_manage_invoices' AND p.schemaname = 'public' AND p.tablename = 'invoices'
  ) THEN
    CREATE POLICY owners_manage_invoices ON public.invoices
      FOR ALL
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.polname = 'owners_manage_expenses' AND p.schemaname = 'public' AND p.tablename = 'expenses'
  ) THEN
    CREATE POLICY owners_manage_expenses ON public.expenses
      FOR ALL
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END$$;

-- Admin policy: allow authenticated users who have profiles.is_admin = true to manage all rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.polname = 'admins_manage_invoices' AND p.schemaname = 'public' AND p.tablename = 'invoices'
  ) THEN
    CREATE POLICY admins_manage_invoices ON public.invoices
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.polname = 'admins_manage_expenses' AND p.schemaname = 'public' AND p.tablename = 'expenses'
  ) THEN
    CREATE POLICY admins_manage_expenses ON public.expenses
      FOR ALL
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));
  END IF;
END$$;

-- Make sure the authenticated role still has basic privileges (optional, usually configured by Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;

-- Add indexes to help policy subqueries (optional but can help performance)
CREATE INDEX IF NOT EXISTS idx_profiles_id_is_admin ON public.profiles(id, is_admin);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
