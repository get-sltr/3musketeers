'use client'

import { useState, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile'

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
  onLoadError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * Image component with automatic fallback handling
 * Gracefully handles 401, 404, and other image load errors
 * Uses local fallback to avoid additional network requests on error
 */
export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_PROFILE_IMAGE,
  onLoadError,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fallbackSrc)
      onLoadError?.(e)
    }
  }, [hasError, fallbackSrc, onLoadError])

  // Reset error state if src changes
  if (src !== imgSrc && !hasError) {
    setImgSrc(src)
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  )
}
