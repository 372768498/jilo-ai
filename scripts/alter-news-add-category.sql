-- scripts/alter-news-add-category.sql
ALTER TABLE news ADD COLUMN IF NOT EXISTS category_tags text[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_news_category ON news USING GIN(category_tags);
