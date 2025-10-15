// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 兼容两种命名（优先使用 NEXT_PUBLIC_*）
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY!;

// 注意：此客户端会在浏览器运行，必须使用 anon/public key
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
