export interface Dream {
  id: string
  text: string
  date: string
  wakeTime: string
  emotionScore: number
  clarityScore: number
  people: string[]
  places: string[]
  keywords: string[]
  createdAt: string
}

export interface CooccurrenceNode {
  id: string
  count: number
}

export interface CooccurrenceEdge {
  source: string
  target: string
  weight: number
}

export type NodeType = 'person' | 'place' | 'keyword'

export interface RelationshipNode extends CooccurrenceNode {
  type: NodeType
}

export interface RelationshipEdge {
  source: string
  target: string
  weight: number
  dreamIds: string[]
}

export interface NodeNeighbor {
  id: string
  type: NodeType
  weight: number
}

export interface Backup {
  id: string
  name: string
  createdAt: string
  dreamCount: number
  dreams: Dream[]
}

export interface SearchViewFilters {
  keyword: string
  person: string
  place: string
  dateFrom: string
  dateTo: string
  text: string
}

export interface SearchView {
  id: string
  name: string
  filters: SearchViewFilters
  createdAt: string
  updatedAt: string
}
