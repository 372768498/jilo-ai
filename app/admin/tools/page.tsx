import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default async function ToolsListPage() {
  const supabase = await createServerClient()
  const { data: tools } = await supabase.from('tools').select('*').order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Tools</h1>
          <div className="flex gap-4">
            <Link href="/admin/tools/new" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add New</Link>
            <Link href="/admin" className="px-4 py-2 border rounded hover:bg-gray-50">Back</Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tool</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tools?.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{tool.name_en}</div>
                    <div className="text-sm text-gray-500">{tool.tagline_en}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tool.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{tool.pricing_type}</td>
                  <td className="px-6 py-4">
                    {tool.affiliate_url ? (
                      <span className="text-green-600 text-sm">✓ Set</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/tools/${tool.id}`} className="text-indigo-600 hover:underline text-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}