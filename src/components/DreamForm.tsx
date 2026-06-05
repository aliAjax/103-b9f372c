import { useState, useEffect, useRef } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import TagInput from './TagInput'
import { Star, Eye, Save, FileText, Trash2 } from 'lucide-react'

const DRAFT_KEY = 'dreamscope_draft'

interface DraftData {
  text: string
  date: string
  wakeTime: string
  emotionScore: number
  clarityScore: number
  people: string[]
  places: string[]
  keywords: string[]
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraftData(draft: DraftData) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}

export default function DreamForm() {
  const addDream = useDreamStore((s) => s.addDream)
  const getRecentTags = useDreamStore((s) => s.getRecentTags)

  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null)
  const [text, setText] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [wakeTime, setWakeTime] = useState('07:00')
  const [emotionScore, setEmotionScore] = useState(3)
  const [clarityScore, setClarityScore] = useState(3)
  const [people, setPeople] = useState<string[]>([])
  const [places, setPlaces] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  const draftResolvedRef = useRef(false)
  const justSavedRef = useRef(false)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setPendingDraft(draft)
    } else {
      draftResolvedRef.current = true
    }
  }, [])

  const initDateRef = useRef(new Date().toISOString().split('T')[0])

  const hasContent =
    !!text.trim() ||
    people.length > 0 ||
    places.length > 0 ||
    keywords.length > 0 ||
    date !== initDateRef.current ||
    wakeTime !== '07:00' ||
    emotionScore !== 3 ||
    clarityScore !== 3

  useEffect(() => {
    if (!draftResolvedRef.current) return
    if (justSavedRef.current) {
      justSavedRef.current = false
      clearDraft()
      return
    }
    if (!hasContent) {
      clearDraft()
      return
    }
    const timer = setTimeout(() => {
      saveDraftData({ text, date, wakeTime, emotionScore, clarityScore, people, places, keywords })
    }, 500)
    return () => clearTimeout(timer)
  }, [hasContent, text, date, wakeTime, emotionScore, clarityScore, people, places, keywords])

  function handleRestoreDraft() {
    if (!pendingDraft) return
    setText(pendingDraft.text)
    setDate(pendingDraft.date)
    setWakeTime(pendingDraft.wakeTime)
    setEmotionScore(pendingDraft.emotionScore)
    setClarityScore(pendingDraft.clarityScore)
    setPeople(pendingDraft.people)
    setPlaces(pendingDraft.places)
    setKeywords(pendingDraft.keywords)
    setPendingDraft(null)
    draftResolvedRef.current = true
  }

  function handleDiscardDraft() {
    clearDraft()
    setPendingDraft(null)
    draftResolvedRef.current = true
  }

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
    justSavedRef.current = true
    setText('')
    setPeople([])
    setPlaces([])
    setKeywords([])
    setEmotionScore(3)
    setClarityScore(3)
    clearDraft()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {pendingDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm mx-4 text-center space-y-4">
            <div className="flex justify-center">
              <FileText size={40} className="text-starlight" />
            </div>
            <h3 className="font-display text-xl text-white">发现未保存的草稿</h3>
            <p className="text-slate-400 text-sm">
              你之前有一份未保存的梦境记录，是否继续编辑？
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                丢弃草稿
              </button>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
              >
                <FileText size={14} />
                继续编辑
              </button>
            </div>
          </div>
        </div>
      )}

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
