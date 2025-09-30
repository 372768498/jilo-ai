import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/client'

export default function NewToolPage() {
  async function createTool(formData: FormData) {
    "use server"
    
    const supabase = await createServerClient()
    
    const toolData = {
      slug: formData.get('name_en')?.toString().toLowerCase().replace(/\s+/g, '-') || '',
      name_en: formData.get('name_en')?.toString() || '',
      name_zh: formData.get('name_zh')?.toString() || '',
      tagline_en: formData.get('tagline_en')?.toString() || '',
      official_url: formData.get('official_url')?.toString() || '',
      pricing_type: formData.get('pricing_type')?.toString() || 'freemium',
      status: 'draft',
      created_at: new Date().toISOString()
    }
    
    await supabase.from('tools').insert(toolData)
    redirect('/admin/tools')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Add New Tool</h1>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <form action={createTool} className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name*</label>
              <input name="name_en" type="text" required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Official URL*</label>
              <input name="official_url" type="url" required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pricing</label>
              <select name="pricing_type" className="w-full border rounded px-3 py-2">
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded">Create</button>
            <a href="/admin/tools" className="px-6 py-2 border rounded">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}