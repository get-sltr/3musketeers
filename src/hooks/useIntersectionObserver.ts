// hooks/useIntersectionObserver.ts
import { useEffect, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver(
  ref: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    enabled = true,
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!enabled || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold, root, rootMargin }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, threshold, root, rootMargin, enabled])

  return { isIntersecting }
}
