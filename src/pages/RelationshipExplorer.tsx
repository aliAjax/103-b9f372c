import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Network, Users, MapPin, Tag, X, Star, Eye, Edit3, Sparkles, Calendar, Filter, SlidersHorizontal, RotateCcw, Search, Crosshair, ZoomIn } from 'lucide-react'
import type { Dream, RelationshipNode, RelationshipEdge, NodeType, NodeNeighbor } from '@/types/dream'
import { seedDemoData } from '@/utils/seedData'

type TimeRangeType = 'all' | '30days' | '90days' | 'month' | 'custom'

interface FilterState {
  timeRange: TimeRangeType
  selectedMonth: string
  dateFrom: string
  dateTo: string
  minAssociation: number
}

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

function getDateRangeForTimeRange(
  timeRange: TimeRangeType,
  selectedMonth: string,
  dateFrom: string,
  dateTo: string,
  today: Date
): { from: string | null; to: string | null } {
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (timeRange) {
    case 'all':
      return { from: null, to: null }
    case '30days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 30)
      return { from: formatDate(from), to: formatDate(today) }
    }
    case '90days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 90)
      return { from: formatDate(from), to: formatDate(today) }
    }
    case 'month': {
      if (!selectedMonth) return { from: null, to: null }
      const [year, month] = selectedMonth.split('-').map(Number)
      const from = new Date(year, month - 1, 1)
      const to = new Date(year, month, 0)
      return { from: formatDate(from), to: formatDate(to) }
    }
    case 'custom': {
      return {
        from: dateFrom || null,
        to: dateTo || null,
      }
    }
    default:
      return { from: null, to: null }
  }
}

function filterDreamsByDate(dreams: Dream[], from: string | null, to: string | null): Dream[] {
  return dreams.filter((d) => {
    if (from && d.date < from) return false
    if (to && d.date > to) return false
    return true
  })
}

export default function RelationshipExplorer() {
  const navigate = useNavigate()
  const dreams = useDreamStore((s) => s.dreams)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const nodePositionsRef = useRef<Map<string, { x: number; y: number; fx?: number | null; fy?: number | null }>>(new Map())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusMode, setFocusMode] = useState(true)
  const [typeFilter, setTypeFilter] = useState<Set<NodeType>>(
    new Set(['person', 'place', 'keyword'])
  )
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    timeRange: 'all',
    selectedMonth: '',
    dateFrom: '',
    dateTo: '',
    minAssociation: 1,
  })

  const today = useMemo(() => new Date(), [])

  const dateRange = useMemo(
    () => getDateRangeForTimeRange(filters.timeRange, filters.selectedMonth, filters.dateFrom, filters.dateTo, today),
    [filters, today]
  )

  const dateFilteredDreams = useMemo(
    () => filterDreamsByDate(dreams, dateRange.from, dateRange.to),
    [dreams, dateRange]
  )

  const { nodes, edges } = useMemo(() => buildGraphData(dateFilteredDreams), [dateFilteredDreams])

  const maxWeight = useMemo(() => Math.max(...edges.map((e) => e.weight), 1), [edges])

  const strengthFilteredEdges = useMemo(
    () => edges.filter((e) => e.weight >= filters.minAssociation),
    [edges, filters.minAssociation]
  )

  const strengthFilteredNodeIds = useMemo(() => {
    const ids = new Set<string>()
    strengthFilteredEdges.forEach((e) => {
      ids.add(e.source)
      ids.add(e.target)
    })
    return ids
  }, [strengthFilteredEdges])

  const filteredNodes = useMemo(
    () => nodes.filter((n) => typeFilter.has(n.type) && strengthFilteredNodeIds.has(n.id)),
    [nodes, typeFilter, strengthFilteredNodeIds]
  )

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  )

  const filteredEdges = useMemo(
    () =>
      strengthFilteredEdges.filter(
        (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
      ),
    [strengthFilteredEdges, filteredNodeIds]
  )

  const searchMatchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const query = searchQuery.toLowerCase().trim()
    return new Set(
      filteredNodes
        .filter((n) => n.id.toLowerCase().includes(query))
        .map((n) => n.id)
    )
  }, [searchQuery, filteredNodes])

  const focusNeighborIds = useMemo(() => {
    if (!selectedNode || !focusMode) return new Set<string>()
    const neighborIds = new Set<string>([selectedNode])
    filteredEdges.forEach((e) => {
      if (e.source === selectedNode) neighborIds.add(e.target)
      if (e.target === selectedNode) neighborIds.add(e.source)
    })
    return neighborIds
  }, [selectedNode, focusMode, filteredEdges])

  const hasFilters = filters.timeRange !== 'all' || filters.minAssociation > 1 || searchQuery.trim() !== ''

  const relatedDreams = useMemo(
    () => (selectedNode ? getRelatedDreams(dateFilteredDreams, selectedNode) : []),
    [dateFilteredDreams, selectedNode]
  )

  const neighbors = useMemo(
    () => (selectedNode ? getNeighbors(selectedNode, filteredNodes, filteredEdges) : []),
    [selectedNode, filteredNodes, filteredEdges]
  )

  const selectedNodeData = useMemo(
    () => filteredNodes.find((n) => n.id === selectedNode) || null,
    [filteredNodes, selectedNode]
  )

  const resetFilters = useCallback(() => {
    setFilters({
      timeRange: 'all',
      selectedMonth: '',
      dateFrom: '',
      dateTo: '',
      minAssociation: 1,
    })
    setTypeFilter(new Set(['person', 'place', 'keyword']))
    setSelectedNode(null)
    setSearchQuery('')
  }, [])

  const focusOnNode = useCallback((nodeId: string) => {
    if (!svgRef.current || !zoomRef.current || !gRef.current) return

    const node = nodePositionsRef.current.get(nodeId)
    if (!node) return

    const width = svgRef.current.parentElement!.clientWidth
    const height = containerRef.current
      ? containerRef.current.clientHeight - 120
      : 600

    const scale = 1.8
    const x = width / 2 - node.x * scale
    const y = height / 2 - node.y * scale

    const transform = d3.zoomIdentity.translate(x, y).scale(scale)

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomRef.current.transform as any, transform)
  }, [])

  const handleSearchSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId)
    setTimeout(() => focusOnNode(nodeId), 50)
  }, [focusOnNode])

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNode((prev) => {
        const next = prev === nodeId ? null : nodeId
        if (next) {
          setTimeout(() => focusOnNode(nodeId), 50)
        }
        return next
      })
    },
    [focusOnNode]
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

  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null)

  useEffect(() => {
    if (selectedNode && !filteredNodeIds.has(selectedNode)) {
      setSelectedNode(null)
    }
  }, [selectedNode, filteredNodeIds])

  useEffect(() => {
    if (selectedNode && filteredNodeIds.has(selectedNode)) {
      const timer = setTimeout(() => focusOnNode(selectedNode), 150)
      return () => clearTimeout(timer)
    }
  }, [filteredNodes])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (simulationRef.current) {
      simulationRef.current.stop()
      simulationRef.current = null
    }

    const width = svgRef.current.parentElement!.clientWidth
    const height = containerRef.current
      ? containerRef.current.clientHeight - 120
      : 600

    svg.attr('width', width).attr('height', height)

    if (filteredNodes.length < 2) {
      return
    }

    const simNodes: SimulationNode[] = filteredNodes.map((n) => {
      const saved = nodePositionsRef.current.get(n.id)
      return {
        ...n,
        x: saved?.x,
        y: saved?.y,
        fx: saved?.fx ?? undefined,
        fy: saved?.fy ?? undefined,
      }
    })

    const simEdges = filteredEdges.map((e) => ({ ...e, source: e.source as string, target: e.target as string }))

    const simulation = d3
      .forceSimulation(simNodes)
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

    simulationRef.current = simulation

    const g = svg.append('g')
    gRef.current = g

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    zoomRef.current = zoom
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
      .attr('stroke-width', (d) => Math.min(d.weight * 1.5, 5))

    const node = g
      .append('g')
      .selectAll('g')
      .data(simNodes)
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
            nodePositionsRef.current.set(d.id, { x: d.x!, y: d.y!, fx: null, fy: null })
          })
      )

    node
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d) => Math.min(10 + d.count * 2.5, 30))

    node
      .append('text')
      .attr('class', 'node-icon')
      .text((d) => TYPE_ICONS[d.type])
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d) => Math.min(10 + d.count, 18))
      .style('pointer-events', 'none')

    node
      .append('text')
      .attr('class', 'node-label')
      .text((d) => d.id)
      .attr('dy', (d) => Math.min(10 + d.count * 2.5, 30) + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')

    const updateVisualState = () => {
      link.attr('stroke-opacity', (d: any) => {
        const src = d.source.id || d.source
        const tgt = d.target.id || d.target
        if (selectedNode && focusMode) {
          if (src === selectedNode || tgt === selectedNode) return 0.8
          return 0.08
        }
        return 0.4
      })

      node.selectAll<SVGCircleElement, SimulationNode>('.node-circle')
        .attr('fill', (d) => {
          if (d.id === selectedNode) return '#f0c040'
          if (searchMatchedNodeIds.has(d.id)) return '#fbbf24'
          return TYPE_COLORS[d.type]
        })
        .attr('fill-opacity', (d) => {
          if (d.id === selectedNode) return 0.95
          if (searchMatchedNodeIds.has(d.id)) return 0.9
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id)) return 0.15
          return 0.7
        })
        .attr('stroke', (d) => {
          if (d.id === selectedNode) return '#f0c040'
          if (searchMatchedNodeIds.has(d.id)) return '#fbbf24'
          return TYPE_COLORS[d.type]
        })
        .attr('stroke-width', (d) => {
          if (d.id === selectedNode) return 3
          if (searchMatchedNodeIds.has(d.id)) return 2.5
          return 1.5
        })
        .attr('stroke-opacity', (d) => {
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id) && d.id !== selectedNode) return 0.3
          return 0.8
        })
        .style('filter', (d) => {
          if (d.id === selectedNode) return 'drop-shadow(0 0 12px rgba(240, 192, 64, 0.7))'
          if (searchMatchedNodeIds.has(d.id)) return 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))'
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id)) return 'none'
          return `drop-shadow(0 0 6px ${TYPE_COLORS[d.type]}66)`
        })

      node.selectAll<SVGTextElement, SimulationNode>('.node-label')
        .attr('fill', (d) => {
          if (d.id === selectedNode) return '#f0c040'
          if (searchMatchedNodeIds.has(d.id)) return '#fbbf24'
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id)) return '#475569'
          return '#cbd5e1'
        })
        .attr('opacity', (d) => {
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id)) return 0.3
          return 1
        })

      node.selectAll<SVGTextElement, SimulationNode>('.node-icon')
        .attr('opacity', (d) => {
          if (selectedNode && focusMode && !focusNeighborIds.has(d.id)) return 0.3
          return 1
        })
    }

    updateVisualState()

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as unknown as SimulationNode).x!)
        .attr('y1', (d) => (d.source as unknown as SimulationNode).y!)
        .attr('x2', (d) => (d.target as unknown as SimulationNode).x!)
        .attr('y2', (d) => (d.target as unknown as SimulationNode).y!)
      node.attr('transform', (d) => `translate(${d.x},${d.y})`)

      simNodes.forEach((n) => {
        if (n.x !== undefined && n.y !== undefined) {
          const existing = nodePositionsRef.current.get(n.id)
          nodePositionsRef.current.set(n.id, {
            x: n.x,
            y: n.y,
            fx: existing?.fx ?? n.fx ?? null,
            fy: existing?.fy ?? n.fy ?? null,
          })
        }
      })
    })

    return () => {
      simulation.stop()
      if (simulationRef.current === simulation) {
        simulationRef.current = null
      }
    }
  }, [filteredNodes, filteredEdges, selectedNode, handleNodeClick, searchMatchedNodeIds, focusMode, focusNeighborIds])

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-white flex items-center gap-3">
              <Network size={28} className="text-dreamscape" />
              关系探索
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              探索梦境中人物、地点与关键词之间的关联网络
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索人物、地点、关键词..."
                  className="glow-input w-64 pl-9 pr-8 py-1.5 text-sm bg-slate-900/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                {searchQuery && searchMatchedNodeIds.size > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card max-h-60 overflow-y-auto z-50">
                    {filteredNodes
                      .filter((n) => searchMatchedNodeIds.has(n.id))
                      .map((node) => (
                        <div
                          key={node.id}
                          onClick={() => handleSearchSelect(node.id)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <span>{TYPE_ICONS[node.type]}</span>
                          <span className="text-sm text-white flex-1">{node.id}</span>
                          <span className="text-xs text-slate-400">{TYPE_LABELS[node.type]}</span>
                          <ZoomIn size={14} className="text-dreamscape" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  focusMode
                    ? 'bg-dreamscape/20 text-dreamscape border border-dreamscape/40'
                    : 'bg-white/5 text-slate-500 border border-transparent opacity-50'
                }`}
                title={focusMode ? '聚焦模式已开启：选中节点后仅显示其邻居' : '点击开启聚焦模式'}
              >
                <Crosshair size={14} />
                <span>聚焦</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  showFilters || hasFilters
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-slate-500 border border-transparent opacity-50'
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>筛选</span>
                {hasFilters && (
                  <span className="w-4 h-4 rounded-full bg-dreamscape text-[10px] flex items-center justify-center text-black font-bold">
                    !
                  </span>
                )}
              </button>
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

        {showFilters && (
          <div className="mt-4 glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Filter size={16} className="text-dreamscape" />
                <span className="font-medium">筛选条件</span>
              </div>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  重置
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> 时间范围
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => updateFilter('timeRange', e.target.value as TimeRangeType)}
                  className="glow-input w-full px-3 py-2 text-sm bg-slate-900/50"
                >
                  <option value="all">全部时间</option>
                  <option value="30days">最近 30 天</option>
                  <option value="90days">最近 90 天</option>
                  <option value="month">按月份</option>
                  <option value="custom">自定义范围</option>
                </select>
              </div>

              {filters.timeRange === 'month' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">选择月份</label>
                  <input
                    type="month"
                    value={filters.selectedMonth}
                    onChange={(e) => updateFilter('selectedMonth', e.target.value)}
                    className="glow-input w-full px-3 py-2 text-sm bg-slate-900/50"
                  />
                </div>
              )}

              {filters.timeRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">起始日期</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilter('dateFrom', e.target.value)}
                      className="glow-input w-full px-3 py-2 text-sm bg-slate-900/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">结束日期</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilter('dateTo', e.target.value)}
                      className="glow-input w-full px-3 py-2 text-sm bg-slate-900/50"
                    />
                  </div>
                </>
              )}

              <div className={filters.timeRange === 'custom' ? 'lg:col-span-4' : ''}>
                <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-starlight" />
                  最小关联次数: {filters.minAssociation}
                  <span className="text-slate-500 font-normal">(最高 {maxWeight})</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={maxWeight}
                    value={filters.minAssociation}
                    onChange={(e) => updateFilter('minAssociation', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-dreamscape"
                  />
                  <input
                    type="number"
                    min={1}
                    max={maxWeight}
                    value={filters.minAssociation}
                    onChange={(e) => updateFilter('minAssociation', Math.min(maxWeight, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="glow-input w-20 px-2 py-1.5 text-sm text-center bg-slate-900/50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
              <div>
                筛选后: {dateFilteredDreams.length} 条梦境 · {filteredNodes.length} 个节点 · {filteredEdges.length} 条关联
              </div>
              {dateRange.from && dateRange.to && (
                <div>
                  日期范围: {dateRange.from} ~ {dateRange.to}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden px-6 pb-6">
        <div
          ref={containerRef}
          className="flex-1 glass-card glass-card-hover p-4 mr-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>
                {filteredNodes.length} 个节点 · {filteredEdges.length} 条关联 · {filteredNodes.length >= 2 ? '点击节点查看详情 · 拖拽可移动' : '需要至少 2 个节点才能显示网络图'}
              </span>
              {searchQuery && searchMatchedNodeIds.size > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Search size={12} />
                  找到 {searchMatchedNodeIds.size} 个匹配
                </span>
              )}
              {focusMode && selectedNode && (
                <span className="text-dreamscape flex items-center gap-1">
                  <Crosshair size={12} />
                  聚焦模式
                </span>
              )}
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
          {filteredNodes.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-lg text-white mb-2">
                {dateFilteredDreams.length === 0 ? '该时间范围内没有梦境' : '筛选结果不足以生成网络图'}
              </h3>
              <p className="text-sm text-slate-400 mb-4 max-w-md">
                {dateFilteredDreams.length === 0
                  ? '当前选择的时间范围内没有记录的梦境，请尝试调整时间范围'
                  : `当前筛选条件下只有 ${filteredNodes.length} 个节点，需要至少 2 个节点才能显示关联网络。请尝试降低最小关联次数或调整其他筛选条件。`}
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  重置筛选条件
                </button>
              )}
            </div>
          ) : (
            <svg ref={svgRef} className="w-full" />
          )}
        </div>

        <div className="w-96 flex flex-col gap-4 overflow-hidden">
          {selectedNode && selectedNodeData ? (
            <>
              <div className="glass-card glass-card-hover p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{TYPE_ICONS[selectedNodeData.type]}</span>
                      <h2 className="font-display text-xl text-white">{selectedNode}</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      {TYPE_LABELS[selectedNodeData.type]} · 出现 {selectedNodeData.count} 次
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
          ) : filteredNodes.length < 2 ? (
            <div className="glass-card p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-lg text-white mb-2">
                {dateFilteredDreams.length === 0 ? '暂无数据' : '节点不足'}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {dateFilteredDreams.length === 0
                  ? '当前筛选条件下没有梦境数据'
                  : '筛选结果太少，无法查看节点详情'}
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  重置筛选条件
                </button>
              )}
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">👆</div>
              <h3 className="font-display text-lg text-white mb-2">选择一个节点</h3>
              <p className="text-sm text-slate-400">
                点击网络图中的任意节点，查看相关梦境和关联节点
              </p>
              {hasFilters && (
                <div className="mt-4 p-3 rounded-lg bg-dreamscape/10 border border-dreamscape/30 w-full text-left">
                  <div className="text-xs font-medium text-dreamscape mb-1 flex items-center gap-1">
                    <Filter size={12} /> 当前筛选
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>梦境: {dateFilteredDreams.length} 条</div>
                    <div>节点: {filteredNodes.length} 个</div>
                    <div>关联: {filteredEdges.length} 条</div>
                    {dateRange.from && dateRange.to && (
                      <div>日期: {dateRange.from} ~ {dateRange.to}</div>
                    )}
                    {filters.minAssociation > 1 && (
                      <div>最小关联: {filters.minAssociation} 次</div>
                    )}
                  </div>
                </div>
              )}
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
