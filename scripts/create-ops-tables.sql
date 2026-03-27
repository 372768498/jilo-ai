-- scripts/create-ops-tables.sql

-- 运营日志表
CREATE TABLE IF NOT EXISTS ops_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  message text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ops_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON ops_logs FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_ops_logs_job ON ops_logs(job_name);
CREATE INDEX idx_ops_logs_created ON ops_logs(created_at DESC);

-- GA 分析数据表
CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  page_path text NOT NULL,
  pageviews integer DEFAULT 0,
  unique_pageviews integer DEFAULT 0,
  avg_session_duration float DEFAULT 0,
  bounce_rate float DEFAULT 0,
  traffic_source text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, page_path, traffic_source)
);

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON analytics_daily FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_analytics_date ON analytics_daily(date DESC);
CREATE INDEX idx_analytics_page ON analytics_daily(page_path);

-- GSC 搜索数据表
CREATE TABLE IF NOT EXISTS search_console_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  query text NOT NULL,
  page text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr float DEFAULT 0,
  position float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, query, page)
);

ALTER TABLE search_console_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON search_console_daily FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_gsc_date ON search_console_daily(date DESC);
CREATE INDEX idx_gsc_query ON search_console_daily(query);

-- 策略报告表
CREATE TABLE IF NOT EXISTS strategy_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date date NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('daily', 'weekly')),
  content jsonb DEFAULT '{}',
  actions_taken jsonb DEFAULT '[]',
  suggestions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strategy_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON strategy_reports FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_reports_date ON strategy_reports(report_date DESC);
CREATE INDEX idx_reports_type ON strategy_reports(report_type);
