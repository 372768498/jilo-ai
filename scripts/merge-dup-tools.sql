-- Merge duplicate Image Generation tools, then remove the redundant draft rows.
-- Strategy: keep the PUBLISHED row (live URL + click_count), copy the rich content
-- (long_description / features / use_cases) from the DRAFT row into it, mark featured.
-- Backup of all 4 rows before running: scripts/backup-dup-tools.json
-- 301 redirects for the deleted draft slugs live in next.config.js.
-- Run in Supabase SQL Editor. Wrapped in a transaction so it is all-or-nothing.

begin;

-- DALL-E 3: keep `dall-e-3` (published, 34 clicks) <- rich content from `dalle-3` (draft)
update tools dst set
  long_description_en = src.long_description_en,
  long_description_zh = src.long_description_zh,
  features            = src.features,
  use_cases           = src.use_cases,
  is_featured         = true,
  updated_at          = now()
from tools src
where dst.slug = 'dall-e-3' and src.slug = 'dalle-3';

-- Leonardo: keep `leonardoai` (published, 33 clicks) <- rich content from `leonardo-ai` (draft)
update tools dst set
  long_description_en = src.long_description_en,
  long_description_zh = src.long_description_zh,
  features            = src.features,
  use_cases           = src.use_cases,
  is_featured         = true,
  updated_at          = now()
from tools src
where dst.slug = 'leonardoai' and src.slug = 'leonardo-ai';

-- Drop the redundant draft duplicates (301'd at the edge via next.config.js)
delete from tools where slug in ('dalle-3', 'leonardo-ai');

commit;

-- Sanity check (run separately after commit):
--   select slug, status, is_featured, click_count, length(long_description_en) as desc_len
--   from tools where slug in ('dall-e-3','dalle-3','leonardoai','leonardo-ai');
--   expect: only dall-e-3 + leonardoai remain, each with desc_len > 1000 and is_featured = true.
