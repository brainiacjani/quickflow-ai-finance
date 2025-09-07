-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  price numeric,
  stock integer DEFAULT 0,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_created_by_idx ON public.inventory (created_by);

-- Trigger to update updated_at (reuse existing function if present)
-- If the function already exists, this will still succeed because we're not redefining it here.
DROP TRIGGER IF EXISTS set_updated_at_inventory ON public.inventory;
CREATE TRIGGER set_updated_at_inventory
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- NOTE: Add RLS policies in Supabase dashboard to restrict access in production.
