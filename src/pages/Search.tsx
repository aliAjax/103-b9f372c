import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Search, Star, Eye, MapPin, User, Tag, X, CalendarDays } from 'lucide-react'
import type { Dream } from '@/types/dream'

interface SearchParams {
  keyword: string
  person: string
  place: string
  dateFrom: string
  dateTo: string
  text: string
}

const emptyParams: SearchParams = {
  keyword: '',
  person: '',
  place: '',
  dateFrom: '',
  dateTo: '',
  text: '',
}

function matchDream(dream: Dream, params: SearchParams): boolean {
  if (params.keyword && !dream.keywords.some(k => k.toLowerCase().includes(params.keyword.toLowerCase()))) return false
  if (params.person && !dream.people.some(p => p.toLowerCase().includes(params.person.toLowerCase()))) return false
  if (params.place && !dream.places.some(p => p.toLowerCase().includes(params.place.toLowerCase()))) return false
  if (params.dateFrom && dream.date < params.dateFrom) return false
  if (params.dateTo && dream.date > params.dateTo) return false
  if (params.text && !dream.text.toLowerCase().includes(params.text.toLowerCase())) return false
  return true
}

export default function SearchPage() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const [params, setParams] = useState<SearchParams>(emptyParams)

  const hasAnyFilter = Object.values(params).some(v => v !== '')

  const results = useMemo(() => {
    if (!hasAnyFilter) return []
    return dreams.filter(d => matchDream(d, params))
  }, [dreams, params, hasAnyFilter])

  const updateParam = (key: keyof SearchParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const clearAll = () => {
    setParams(emptyParams)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <Search size={28} className="text-dreamscape" />
          梦境搜索
        </h1>
        <p className="text-slate-400 text-sm mt-1">按关键词、人物、地点、日期范围和正文内容搜索本地保存的梦境</p>
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Tag size={12} /> 关键词
            </label>
            <input
              type="text"
              value={params.keyword}
              onChange={e => updateParam('keyword', e.target.value)}
              placeholder="搜索关键词标签"
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <User size={12} /> 人物
            </label>
            <input
              type="text"
              value={params.person}
              onChange={e => updateParam('person', e.target.value)}
              placeholder="搜索梦境中出现的人物"
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <MapPin size={12} /> 地点
            </label>
            <input
              type="text"
              value={params.place}
              onChange={e => updateParam('place', e.target.value)}
              placeholder="搜索梦境中的地点"
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <CalendarDays size={12} /> 起始日期
            </label>
            <input
              type="date"
              value={params.dateFrom}
              onChange={e => updateParam('dateFrom', e.target.value)}
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <CalendarDays size={12} /> 结束日期
            </label>
            <input
              type="date"
              value={params.dateTo}
              onChange={e => updateParam('dateTo', e.target.value)}
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Search size={12} /> 正文内容
            </label>
            <input
              type="text"
              value={params.text}
              onChange={e => updateParam('text', e.target.value)}
              placeholder="在梦境正文中搜索"
              className="glow-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>

        {hasAnyFilter && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-dreamscape/10">
            <span className="text-xs text-slate-400">
              {results.length > 0
                ? `找到 ${results.length} 条匹配梦境`
                : '没有匹配的梦境'}
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <X size={12} /> 清除筛选
            </button>
          </div>
        )}
      </div>

      {!hasAnyFilter && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-400 text-sm">输入搜索条件开始查找梦境</p>
        </div>
      )}

      {hasAnyFilter && results.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌀</div>
          <p className="text-slate-400 text-sm">没有找到匹配的梦境，试试其他关键词</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((dream) => (
            <div
              key={dream.id}
              className="glass-card glass-card-hover p-4 space-y-3 cursor-pointer"
              onClick={() => navigate(`/dream/${dream.id}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{dream.date}</span>
                  <span className="text-dreamscape/50">|</span>
                  <span>{dream.wakeTime}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-starlight" />
                    {dream.emotionScore}/5
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="text-dreamscape" />
                    {dream.clarityScore}/5
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {dream.text}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                {dream.people.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <User size={11} className="text-slate-500 shrink-0" />
                    {dream.people.map(p => (
                      <span key={p} className="capsule-tag capsule-tag-default text-[10px]">{p}</span>
                    ))}
                  </div>
                )}
                {dream.places.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MapPin size={11} className="text-slate-500 shrink-0" />
                    {dream.places.map(p => (
                      <span key={p} className="capsule-tag capsule-tag-default text-[10px]">{p}</span>
                    ))}
                  </div>
                )}
                {dream.keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag size={11} className="text-slate-500 shrink-0" />
                    {dream.keywords.map(k => (
                      <span key={k} className="capsule-tag capsule-tag-default text-[10px]">{k}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-dreamscape/60 hover:text-dreamscape transition-colors">点击查看完整内容 →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
