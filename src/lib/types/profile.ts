// This is the LIGHT profile for the grid.
// It's what your new 'get_nearby_users' SQL function returns.
export interface UserGridProfile {
  id: string
  display_name?: string
  username?: string // Keep username for fallback
  photo_url?: string
  photos?: string[] // supabase-js will parse the 'jsonb' column into this
  is_online?: boolean
  dtfn?: boolean
  distance_miles?: number | null
  party_friendly?: boolean // This is light enough to include in the grid
  tags?: string[] // Good for showing 1-2 tags on the card
}

// This is the FULL profile for the modal.
// It extends the grid profile and adds all the heavy details.
export interface UserFullProfile extends UserGridProfile {
  age?: number
  position?: string
  height?: string
  weight?: string
  body_type?: string
  ethnicity?: string
  about?: string
  kinks?: string[]
  hiv_status?: string
  prep_status?: string
  last_tested?: string
  practices?: string
  hosting?: boolean
  looking_for?: string
  latitude?: number
  longitude?: number
}