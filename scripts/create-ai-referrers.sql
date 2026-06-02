-- Track external AI-answer-engine traffic such as ChatGPT, Perplexity,
-- Claude, Gemini, Copilot, Poe, and similar referrers.

CREATE TABLE IF NOT EXISTS analytics_referrers_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  page_path text NOT NULL,
  source_medium text NOT NULL,
  source_type text DEFAULT 'referrer',
  pageviews integer DEFAULT 0,
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, page_path, source_medium)
);

ALTER TABLE analytics_referrers_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON analytics_referrers_daily FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_referrers_date ON analytics_referrers_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_referrers_source_type ON analytics_referrers_daily(source_type);
CREATE INDEX IF NOT EXISTS idx_referrers_page_path ON analytics_referrers_daily(page_path);
