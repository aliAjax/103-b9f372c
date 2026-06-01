import { useDreamStore } from '@/store/dreamStore'
import EmotionTimeline from '@/components/EmotionTimeline'
import KeywordNetwork from '@/components/KeywordNetwork'
import PeopleFrequency from '@/components/PeopleFrequency'
import MonthCalendar from '@/components/MonthCalendar'
import { Moon, List } from 'lucide-react'

export default function Dashboard() {
  const dreams = useDreamStore((s) => s.dreams)
  const setSidebarOpen = useDreamStore((s) => s.setSidebarOpen)

  const totalDreams = dreams.length
  const avgEmotion = totalDreams
    ? (dreams.reduce((sum, d) => sum + d.emotionScore, 0) / totalDreams).toFixed(1)
    : '—'
  const avgClarity = totalDreams
    ? (dreams.reduce((sum, d) => sum + d.clarityScore, 0) / totalDreams).toFixed(1)
    : '—'
  const totalKeywords = new Set(dreams.flatMap((d) => d.keywords)).size

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
        {totalDreams > 0 && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <List size={16} />
            查看全部记录
          </button>
        )}
      </div>

      {totalDreams > 0 && (
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
      )}

      {totalDreams === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🌙</div>
          <h2 className="font-display text-xl text-white mb-2">还没有梦境记录</h2>
          <p className="text-slate-400 text-sm mb-6">前往录入页面记录你的第一个梦境吧</p>
          <a
            href="/record"
            className="btn-primary inline-block"
          >
            开始记录
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmotionTimeline />
            <MonthCalendar />
          </div>
          <KeywordNetwork />
          <PeopleFrequency />
        </div>
      )}
    </div>
  )
}
