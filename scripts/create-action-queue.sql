-- scripts/create-action-queue.sql
--
-- AI-native message bus between policy layer (strategy_engine)
-- and executor layer (generators). Single source of truth for
-- "what should be generated next and why".
--
-- Apply once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS action_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- What to do and why
  action_type text NOT NULL CHECK (action_type IN (
    'generate_seo_content',
    'generate_comparison',
    'flag_for_review'
  )),
  payload jsonb NOT NULL DEFAULT '{}',
  reason text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- Lifecycle
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'done', 'failed', 'skipped'
  )),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,

  -- Trace
  result jsonb,
  error_reason text,
  picked_at timestamptz,
  completed_at timestamptz,
  source_report_id uuid REFERENCES strategy_reports(id) ON DELETE SET NULL,

  -- Idempotency: same logical action never enqueued twice while pending/in_progress
  dedup_key text NOT NULL UNIQUE,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE action_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON action_queue FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_action_queue_pick ON action_queue (status, priority DESC, created_at);
CREATE INDEX idx_action_queue_type ON action_queue (action_type);
CREATE INDEX idx_action_queue_dedup ON action_queue (dedup_key);
