import { createServerClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createServerClient()
  
  const { count: totalTools } = await supabase.from('tools').select('*', { count: 'exact', head: true })
  const { count: pendingTools } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'draft')
  const { count: publishedTools } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Jilo.ai Admin</h1>
          <Link href="/" className="text-indigo-600 hover:underline">Visit Site</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">{totalTools || 0}</div>
            <div className="text-gray-600">Total Tools</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-yellow-600 mb-2">{pendingTools || 0}</div>
            <div className="text-gray-600">Pending Review</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-4xl font-bold text-green-600 mb-2">{publishedTools || 0}</div>
            <div className="text-gray-600">Published</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/tools" className="block bg-white rounded-lg shadow p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2">Manage Tools</h3>
            <p className="text-gray-600">View, edit, and publish tools</p>
          </Link>
          
          <Link href="/admin/tools/new" className="block bg-white rounded-lg shadow p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2">Add New Tool</h3>
            <p className="text-gray-600">Manually add a new AI tool</p>
          </Link>
        </div>
      </div>
    </div>
  )
}