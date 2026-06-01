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

    const dates = dreams.map((d) => d.date).sort()
    const minDate = dates[0]

    const now = new Date()
    const endDate = now.toISOString().split('T')[0]

    const data: [string, number][] = []
    const start = new Date(minDate)
    const end = new Date(endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      data.push([dateStr, dateMap.get(dateStr) || 0])
    }

    const maxCount = Math.max(...data.map((d) => d[1]), 1)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(15, 19, 52, 0.95)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: unknown) => {
          const { value } = params as { value: [string, number] }
          const [date, count] = value
          return `${date}<br/>梦境数: ${count}`
        },
      },
      visualMap: {
        min: 0,
        max: maxCount,
        show: false,
        inRange: {
          color: ['rgba(124, 58, 237, 0.08)', 'rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0.6)', '#7c3aed', '#a78bfa'],
        },
      },
      calendar: {
        top: 40,
        left: 40,
        right: 20,
        cellSize: [14, 14],
        range: [minDate, endDate],
        itemStyle: {
          borderRadius: 3,
          borderColor: 'rgba(10, 14, 39, 0.6)',
          borderWidth: 2,
        },
        dayLabel: {
          firstDay: 0,
          nameMap: ['日', '', '二', '', '四', '', '六'],
          color: '#64748b',
          fontSize: 9,
        },
        monthLabel: {
          nameMap: 'cn',
          color: '#94a3b8',
          fontSize: 10,
        },
        yearLabel: {
          show: false,
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: data,
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
      <div className="glass-card p-6 flex items-center justify-center h-44 text-slate-500 text-sm">
        记录梦境后，长期分布日历将在此展示
      </div>
    )
  }

  const dates = dreams.map((d) => d.date).sort()
  const startYear = dates[0]?.substring(0, 4) || ''
  const endYear = dates[dates.length - 1]?.substring(0, 4) || ''
  const dateRange = startYear === endYear ? startYear : `${startYear} - ${endYear}`

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">长期分布日历</h3>
      <p className="text-xs text-slate-500 mb-3">{dateRange}</p>
      <div ref={chartRef} className="min-h-[120px] w-full" />
    </div>
  )
}
