-- Migration 037: premium polish — subscriptions RLS, indices, monthly freeze grant

-- ── 1. subscriptions table: missing write policies for service role ─────────
-- Service role bypasses RLS so technically not needed, but adding explicit
-- policies for clarity + potential future user-facing reads.
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ── 2. Index for stripe_customer_id lookups (webhook) ──────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── 3. Premium expiry index — useful for cron job that flips lapsed ────────
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until
  ON public.profiles (premium_until)
  WHERE is_premium = true;

-- ── 4. Monthly streak freeze grant for premium users ────────────────────────
-- Run from a cron monthly to top up premium users to 3 freezes.
CREATE OR REPLACE FUNCTION public.grant_premium_freezes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles
  SET streak_freeze_count = 3
  WHERE is_premium = true
    AND (premium_until IS NULL OR premium_until > now())
    AND COALESCE(streak_freeze_count, 0) < 3;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ── 5. Auto-expire lapsed premium ────────────────────────────────────────────
-- Run from a cron daily to flip is_premium = false when premium_until passes.
CREATE OR REPLACE FUNCTION public.expire_lapsed_premium()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles
  SET is_premium = false
  WHERE is_premium = true
    AND premium_until IS NOT NULL
    AND premium_until < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
