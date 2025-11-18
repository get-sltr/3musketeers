// hooks/useCleanup.ts
import { useEffect, useRef } from 'react'

type CleanupFunction = () => void

export function useCleanup() {
  const cleanupFns = useRef<CleanupFunction[]>([])

  const register = (fn: CleanupFunction) => {
    cleanupFns.current.push(fn)
  }

  const cleanup = () => {
    cleanupFns.current.forEach((fn) => {
      try {
        fn()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })
    cleanupFns.current = []
  }

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return { register, cleanup }
}
