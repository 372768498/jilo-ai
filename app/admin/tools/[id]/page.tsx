'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Save, ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

export default function EditToolPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 基础信息
  const [nameEn, setNameEn] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [taglineEn, setTaglineEn] = useState('')
  const [taglineZh, setTaglineZh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionZh, setDescriptionZh] = useState('')
  
  // 详细信息
  const [longDescriptionEn, setLongDescriptionEn] = useState('')
  const [longDescriptionZh, setLongDescriptionZh] = useState('')
  
  // URL 和链接
  const [officialUrl, setOfficialUrl] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  const [affiliatePlatform, setAffiliatePlatform] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  
  // 分类和定价
  const [category, setCategory] = useState('')
  const [pricingType, setPricingType] = useState('freemium')
  const [status, setStatus] = useState('published')
  
  // 评分
  const [rating, setRating] = useState('4.5')
  
  // 数组字段
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [features, setFeatures] = useState<Array<{title: string, description: string}>>([])
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [useCases, setUseCases] = useState<string[]>([])
  
  // 临时输入
  const [newScreenshot, setNewScreenshot] = useState('')
  const [newPro, setNewPro] = useState('')
  const [newCon, setNewCon] = useState('')
  const [newUseCase, setNewUseCase] = useState('')

  // 加载工具数据
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

      // 填充基础信息
      setNameEn(data.name_en || '')
      setNameZh(data.name_zh || '')
      setTaglineEn(data.tagline_en || '')
      setTaglineZh(data.tagline_zh || '')
      setDescriptionEn(data.description_en || '')
      setDescriptionZh(data.description_zh || '')
      
      // 填充详细信息
      setLongDescriptionEn(data.long_description_en || '')
      setLongDescriptionZh(data.long_description_zh || '')
      
      // 填充 URL
      setOfficialUrl(data.official_url || '')
      setAffiliateUrl(data.affiliate_url || '')
      setAffiliatePlatform(data.affiliate_platform || '')
      setVideoUrl(data.video_url || '')
      setLogoUrl(data.logo_url || '')
      
      // 填充分类
      setCategory(data.category || '')
      setPricingType(data.pricing_type || 'freemium')
      setStatus(data.status || 'published')
      
      // 填充评分
      setRating(data.rating?.toString() || '4.5')
      
      // 填充数组字段
      setScreenshots(data.screenshots || [])
      setFeatures(data.features || [])
      setPros(data.pros || [])
      setCons(data.cons || [])
      setUseCases(data.use_cases || [])

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
          long_description_en: longDescriptionEn,
          long_description_zh: longDescriptionZh,
          official_url: officialUrl,
          affiliate_url: affiliateUrl,
          affiliate_platform: affiliatePlatform,
          video_url: videoUrl,
          logo_url: logoUrl,
          category: category,
          pricing_type: pricingType,
          status: status,
          rating: parseFloat(rating),
          screenshots: screenshots,
          features: features,
          pros: pros,
          cons: cons,
          use_cases: useCases,
          last_updated_at: new Date().toISOString()
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tools">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">编辑工具</h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="details">详细介绍</TabsTrigger>
            <TabsTrigger value="features">功能特点</TabsTrigger>
            <TabsTrigger value="media">媒体资源</TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          {/* 基础信息 */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基础信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nameEn">名称 (英文) *</Label>
                    <Input
                      id="nameEn"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameZh">名称 (中文) *</Label>
                    <Input
                      id="nameZh"
                      value={nameZh}
                      onChange={(e) => setNameZh(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taglineEn">标语 (英文) *</Label>
                    <Input
                      id="taglineEn"
                      value={taglineEn}
                      onChange={(e) => setTaglineEn(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taglineZh">标语 (中文) *</Label>
                    <Input
                      id="taglineZh"
                      value={taglineZh}
                      onChange={(e) => setTaglineZh(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="descriptionEn">简短描述 (英文) *</Label>
                    <Textarea
                      id="descriptionEn"
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionZh">简短描述 (中文) *</Label>
                    <Textarea
                      id="descriptionZh"
                      value={descriptionZh}
                      onChange={(e) => setDescriptionZh(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 详细介绍 */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>详细介绍</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="longDescEn">详细介绍 (英文)</Label>
                  <Textarea
                    id="longDescEn"
                    value={longDescriptionEn}
                    onChange={(e) => setLongDescriptionEn(e.target.value)}
                    rows={10}
                    placeholder="支持 HTML 格式..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    可以使用 HTML 标签,如 &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt; 等
                  </p>
                </div>

                <div>
                  <Label htmlFor="longDescZh">详细介绍 (中文)</Label>
                  <Textarea
                    id="longDescZh"
                    value={longDescriptionZh}
                    onChange={(e) => setLongDescriptionZh(e.target.value)}
                    rows={10}
                    placeholder="支持 HTML 格式..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 功能特点 */}
          <TabsContent value="features" className="space-y-6">
            {/* 功能列表 */}
            <Card>
              <CardHeader>
                <CardTitle>核心功能</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="功能标题"
                        value={feature.title}
                        onChange={(e) => {
                          const newFeatures = [...features]
                          newFeatures[index].title = e.target.value
                          setFeatures(newFeatures)
                        }}
                      />
                      <Textarea
                        placeholder="功能描述"
                        value={feature.description}
                        onChange={(e) => {
                          const newFeatures = [...features]
                          newFeatures[index].description = e.target.value
                          setFeatures(newFeatures)
                        }}
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFeatures([...features, { title: '', description: '' }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加功能
                </Button>
              </CardContent>
            </Card>

            {/* 优点 */}
            <Card>
              <CardHeader>
                <CardTitle>优点</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {pros.map((pro, index) => (
                    <Badge key={index} variant="default" className="gap-2">
                      {pro}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setPros(pros.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入优点..."
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newPro.trim()) {
                          setPros([...pros, newPro.trim()])
                          setNewPro('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newPro.trim()) {
                        setPros([...pros, newPro.trim()])
                        setNewPro('')
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 缺点 */}
            <Card>
              <CardHeader>
                <CardTitle>缺点</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {cons.map((con, index) => (
                    <Badge key={index} variant="secondary" className="gap-2">
                      {con}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setCons(cons.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入缺点..."
                    value={newCon}
                    onChange={(e) => setNewCon(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newCon.trim()) {
                          setCons([...cons, newCon.trim()])
                          setNewCon('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newCon.trim()) {
                        setCons([...cons, newCon.trim()])
                        setNewCon('')
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 使用场景 */}
            <Card>
              <CardHeader>
                <CardTitle>使用场景</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {useCases.map((useCase, index) => (
                    <Badge key={index} variant="outline" className="gap-2">
                      {useCase}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setUseCases(useCases.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入使用场景..."
                    value={newUseCase}
                    onChange={(e) => setNewUseCase(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newUseCase.trim()) {
                          setUseCases([...useCases, newUseCase.trim()])
                          setNewUseCase('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newUseCase.trim()) {
                        setUseCases([...useCases, newUseCase.trim()])
                        setNewUseCase('')
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 媒体资源 */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>图片和视频</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="videoUrl">演示视频 URL</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube 或 Bilibili 链接"
                  />
                </div>

                <div>
                  <Label>截图 URL</Label>
                  <div className="space-y-2">
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={screenshot} disabled />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setScreenshots(screenshots.filter((_, i) => i !== index))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入截图 URL..."
                        value={newScreenshot}
                        onChange={(e) => setNewScreenshot(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newScreenshot.trim()) {
                            setScreenshots([...screenshots, newScreenshot.trim()])
                            setNewScreenshot('')
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 设置 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>链接设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="officialUrl">官方网址 *</Label>
                  <Input
                    id="officialUrl"
                    value={officialUrl}
                    onChange={(e) => setOfficialUrl(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="affiliateUrl">分销链接 (Affiliate URL)</Label>
                  <Input
                    id="affiliateUrl"
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    placeholder="如果有分销链接,请填写"
                  />
                </div>

                <div>
                  <Label htmlFor="affiliatePlatform">分销平台</Label>
                  <Input
                    id="affiliatePlatform"
                    value={affiliatePlatform}
                    onChange={(e) => setAffiliatePlatform(e.target.value)}
                    placeholder="例如: AppSumo, Direct, PartnerStack"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>分类和状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">分类 *</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="pricingType">定价类型</Label>
                  <Select value={pricingType} onValueChange={setPricingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">免费</SelectItem>
                      <SelectItem value="freemium">免费 + 付费</SelectItem>
                      <SelectItem value="paid">付费</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rating">评分 (0-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="published">已发布</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Link href="/admin/tools">
            <Button type="button" variant="outline">
              取消
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存更改
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
