"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ToolEditForm({ tool }: { tool: any }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name_en: tool.name_en || '',
    name_zh: tool.name_zh || '',
    tagline_en: tool.tagline_en || '',
    tagline_zh: tool.tagline_zh || '',
    description_en: tool.description_en || '',
    description_zh: tool.description_zh || '',
    official_url: tool.official_url || '',
    affiliate_url: tool.affiliate_url || '',
    affiliate_platform: tool.affiliate_platform || '',
    pricing_type: tool.pricing_type || 'freemium',
    status: tool.status || 'draft',
  })
  
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const response = await fetch('/api/admin/tools/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tool.id, ...formData })
      })
      
      if (response.ok) {
        alert('Tool updated successfully!')
        router.push('/admin/tools')
      } else {
        alert('Failed to update tool')
      }
    } catch (error) {
      alert('Error updating tool')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name (EN)</label>
          <input type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})}
                 className="w-full border rounded px-3 py-2" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Name (ZH)</label>
          <input type="text" value={formData.name_zh} onChange={e => setFormData({...formData, name_zh: e.target.value})}
                 className="w-full border rounded px-3 py-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tagline (EN)</label>
          <input type="text" value={formData.tagline_en} onChange={e => setFormData({...formData, tagline_en: e.target.value})}
                 className="w-full border rounded px-3 py-2" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tagline (ZH)</label>
          <input type="text" value={formData.tagline_zh} onChange={e => setFormData({...formData, tagline_zh: e.target.value})}
                 className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Description (EN)</label>
        <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-24" />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Description (ZH)</label>
        <textarea value={formData.description_zh} onChange={e => setFormData({...formData, description_zh: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-24" />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Official URL</label>
          <input type="url" value={formData.official_url} onChange={e => setFormData({...formData, official_url: e.target.value})}
                 className="w-full border rounded px-3 py-2" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-green-600">Affiliate URL ⭐</label>
          <input type="url" value={formData.affiliate_url} onChange={e => setFormData({...formData, affiliate_url: e.target.value})}
                 className="w-full border-2 border-green-200 rounded px-3 py-2 focus:border-green-500" 
                 placeholder="Add your affiliate link here" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Affiliate Platform</label>
          <input type="text" value={formData.affiliate_platform} onChange={e => setFormData({...formData, affiliate_platform: e.target.value})}
                 className="w-full border rounded px-3 py-2" placeholder="e.g., AppSumo, Direct" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Pricing Type</label>
          <select value={formData.pricing_type} onChange={e => setFormData({...formData, pricing_type: e.target.value})}
                  className="w-full border rounded px-3 py-2">
            <option value="free">Free</option>
            <option value="freemium">Freemium</option>
            <option value="paid">Paid</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full border rounded px-3 py-2">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button type="submit" disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.push('/admin/tools')}
                className="px-6 py-2 border rounded hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}