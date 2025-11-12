'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  display_name?: string;
  username?: string;
  age?: number;
  photo?: string | null;
  distance?: string;
  isOnline?: boolean;
  dtfn?: boolean;
  party_friendly?: boolean;
  tags?: string[];
}

interface GrindrStyleGridProps {
  users: User[];
  onUserClick: (user: User) => void;
  onLoadMore?: () => Promise<void>;
  loading?: boolean;
}

// ============================================================================
// COMPACT GRID CARD (Grindr Style)
// ============================================================================

interface CompactCardProps {
  user: User;
  onClick: () => void;
  isPriority: boolean;
}

function CompactCard({ user, onClick, isPriority }: CompactCardProps) {
  const displayName = user.display_name || user.username || 'Member';
  const photoSrc = user.photo || '/black-white-silhouette-man-600nw-1677576007.webp';
  const distance = user.distance && user.distance !== '' ? user.distance : '?';

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-square overflow-hidden bg-gray-900 group active:scale-95 transition-transform"
    >
      {/* Background Image */}
      <Image
        src={photoSrc}
        alt={displayName}
        fill
        className="object-cover"
        sizes="33vw"
        quality={75}
        priority={isPriority}
        loading={isPriority ? 'eager' : 'lazy'}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Top Section: Status & Badges */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        {/* Online Status */}
        {user.isOnline && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
        )}

        {/* DTFN Badge */}
        {user.dtfn && (
          <span className="px-2 py-0.5 rounded-full bg-fuchsia-500 text-[10px] font-bold text-white">
            NOW
          </span>
        )}
      </div>

      {/* Bottom Section: Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
        {/* Name & Age */}
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-white truncate">
            {displayName}
            {user.age && <span className="text-xs text-gray-300">, {user.age}</span>}
          </p>
          
          {/* Distance */}
          <span className="text-[10px] text-gray-300 font-semibold ml-1 flex-shrink-0">
            {distance}
          </span>
        </div>

        {/* Tags (max 1) */}
        {user.tags && user.tags.length > 0 && (
          <div className="flex gap-1">
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-semibold text-white truncate">
              {user.tags[0]}
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors" />
    </button>
  );
}

// ============================================================================
// MAIN GRID COMPONENT
// ============================================================================

export default function GrindrStyleGrid({
  users,
  onUserClick,
  onLoadMore,
  loading = false
}: GrindrStyleGridProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    if (!onLoadMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !loading) {
          setIsLoadingMore(true);
          await onLoadMore();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, isLoadingMore, loading]);

  // Sort users: Online first, then by distance
  const sortedUsers = [...users].sort((a, b) => {
    // Online users first
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;

    // Then by distance
    const distA = parseFloat(a.distance || '999');
    const distB = parseFloat(b.distance || '999');
    return distA - distB;
  });

  return (
    <div className="mobile-grid-container bg-black">
      {/* 3-Column Grid (Grindr style) */}
      <div className="grid grid-cols-3 gap-[2px] p-[2px] bg-black min-h-full">
        {sortedUsers.map((user, index) => (
          <CompactCard
            key={user.id}
            user={user}
            onClick={() => onUserClick(user)}
            isPriority={index < 12} // First 12 cards (4 rows × 3 cols)
          />
        ))}
      </div>

      {/* Loading Indicator */}
      {onLoadMore && (
        <div
          ref={observerRef}
          className="h-20 flex items-center justify-center"
        >
          {(loading || isLoadingMore) && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
          <div className="text-6xl mb-4">🛰️</div>
          <h2 className="text-xl font-bold text-white mb-2">No users nearby</h2>
          <p className="text-gray-400 text-sm">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RESPONSIVE VARIANT (Optional)
// ============================================================================

export function ResponsiveGrindrGrid({
  users,
  onUserClick,
  onLoadMore,
  loading = false
}: GrindrStyleGridProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !loading) {
          setIsLoadingMore(true);
          await onLoadMore();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, isLoadingMore, loading]);

  const sortedUsers = [...users].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    const distA = parseFloat(a.distance || '999');
    const distB = parseFloat(b.distance || '999');
    return distA - distB;
  });

  return (
    <div className="mobile-grid-container bg-black">
      {/* Responsive Grid */}
      <div className="
        grid
        grid-cols-3    /* Mobile: 3 columns */
        sm:grid-cols-4 /* Small: 4 columns */
        md:grid-cols-5 /* Medium: 5 columns */
        lg:grid-cols-6 /* Large: 6 columns */
        xl:grid-cols-8 /* XL: 8 columns */
        gap-[2px]
        p-[2px]
        bg-black
        min-h-full
      ">
        {sortedUsers.map((user, index) => (
          <CompactCard
            key={user.id}
            user={user}
            onClick={() => onUserClick(user)}
            isPriority={index < 12}
          />
        ))}
      </div>

      {onLoadMore && (
        <div ref={observerRef} className="h-20 flex items-center justify-center">
          {(loading || isLoadingMore) && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
          <div className="text-6xl mb-4">🛰️</div>
          <h2 className="text-xl font-bold text-white mb-2">No users nearby</h2>
          <p className="text-gray-400 text-sm">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import GrindrStyleGrid from '@/components/GrindrStyleGrid';

export default function NearbyPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await fetch('/api/users/nearby');
    const data = await response.json();
    setUsers(data);
  };

  const loadMore = async () => {
    const response = await fetch(`/api/users/nearby?offset=${users.length}`);
    const data = await response.json();
    setUsers(prev => [...prev, ...data]);
  };

  return (
    <>
      <GrindrStyleGrid
        users={users}
        onUserClick={(user) => setSelectedUser(user)}
        onLoadMore={loadMore}
      />

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
*/

