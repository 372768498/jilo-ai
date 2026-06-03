-- scripts/create-growth-state.sql
--
-- Shared decision-state store: the single table that reconnects the three
-- feedback edges the 2026-06-03 audit found dead (written but never read):
--   1. per (source, mode) PV effectiveness  -> rank3 budget allocation
--   2. autonomy verdict + blockers          -> rank4 quota gating
--   3. keyword/mode suppress list            -> rank3/rank9 disinvestment
--
-- It is a thin key/jsonb store so rank1/3/4 can extend the shape without
-- schema churn. Read at turn-head by traffic_growth_agent.py and
-- strategy_engine.py via crawler/growth_state.py.
--
-- Apply once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS growth_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE growth_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON growth_state;
CREATE POLICY "Service role full access"
  ON growth_state
  FOR ALL
  USING (auth.role() = 'service_role');
