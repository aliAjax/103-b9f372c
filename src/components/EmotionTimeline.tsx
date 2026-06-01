import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { useDreamStore } from '@/store/dreamStore'

export default function EmotionTimeline() {
  const chartRef = useRef<HTMLDivElement>(null)
  const dreams = useDreamStore((s) => s.dreams)

  useEffect(() => {
    if (!chartRef.current) return
    const chart = echarts.init(chartRef.current, 'dark')

    const sorted = [...dreams].sort((a, b) => a.date.localeCompare(b.date))
    const dates = sorted.map((d) => d.date)
    const emotions = sorted.map((d) => d.emotionScore)
    const clarity = sorted.map((d) => d.clarityScore)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: unknown) => {
          const paramArray = params as Array<{ dataIndex: number; marker: string; seriesName: string; value: number }>
          const idx = paramArray[0].dataIndex
          const dream = sorted[idx]
          let html = `<div style="font-weight:600;margin-bottom:4px">${dream.date}</div>`
          paramArray.forEach((p) => {
            html += `<div>${p.marker} ${p.seriesName}: ${p.value}</div>`
          })
          if (dream.text) {
            html += `<div style="margin-top:4px;color:#94a3b8;font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${dream.text.slice(0, 50)}...</div>`
          }
          return html
        },
      },
      legend: {
        data: ['情绪', '清晰度'],
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 36, right: 16, bottom: 28, left: 36 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.2)' } },
        axisLabel: { color: '#64748b', fontSize: 10, rotate: dates.length > 15 ? 45 : 0 },
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
          name: '情绪',
          type: 'line',
          data: emotions,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#7c3aed', width: 2 },
          itemStyle: { color: '#7c3aed' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124, 58, 237, 0.3)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0.02)' },
            ]),
          },
        },
        {
          name: '清晰度',
          type: 'line',
          data: clarity,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 5,
          lineStyle: { color: '#f0c040', width: 1.5, type: 'dashed' },
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
  }, [dreams])

  if (dreams.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64 text-slate-500 text-sm">
        记录梦境后，情绪时间线将在此展示
      </div>
    )
  }

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">情绪时间线</h3>
      <div ref={chartRef} className="h-56 w-full" />
    </div>
  )
}
