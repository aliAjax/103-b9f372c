import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { CalendarDays, Star, Eye, User, MapPin, Tag, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Dream } from '@/types/dream'

interface MonthStats {
  totalDreams: number
  avgEmotion: number
  avgClarity: number
  topPeople: Array<{ name: string; count: number }>
  topPlaces: Array<{ name: string; count: number }>
  topKeywords: Array<{ name: string; count: number }>
  dreams: Dream[]
}

function getMonthRange(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  return { start, end }
}

function calculateStats(dreams: Dream[]): MonthStats {
  const totalDreams = dreams.length
  const avgEmotion = totalDreams
    ? dreams.reduce((sum, d) => sum + d.emotionScore, 0) / totalDreams
    : 0
  const avgClarity = totalDreams
    ? dreams.reduce((sum, d) => sum + d.clarityScore, 0) / totalDreams
    : 0

  const countItems = (key: 'people' | 'places' | 'keywords') => {
    const map = new Map<string, number>()
    dreams.forEach((d) => {
      d[key].forEach((item) => {
        map.set(item, (map.get(item) || 0) + 1)
      })
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }

  return {
    totalDreams,
    avgEmotion,
    avgClarity,
    topPeople: countItems('people'),
    topPlaces: countItems('places'),
    topKeywords: countItems('keywords'),
    dreams: [...dreams].sort((a, b) => b.date.localeCompare(a.date)),
  }
}

function getEmotionLabel(score: number): string {
  if (score >= 4) return '积极愉悦'
  if (score >= 3) return '平静中性'
  if (score >= 2) return '略显低落'
  return '较为消极'
}

function getClarityLabel(score: number): string {
  if (score >= 4) return '非常清晰'
  if (score >= 3) return '较为清晰'
  if (score >= 2) return '模糊不清'
  return '印象很浅'
}

export default function MonthlySummary() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const nowRef = useRef(new Date())
  const [selectedYear, setSelectedYear] = useState(nowRef.current.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(nowRef.current.getMonth() + 1)

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    dreams.forEach((d) => {
      const [year, month] = d.date.split('-')
      months.add(`${year}-${month}`)
    })
    return Array.from(months).sort().reverse()
  }, [dreams])

  const availableYears = useMemo(() => {
    const years = new Set<number>()
    dreams.forEach((d) => {
      years.add(Number(d.date.split('-')[0]))
    })
    years.add(nowRef.current.getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [dreams])

  const yearOptions = useMemo(() => {
    const opts = new Set(availableYears)
    opts.add(selectedYear)
    return Array.from(opts).sort((a, b) => b - a)
  }, [availableYears, selectedYear])

  const monthDreams = useMemo(() => {
    const { start, end } = getMonthRange(selectedYear, selectedMonth)
    return dreams.filter((d) => d.date >= start && d.date <= end)
  }, [dreams, selectedYear, selectedMonth])

  const stats = useMemo(() => calculateStats(monthDreams), [monthDreams])

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const jumpToMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number)
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const hasDataThisMonth = stats.totalDreams > 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <CalendarDays size={28} className="text-dreamscape" />
          月度总结
        </h1>
        <p className="text-slate-400 text-sm mt-1">按月回顾你的梦境记录，发现月度主题与规律</p>
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="glow-input px-3 py-2 text-sm font-display text-white bg-slate-900/50 appearance-none cursor-pointer pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="glow-input px-3 py-2 text-sm font-display text-white bg-slate-900/50 appearance-none cursor-pointer pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>{name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 mr-2">快速跳转：</span>
            {availableMonths.slice(0, 6).map((ym) => {
              const [y, m] = ym.split('-')
              const isActive = Number(y) === selectedYear && Number(m) === selectedMonth
              return (
                <button
                  key={ym}
                  onClick={() => jumpToMonth(ym)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-dreamscape/30 text-dreamscape border border-dreamscape/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {y}.{m}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {!hasDataThisMonth ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="font-display text-xl text-white mb-2">本月暂无梦境记录</h2>
          <p className="text-slate-400 text-sm mb-6">前往录入页面记录你的梦境吧</p>
          <a href="/record" className="btn-primary inline-block">
            开始记录
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              <div className="text-3xl font-bold text-dreamscape">{stats.totalDreams}</div>
              <div className="text-xs text-slate-500 mt-2">梦境总数</div>
            </div>

            <div className="glass-card p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <Star size={20} className="text-starlight" />
                <span className="text-3xl font-bold text-starlight">
                  {stats.avgEmotion.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                平均情绪 · {getEmotionLabel(stats.avgEmotion)}
              </div>
            </div>

            <div className="glass-card p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <Eye size={20} className="text-c4b5fd" />
                <span className="text-3xl font-bold text-c4b5fd">
                  {stats.avgClarity.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                平均清晰度 · {getClarityLabel(stats.avgClarity)}
              </div>
            </div>

            <div className="glass-card p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp size={20} className="text-dreamscape" />
                <span className="text-3xl font-bold text-dreamscape">
                  {new Set(monthDreams.flatMap((d) => d.keywords)).size}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2">本月关键词数</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <User size={16} className="text-dreamscape" />
                最常出现的人物
              </h3>
              {stats.topPeople.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-6">本月暂无人物记录</div>
              ) : (
                <div className="space-y-3">
                  {stats.topPeople.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-dreamscape/20 text-dreamscape text-xs flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{item.count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-dreamscape" />
                最常出现的地点
              </h3>
              {stats.topPlaces.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-6">本月暂无地点记录</div>
              ) : (
                <div className="space-y-3">
                  {stats.topPlaces.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-dreamscape/20 text-dreamscape text-xs flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{item.count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Tag size={16} className="text-dreamscape" />
                最常出现的关键词
              </h3>
              {stats.topKeywords.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-6">本月暂无关键词记录</div>
              ) : (
                <div className="space-y-3">
                  {stats.topKeywords.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-dreamscape/20 text-dreamscape text-xs flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{item.count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-dreamscape" />
              本月梦境摘要
            </h3>
            <div className="space-y-4">
              {stats.dreams.map((dream) => (
                <div
                  key={dream.id}
                  className="glass-card-hover p-4 rounded-xl border border-dreamscape/10 hover:border-dreamscape/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/dream/${dream.id}`)}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{dream.date}</span>
                      <span className="text-dreamscape/50">|</span>
                      <span>{dream.wakeTime}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
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

                  <p className="text-sm text-slate-200 leading-relaxed line-clamp-2 mb-3">
                    {dream.text}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    {dream.people.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <User size={11} className="text-slate-500 shrink-0" />
                        {dream.people.slice(0, 3).map((p) => (
                          <span key={p} className="capsule-tag capsule-tag-default text-[10px]">
                            {p}
                          </span>
                        ))}
                        {dream.people.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{dream.people.length - 3}</span>
                        )}
                      </div>
                    )}
                    {dream.places.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin size={11} className="text-slate-500 shrink-0" />
                        {dream.places.slice(0, 3).map((p) => (
                          <span key={p} className="capsule-tag capsule-tag-default text-[10px]">
                            {p}
                          </span>
                        ))}
                        {dream.places.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{dream.places.length - 3}</span>
                        )}
                      </div>
                    )}
                    {dream.keywords.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag size={11} className="text-slate-500 shrink-0" />
                        {dream.keywords.slice(0, 3).map((k) => (
                          <span key={k} className="capsule-tag capsule-tag-default text-[10px]">
                            {k}
                          </span>
                        ))}
                        {dream.keywords.length > 3 && (
                          <span className="text-[10px] text-slate-500">+{dream.keywords.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
