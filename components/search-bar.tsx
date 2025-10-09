'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Tool {
  id: string
  slug: string
  name_en: string
  name_zh: string | null
  tagline_en: string | null
  tagline_zh: string | null
  description_en: string | null
  description_zh: string | null
  logo_url: string | null
  pricing_type: string | null
}

interface SearchBarProps {
  locale: string
  placeholder?: string
}

export default function SearchBar({ locale, placeholder }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const isZh = locale === 'zh'

  // 点击外部关闭搜索结果
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 搜索功能
  useEffect(() => {
    const searchTools = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      try {
        // 搜索名称、标语、描述
        // 去除空格,支持更模糊的搜索
        const searchQuery = query.trim().replace(/\s+/g, '')

        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('status', 'published')
          .or(`name_en.ilike.%${searchQuery}%,name_zh.ilike.%${searchQuery}%,tagline_en.ilike.%${query}%,tagline_zh.ilike.%${query}%,description_en.ilike.%${query}%,description_zh.ilike.%${query}%`)
          .limit(8)

        if (!error && data) {
          setResults(data)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchTools, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || (isZh ? '搜索AI工具...' : 'Search AI tools...')}
          className="pl-12 pr-12 h-14 text-lg rounded-full shadow-lg border-2 focus:border-primary"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {showResults && (
        <Card className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto shadow-xl z-50 bg-white dark:bg-gray-900">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              {isZh ? '搜索中...' : 'Searching...'}
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((tool) => {
                const name = isZh ? tool.name_zh : tool.name_en
                const tagline = isZh ? tool.tagline_zh : tool.tagline_en

                return (
                  <Link
                    key={tool.id}
                    href={`/${locale}/tools/${tool.slug}`}
                    onClick={() => setShowResults(false)}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      {tool.logo_url && (
                        <img
                          src={tool.logo_url}
                          alt={name || ''}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {name || tool.name_en}
                          </h4>
                          {tool.pricing_type && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {tool.pricing_type}
                            </Badge>
                          )}
                        </div>
                        {tagline && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {tagline}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
              <div className="mt-2 pt-2 border-t text-center">
                <Link
                  href={`/${locale}/tools`}
                  onClick={() => setShowResults(false)}
                  className="text-sm text-primary hover:underline"
                >
                  {isZh ? '查看所有工具 →' : 'View all tools →'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              {isZh ? '未找到相关工具' : 'No tools found'}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}