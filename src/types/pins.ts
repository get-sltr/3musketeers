export type Status = 'online' | 'away' | 'dtfn' | 'offline'
export type Badge = 'DTFN' | 'NOW' | null

export interface Pin {
  id: string
  lng: number
  lat: number
  name?: string
  photo?: string
  status?: Status
  badge?: Badge
  premiumTier?: 0 | 1 | 2 // 0: none, 1: premium, 2: founder
  isCurrentUser?: boolean
  clusterSize?: number // if present >0, this instance is a cluster sprite
}

export interface HoloPinsOptions {
  partyMode?: number
  prideMonth?: number
}