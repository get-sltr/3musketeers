// types/app.ts
export interface User {
  id: string
  display_name: string
  latitude?: number
  longitude?: number
  isYou?: boolean
  isFavorited?: boolean
  dtfn?: boolean
  party_friendly?: boolean
  photo_url?: string
  photos?: string[]
  is_online?: boolean
  online?: boolean
  founder_number?: number | null
  age?: number
  about?: string
  kinks?: string[]
  tags?: string[]
  position?: string
  height?: string
  body_type?: string
  ethnicity?: string
  distance_miles?: number | null
  distance_label?: string
  incognito_mode?: boolean
}

export interface AppState {
  userId: string | null
  origin: [number, number] | null
  loading: boolean
  error: Error | null
  viewMode: 'grid' | 'map'
  isIncognito: boolean
  isRelocating: boolean
}

export interface PaginationState {
  cursor: string | null
  hasMore: boolean
  loading: boolean
}
