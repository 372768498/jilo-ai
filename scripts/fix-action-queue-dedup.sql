-- scripts/fix-action-queue-dedup.sql
--
-- The original table-wide UNIQUE(dedup_key) permanently locked out a
-- logical action once any row existed for it — so a failed action could
-- never be retried or re-enqueued. Relax it: dedup is only enforced while
-- an action is actively queued (pending|in_progress). Failed/done/skipped
-- rows stay as history and never block a fresh attempt.
--
-- Apply once in Supabase SQL editor.

-- 1. Drop the auto-created UNIQUE constraint from `dedup_key text ... UNIQUE`
ALTER TABLE action_queue DROP CONSTRAINT IF EXISTS action_queue_dedup_key_key;

-- 2. Drop the plain dedup index (replaced by the partial unique one below)
DROP INDEX IF EXISTS idx_action_queue_dedup;

-- 3. Enforce uniqueness only among actively-queued rows
CREATE UNIQUE INDEX idx_action_queue_dedup_active
  ON action_queue (dedup_key)
  WHERE status IN ('pending', 'in_progress');

-- 4. One-time cleanup: clear the dead failed rows from the parser bug
DELETE FROM action_queue WHERE status = 'failed';
