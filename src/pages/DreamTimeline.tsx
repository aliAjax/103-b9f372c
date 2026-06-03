import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Clock, Star, Eye, ChevronDown, ChevronUp, Calendar, GripVertical } from 'lucide-react'
import type { Dream } from '@/types/dream'

interface GroupedDreams {
  [year: string]: {
    [month: string]: {
      [day: string]: Dream[]
    }
  }
}

function getEmotionColor(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500'
  if (score >= 3.5) return 'bg-green-400'
  if (score >= 2.5) return 'bg-yellow-400'
  if (score >= 1.5) return 'bg-orange-400'
  return 'bg-red-500'
}

function getEmotionBorderColor(score: number): string {
  if (score >= 4.5) return 'border-emerald-500/50'
  if (score >= 3.5) return 'border-green-400/50'
  if (score >= 2.5) return 'border-yellow-400/50'
  if (score >= 1.5) return 'border-orange-400/50'
  return 'border-red-500/50'
}

function getEmotionBgColor(score: number): string {
  if (score >= 4.5) return 'bg-emerald-500/10'
  if (score >= 3.5) return 'bg-green-400/10'
  if (score >= 2.5) return 'bg-yellow-400/10'
  if (score >= 1.5) return 'bg-orange-400/10'
  return 'bg-red-500/10'
}

function getEmotionLabel(score: number): string {
  if (score >= 4.5) return '非常愉悦'
  if (score >= 3.5) return '积极'
  if (score >= 2.5) return '中性'
  if (score >= 1.5) return '低落'
  return '消极'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function getWeekday(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return weekdays[date.getDay()]
}

export default function DreamTimeline() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const monthRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showQuickNav, setShowQuickNav] = useState(false)

  const groupedDreams = useMemo<GroupedDreams>(() => {
    const grouped: GroupedDreams = {}
    const sorted = [...dreams].sort((a, b) => b.date.localeCompare(a.date))
    
    sorted.forEach((dream) => {
      const [year, month, day] = dream.date.split('-')
      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = {}
      if (!grouped[year][month][day]) grouped[year][month][day] = []
      grouped[year][month][day].push(dream)
    })
    
    return grouped
  }, [dreams])

  const monthList = useMemo(() => {
    const months: { label: string; key: string; count: number }[] = []
    Object.entries(groupedDreams).forEach(([year, monthsData]) => {
      Object.entries(monthsData).forEach(([month, daysData]) => {
        const count = Object.values(daysData).reduce((sum, arr) => sum + arr.length, 0)
        months.push({
          label: `${year}年${Number(month)}月`,
          key: `${year}-${month}`,
          count,
        })
      })
    })
    return months.sort((a, b) => b.key.localeCompare(a.key))
  }, [groupedDreams])

  const scrollToMonth = (yearMonth: string) => {
    const element = monthRefs.current[yearMonth]
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const containerTop = container.getBoundingClientRect().top
      const elementTop = element.getBoundingClientRect().top
      const scrollTop = container.scrollTop + (elementTop - containerTop) - 20
      container.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
    setShowQuickNav(false)
  }

  const toggleDay = (dayKey: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayKey)) {
        next.delete(dayKey)
      } else {
        next.add(dayKey)
      }
      return next
    })
  }

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  if (dreams.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Clock size={28} className="text-dreamscape" />
            梦境时间轴
          </h1>
          <p className="text-slate-400 text-sm mt-1">按时间回顾你的梦境旅程</p>
        </div>
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="font-display text-xl text-white mb-2">暂无梦境记录</h2>
          <p className="text-slate-400 text-sm mb-6">记录你的第一个梦境，开启时间轴之旅</p>
          <a href="/record" className="btn-primary inline-block">
            开始记录
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <Clock size={28} className="text-dreamscape" />
          梦境时间轴
        </h1>
        <p className="text-slate-400 text-sm mt-1">按时间回顾你的梦境旅程，发现时间的痕迹</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowQuickNav(!showQuickNav)}
          className="glass-card glass-card-hover px-4 py-3 w-full flex items-center justify-between text-sm"
        >
          <span className="flex items-center gap-2 text-slate-300">
            <GripVertical size={16} className="text-dreamscape" />
            快速跳转月份
          </span>
          {showQuickNav ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showQuickNav && (
          <div className="glass-card mt-2 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap gap-2">
              {monthList.map(({ label, key, count }) => (
                <button
                  key={key}
                  onClick={() => scrollToMonth(key)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-dreamscape/30 text-slate-300 hover:bg-dreamscape/20 hover:border-dreamscape/50 transition-all"
                >
                  {label}
                  <span className="ml-1.5 text-dreamscape">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 glass-card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 mr-2">情绪图例：</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400">非常愉悦</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-slate-400">积极</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-xs text-slate-400">中性</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-400" />
          <span className="text-xs text-slate-400">低落</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-slate-400">消极</span>
        </div>
      </div>

      <div ref={scrollContainerRef} className="space-y-8">
        {Object.entries(groupedDreams)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, monthsData]) => (
            <div key={year}>
              {Object.entries(monthsData)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([month, daysData]) => {
                  const monthKey = `${year}-${month}`
                  const dreamCount = Object.values(daysData).reduce((sum, arr) => sum + arr.length, 0)
                  
                  return (
                    <div
                      key={monthKey}
                      ref={(el) => { monthRefs.current[monthKey] = el }}
                      className="mb-8 scroll-mt-4"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-dreamscape/20 flex items-center justify-center border border-dreamscape/30">
                          <Calendar size={20} className="text-dreamscape" />
                        </div>
                        <div>
                          <h2 className="font-display text-xl text-white">
                            {year}年 {monthNames[Number(month) - 1]}
                          </h2>
                          <p className="text-xs text-slate-500">
                            共 {dreamCount} 条梦境 · {Object.keys(daysData).length} 天有记录
                          </p>
                        </div>
                      </div>

                      <div className="relative pl-6 ml-6 border-l border-dreamscape/30">
                        {Object.entries(daysData)
                          .sort(([a], [b]) => Number(b) - Number(a))
                          .map(([day, dayDreams]) => {
                            const dayKey = `${year}-${month}-${day}`
                            const isExpanded = expandedDays.has(dayKey)
                            const avgEmotion = dayDreams.reduce((sum, d) => sum + d.emotionScore, 0) / dayDreams.length
                            
                            return (
                              <div key={dayKey} className="relative mb-4">
                                <div className="absolute -left-[30px] top-4">
                                  <div className={`w-4 h-4 rounded-full ${getEmotionColor(avgEmotion)} ring-4 ring-midnight`} />
                                </div>

                                <div
                                  className={`glass-card glass-card-hover ${getEmotionBgColor(avgEmotion)} border ${getEmotionBorderColor(avgEmotion)} cursor-pointer transition-all`}
                                  onClick={() => toggleDay(dayKey)}
                                >
                                  <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-center min-w-[60px]">
                                        <div className="font-display text-2xl text-white">{Number(day)}</div>
                                        <div className="text-xs text-slate-500">{getWeekday(dayKey)}</div>
                                      </div>
                                      <div className="hidden sm:block">
                                        <div className="text-sm text-slate-300">{formatDate(dayKey)}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                          <span className={`px-2 py-0.5 rounded-full ${getEmotionBgColor(avgEmotion)} text-xs`}>
                                            {getEmotionLabel(avgEmotion)}
                                          </span>
                                          <span>{dayDreams.length} 条记录</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                          <Star size={12} className="text-starlight" />
                                          {avgEmotion.toFixed(1)}
                                        </span>
                                      </div>
                                      {dayDreams.length > 1 && (
                                        <div className="flex items-center gap-1 text-xs text-dreamscape">
                                          {isExpanded ? (
                                            <>收起 <ChevronUp size={14} /></>
                                          ) : (
                                            <>展开 <ChevronDown size={14} /></>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {dayDreams.length === 1 ? (
                                    <div
                                      className="px-4 pb-4"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/dream/${dayDreams[0].id}`)
                                      }}
                                    >
                                      <div className="glass-card p-3 border border-dreamscape/20 hover:border-dreamscape/40 transition-all">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock size={10} />
                                            {dayDreams[0].wakeTime}
                                          </span>
                                          <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                              <Star size={10} className="text-starlight" />
                                              {dayDreams[0].emotionScore}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Eye size={10} className="text-dreamscape" />
                                              {dayDreams[0].clarityScore}
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">
                                          {dayDreams[0].text}
                                        </p>
                                        <div className="mt-2 text-right">
                                          <span className="text-xs text-dreamscape">查看详情 →</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : isExpanded ? (
                                    <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
                                      {dayDreams.map((dream, index) => (
                                        <div
                                          key={dream.id}
                                          className={`glass-card p-3 border ${getEmotionBorderColor(dream.emotionScore)} hover:border-dreamscape/40 transition-all cursor-pointer`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            navigate(`/dream/${dream.id}`)
                                          }}
                                        >
                                          <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${getEmotionColor(dream.emotionScore)}`} />
                                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock size={10} />
                                                {dream.wakeTime}
                                              </span>
                                              <span className="text-xs text-slate-600">#{index + 1}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span className="flex items-center gap-1">
                                                <Star size={10} className="text-starlight" />
                                                {dream.emotionScore}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Eye size={10} className="text-dreamscape" />
                                                {dream.clarityScore}
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-200 leading-relaxed line-clamp-2">
                                            {dream.text}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="px-4 pb-4">
                                      <div className="flex -space-x-2">
                                        {dayDreams.slice(0, 4).map((dream, i) => (
                                          <div
                                            key={dream.id}
                                            className={`w-8 h-8 rounded-full ${getEmotionColor(dream.emotionScore)} border-2 border-midnight flex items-center justify-center text-xs text-white font-medium`}
                                          >
                                            {i + 1}
                                          </div>
                                        ))}
                                        {dayDreams.length > 4 && (
                                          <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-midnight flex items-center justify-center text-xs text-white font-medium">
                                            +{dayDreams.length - 4}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}
      </div>
    </div>
  )
}
