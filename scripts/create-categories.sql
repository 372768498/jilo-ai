-- scripts/create-categories.sql
--
-- A `categories` table already exists (15 clean categories: video, image,
-- writing, code, audio, design, marketing, productivity, chat, ...) but it
-- was never wired to tools (tools.category_id is null everywhere). We reuse
-- it for topic-cluster hubs. The only schema change needed is a canonical
-- category pointer on tools, backfilled by mapping the messy free-text
-- tools.category onto the existing category slugs.
--
-- Apply once in Supabase SQL editor.

ALTER TABLE tools ADD COLUMN IF NOT EXISTS category_canonical text;
CREATE INDEX IF NOT EXISTS idx_tools_category_canonical ON tools (category_canonical);
