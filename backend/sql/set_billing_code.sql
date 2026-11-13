-- Human-readable billing codes: BILL-YYYY-NNNNNN.
-- Reference copy — apply manually via the Supabase SQL editor BEFORE
-- deploying the frontend (BILLING_SELECT references billing_code).
-- Old rows keep NULL and the UI falls back to the UUID.

-- 1. Code column
ALTER TABLE public.billings ADD COLUMN IF NOT EXISTS billing_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS billings_billing_code_key
  ON public.billings (billing_code)
  WHERE billing_code IS NOT NULL;

-- 2. Per-year counter table
CREATE TABLE IF NOT EXISTS billing_code_counters (
  year INT PRIMARY KEY,
  last_seq BIGINT NOT NULL DEFAULT 0
);

-- 3. Trigger function
CREATE OR REPLACE FUNCTION set_billing_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()));
  next_seq BIGINT;
BEGIN
  INSERT INTO billing_code_counters (year, last_seq)
  VALUES (current_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_seq = billing_code_counters.last_seq + 1
  RETURNING last_seq INTO next_seq;

  NEW.billing_code := 'BILL-' || current_year || '-' || lpad(next_seq::text, 6, '0');

  RETURN NEW;
END;
$$;

-- 4. Trigger
CREATE TRIGGER trg_set_billing_code
BEFORE INSERT ON billings
FOR EACH ROW
EXECUTE FUNCTION set_billing_code();
