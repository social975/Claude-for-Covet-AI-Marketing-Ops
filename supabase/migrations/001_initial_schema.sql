-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- workflow_tasks: process inventory fields per role + system kv
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     TEXT        NOT NULL, -- 'karli' | 'johnathan' | ... | '__system__'
  field_key   TEXT        NOT NULL, -- inventory field name or '__tool_scores__'
  value       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id, field_key)
);

ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their workflow_tasks"
  ON workflow_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- kpis: user-defined key performance indicators
-- ============================================================
CREATE TABLE IF NOT EXISTS kpis (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  value       NUMERIC,
  target      NUMERIC,
  unit        TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their kpis"
  ON kpis FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- quick_wins: quick win items with status tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS quick_wins (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  impact      TEXT,
  effort      TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending', -- pending | in_progress | done
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quick_wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their quick_wins"
  ON quick_wins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- notes: section-scoped freeform notes
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section     TEXT,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER workflow_tasks_updated_at
  BEFORE UPDATE ON workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER kpis_updated_at
  BEFORE UPDATE ON kpis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER quick_wins_updated_at
  BEFORE UPDATE ON quick_wins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
