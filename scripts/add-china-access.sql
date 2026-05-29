-- scripts/add-china-access.sql
--
-- China-accessibility is jilo's differentiator. Store a machine value on each
-- tool; the UI localizes it. Values:
--   'direct'  — usable from mainland China without a VPN
--   'proxy'   — needs a VPN/proxy
--   'blocked' — not usable even with a proxy (account/region banned)
--   null      — unknown / not yet judged
-- Populated by crawler/china_access_agent.py.
--
-- Apply once in Supabase SQL editor.

ALTER TABLE tools ADD COLUMN IF NOT EXISTS china_access text;
CREATE INDEX IF NOT EXISTS idx_tools_china_access ON tools (china_access);
