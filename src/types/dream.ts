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
