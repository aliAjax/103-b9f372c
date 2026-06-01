import { useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import TagInput from './TagInput'
import { Star, Eye, Save } from 'lucide-react'

export default function DreamForm() {
  const addDream = useDreamStore((s) => s.addDream)
  const getRecentTags = useDreamStore((s) => s.getRecentTags)

  const [text, setText] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [wakeTime, setWakeTime] = useState('07:00')
  const [emotionScore, setEmotionScore] = useState(3)
  const [clarityScore, setClarityScore] = useState(3)
  const [people, setPeople] = useState<string[]>([])
  const [places, setPlaces] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const emotionLabels = ['', '很糟糕', '不太好', '一般', '还不错', '很开心']
  const clarityLabels = ['', '很模糊', '较模糊', '一般', '较清晰', '很清晰']

  function handleSubmit() {
    if (!text.trim()) return
    addDream({
      text: text.trim(),
      date,
      wakeTime,
      emotionScore,
      clarityScore,
      people,
      places,
      keywords,
    })
    setText('')
    setPeople([])
    setPlaces([])
    setKeywords([])
    setEmotionScore(3)
    setClarityScore(3)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-white mb-2">记录梦境</h1>
      <p className="text-slate-400 text-sm mb-8">把梦的碎片留在这里，让它们汇聚成星空</p>

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
            {saved ? '已保存 ✓' : '保存梦境'}
          </button>
        </div>
      </div>
    </div>
  )
}
