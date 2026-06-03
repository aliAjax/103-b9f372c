import { useParams, useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { ArrowLeft, Trash2, Edit3, Star, Eye, MapPin, User, Tag, Clock, CalendarDays } from 'lucide-react'

export default function DreamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const deleteDream = useDreamStore((s) => s.deleteDream)

  const dream = dreams.find((d) => d.id === id)

  if (!dream) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🌀</div>
        <h2 className="font-display text-xl text-white mb-2">梦境未找到</h2>
        <p className="text-slate-400 text-sm mb-6">该梦境记录可能已被删除</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          返回首页
        </button>
      </div>
    )
  }

  const handleDelete = () => {
    deleteDream(dream.id)
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const emotionLabels = ['', '低落', '不安', '平淡', '愉悦', '兴奋']
  const clarityLabels = ['', '模糊', '朦胧', '一般', '清晰', '超清晰']

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          返回
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/dream/${dream.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-dreamscape/40 text-dreamscape hover:bg-dreamscape/10 transition-all text-sm font-medium"
          >
            <Edit3 size={14} />
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl text-white mb-4">梦境详情</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-dreamscape" />
              {dream.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-dreamscape" />
              {dream.wakeTime} 醒来
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={16} className="text-starlight" />
              <span className="text-xs text-slate-400">情绪</span>
            </div>
            <div className="text-2xl font-bold text-starlight">{dream.emotionScore}/5</div>
            <div className="text-xs text-slate-500 mt-1">{emotionLabels[dream.emotionScore]}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye size={16} className="text-dreamscape" />
              <span className="text-xs text-slate-400">清晰度</span>
            </div>
            <div className="text-2xl font-bold text-dreamscape">{dream.clarityScore}/5</div>
            <div className="text-xs text-slate-500 mt-1">{clarityLabels[dream.clarityScore]}</div>
          </div>
        </div>

        <div>
          <h3 className="text-xs text-slate-400 mb-3 uppercase tracking-wider">梦境正文</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {dream.text}
          </p>
        </div>

        {dream.people.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <User size={12} /> 人物
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {dream.people.map((p) => (
                <span key={p} className="capsule-tag capsule-tag-default text-sm">{p}</span>
              ))}
            </div>
          </div>
        )}

        {dream.places.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin size={12} /> 地点
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {dream.places.map((p) => (
                <span key={p} className="capsule-tag capsule-tag-default text-sm">{p}</span>
              ))}
            </div>
          </div>
        )}

        {dream.keywords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag size={12} /> 关键词
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {dream.keywords.map((k) => (
                <span key={k} className="capsule-tag capsule-tag-active text-sm">{k}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
