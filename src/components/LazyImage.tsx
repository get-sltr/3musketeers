'use client'

import { useState, useRef, useEffect } from 'react'
import LoadingSkeleton from './LoadingSkeleton'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
}

export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  onLoad,
  onError,
  style
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isInView && (
        <LoadingSkeleton 
          variant="avatar" 
          className={`w-full h-full ${className}`}
        />
      )}
      
      {isInView && !isLoaded && !hasError && (
        <LoadingSkeleton 
          variant="avatar" 
          className={`w-full h-full ${className}`}
        />
      )}
      
      {isInView && (
        <img
          src={hasError ? placeholder || '/placeholder-avatar.png' : src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          width={width}
          height={height}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  )
}

// Avatar component with lazy loading
export function LazyAvatar({ 
  src, 
  alt, 
  size = 40, 
  className = '' 
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

// Profile image with lazy loading
export function LazyProfileImage({ 
  src, 
  alt, 
  className = '' 
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
    />
  )
}
