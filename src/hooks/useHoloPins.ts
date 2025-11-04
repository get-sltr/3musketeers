"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Pin, HoloPinsOptions } from '@/types/pins'

export function useHoloPins(autoLoad: boolean = true) {
  const supabase = useMemo(() => createClient(), [])
  const [pins, setPins] = useState<Pin[]>([])
  const [options, setOptions] = useState<HoloPinsOptions>({ partyMode: 0, prideMonth: 0 })
  const [loading, setLoading] = useState<boolean>(!!autoLoad)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!autoLoad) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: profiles, error: err } = await supabase
          .from('profiles')
          .select('id, display_name, username, photos, photo_url, online, is_online, dtfn, party_friendly, latitude, longitude, founder')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        if (err) throw err

        const mapped: Pin[] = (profiles || []).map((p: any) => ({
          id: p.id,
          lng: p.longitude,
          lat: p.latitude,
          name: p.display_name || p.username,
          photo: (p.photos && p.photos[0]) || p.photo_url || undefined,
          status: (p.online || p.is_online) ? 'online' : 'offline',
          badge: p.dtfn ? 'DTFN' : null,
          premiumTier: p.founder ? 2 : (p.party_friendly ? 1 : 0),
        }))
        setPins(mapped)
      } catch (e: any) {
        setError(e?.message || 'Failed to load pins')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [autoLoad, supabase])

  useEffect(() => {
    // Daily settings refresh - gracefully handle missing settings table
    const now = Date.now()
    const key = 'holoPins:lastSettingsFetch'
    const last = Number(localStorage.getItem(key) || '0')
    const shouldFetch = now - last > 24 * 60 * 60 * 1000

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('party_mode, pride_month')
          .limit(1)
          .single()
        if (!error && data) {
          setOptions({
            partyMode: Number(data.party_mode || 0),
            prideMonth: Number(data.pride_month || 0),
          })
          localStorage.setItem(key, String(now))
        } else {
          // Settings table doesn't exist or error - use defaults
          setOptions({ partyMode: 0, prideMonth: 0 })
        }
      } catch (err) {
        // Settings table doesn't exist - use defaults silently
        setOptions({ partyMode: 0, prideMonth: 0 })
      }
    }

    if (shouldFetch) fetchSettings()
  }, [supabase])

  return { pins, options, loading, error }
}