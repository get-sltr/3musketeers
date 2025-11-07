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
          .select('id, display_name, photo_url, is_online, dtfn, party_friendly, latitude, longitude, founder_number')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        if (err) throw err

        const mapped: Pin[] = (profiles || []).map((p: any) => ({
          id: p.id,
          lng: p.longitude,
          lat: p.latitude,
          name: p.display_name || 'Anonymous',
          photo: p.photo_url || undefined,
          status: p.is_online ? 'online' : 'offline',
          badge: p.dtfn ? 'DTFN' : null,
          premiumTier: p.founder_number ? 2 : (p.party_friendly ? 1 : 0),
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
      const fallback = () => setOptions({ partyMode: 0, prideMonth: 0 })
      try {
        const queryTables = ['settings', 'user_settings']
        for (const table of queryTables) {
          const { data, error } = await supabase
            .from(table)
            .select('party_mode, pride_month')
            .limit(1)
            .maybeSingle()

          if (!error && data) {
            setOptions({
              partyMode: Number((data as any).party_mode || 0),
              prideMonth: Number((data as any).pride_month || 0),
            })
            localStorage.setItem(key, String(now))
            return
          }
        }
        fallback()
      } catch (err) {
        fallback()
      }
    }

    if (shouldFetch) fetchSettings()
  }, [supabase])

  return { pins, options, loading, error }
}