import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Network, Users, MapPin, Tag, X, Star, Eye, Edit3, Sparkles } from 'lucide-react'
import type { Dream, RelationshipNode, RelationshipEdge, NodeType, NodeNeighbor } from '@/types/dream'
import { seedDemoData } from '@/utils/seedData'

interface SimulationNode extends RelationshipNode, d3.SimulationNodeDatum {
  fx?: number | null
  fy?: number | null
}

const TYPE_COLORS: Record<NodeType, string> = {
  person: '#ec4899',
  place: '#22c55e',
  keyword: '#7c3aed',
}

const TYPE_ICONS: Record<NodeType, string> = {
  person: '👤',
  place: '📍',
  keyword: '🏷️',
}

const TYPE_LABELS: Record<NodeType, string> = {
  person: '人物',
  place: '地点',
  keyword: '关键词',
}

function buildGraphData(dreams: Dream[]) {
  const nodeMap = new Map<string, { count: number; type: NodeType }>()
  const edgeMap = new Map<string, { weight: number; dreamIds: string[] }>()

  dreams.forEach((dream) => {
    const allTags: Array<{ name: string; type: NodeType }> = [
      ...dream.people.map((name) => ({ name, type: 'person' as NodeType })),
      ...dream.places.map((name) => ({ name, type: 'place' as NodeType })),
      ...dream.keywords.map((name) => ({ name, type: 'keyword' as NodeType })),
    ]

    allTags.forEach(({ name, type }) => {
      const existing = nodeMap.get(name)
      if (existing) {
        existing.count++
      } else {
        nodeMap.set(name, { count: 1, type })
      }
    })

    for (let i = 0; i < allTags.length; i++) {
      for (let j = i + 1; j < allTags.length; j++) {
        const pair = [allTags[i].name, allTags[j].name].sort().join('||')
        const existing = edgeMap.get(pair)
        if (existing) {
          existing.weight++
          if (!existing.dreamIds.includes(dream.id)) {
            existing.dreamIds.push(dream.id)
          }
        } else {
          edgeMap.set(pair, { weight: 1, dreamIds: [dream.id] })
        }
      }
    }
  })

  const nodes: RelationshipNode[] = Array.from(nodeMap.entries()).map(([id, data]) => ({
    id,
    count: data.count,
    type: data.type,
  }))

  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges: RelationshipEdge[] = Array.from(edgeMap.entries())
    .map(([pair, data]) => {
      const [source, target] = pair.split('||')
      if (!nodeIds.has(source) || !nodeIds.has(target)) return null
      return {
        source,
        target,
        weight: data.weight,
        dreamIds: data.dreamIds,
      }
    })
    .filter(Boolean) as RelationshipEdge[]

  return { nodes, edges }
}

function getRelatedDreams(dreams: Dream[], nodeId: string): Dream[] {
  return dreams.filter(
    (d) =>
      d.people.includes(nodeId) ||
      d.places.includes(nodeId) ||
      d.keywords.includes(nodeId)
  )
}

function getNeighbors(
  nodeId: string,
  nodes: RelationshipNode[],
  edges: RelationshipEdge[]
): NodeNeighbor[] {
  const nodeTypeMap = new Map(nodes.map((n) => [n.id, n.type]))
  const neighbors: Map<string, { weight: number; type: NodeType }> = new Map()

  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      neighbors.set(edge.target, {
        weight: edge.weight,
        type: nodeTypeMap.get(edge.target)!,
      })
    } else if (edge.target === nodeId) {
      neighbors.set(edge.source, {
        weight: edge.weight,
        type: nodeTypeMap.get(edge.source)!,
      })
    }
  })

  return Array.from(neighbors.entries())
    .map(([id, data]) => ({ id, type: data.type, weight: data.weight }))
    .sort((a, b) => b.weight - a.weight)
}

export default function RelationshipExplorer() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<NodeType>>(
    new Set(['person', 'place', 'keyword'])
  )

  const { nodes, edges } = useMemo(() => buildGraphData(dreams), [dreams])

  const filteredNodes = useMemo(
    () => nodes.filter((n) => typeFilter.has(n.type)),
    [nodes, typeFilter]
  )

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  )

  const filteredEdges = useMemo(
    () =>
      edges.filter(
        (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
      ),
    [edges, filteredNodeIds]
  )

  const relatedDreams = useMemo(
    () => (selectedNode ? getRelatedDreams(dreams, selectedNode) : []),
    [dreams, selectedNode]
  )

  const neighbors = useMemo(
    () => (selectedNode ? getNeighbors(selectedNode, nodes, edges) : []),
    [selectedNode, nodes, edges]
  )

  const selectedNodeData = useMemo(
    () => nodes.find((n) => n.id === selectedNode) || null,
    [nodes, selectedNode]
  )

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNode((prev) => (prev === nodeId ? null : nodeId))
    },
    []
  )

  const toggleTypeFilter = useCallback((type: NodeType) => {
    setTypeFilter((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) {
          next.delete(type)
        }
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.parentElement!.clientWidth
    const height = containerRef.current
      ? containerRef.current.clientHeight - 120
      : 600

    svg.attr('width', width).attr('height', height)

    const simEdges = filteredEdges.map((e) => ({ ...e, source: e.source as string, target: e.target as string }))

    const simulation = d3
      .forceSimulation(filteredNodes as SimulationNode[])
      .force(
        'link',
        d3
          .forceLink<SimulationNode, RelationshipEdge>(simEdges)
          .id((d) => (d as SimulationNode).id)
          .distance(100)
          .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))

    const g = svg.append('g')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    const defs = g.append('defs')

    filteredEdges.forEach((edge, i) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')

      const sourceNode = filteredNodes.find((n) => n.id === edge.source)
      const targetNode = filteredNodes.find((n) => n.id === edge.target)

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', sourceNode ? TYPE_COLORS[sourceNode.type] : '#7c3aed')

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', targetNode ? TYPE_COLORS[targetNode.type] : '#7c3aed')
    })

    const link = g
      .append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', (_d, i) => `url(#gradient-${i})`)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => Math.min(d.weight * 1.5, 5))

    const node = g
      .append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => handleNodeClick(d.id))
      .call(
        d3
          .drag<SVGGElement, SimulationNode>()
          .on('start', (event, d: SimulationNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d: SimulationNode) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d: SimulationNode) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    node
      .append('circle')
      .attr('r', (d) => Math.min(10 + d.count * 2.5, 30))
      .attr('fill', (d) =>
        d.id === selectedNode ? '#f0c040' : TYPE_COLORS[d.type]
      )
      .attr('fill-opacity', (d) => (d.id === selectedNode ? 0.9 : 0.7))
      .attr('stroke', (d) =>
        d.id === selectedNode ? '#f0c040' : TYPE_COLORS[d.type]
      )
      .attr('stroke-width', (d) => (d.id === selectedNode ? 3 : 1.5))
      .attr('stroke-opacity', 0.8)
      .style('filter', (d) =>
        d.id === selectedNode
          ? 'drop-shadow(0 0 12px rgba(240, 192, 64, 0.7))'
          : `drop-shadow(0 0 6px ${TYPE_COLORS[d.type]}66)`
      )

    node
      .append('text')
      .text((d) => TYPE_ICONS[d.type])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => Math.min(10 + d.count, 18))
      .style('pointer-events', 'none')

    node
      .append('text')
      .text((d) => d.id)
      .attr('dy', (d) => Math.min(10 + d.count * 2.5, 30) + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.id === selectedNode ? '#f0c040' : '#cbd5e1'))
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as unknown as SimulationNode).x!)
        .attr('y1', (d) => (d.source as unknown as SimulationNode).y!)
        .attr('x2', (d) => (d.target as unknown as SimulationNode).x!)
        .attr('y2', (d) => (d.target as unknown as SimulationNode).y!)
      node.attr('transform', (d) => `translate(${(d as SimulationNode).x},${(d as SimulationNode).y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [filteredNodes, filteredEdges, selectedNode, handleNodeClick])

  if (dreams.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <Network size={28} className="text-dreamscape" />
            关系探索
          </h1>
          <p className="text-slate-400 text-sm mt-1">探索梦境中人物、地点与关键词之间的关联网络</p>
        </div>
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">🔮</div>
          <h2 className="font-display text-xl text-white mb-2">暂无数据</h2>
          <p className="text-slate-400 text-sm mb-6">记录梦境后，关系网络将在此展示</p>
          <button
            onClick={seedDemoData}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Sparkles size={16} />
            加载示例数据
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-white flex items-center gap-3">
              <Network size={28} className="text-dreamscape" />
              关系探索
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              探索梦境中人物、地点与关键词之间的关联网络
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(['person', 'place', 'keyword'] as NodeType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  typeFilter.has(type)
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-slate-500 border border-transparent opacity-50'
                }`}
              >
                <span>{TYPE_ICONS[type]}</span>
                <span>{TYPE_LABELS[type]}</span>
                <span className="text-[10px] opacity-60">
                  ({nodes.filter((n) => n.type === type).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden px-6 pb-6">
        <div
          ref={containerRef}
          className="flex-1 glass-card glass-card-hover p-4 mr-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-slate-500">
              {filteredNodes.length} 个节点 · {filteredEdges.length} 条关联 · 点击节点查看详情 · 拖拽可移动
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS.person, opacity: 0.7 }}
                />
                <span>人物</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS.place, opacity: 0.7 }}
                />
                <span>地点</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS.keyword, opacity: 0.7 }}
                />
                <span>关键词</span>
              </div>
            </div>
          </div>
          <svg ref={svgRef} className="w-full" />
        </div>

        <div className="w-96 flex flex-col gap-4 overflow-hidden">
          {selectedNode ? (
            <>
              <div className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{TYPE_ICONS[selectedNodeData!.type]}</span>
                      <h2 className="font-display text-xl text-white">{selectedNode}</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      {TYPE_LABELS[selectedNodeData!.type]} · 出现 {selectedNodeData!.count} 次
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-starlight" />
                    关联最强的节点
                  </h3>
                  {neighbors.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">
                      暂无关联节点
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {neighbors.slice(0, 10).map((neighbor) => (
                        <div
                          key={neighbor.id}
                          onClick={() => handleNodeClick(neighbor.id)}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span>{TYPE_ICONS[neighbor.type]}</span>
                            <span className="text-sm text-slate-200">{neighbor.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min((neighbor.weight / neighbors[0].weight) * 100, 100)}%`,
                                  backgroundColor: TYPE_COLORS[neighbor.type],
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-6 text-right">
                              {neighbor.weight}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    相关梦境 ({relatedDreams.length})
                  </h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {relatedDreams.map((dream) => (
                    <div
                      key={dream.id}
                      className="glass-card glass-card-hover p-4 cursor-pointer"
                      onClick={() => navigate(`/dream/${dream.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{dream.date}</span>
                          <span className="text-dreamscape/50">|</span>
                          <span>{dream.wakeTime}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/dream/${dream.id}/edit`)
                          }}
                          className="text-slate-500 hover:text-dreamscape transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed line-clamp-3 mb-3">
                        {dream.text}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-starlight" />
                          {dream.emotionScore}/5
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} className="text-dreamscape" />
                          {dream.clarityScore}/5
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {dream.people
                          .filter((p) => p === selectedNode || neighbors.some((n) => n.id === p))
                          .map((p) => (
                            <span
                              key={p}
                              className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                                p === selectedNode
                                  ? 'bg-starlight/30 text-starlight border border-starlight/50'
                                  : 'bg-pink-500/20 text-pink-400'
                              }`}
                            >
                              <Users size={10} />
                              {p}
                            </span>
                          ))}
                        {dream.places
                          .filter((p) => p === selectedNode || neighbors.some((n) => n.id === p))
                          .map((p) => (
                            <span
                              key={p}
                              className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                                p === selectedNode
                                  ? 'bg-starlight/30 text-starlight border border-starlight/50'
                                  : 'bg-green-500/20 text-green-400'
                              }`}
                            >
                              <MapPin size={10} />
                              {p}
                            </span>
                          ))}
                        {dream.keywords
                          .filter((k) => k === selectedNode || neighbors.some((n) => n.id === k))
                          .map((k) => (
                            <span
                              key={k}
                              className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${
                                k === selectedNode
                                  ? 'bg-starlight/30 text-starlight border border-starlight/50'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              <Tag size={10} />
                              {k}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">👆</div>
              <h3 className="font-display text-lg text-white mb-2">选择一个节点</h3>
              <p className="text-sm text-slate-400">
                点击网络图中的任意节点，查看相关梦境和关联节点
              </p>
              <div className="mt-6 space-y-3 w-full max-w-xs">
                <div className="p-3 rounded-lg bg-white/5 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-pink-400" />
                    <span className="text-xs font-medium text-slate-300">人物节点</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    出现在梦境中的人物，粉色表示
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-green-400" />
                    <span className="text-xs font-medium text-slate-300">地点节点</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    梦境发生的地点，绿色表示
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag size={14} className="text-purple-400" />
                    <span className="text-xs font-medium text-slate-300">关键词节点</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    从梦境中提取的关键词，紫色表示
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
