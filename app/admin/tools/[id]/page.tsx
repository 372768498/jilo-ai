import { createServerClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { ToolEditForm } from '@/components/admin/ToolEditForm'

export default async function EditToolPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const { data: tool } = await supabase.from('tools').select('*').eq('id', params.id).single()
  
  if (!tool) redirect('/admin/tools')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Edit Tool: {tool.name_en}</h1>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <ToolEditForm tool={tool} />
      </div>
    </div>
  )
}