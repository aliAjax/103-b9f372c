import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Search, Star, Eye, MapPin, User, Tag, X, CalendarDays, BookmarkPlus, BookOpen, Edit2, Trash2, Check, ChevronDown, Download } from 'lucide-react'
import type { SearchView, SearchViewFilters } from '@/types/dream'
import {
  filterDreamsBySearchParams,
  hasAnyFilter,
  getSearchViewDescription,
  createEmptySearchParams,
  areFiltersEqual,
} from '@/domain/searchFilter'
import { getAllTags, getTagSuggestions, type TagType } from '@/domain/tagStats'

type SearchParams = SearchViewFilters

export default function SearchPage() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const searchViews = useDreamStore((s) => s.searchViews)
  const createSearchView = useDreamStore((s) => s.createSearchView)
  const updateSearchView = useDreamStore((s) => s.updateSearchView)
  const deleteSearchView = useDreamStore((s) => s.deleteSearchView)

  const [params, setParams] = useState<SearchParams>(createEmptySearchParams())
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const [editingViewName, setEditingViewName] = useState('')

  const allTags = useMemo(() => getAllTags(dreams), [dreams])

  const activeView = useMemo(() => searchViews.find((v) => v.id === activeViewId) || null, [searchViews, activeViewId])
  const hasFilter = hasAnyFilter(params)

  const results = useMemo(() => filterDreamsBySearchParams(dreams, params), [dreams, params])

  const updateParam = (key: keyof SearchParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }))
    setActiveViewId(null)
  }

  const clearAll = () => {
    setParams(createEmptySearchParams())
    setActiveViewId(null)
  }

  const applyView = (view: SearchView) => {
    setParams({ ...view.filters })
    setActiveViewId(view.id)
    setShowViewDropdown(false)
  }

  const handleSaveView = () => {
    if (!newViewName.trim() || !hasFilter) return
    createSearchView(newViewName.trim(), params)
    setNewViewName('')
    setShowSaveDialog(false)
  }

  const handleUpdateView = () => {
    if (!activeViewId) return
    updateSearchView(activeViewId, { filters: params })
  }

  const startRenameView = (view: SearchView) => {
    setEditingViewId(view.id)
    setEditingViewName(view.name)
  }

  const confirmRenameView = () => {
    if (!editingViewId || !editingViewName.trim()) return
    updateSearchView(editingViewId, { name: editingViewName.trim() })
    setEditingViewId(null)
    setEditingViewName('')
  }

  const cancelRenameView = () => {
    setEditingViewId(null)
    setEditingViewName('')
  }

  const handleDeleteView = (id: string) => {
    deleteSearchView(id)
    if (activeViewId === id) {
      setActiveViewId(null)
    }
  }

  const exportFilteredResults = () => {
    if (results.length === 0) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `dreamscope_search_${date}_${results.length}条.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFilterSuggestions = (type: TagType, query: string) => {
    return getTagSuggestions(allTags, type, query, 5)
  }

  const filtersChanged = useMemo(() => {
    if (!activeView) return false
    return !areFiltersEqual(activeView.filters, params)
  }, [activeView, params])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-white flex items-center gap-3">
              <Search size={28} className="text-dreamscape" />
              梦境搜索
            </h1>
            <p className="text-slate-400 text-sm mt-1">按关键词、人物、地点、日期范围和正文内容搜索本地保存的梦境</p>
          </div>
          <div className="flex items-center gap-2">
            {hasFilter && (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="btn-secondary px-3 py-2 text-sm flex items-center gap-2"
              >
                <BookmarkPlus size={16} />
                保存视图
              </button>
            )}
            {searchViews.length > 0 && (
              <button
                onClick={() => setShowManageDialog(true)}
                className="btn-secondary px-3 py-2 text-sm flex items-center gap-2"
              >
                <BookOpen size={16} />
                管理视图
              </button>
            )}
          </div>
        </div>

        {searchViews.length > 0 && (
          <div className="mt-4 relative">
            <button
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="w-full glass-card p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <BookOpen size={18} className="text-dreamscape shrink-0" />
                <div>
                  <div className="text-sm text-white font-medium">
                    {activeView ? activeView.name : '选择已保存的视图...'}
                  </div>
                  {activeView && (
                    <div className="text-xs text-slate-400 truncate max-w-xl">
                      {getSearchViewDescription(activeView)}
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showViewDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 glass-card z-20 max-h-80 overflow-y-auto">
                  {searchViews.map(view => (
                    <button
                      key={view.id}
                      onClick={() => applyView(view)}
                      className={`w-full p-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                        view.id === activeViewId ? 'bg-dreamscape/10' : ''
                      }`}
                    >
                      <div className="text-sm text-white font-medium">{view.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {getSearchViewDescription(view)}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeView && filtersChanged && (
          <div className="mt-3 glass-card p-3 flex items-center justify-between bg-dreamscape/5 border border-dreamscape/30">
            <div className="flex items-center gap-2 text-sm text-dreamscape">
              <Edit2 size={14} />
              <span>当前筛选条件已修改，是否更新视图 "{activeView.name}"？</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdateView}
                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Check size={14} />
                更新视图
              </button>
              <button
                onClick={() => {
                  setParams({ ...activeView.filters })
                }}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                还原
              </button>
            </div>
          </div>
        )}
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
              list="keyword-suggestions"
            />
            <datalist id="keyword-suggestions">
              {getFilterSuggestions('keywords', params.keyword).map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
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
              list="person-suggestions"
            />
            <datalist id="person-suggestions">
              {getFilterSuggestions('people', params.person).map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
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
              list="place-suggestions"
            />
            <datalist id="place-suggestions">
              {getFilterSuggestions('places', params.place).map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
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

        {hasFilter && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-dreamscape/10">
            <span className="text-xs text-slate-400">
              {results.length > 0
                ? `找到 ${results.length} 条匹配梦境`
                : '没有匹配的梦境'}
            </span>
            <div className="flex items-center gap-3">
              {results.length > 0 && (
                <button
                  onClick={exportFilteredResults}
                  className="text-xs text-dreamscape hover:text-dreamscape/80 transition-colors flex items-center gap-1"
                >
                  <Download size={12} /> 导出搜索结果
                </button>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X size={12} /> 清除筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {!hasFilter && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-400 text-sm">输入搜索条件开始查找梦境</p>
          {searchViews.length > 0 && (
            <p className="text-slate-500 text-xs mt-2">或从上方选择已保存的搜索视图</p>
          )}
        </div>
      )}

      {hasFilter && results.length === 0 && (
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

      {showSaveDialog && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowSaveDialog(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50">
            <div className="glass-card p-6">
              <h3 className="font-display text-xl text-white mb-4">保存搜索视图</h3>
              <p className="text-sm text-slate-400 mb-4">
                将当前的筛选条件保存为命名视图，方便下次快速访问
              </p>
              <input
                type="text"
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveView()
                  if (e.key === 'Escape') setShowSaveDialog(false)
                }}
                placeholder="输入视图名称..."
                className="glow-input w-full px-3 py-2 text-sm mb-4"
                autoFocus
              />
              <div className="text-xs text-slate-500 mb-4 p-3 bg-white/5 rounded-lg">
                <div className="font-medium text-slate-400 mb-1">将保存以下筛选条件：</div>
                <div>{getSearchViewDescription({ filters: params }) || '无筛选条件'}</div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveView}
                  disabled={!newViewName.trim()}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <BookmarkPlus size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showManageDialog && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowManageDialog(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="glass-card p-6 flex flex-col max-h-full">
              <h3 className="font-display text-xl text-white mb-4">管理搜索视图</h3>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {searchViews.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    暂无已保存的搜索视图
                  </div>
                ) : (
                  searchViews.map(view => (
                    <div
                      key={view.id}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      {editingViewId === view.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingViewName}
                            onChange={e => setEditingViewName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmRenameView()
                              if (e.key === 'Escape') cancelRenameView()
                            }}
                            className="glow-input flex-1 px-3 py-1.5 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={confirmRenameView}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelRenameView}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium flex items-center gap-2">
                              <BookOpen size={14} className="text-dreamscape shrink-0" />
                              {view.name}
                              {view.id === activeViewId && (
                                <span className="text-[10px] bg-dreamscape/20 text-dreamscape px-2 py-0.5 rounded-full">
                                  当前使用
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 truncate">
                              {getSearchViewDescription(view)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              创建于 {new Date(view.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startRenameView(view)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-dreamscape hover:bg-dreamscape/20 transition-colors"
                              title="重命名"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteView(view.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-400/20 transition-colors"
                              title="删除"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-end pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowManageDialog(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
