-- Apply manually via the Supabase SQL editor.
-- The live Supabase schema is the source of truth.
--
-- Categories remain compatible with services.category, which currently uses
-- the public.service_category enum. The enum value is the stable key so this
-- migration does not require changing the service RPCs or frontend payloads.

CREATE TABLE IF NOT EXISTS public.service_categories (
    category public.service_category PRIMARY KEY,
    name VARCHAR NOT NULL,
    description VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_categories
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO public.service_categories (category, name)
VALUES
    ('tax_filing'::public.service_category, 'Tax Filing'),
    ('business_registration'::public.service_category, 'Business Registration'),
    ('other'::public.service_category, 'Other')
ON CONFLICT (category) DO NOTHING;

-- Fail before adding the constraint if existing rows contain a category that
-- has not been registered in the lookup table.
DO $$
DECLARE
    missing_categories TEXT;
BEGIN
    SELECT string_agg(DISTINCT s.category::TEXT, ', ' ORDER BY s.category::TEXT)
    INTO missing_categories
    FROM public.services AS s
    LEFT JOIN public.service_categories AS c
      ON c.category = s.category
    WHERE s.category IS NOT NULL
      AND c.category IS NULL;

    IF missing_categories IS NOT NULL THEN
        RAISE EXCEPTION
            'Cannot add services.category foreign key; missing service categories: %',
            missing_categories;
    END IF;
END $$;

ALTER TABLE public.services
    DROP CONSTRAINT IF EXISTS services_category_fkey,
    ADD CONSTRAINT services_category_fkey
        FOREIGN KEY (category)
        REFERENCES public.service_categories (category);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.service_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;

DROP POLICY IF EXISTS "service categories are readable by authenticated users"
    ON public.service_categories;
CREATE POLICY "service categories are readable by authenticated users"
    ON public.service_categories
    FOR SELECT
    TO authenticated
    USING (is_active OR public.is_firm_user());

DROP POLICY IF EXISTS "service categories are manageable by admins"
    ON public.service_categories;
CREATE POLICY "service categories are manageable by admins"
    ON public.service_categories
    FOR ALL
    TO authenticated
    USING (public.has_role('admin'))
    WITH CHECK (public.has_role('admin'));
