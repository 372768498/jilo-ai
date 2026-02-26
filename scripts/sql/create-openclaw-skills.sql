-- OpenClaw Skills 表
CREATE TABLE openclaw_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_zh TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  author TEXT,
  github_url TEXT,
  clawhub_url TEXT,
  install_command TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_openclaw_skills_slug ON openclaw_skills(slug);
CREATE INDEX idx_openclaw_skills_category ON openclaw_skills(category);
CREATE INDEX idx_openclaw_skills_featured ON openclaw_skills(featured);

-- RLS
ALTER TABLE openclaw_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON openclaw_skills FOR SELECT USING (true);
