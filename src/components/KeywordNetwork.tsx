import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { useDreamStore } from '@/store/dreamStore'
import type { CooccurrenceNode, CooccurrenceEdge } from '@/types/dream'

export default function KeywordNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const dreams = useDreamStore((s) => s.dreams)
  const selectedKeyword = useDreamStore((s) => s.selectedKeyword)
  const selectKeyword = useDreamStore((s) => s.selectKeyword)

  const handleClick = useCallback(
    (keyword: string | null) => {
      if (selectedKeyword === keyword) {
        selectKeyword(null)
      } else {
        selectKeyword(keyword)
      }
    },
    [selectedKeyword, selectKeyword]
  )

  useEffect(() => {
    if (!svgRef.current || dreams.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.parentElement!.clientWidth
    const height = 360

    svg.attr('width', width).attr('height', height)

    const keywordMap = new Map<string, number>()
    dreams.forEach((d) => {
      d.keywords.forEach((k) => {
        keywordMap.set(k, (keywordMap.get(k) || 0) + 1)
      })
    })

    const cooccurrenceMap = new Map<string, number>()
    dreams.forEach((d) => {
      const ks = d.keywords
      for (let i = 0; i < ks.length; i++) {
        for (let j = i + 1; j < ks.length; j++) {
          const pair = [ks[i], ks[j]].sort().join('||')
          cooccurrenceMap.set(pair, (cooccurrenceMap.get(pair) || 0) + 1)
        }
      }
    })

    const nodes: CooccurrenceNode[] = Array.from(keywordMap.entries())
      .filter(([, count]) => count >= 1)
      .map(([id, count]) => ({ id, count }))

    const nodeIds = new Set(nodes.map((n) => n.id))

    const edges: CooccurrenceEdge[] = Array.from(cooccurrenceMap.entries())
      .filter(([, weight]) => weight >= 1)
      .map(([pair, weight]) => {
        const [source, target] = pair.split('||')
        if (!nodeIds.has(source) || !nodeIds.has(target)) return null
        return { source, target, weight }
      })
      .filter(Boolean) as CooccurrenceEdge[]

    if (nodes.length === 0) return

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(edges as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
          .id((d: any) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))

    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    const link = g
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'rgba(124, 58, 237, 0.3)')
      .attr('stroke-width', (d) => Math.min(d.weight * 2, 6))

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d: any) => handleClick(d.id))
      .call(
        d3
          .drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    node
      .append('circle')
      .attr('r', (d) => Math.min(8 + d.count * 3, 28))
      .attr('fill', (d) =>
        d.id === selectedKeyword ? '#f0c040' : 'rgba(124, 58, 237, 0.7)'
      )
      .attr('stroke', (d) =>
        d.id === selectedKeyword ? '#f0c040' : 'rgba(124, 58, 237, 0.3)'
      )
      .attr('stroke-width', (d) => (d.id === selectedKeyword ? 3 : 1))
      .style('filter', (d) =>
        d.id === selectedKeyword
          ? 'drop-shadow(0 0 8px rgba(240, 192, 64, 0.6))'
          : 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.4))'
      )

    node
      .append('text')
      .text((d) => d.id)
      .attr('dy', (d) => Math.min(8 + d.count * 3, 28) + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.id === selectedKeyword ? '#f0c040' : '#c4b5fd'))
      .attr('font-size', '11px')
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [dreams, selectedKeyword, handleClick])

  if (dreams.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-80 text-slate-500 text-sm">
        记录梦境后，关键词共现网络将在此展示
      </div>
    )
  }

  return (
    <div className="glass-card glass-card-hover p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">关键词共现网络</h3>
      <p className="text-xs text-slate-500 mb-2">点击节点筛选相关梦境，拖拽移动节点</p>
      <svg ref={svgRef} className="w-full" style={{ minHeight: 360 }} />
    </div>
  )
}
