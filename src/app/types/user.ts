export interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos: string[]
  distance?: string
  eta?: string
  isOnline: boolean
  bio?: string
  about?: string
  position?: string
  kinks?: string[]
  tags?: string[]
  party_friendly?: boolean
  dtfn?: boolean
  isFavorited?: boolean
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  last_message?: Message
  other_user: User
}

export interface Profile {
  id: string
  email: string
  display_name?: string
  age: number
  height?: string
  weight?: string
  body_type?: string
  ethnicity?: string
  about?: string
  position?: string
  kinks?: string[]
  tags?: string[]
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  photo_url?: string
  verified: boolean
  premium: boolean
  online: boolean
  last_active: string
}

export interface Photo {
  id: string
  user_id: string
  photo_url: string
  order_index: number
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  favorited_user_id: string
  created_at: string
}


