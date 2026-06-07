import type {
  Dream,
  CooccurrenceNode,
  CooccurrenceEdge,
  RelationshipNode,
  RelationshipEdge,
  NodeType,
  NodeNeighbor,
} from '@/types/dream'

export function buildKeywordCooccurrenceNetwork(
  dreams: Dream[],
  minCount: number = 1,
  minWeight: number = 1
): { nodes: CooccurrenceNode[]; edges: CooccurrenceEdge[] } {
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
    .filter(([, count]) => count >= minCount)
    .map(([id, count]) => ({ id, count }))

  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges: CooccurrenceEdge[] = Array.from(cooccurrenceMap.entries())
    .filter(([, weight]) => weight >= minWeight)
    .map(([pair, weight]) => {
      const [source, target] = pair.split('||')
      if (!nodeIds.has(source) || !nodeIds.has(target)) return null
      return { source, target, weight }
    })
    .filter(Boolean) as CooccurrenceEdge[]

  return { nodes, edges }
}

export function buildRelationshipGraph(dreams: Dream[]): {
  nodes: RelationshipNode[]
  edges: RelationshipEdge[]
} {
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

export function getNodeNeighbors(
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

export function filterNodesByType(
  nodes: RelationshipNode[],
  allowedTypes: Set<NodeType>
): RelationshipNode[] {
  return nodes.filter((n) => allowedTypes.has(n.type))
}

export function filterEdgesByMinWeight(
  edges: RelationshipEdge[],
  minWeight: number
): RelationshipEdge[] {
  return edges.filter((e) => e.weight >= minWeight)
}

export function getNodeIdsFromEdges(edges: RelationshipEdge[]): Set<string> {
  const ids = new Set<string>()
  edges.forEach((e) => {
    ids.add(e.source)
    ids.add(e.target)
  })
  return ids
}

export function filterEdgesByNodeIds(
  edges: RelationshipEdge[],
  nodeIds: Set<string>
): RelationshipEdge[] {
  return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
}

export function filterNodesByIds(
  nodes: RelationshipNode[],
  nodeIds: Set<string>
): RelationshipNode[] {
  return nodes.filter((n) => nodeIds.has(n.id))
}

export function searchNodes(nodes: RelationshipNode[], query: string): Set<string> {
  if (!query.trim()) return new Set<string>()
  const lowerQuery = query.toLowerCase().trim()
  return new Set(nodes.filter((n) => n.id.toLowerCase().includes(lowerQuery)).map((n) => n.id))
}

export function getNeighborNodeIds(
  nodeId: string | null,
  edges: RelationshipEdge[],
  includeSelf: boolean = true
): Set<string> {
  if (!nodeId) return new Set<string>()
  const neighborIds = new Set<string>(includeSelf ? [nodeId] : [])
  edges.forEach((e) => {
    if (e.source === nodeId) neighborIds.add(e.target)
    if (e.target === nodeId) neighborIds.add(e.source)
  })
  return neighborIds
}
