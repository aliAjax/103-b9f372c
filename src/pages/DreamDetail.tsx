import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { ArrowLeft, Trash2, Edit3, Star, Eye, MapPin, User, Tag, Clock, CalendarDays, Link2 } from 'lucide-react'
import type { Dream, NodeType } from '@/types/dream'

interface MatchedTag {
  name: string
  type: NodeType
}

interface SimilarDream {
  dream: Dream
  score: number
  matchedTags: MatchedTag[]
}

function computeSimilarDreams(current: Dream, allDreams: Dream[], limit = 5): SimilarDream[] {
  const currentTags = new Set([
    ...current.people.map((p) => `person:${p}`),
    ...current.places.map((p) => `place:${p}`),
    ...current.keywords.map((k) => `keyword:${k}`),
  ])

  if (currentTags.size === 0) return []

  const results: SimilarDream[] = []

  for (const dream of allDreams) {
    if (dream.id === current.id) continue

    const matchedTags: MatchedTag[] = []
    let overlap = 0

    for (const p of dream.people) {
      if (currentTags.has(`person:${p}`)) {
        overlap++
        matchedTags.push({ name: p, type: 'person' })
      }
    }
    for (const p of dream.places) {
      if (currentTags.has(`place:${p}`)) {
        overlap++
        matchedTags.push({ name: p, type: 'place' })
      }
    }
    for (const k of dream.keywords) {
      if (currentTags.has(`keyword:${k}`)) {
        overlap++
        matchedTags.push({ name: k, type: 'keyword' })
      }
    }

    if (overlap === 0) continue

    const otherTags = new Set([
      ...dream.people.map((p) => `person:${p}`),
      ...dream.places.map((p) => `place:${p}`),
      ...dream.keywords.map((k) => `keyword:${k}`),
    ])
    const union = new Set([...currentTags, ...otherTags]).size
    const score = union > 0 ? overlap / union : 0

    results.push({ dream, score, matchedTags })
  }

  results.sort((a, b) => b.score - a.score || b.matchedTags.length - a.matchedTags.length)
  return results.slice(0, limit)
}

const TAG_STYLE: Record<NodeType, string> = {
  person: 'bg-pink-500/20 text-pink-400',
  place: 'bg-green-500/20 text-green-400',
  keyword: 'bg-purple-500/20 text-purple-400',
}

const TAG_ICON: Record<NodeType, typeof User> = {
  person: User,
  place: MapPin,
  keyword: Tag,
}

export default function DreamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const deleteDream = useDreamStore((s) => s.deleteDream)

  const dream = dreams.find((d) => d.id === id)

  const similarDreams = useMemo(
    () => (dream ? computeSimilarDreams(dream, dreams) : []),
    [dream, dreams]
  )

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

      {similarDreams.length > 0 && (
        <div className="glass-card p-6 mt-6">
          <h2 className="font-display text-lg text-white flex items-center gap-2 mb-4">
            <Link2 size={18} className="text-dreamscape" />
            相似梦境
          </h2>
          <div className="space-y-3">
            {similarDreams.map(({ dream: sd, score, matchedTags }) => (
              <div
                key={sd.id}
                onClick={() => navigate(`/dream/${sd.id}`)}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-dreamscape/40 hover:bg-white/[0.07] cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CalendarDays size={12} className="text-dreamscape" />
                    {sd.date}
                    <span className="text-dreamscape/40">|</span>
                    <Clock size={12} className="text-dreamscape" />
                    {sd.wakeTime}
                  </div>
                  <span className="text-[10px] text-dreamscape/70 font-medium">
                    相似度 {Math.round(score * 100)}%
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-3">
                  {sd.text}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedTags.map((tag) => {
                    const Icon = TAG_ICON[tag.type]
                    return (
                      <span
                        key={`${tag.type}:${tag.name}`}
                        className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${TAG_STYLE[tag.type]}`}
                      >
                        <Icon size={10} />
                        {tag.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
