import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthorized } from "@/lib/admin-auth";
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request, process.env.ADMIN_KEY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "Missing tool id" }, { status: 400 })
    }
    
    if (updateData.status === 'published' && !updateData.published_at) {
      updateData.published_at = new Date().toISOString()
    }
    
    const { data: updated, error } = await supabaseAdmin
      .from('tools')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
