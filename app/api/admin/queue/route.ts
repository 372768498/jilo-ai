import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET: list pending monetization-gap flags, joined to their tool id so the
// UI can deep-link to the tool editor. Sorted by outbound clicks desc.
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request, process.env.ADMIN_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: flags, error } = await supabaseAdmin
      .from('action_queue')
      .select('id, priority, payload, reason, created_at')
      .eq('action_type', 'flag_for_review')
      .eq('status', 'pending')
      .eq('payload->>subtype', 'monetization_gap')
    if (error) throw error

    const rows = flags || []
    const slugs = rows.map((f: any) => f.payload?.slug).filter(Boolean)

    const slugToTool: Record<string, any> = {}
    if (slugs.length) {
      const { data: tools } = await supabaseAdmin
        .from('tools')
        .select('id, slug, name_en, affiliate_url')
        .in('slug', slugs)
      for (const t of tools || []) slugToTool[t.slug] = t
    }

    const items = rows
      .map((f: any) => {
        const slug = f.payload?.slug
        const tool = slugToTool[slug]
        return {
          id: f.id,
          slug,
          name: f.payload?.name || slug,
          clicks: f.payload?.click_count ?? 0,
          priority: f.priority,
          reason: f.reason,
          tool_id: tool?.id || null,
          created_at: f.created_at,
        }
      })
      .sort((a: any, b: any) => b.clicks - a.clicks)

    const totalClicks = items.reduce((s: number, i: any) => s + (i.clicks || 0), 0)
    return NextResponse.json({ items, count: items.length, totalClicks })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: manually resolve a flag — 'done' (handled) or 'skipped' (won't pursue).
// Auto-resolution still happens in monitor_agent when affiliate_url is added.
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request, process.env.ADMIN_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status, note } = await request.json()
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (!['done', 'skipped'].includes(status)) {
      return NextResponse.json({ error: "status must be 'done' or 'skipped'" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('action_queue')
      .update({
        status,
        result: status === 'done' ? { resolved: 'manual', note: note || null } : null,
        error_reason: status === 'skipped' ? (note || 'dismissed by admin') : null,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
