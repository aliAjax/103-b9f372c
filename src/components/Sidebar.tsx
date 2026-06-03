import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { X, Star, Eye, MapPin, User, Tag, Edit3 } from 'lucide-react'

export default function Sidebar() {
  const navigate = useNavigate()
  const sidebarOpen = useDreamStore((s) => s.sidebarOpen)
  const selectedKeyword = useDreamStore((s) => s.selectedKeyword)
  const setSidebarOpen = useDreamStore((s) => s.setSidebarOpen)
  const getFilteredDreams = useDreamStore((s) => s.getFilteredDreams)

  const filteredDreams = getFilteredDreams()

  if (!sidebarOpen) return null

  return (
    <>
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      <div className="sidebar-panel">
        <div className="sticky top-0 z-10 bg-[rgba(15,19,52,0.98)] backdrop-blur-md border-b border-dreamscape/20 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-white">
                {selectedKeyword ? `"${selectedKeyword}" 相关梦境` : '全部梦境'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">共 {filteredDreams.length} 条记录</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredDreams.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-12">
              没有匹配的梦境记录
            </div>
          ) : (
            filteredDreams.map((dream) => (
              <div
                key={dream.id}
                className="glass-card glass-card-hover p-4 space-y-3 cursor-pointer"
                onClick={() => {
                  setSidebarOpen(false)
                  navigate(`/dream/${dream.id}`)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{dream.date}</span>
                    <span className="text-dreamscape/50">|</span>
                    <span>{dream.wakeTime}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSidebarOpen(false)
                      navigate(`/dream/${dream.id}/edit`)
                    }}
                    className="text-slate-500 hover:text-dreamscape transition-colors"
                    title="编辑"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {dream.text}
                </p>

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

                {dream.people.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <User size={11} className="text-slate-500 shrink-0" />
                    {dream.people.map((p) => (
                      <span key={p} className="capsule-tag capsule-tag-default text-[10px]">
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {dream.places.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MapPin size={11} className="text-slate-500 shrink-0" />
                    {dream.places.map((p) => (
                      <span key={p} className="capsule-tag capsule-tag-default text-[10px]">
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                {dream.keywords.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag size={11} className="text-slate-500 shrink-0" />
                    {dream.keywords.map((k) => (
                      <span
                        key={k}
                        className={`capsule-tag text-[10px] ${
                          k === selectedKeyword ? 'capsule-tag-active' : 'capsule-tag-default'
                        }`}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
