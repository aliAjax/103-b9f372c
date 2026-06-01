import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useDreamStore } from '@/store/dreamStore'

export default function MonthCalendar() {
  const chartRef = useRef<HTMLDivElement>(null)
  const dreams = useDreamStore((s) => s.dreams)

  useEffect(() => {
    if (!chartRef.current || dreams.length === 0) return
    const chart = echarts.init(chartRef.current, 'dark')

    const dateMap = new Map<string, number>()
    dreams.forEach((d) => {
      dateMap.set(d.date, (dateMap.get(d.date) || 0) + 1)
    })

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const data: [number, number, number][] = []
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const count = dateMap.get(dateStr) || 0
      data.push([
        d.getDay(),
        Math.ceil(d.getDate() / 7),
        count,
      ])
    }

    const maxCount = Math.max(...data.map((d) => d[2]), 1)

    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const weekCount = Math.ceil(lastDay.getDate() / 7)
    const weekLabels = Array.from({ length: weekCount }, (_, i) => `${i + 1}`)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any) => {
          const [dayIdx, weekIdx, count] = params.data
          const day = (weekIdx - 1) * 7 + 1 + dayIdx - firstDay.getDay()
          if (day < 1 || day > lastDay.getDate()) return ''
          return `${year}年${month + 1}月${day}日<br/>梦境数: ${count}`
        },
      },
      grid: { top: 28, right: 8, bottom: 8, left: 32 },
      xAxis: {
        type: 'category',
        data: weekLabels,
        axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisTick: { show: false },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: dayNames,
        axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisTick: { show: false },
        splitArea: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        show: false,
        inRange: {
          color: ['rgba(124, 58, 237, 0.1)', 'rgba(124, 58, 237, 0.4)', '#7c3aed', '#a78bfa'],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: data,
          itemStyle: {
            borderRadius: 4,
            borderColor: 'rgba(10, 14, 39, 0.6)',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              borderColor: '#f0c040',
              borderWidth: 2,
            },
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
  }, [dreams])

  if (dreams.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64 text-slate-500 text-sm">
        记录梦境后，月份分布日历将在此展示
      </div>
    )
  }

  const now = new Date()
  const monthName = `${now.getFullYear()}年${now.getMonth() + 1}月`

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">月份分布日历</h3>
      <p className="text-xs text-slate-500 mb-3">{monthName}</p>
      <div ref={chartRef} className="h-48 w-full" />
    </div>
  )
}
