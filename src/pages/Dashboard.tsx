import { useState, useMemo } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import EmotionTimeline from '@/components/EmotionTimeline'
import KeywordNetwork from '@/components/KeywordNetwork'
import PeopleFrequency from '@/components/PeopleFrequency'
import MonthCalendar from '@/components/MonthCalendar'
import { seedDemoData } from '@/utils/seedData'
import { Moon, List } from 'lucide-react'
import { filterDreamsByDashboardRange, type DashboardTimeRange } from '@/domain/dateFilter'

const TIME_RANGE_OPTIONS: { key: DashboardTimeRange; label: string }[] = [
  { key: '7d', label: '最近7天' },
  { key: '30d', label: '最近30天' },
  { key: '90d', label: '最近90天' },
  { key: 'all', label: '全部' },
]

export default function Dashboard() {
  const dreams = useDreamStore((s) => s.dreams)
  const setSidebarOpen = useDreamStore((s) => s.setSidebarOpen)
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('all')

  const filteredDreams = useMemo(() => filterDreamsByDashboardRange(dreams, timeRange), [dreams, timeRange])

  const totalDreams = filteredDreams.length
  const avgEmotion = totalDreams
    ? (filteredDreams.reduce((sum, d) => sum + d.emotionScore, 0) / totalDreams).toFixed(1)
    : '—'
  const avgClarity = totalDreams
    ? (filteredDreams.reduce((sum, d) => sum + d.clarityScore, 0) / totalDreams).toFixed(1)
    : '—'
  const totalKeywords = new Set(filteredDreams.flatMap((d) => d.keywords)).size

  const hasAnyDreams = dreams.length > 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Moon size={28} className="text-dreamscape" />
            梦境档案
          </h1>
          <p className="text-slate-400 text-sm mt-1">从零散梦境中发现长期主题与情绪变化</p>
        </div>
        {hasAnyDreams && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <List size={16} />
            查看全部记录
          </button>
        )}
      </div>

      {!hasAnyDreams ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="font-display text-xl text-white mb-2">还没有梦境记录</h2>
          <p className="text-slate-400 text-sm mb-6">前往录入页面记录你的第一个梦境吧</p>
          <div className="flex justify-center gap-4">
            <a
              href="/record"
              className="btn-primary inline-block"
            >
              开始记录
            </a>
            <button
              onClick={seedDemoData}
              className="px-6 py-2.5 rounded-full border border-dreamscape/40 text-dreamscape hover:bg-dreamscape/10 transition-all text-sm font-medium"
            >
              加载示例数据
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTimeRange(opt.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    timeRange === opt.key
                      ? 'bg-dreamscape/30 text-white border border-dreamscape/60 shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                      : 'text-slate-400 border border-slate-700/50 hover:border-dreamscape/30 hover:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '梦境总数', value: totalDreams, color: 'text-dreamscape' },
              { label: '平均情绪', value: avgEmotion, color: 'text-starlight' },
              { label: '平均清晰度', value: avgClarity, color: 'text-c4b5fd' },
              { label: '关键词数', value: totalKeywords, color: 'text-dreamscape' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmotionTimeline dreams={filteredDreams} />
              <MonthCalendar dreams={filteredDreams} />
            </div>
            <KeywordNetwork dreams={filteredDreams} />
            <PeopleFrequency dreams={filteredDreams} />
          </div>
        </>
      )}
    </div>
  )
}
