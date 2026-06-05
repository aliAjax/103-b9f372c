import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { Dream } from '@/types/dream'

interface Props {
  dreams: Dream[]
}

export default function PeopleFrequency({ dreams }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || dreams.length === 0) return
    const chart = echarts.init(chartRef.current, 'dark')

    const peopleMap = new Map<string, number>()
    dreams.forEach((d) => {
      d.people.forEach((p) => {
        peopleMap.set(p, (peopleMap.get(p) || 0) + 1)
      })
    })

    const sorted = Array.from(peopleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)

    if (sorted.length === 0) {
      chart.dispose()
      return
    }

    const names = sorted.map(([name]) => name)
    const values = sorted.map(([, count]) => count)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 19, 52, 0.9)',
        borderColor: 'rgba(124, 58, 237, 0.4)',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        axisPointer: { type: 'shadow' },
      },
      grid: { top: 8, right: 32, bottom: 8, left: 80 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.1)' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
      },
      yAxis: {
        type: 'category',
        data: names.reverse(),
        axisLine: { lineStyle: { color: 'rgba(124, 58, 237, 0.2)' } },
        axisLabel: { color: '#c4b5fd', fontSize: 11 },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: values.reverse(),
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 7, 7, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: 'rgba(124, 58, 237, 0.5)' },
              { offset: 1, color: 'rgba(124, 58, 237, 0.9)' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: 'rgba(124, 58, 237, 0.7)' },
                { offset: 1, color: '#a78bfa' },
              ]),
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

  const peopleCount = new Set(dreams.flatMap((d) => d.people)).size

  if (peopleCount === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64 text-slate-500 text-sm">
        当前时间范围内暂无人物记录
      </div>
    )
  }

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-1">人物出现频率</h3>
      <p className="text-xs text-slate-500 mb-3">共 {peopleCount} 位人物</p>
      <div ref={chartRef} className="h-64 w-full" />
    </div>
  )
}
