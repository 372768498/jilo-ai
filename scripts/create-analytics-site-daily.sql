-- scripts/create-analytics-site-daily.sql
-- Site-level GA daily totals used by analytics_collector.py, traffic_growth_agent.py,
-- daily_report.py, and weekly_report.py.

CREATE TABLE IF NOT EXISTS analytics_site_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  total_pageviews integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_site_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON analytics_site_daily;
CREATE POLICY "Service role full access"
  ON analytics_site_daily
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_analytics_site_date
  ON analytics_site_daily(date DESC);
