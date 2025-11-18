// hooks/usePaginatedUsers.ts
import { useState, useCallback, useRef } from 'react'
import { createClient } from '../lib/supabase/client'
import type { User, PaginationState } from '../types/app'

const BATCH_SIZE = 50

export function usePaginatedUsers(
  userId: string | null,
  origin: [number, number] | null,
  radiusMiles: number,
  travelMode: boolean
) {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    cursor: null,
    hasMore: true,
    loading: false,
  })
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchUsers = useCallback(
    async (reset: boolean = false) => {
      if (!userId || !origin) return
      if (pagination.loading) return
      if (!reset && !pagination.hasMore) return

      // Cancel previous request
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      setPagination((prev) => ({ ...prev, loading: true }))
      setError(null)

      try {
        const effectiveRadius = travelMode ? 25000 : radiusMiles
        const currentCursor = reset ? null : pagination.cursor

        const { data: response, error: fetchError } = await supabase.rpc(
          'get_nearby_profiles_paginated',
          {
            p_user_id: userId,
            p_origin_lat: origin[1],
            p_origin_lon: origin[0],
            p_radius_miles: effectiveRadius,
            p_limit: BATCH_SIZE,
            p_cursor: currentCursor,
            p_filters: {},
          }
        )

        if (fetchError) throw fetchError

        // Parse JSONB response
        const data = response as { users: any[]; next_cursor: string | null; has_more: boolean }
        const profilesArray = data?.users || []

        const newUsers: User[] = profilesArray.map((profile: any) => ({
          id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          latitude: profile.latitude ?? undefined,
          longitude: profile.longitude ?? undefined,
          isYou: !!profile.is_self,
          isFavorited: false, // Load separately if needed
          dtfn: profile.dtfn ?? false,
          party_friendly: profile.party_friendly ?? false,
          photo_url: profile.photo_url ?? undefined,
          photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : undefined,
          is_online: profile.is_online ?? null,
          founder_number: profile.founder_number ?? null,
          about: profile.about ?? undefined,
          kinks: Array.isArray(profile.kinks) ? profile.kinks : undefined,
          tags: Array.isArray(profile.tags) ? profile.tags : undefined,
          position: profile.position ?? undefined,
          age: profile.age ?? undefined,
          online: profile.is_online ?? null,
          distance_miles: profile.distance_miles ?? null,
          distance_label: profile.is_self ? 'You' : formatDistance(profile.distance_miles),
          incognito_mode: profile.incognito_mode ?? false,
        }))

        setUsers((prev) => (reset ? newUsers : [...prev, ...newUsers]))
        setPagination({
          cursor: data.next_cursor,
          hasMore: data.has_more,
          loading: false,
        })
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err)
          setPagination((prev) => ({ ...prev, loading: false }))
        }
      }
    },
    [userId, origin, radiusMiles, travelMode, pagination.cursor, pagination.hasMore, pagination.loading]
  )

  const loadMore = useCallback(() => {
    fetchUsers(false)
  }, [fetchUsers])

  const refresh = useCallback(() => {
    setPagination({ cursor: null, hasMore: true, loading: false })
    fetchUsers(true)
  }, [fetchUsers])

  const cleanup = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return {
    users,
    loading: pagination.loading,
    hasMore: pagination.hasMore,
    error,
    loadMore,
    refresh,
    cleanup,
  }
}

function formatDistance(miles?: number | null) {
  if (miles == null) return undefined
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
