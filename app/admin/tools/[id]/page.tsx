'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EditToolPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [nameEn, setNameEn] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [taglineEn, setTaglineEn] = useState('')
  const [taglineZh, setTaglineZh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionZh, setDescriptionZh] = useState('')
  const [officialUrl, setOfficialUrl] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliatePlatform, setAffiliatePlatform] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [category, setCategory] = useState('')
  const [pricingType, setPricingType] = useState('freemium')
  const [status, setStatus] = useState('published')

  useEffect(() => {
    loadTool()
  }, [params.id])

  async function loadTool() {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        alert('工具不存在')
        router.push('/admin/tools')
        return
      }

      setNameEn(data.name_en || '')
      setNameZh(data.name_zh || '')
      setTaglineEn(data.tagline_en || '')
      setTaglineZh(data.tagline_zh || '')
      setDescriptionEn(data.description_en || '')
      setDescriptionZh(data.description_zh || '')
      setOfficialUrl(data.official_url || '')
      setAffiliateUrl(data.affiliate_url || '')
      setAffiliatePlatform(data.affiliate_platform || '')
      setLogoUrl(data.logo_url || '')
      setCategory(data.category || '')
      setPricingType(data.pricing_type || 'freemium')
      setStatus(data.status || 'published')

    } catch (error) {
      console.error('Error loading tool:', error)
      alert('加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('tools')
        .update({
          name_en: nameEn,
          name_zh: nameZh,
          tagline_en: taglineEn,
          tagline_zh: taglineZh,
          description_en: descriptionEn,
          description_zh: descriptionZh,
          official_url: officialUrl,
          affiliate_url: affiliateUrl,
          affiliate_platform: affiliatePlatform,
          logo_url: logoUrl,
          category: category,
          pricing_type: pricingType,
          status: status,
        })
        .eq('id', params.id)

      if (error) throw error

      alert('保存成功!')
      router.push('/admin/tools')
    } catch (error) {
      console.error('Error updating tool:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/tools" className="text-blue-600 hover:underline">
          ← 返回
        </Link>
        <h1 className="text-3xl font-bold mt-2">编辑工具</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">基础信息</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">名称 (英文) *</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">名称 (中文) *</label>
              <input
                type="text"
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">标语 (英文) *</label>
              <input
                type="text"
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标语 (中文) *</label>
              <input
                type="text"
                value={taglineZh}
                onChange={(e) => setTaglineZh(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">描述 (英文) *</label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述 (中文) *</label>
              <textarea
                value={descriptionZh}
                onChange={(e) => setDescriptionZh(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">链接设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">官方网址 *</label>
              <input
                type="url"
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">分销链接 (Affiliate URL) ⭐</label>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="如果有分销链接,请填写"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">分销平台</label>
              <input
                type="text"
                value={affiliatePlatform}
                onChange={(e) => setAffiliatePlatform(e.target.value)}
                placeholder="例如: AppSumo, Direct"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">分类和状态</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">分类 *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">定价类型</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="free">免费</option>
                <option value="freemium">免费 + 付费</option>
                <option value="paid">付费</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/tools"
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  )
}