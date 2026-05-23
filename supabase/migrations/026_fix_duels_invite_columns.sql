-- Migration 026: Fix duels table for invite flow
--
-- Migration 024 used CREATE TABLE IF NOT EXISTS, which was skipped because
-- the duels table already existed (created from schema.sql). As a result the
-- `code` and `creator_id` columns were never added, causing every invite
-- creation to fail with "Düello oluşturulamadı."
--
-- This migration safely adds those columns and relaxes NOT NULL constraints
-- so invite-type duels (no opponent yet) can be stored.

-- 1. Add invite columns
ALTER TABLE duels ADD COLUMN IF NOT EXISTS code       text UNIQUE;
ALTER TABLE duels ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Relax NOT NULL constraints for invite-type duels
--    (direct duels still fill all fields; invites leave opponent fields null until accepted)
ALTER TABLE duels ALTER COLUMN challenger_id DROP NOT NULL;
ALTER TABLE duels ALTER COLUMN challenged_id DROP NOT NULL;
ALTER TABLE duels ALTER COLUMN share_token   DROP NOT NULL;

-- 3. Fix INSERT RLS — support both invite duels (creator_id) and direct duels (challenger_id)
DROP POLICY IF EXISTS "duels_insert"                       ON duels;
DROP POLICY IF EXISTS "Authenticated users can create duels" ON duels;

CREATE POLICY "duels_insert" ON duels
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      (creator_id   IS NOT NULL AND creator_id   = auth.uid()) OR
      (challenger_id IS NOT NULL AND challenger_id = auth.uid())
    )
  );
