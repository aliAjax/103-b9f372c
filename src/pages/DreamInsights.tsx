import { useMemo } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { Clock, MapPin, Users, Calendar, Brain, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { Dream } from '@/types/dream'

interface TimeSlotEmotion {
  slot: string
  avgEmotion: number
  avgClarity: number
  count: number
}

interface PlaceKeyword {
  place: string
  count: number
  topKeywords: Array<{ keyword: string; count: number }>
}

interface PersonEmotion {
  person: string
  count: number
  avgEmotion: number
  emotions: number[]
}

interface StreakData {
  date: string
  hasDream: boolean
}

function getTimeSlot(wakeTime: string): string {
  const hour = parseInt(wakeTime.split(':')[0])
  if (hour >= 0 && hour < 5) return '深夜 (0-5时)'
  if (hour >= 5 && hour < 7) return '凌晨 (5-7时)'
  if (hour >= 7 && hour < 9) return '清晨 (7-9时)'
  if (hour >= 9 && hour < 12) return '上午 (9-12时)'
  if (hour >= 12 && hour < 14) return '中午 (12-14时)'
  if (hour >= 14 && hour < 18) return '下午 (14-18时)'
  if (hour >= 18 && hour < 22) return '傍晚 (18-22时)'
  return '夜晚 (22-24时)'
}

function analyzeTimeSlotEmotions(dreams: Dream[]): TimeSlotEmotion[] {
  const slotMap = new Map<string, { emotions: number[]; clarity: number[] }>()

  dreams.forEach((d) => {
    const slot = getTimeSlot(d.wakeTime)
    if (!slotMap.has(slot)) {
      slotMap.set(slot, { emotions: [], clarity: [] })
    }
    slotMap.get(slot)!.emotions.push(d.emotionScore)
    slotMap.get(slot)!.clarity.push(d.clarityScore)
  })

  const slotOrder = [
    '深夜 (0-5时)',
    '凌晨 (5-7时)',
    '清晨 (7-9时)',
    '上午 (9-12时)',
    '中午 (12-14时)',
    '下午 (14-18时)',
    '傍晚 (18-22时)',
    '夜晚 (22-24时)',
  ]

  return slotOrder
    .filter((slot) => slotMap.has(slot))
    .map((slot) => {
      const data = slotMap.get(slot)!
      return {
        slot,
        avgEmotion: data.emotions.reduce((a, b) => a + b, 0) / data.emotions.length,
        avgClarity: data.clarity.reduce((a, b) => a + b, 0) / data.clarity.length,
        count: data.emotions.length,
      }
    })
}

function analyzePlaceKeywords(dreams: Dream[]): PlaceKeyword[] {
  const placeKeywordMap = new Map<string, Map<string, number>>()

  dreams.forEach((d) => {
    d.places.forEach((place) => {
      if (!placeKeywordMap.has(place)) {
        placeKeywordMap.set(place, new Map())
      }
      const kwMap = placeKeywordMap.get(place)!
      d.keywords.forEach((kw) => {
        kwMap.set(kw, (kwMap.get(kw) || 0) + 1)
      })
    })
  })

  return Array.from(placeKeywordMap.entries())
    .map(([place, kwMap]) => ({
      place,
      count: dreams.filter((d) => d.places.includes(place)).length,
      topKeywords: Array.from(kwMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count })),
    }))
    .sort((a, b) => b.count - a.count)
}

function analyzePersonEmotions(dreams: Dream[]): PersonEmotion[] {
  const personEmotionMap = new Map<string, number[]>()

  dreams.forEach((d) => {
    d.people.forEach((person) => {
      if (!personEmotionMap.has(person)) {
        personEmotionMap.set(person, [])
      }
      personEmotionMap.get(person)!.push(d.emotionScore)
    })
  })

  return Array.from(personEmotionMap.entries())
    .map(([person, emotions]) => ({
      person,
      count: emotions.length,
      avgEmotion: emotions.reduce((a, b) => a + b, 0) / emotions.length,
      emotions,
    }))
    .sort((a, b) => b.count - a.count)
}

function analyzeStreaks(dreams: Dream[]): { streaks: StreakData[]; maxStreak: number; currentStreak: number } {
  if (dreams.length === 0) {
    return { streaks: [], maxStreak: 0, currentStreak: 0 }
  }

  const dreamDates = new Set(dreams.map((d) => d.date))
  const sortedDates = Array.from(dreamDates).sort()

  const startDate = sortedDates[0]
  const endDate = sortedDates[sortedDates.length - 1]

  const streaks: StreakData[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    streaks.push({
      date: dateStr,
      hasDream: dreamDates.has(dateStr),
    })
    current.setDate(current.getDate() + 1)
  }

  let maxStreak = 0
  let currentStreak = 0
  let tempStreak = 0

  for (let i = 0; i < streaks.length; i++) {
    if (streaks[i].hasDream) {
      tempStreak++
      maxStreak = Math.max(maxStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  tempStreak = 0
  for (let i = streaks.length - 1; i >= 0; i--) {
    if (streaks[i].hasDream) {
      tempStreak++
    } else {
      break
    }
  }
  currentStreak = tempStreak

  return { streaks, maxStreak, currentStreak }
}

function TimeSlotChart({ data }: { data: TimeSlotEmotion[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return
    const chart = echarts.init(chartRef.current, 'dark')

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const paramArray = params as Array<{ name: string; dataIndex: number; marker: string; seriesName: string; value: number }>
          const item = data[paramArray[0].dataIndex]
          let html = `<div style="font-weight:600;margin-bottom:4px">${item.slot}</div>`
          html += `<div style="color:#94a3b8;font-size:11px">样本数: ${item.count} 个梦境</div>`
          paramArray.forEach((p) => {
            html += `<div style="margin-top:4px">${p.marker} ${p.seriesName}: ${p.value.toFixed(2)}</div>`
          })
          return html
        },
      },
      legend: {
        data: ['平均情绪', '平均清晰度'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 36, right: 16, bottom: 48, left: 48 },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.slot.split(' ')[0]),
        axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 10, interval: 0, rotate: 30 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      series: [
        {
          name: '平均情绪',
          type: 'bar',
          data: data.map((d) => d.avgEmotion),
          barWidth: 16,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 58, 237, 0.9)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0.4)' },
            ]),
          },
        },
        {
          name: '平均清晰度',
          type: 'line',
          data: data.map((d) => d.avgClarity),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#f0c040', width: 2 },
          itemStyle: { color: '#f0c040' },
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        需要更多数据来分析醒来时间与情绪的关系
      </div>
    )
  }

  return <div ref={chartRef} className="h-56 w-full" />
}

function PersonEmotionScatter({ data }: { data: PersonEmotion[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return
    const chart = echarts.init(chartRef.current, 'dark')

    const chartData = data.map((d) => [d.count, d.avgEmotion, d.person])

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: unknown) => {
          const param = params as { data: Array<string | number> }
          const [count, avgEmotion, name] = param.data
          const emotionLabel = Number(avgEmotion) >= 3.5 ? '积极愉悦' : Number(avgEmotion) >= 2.5 ? '平静中性' : '略显低落'
          return `
            <div style="font-weight:600;margin-bottom:4px">${name}</div>
            <div>出现次数: ${count} 次</div>
            <div>平均情绪: ${Number(avgEmotion).toFixed(2)} (${emotionLabel})</div>
          `
        },
      },
      grid: { top: 24, right: 24, bottom: 36, left: 48 },
      xAxis: {
        type: 'value',
        name: '出现次数',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '平均情绪',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        min: 0,
        max: 5,
        splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      series: [
        {
          type: 'scatter',
          data: chartData,
          symbolSize: (data: Array<number>) => 12 + data[0] * 3,
          itemStyle: {
            color: (params: { data: Array<string | number> }) => {
              const emotion = params.data[1] as number
              if (emotion >= 4) return '#22c55e'
              if (emotion >= 3) return '#7c3aed'
              if (emotion >= 2) return '#f0c040'
              return '#ef4444'
            },
            opacity: 0.7,
          },
          label: {
            show: true,
            formatter: (params: { data: Array<string | number> }) => params.data[2] as string,
            position: 'right',
            color: '#c4b5fd',
            fontSize: 10,
          },
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        需要更多人物数据来分析情绪关系
      </div>
    )
  }

  return <div ref={chartRef} className="h-56 w-full" />
}

function StreakCalendar({ streaks, maxStreak, currentStreak }: ReturnType<typeof analyzeStreaks>) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || streaks.length === 0) return
    const chart = echarts.init(chartRef.current, 'dark')

    const yearMonths = new Set<string>()
    streaks.forEach((s) => {
      yearMonths.add(s.date.substring(0, 7))
    })

    const monthList = Array.from(yearMonths).sort()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: unknown) => {
          const param = params as { value: number[]; data: number }
          const date = streaks[param.data]
          if (!date) return ''
          return `
            <div style="font-weight:600;margin-bottom:4px">${date.date}</div>
            <div>${date.hasDream ? '🌙 有梦境记录' : '— 无记录'}</div>
          `
        },
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['rgba(124, 58, 237, 0.1)', 'rgba(124, 58, 237, 0.9)'],
        },
        show: false,
      },
      calendar: {
        top: 20,
        left: 40,
        right: 20,
        bottom: 20,
        cellSize: [16, 16],
        range: monthList.length > 0 ? [monthList[0], monthList[monthList.length - 1]] : undefined,
        itemStyle: {
          borderWidth: 2,
          borderColor: 'rgba(15, 19, 52, 1)',
        },
        yearLabel: { show: false },
        monthLabel: {
          color: '#64748b',
          fontSize: 10,
          margin: 8,
        },
        dayLabel: {
          color: '#64748b',
          fontSize: 9,
          margin: 4,
          nameMap: weekDays,
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: streaks.map((s, i) => [s.date, s.hasDream ? 1 : 0, i]),
        },
      ],
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [streaks])

  if (streaks.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        记录更多梦境来查看连续记录天数
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-6 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-dreamscape">{currentStreak}</div>
          <div className="text-xs text-slate-500">当前连续</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-starlight">{maxStreak}</div>
          <div className="text-xs text-slate-500">最长连续</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-c4b5fd">{streaks.filter((s) => s.hasDream).length}</div>
          <div className="text-xs text-slate-500">总记录天数</div>
        </div>
      </div>
      <div ref={chartRef} className="h-56 w-full" />
    </div>
  )
}

export default function DreamInsights() {
  const dreams = useDreamStore((s) => s.dreams)

  const { timeSlotData, placeKeywordData, personEmotionData, streakData } = useMemo(() => {
    return {
      timeSlotData: analyzeTimeSlotEmotions(dreams),
      placeKeywordData: analyzePlaceKeywords(dreams),
      personEmotionData: analyzePersonEmotions(dreams),
      streakData: analyzeStreaks(dreams),
    }
  }, [dreams])

  const hasSufficientData = dreams.length >= 3

  const getEmotionColor = (score: number) => {
    if (score >= 4) return 'text-green-400'
    if (score >= 3) return 'text-dreamscape'
    if (score >= 2) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <Brain size={28} className="text-dreamscape" />
          梦境模式洞察
        </h1>
        <p className="text-slate-400 text-sm mt-1">从历史记录中发现隐藏的规律与长期趋势</p>
      </div>

      {!hasSufficientData ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h2 className="font-display text-xl text-white mb-2">数据不足</h2>
          <p className="text-slate-400 text-sm mb-2">
            目前只有 {dreams.length} 条梦境记录
          </p>
          <p className="text-slate-500 text-sm mb-6">
            至少需要 3 条记录才能开始分析模式规律
          </p>
          <div className="flex justify-center gap-4">
            <a href="/record" className="btn-primary inline-block">
              继续记录
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card glass-card-hover p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Clock size={16} className="text-dreamscape" />
                醒来时间与情绪分析
              </h3>
              <p className="text-xs text-slate-500 mb-4">不同时间段醒来时的情绪和清晰度对比</p>
              <TimeSlotChart data={timeSlotData} />
            </div>

            <div className="glass-card glass-card-hover p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                <Users size={16} className="text-dreamscape" />
                人物情绪关联
              </h3>
              <p className="text-xs text-slate-500 mb-4">人物出现频率与梦境情绪的关系</p>
              <PersonEmotionScatter data={personEmotionData.slice(0, 15)} />
            </div>
          </div>

          <div className="glass-card glass-card-hover p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
              <Calendar size={16} className="text-dreamscape" />
              记录连续性分析
            </h3>
            <p className="text-xs text-slate-500 mb-4">梦境记录的连续天数与覆盖情况</p>
            <StreakCalendar {...streakData} />
          </div>

          <div className="glass-card glass-card-hover p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-dreamscape" />
              地点与关键词关联
            </h3>
            {placeKeywordData.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                需要更多地点数据来分析关联关键词
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {placeKeywordData.slice(0, 6).map((item) => (
                  <div
                    key={item.place}
                    className="p-4 rounded-xl bg-gradient-to-br from-dreamscape/10 to-transparent border border-dreamscape/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-200">{item.place}</span>
                      <span className="text-xs text-slate-500">{item.count} 次出现</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.topKeywords.length === 0 ? (
                        <span className="text-xs text-slate-500">无关联关键词</span>
                      ) : (
                        item.topKeywords.map((kw) => (
                          <span
                            key={kw.keyword}
                            className="px-2 py-0.5 rounded-full bg-dreamscape/20 text-dreamscape text-xs"
                            title={`出现 ${kw.count} 次`}
                          >
                            {kw.keyword}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card glass-card-hover p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-dreamscape" />
              人物情绪排行
            </h3>
            {personEmotionData.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                需要更多人物数据来生成排行
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {personEmotionData.slice(0, 10).map((item, idx) => (
                  <div
                    key={item.person}
                    className="p-4 rounded-xl bg-gradient-to-br from-dreamscape/10 to-transparent border border-dreamscape/20 text-center"
                  >
                    <div className="text-xs text-slate-500 mb-1">#{idx + 1}</div>
                    <div className="text-sm font-medium text-slate-200 mb-2">{item.person}</div>
                    <div className={`text-2xl font-bold ${getEmotionColor(item.avgEmotion)}`}>
                      {item.avgEmotion.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.count} 次出现
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
