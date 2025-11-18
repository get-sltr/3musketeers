// components/GridViewWithPagination.tsx
import { useCallback, useEffect, useRef } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import GridViewProduction from './GridViewProduction'
import type { User } from '../types/app'

interface GridViewWithPaginationProps {
  users: User[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onUserClick: (userId: string) => void
  onRefresh: () => void
}

export default function GridViewWithPagination({
  users,
  loading,
  hasMore,
  onLoadMore,
  onUserClick,
  onRefresh,
}: GridViewWithPaginationProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for infinite scroll
  const { isIntersecting } = useIntersectionObserver(loadMoreRef, {
    threshold: 0.1,
    rootMargin: '100px',
  })

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

  return (
    <div className="relative">
      {/* Pull to refresh */}
      <div className="absolute top-0 left-0 right-0 z-10">
        {/* Add pull-to-refresh UI here if needed */}
      </div>

      {/* Existing Grid View */}
      <GridViewProduction 
        onUserClick={onUserClick}
        users={users} // Pass users as prop
      />

      {/* Load more trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {loading && (
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
