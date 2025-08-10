-- Add company logo column if it doesn't exist (safe to run multiple times)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url text;

-- Ensure updated_at triggers on companies and profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_companies_updated_at'
  ) THEN
    CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Storage policies for public read and user-scoped writes on the company-logos bucket
-- Drop existing policies with the same names to keep this migration idempotent
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_public_read'
  ) THEN
    DROP POLICY "company_logos_public_read" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "company_logos_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_upload_own'
  ) THEN
    DROP POLICY "company_logos_upload_own" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "company_logos_upload_own"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_update_own'
  ) THEN
    DROP POLICY "company_logos_update_own" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "company_logos_update_own"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'company_logos_delete_own'
  ) THEN
    DROP POLICY "company_logos_delete_own" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "company_logos_delete_own"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);