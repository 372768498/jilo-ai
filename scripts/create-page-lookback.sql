-- scripts/create-page-lookback.sql
--
-- Learning-feedback layer: when a generated page reaches 7/14/28 days old,
-- snapshot how it's actually performing (GSC position/ctr/clicks + GA views).
-- The baseline must be captured AS pages age — it can't be reconstructed
-- later — so this starts recording from day one even at low traffic.
--
-- Apply once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS page_performance_lookback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  content_type text NOT NULL,          -- 'seo_article' | 'compare'
  slug text NOT NULL,
  page_url text,                       -- representative URL seen in GSC, if matched
  published_at timestamptz,
  age_bucket integer NOT NULL,         -- 7 | 14 | 28 (days since publish)

  -- GSC snapshot at this age (aggregated across locales for the slug)
  position float,
  ctr float,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  -- GA snapshot
  pageviews integer DEFAULT 0,

  captured_at timestamptz DEFAULT now(),

  UNIQUE (content_type, slug, age_bucket)
);

ALTER TABLE page_performance_lookback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON page_performance_lookback
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_lookback_slug ON page_performance_lookback (slug);
CREATE INDEX idx_lookback_bucket ON page_performance_lookback (age_bucket);
CREATE INDEX idx_lookback_captured ON page_performance_lookback (captured_at DESC);
