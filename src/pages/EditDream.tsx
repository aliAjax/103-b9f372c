import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import TagInput from '@/components/TagInput'
import { Star, Eye, Save, ArrowLeft } from 'lucide-react'

export default function EditDream() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const updateDream = useDreamStore((s) => s.updateDream)
  const getRecentTags = useDreamStore((s) => s.getRecentTags)

  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [emotionScore, setEmotionScore] = useState(3)
  const [clarityScore, setClarityScore] = useState(3)
  const [people, setPeople] = useState<string[]>([])
  const [places, setPlaces] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const dream = dreams.find((d) => d.id === id)

  useEffect(() => {
    if (dream) {
      setText(dream.text)
      setDate(dream.date)
      setWakeTime(dream.wakeTime)
      setEmotionScore(dream.emotionScore)
      setClarityScore(dream.clarityScore)
      setPeople(dream.people)
      setPlaces(dream.places)
      setKeywords(dream.keywords)
    }
  }, [dream])

  const emotionLabels = ['', '很糟糕', '不太好', '一般', '还不错', '很开心']
  const clarityLabels = ['', '很模糊', '较模糊', '一般', '较清晰', '很清晰']

  function handleSubmit() {
    if (!id || !text.trim()) return
    updateDream(id, {
      text: text.trim(),
      date,
      wakeTime,
      emotionScore,
      clarityScore,
      people,
      places,
      keywords,
    })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      navigate(`/dream/${id}`)
    }, 1000)
  }

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={18} />
          返回
        </button>
      </div>

      <h1 className="font-display text-3xl text-white mb-2">编辑梦境</h1>
      <p className="text-slate-400 text-sm mb-8">修改梦境记录，保存后将保持原始创建时间</p>

      <div className="glass-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">梦境描述</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="描述你的梦境..."
            rows={6}
            className="glow-input w-full px-4 py-3 text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glow-input w-full px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">醒来时间</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="glow-input w-full px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Star size={14} className="inline mr-1 text-starlight" />
            情绪评分 — {emotionLabels[emotionScore]}
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEmotionScore(v)}
                className={`text-2xl transition-all duration-200 ${
                  v <= emotionScore ? 'text-starlight scale-110' : 'text-slate-600 scale-100'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Eye size={14} className="inline mr-1 text-dreamscape" />
            清晰程度 — {clarityLabels[clarityScore]}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={clarityScore}
            onChange={(e) => setClarityScore(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${((clarityScore - 1) / 4) * 100}%, rgba(124,58,237,0.2) ${((clarityScore - 1) / 4) * 100}%, rgba(124,58,237,0.2) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>模糊</span>
            <span>清晰</span>
          </div>
        </div>

        <TagInput
          label="出现的人物"
          tags={people}
          onChange={setPeople}
          suggestions={getRecentTags('people')}
          placeholder="输入人物名称，回车添加"
        />

        <TagInput
          label="出现的地点"
          tags={places}
          onChange={setPlaces}
          suggestions={getRecentTags('places')}
          placeholder="输入地点名称，回车添加"
        />

        <TagInput
          label="关键词"
          tags={keywords}
          onChange={setKeywords}
          suggestions={getRecentTags('keywords')}
          placeholder="输入关键词，回车添加"
        />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saved ? '已保存 ✓' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  )
}
