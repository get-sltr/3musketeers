# Grindr-Style 3x4 Grid Layout Guide

## 📱 Layout Overview

The classic Grindr layout shows **12 user cards** in a **3 columns × 4 rows** grid:

```
┌─────────┬─────────┬─────────┐
│ Card 1  │ Card 2  │ Card 3  │  ← Row 1
├─────────┼─────────┼─────────┤
│ Card 4  │ Card 5  │ Card 6  │  ← Row 2
├─────────┼─────────┼─────────┤
│ Card 7  │ Card 8  │ Card 9  │  ← Row 3
├─────────┼─────────┼─────────┤
│ Card 10 │ Card 11 │ Card 12 │  ← Row 4
└─────────┴─────────┴─────────┘
```

**12 cards visible at once** - scroll down to see more

---

## 🎯 Key Characteristics

### Desktop (Grindr Web)
- **3 columns** × **4 rows**
- **Minimal gaps** between cards (2-4px)
- **Square aspect ratio** (1:1) or slightly taller (3:4)
- **Compact design** - maximize visible users
- **Infinite scroll** - load more as you scroll

### Mobile (Grindr App)
- **3 columns** × **infinite rows**
- **Very tight spacing** (1-2px gaps)
- **Square cards** for consistency
- **Fast scrolling** performance
- **Tap to view** full profile

---

## 💻 Implementation

### Option 1: Pure CSS Grid (Recommended)

```typescript
'use client';

import GridCard from './grid/GridCard';

interface User {
  id: string;
  name: string;
  avatar: string;
  distance: number;
  status: 'online' | 'away' | 'offline';
  age?: number;
  vibe?: string;
  headline?: string;
}

interface GrindrGridProps {
  users: User[];
  onUserClick: (userId: string) => void;
  onQuickAction?: (userId: string, action: string) => void;
}

export default function GrindrGrid({ 
  users, 
  onUserClick,
  onQuickAction 
}: GrindrGridProps) {
  return (
    <div className="w-full h-screen overflow-y-auto bg-black">
      {/* Grid Container - 3 columns, auto rows */}
      <div className="grid grid-cols-3 gap-[2px] p-[2px]">
        {users.map((user, index) => (
          <GridCard
            key={user.id}
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            distance={user.distance}
            status={user.status}
            vibe={user.vibe || 'Member'}
            age={user.age}
            headline={user.headline}
            isPriority={index < 12} // First 12 cards (visible on load)
            onTap={() => onUserClick(user.id)}
            onQuickAction={(action) => onQuickAction?.(user.id, action)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Option 2: With Infinite Scroll

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import GridCard from './grid/GridCard';

export default function GrindrGridInfinite({ 
  initialUsers,
  onLoadMore,
  onUserClick 
}: {
  initialUsers: User[];
  onLoadMore: () => Promise<User[]>;
  onUserClick: (userId: string) => void;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMoreUsers();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const loadMoreUsers = async () => {
    setLoading(true);
    const newUsers = await onLoadMore();
    setUsers((prev) => [...prev, ...newUsers]);
    setLoading(false);
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-black">
      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-[2px] p-[2px]">
        {users.map((user, index) => (
          <GridCard
            key={user.id}
            id={user.id}
            name={user.name}
            avatar={user.avatar}
            distance={user.distance}
            status={user.status}
            vibe={user.vibe || 'Member'}
            age={user.age}
            isPriority={index < 12}
            onTap={() => onUserClick(user.id)}
          />
        ))}
      </div>

      {/* Loading indicator */}
      <div ref={observerRef} className="h-20 flex items-center justify-center">
        {loading && (
          <div className="text-white text-sm">Loading more...</div>
        )}
      </div>
    </div>
  );
}
```

---

### Option 3: Virtualized Grid (Best Performance)

For **1000+ users**, use virtualization:

```typescript
'use client';

import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import GridCard from './grid/GridCard';

export default function GrindrGridVirtualized({ 
  users,
  onUserClick 
}: {
  users: User[];
  onUserClick: (userId: string) => void;
}) {
  const COLUMN_COUNT = 3;
  const ROW_COUNT = Math.ceil(users.length / COLUMN_COUNT);

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex;
    const user = users[index];

    if (!user) return null;

    return (
      <div style={style} className="p-[1px]">
        <GridCard
          id={user.id}
          name={user.name}
          avatar={user.avatar}
          distance={user.distance}
          status={user.status}
          vibe={user.vibe || 'Member'}
          age={user.age}
          isPriority={index < 12}
          onTap={() => onUserClick(user.id)}
        />
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black">
      <AutoSizer>
        {({ height, width }) => (
          <Grid
            columnCount={COLUMN_COUNT}
            columnWidth={width / COLUMN_COUNT}
            height={height}
            rowCount={ROW_COUNT}
            rowHeight={width / COLUMN_COUNT} // Square cards
            width={width}
          >
            {Cell}
          </Grid>
        )}
      </AutoSizer>
    </div>
  );
}
```

---

## 🎨 Styling for Grindr Look

### Minimal Gaps (Tight Grid)

```css
/* Tailwind classes */
.grindr-grid {
  @apply grid grid-cols-3 gap-[2px] p-[2px] bg-black;
}

/* Or custom CSS */
.grindr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 2px;
  background: #000;
}
```

### Square Cards

```typescript
// In GridCard component, change aspect ratio
<div className="relative aspect-square w-full overflow-hidden">
  {/* Card content */}
</div>
```

### Compact Info Display

```typescript
// Minimal text, focus on photo
<div className="absolute inset-0 flex flex-col justify-between p-2">
  {/* Top: Just status dot */}
  <div className="flex justify-between">
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded">
      {distance}mi
    </span>
  </div>

  {/* Bottom: Name + age only */}
  <div>
    <p className="text-sm font-bold text-white drop-shadow-lg">
      {name}, {age}
    </p>
  </div>
</div>
```

---

## 📱 Responsive Breakpoints

```typescript
export default function ResponsiveGrindrGrid({ users, onUserClick }: Props) {
  return (
    <div className="w-full h-screen overflow-y-auto bg-black">
      <div className="
        grid 
        grid-cols-3    /* Mobile: 3 columns */
        md:grid-cols-4 /* Tablet: 4 columns */
        lg:grid-cols-5 /* Desktop: 5 columns */
        xl:grid-cols-6 /* Large: 6 columns */
        gap-[2px] 
        p-[2px]
      ">
        {users.map((user, index) => (
          <GridCard key={user.id} {...user} onTap={() => onUserClick(user.id)} />
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Grindr-Specific Features

### 1. Distance Sorting
```typescript
const sortedUsers = users.sort((a, b) => a.distance - b.distance);
```

### 2. Online First
```typescript
const sortedUsers = users.sort((a, b) => {
  if (a.status === 'online' && b.status !== 'online') return -1;
  if (a.status !== 'online' && b.status === 'online') return 1;
  return a.distance - b.distance;
});
```

### 3. Tap to Expand
```typescript
const [selectedUser, setSelectedUser] = useState<User | null>(null);

<GrindrGrid
  users={users}
  onUserClick={(userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
  }}
/>

{selectedUser && (
  <UserProfileModal
    user={selectedUser}
    onClose={() => setSelectedUser(null)}
  />
)}
```

### 4. Refresh on Pull
```typescript
import { useState } from 'react';

const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  await fetchNewUsers();
  setRefreshing(false);
};

// Add pull-to-refresh library or custom implementation
```

---

## 🚀 Performance Tips

### 1. Image Optimization
```typescript
<Image
  src={user.avatar}
  alt={user.name}
  fill
  sizes="33vw" // Each card is ~1/3 of viewport width
  quality={75} // Lower quality for grid view
  priority={index < 12} // Only first 12 cards
/>
```

### 2. Lazy Loading
```typescript
{users.map((user, index) => (
  <GridCard
    key={user.id}
    {...user}
    isPriority={index < 12}
    loading={index >= 12 ? 'lazy' : 'eager'}
  />
))}
```

### 3. Memoization
```typescript
import { memo } from 'react';

const GridCard = memo(({ user, onTap }) => {
  // Card implementation
}, (prev, next) => prev.user.id === next.user.id);
```

---

## 📊 Layout Comparison

| Layout | Columns | Visible Cards | Use Case |
|--------|---------|---------------|----------|
| **Mobile** | 3 | 12-15 | Phones |
| **Tablet** | 4 | 16-20 | iPads |
| **Desktop** | 5-6 | 20-30 | Laptops |
| **Large** | 6-8 | 30-40 | Monitors |

---

## 🎨 Visual Example

```
Mobile (375px width):
┌───┬───┬───┐
│ 1 │ 2 │ 3 │  125px each
├───┼───┼───┤
│ 4 │ 5 │ 6 │
├───┼───┼───┤
│ 7 │ 8 │ 9 │
├───┼───┼───┤
│10 │11 │12 │
└───┴───┴───┘

Desktop (1200px width):
┌──┬──┬──┬──┬──┬──┐
│1 │2 │3 │4 │5 │6 │  200px each
├──┼──┼──┼──┼──┼──┤
│7 │8 │9 │10│11│12│
└──┴──┴──┴──┴──┴──┘
```

---

## 🔧 Complete Example

Here's a full working example:

```typescript
'use client';

import { useState, useEffect } from 'react';
import GridCard from './grid/GridCard';

export default function GrindrStyleGrid() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const response = await fetch('/api/users/nearby');
    const data = await response.json();
    setUsers(data);
    setLoading(false);
  };

  const handleUserClick = (userId: string) => {
    // Open profile modal
    console.log('Open user:', userId);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800 p-4">
        <h1 className="text-white text-xl font-bold">Nearby</h1>
      </div>

      {/* 3x4 Grid */}
      <div className="grid grid-cols-3 gap-[2px] p-[2px]">
        {users.map((user, index) => (
          <div key={user.id} className="aspect-square">
            <GridCard
              id={user.id}
              name={user.name}
              avatar={user.avatar}
              distance={user.distance}
              status={user.isOnline ? 'online' : 'offline'}
              vibe={user.vibe}
              age={user.age}
              isPriority={index < 12}
              onTap={() => handleUserClick(user.id)}
            />
          </div>
        ))}
      </div>

      {/* Load More */}
      {users.length >= 12 && (
        <div className="p-4 text-center">
          <button
            onClick={fetchUsers}
            className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📦 Installation

If using virtualization:

```bash
npm install react-window react-virtualized-auto-sizer
npm install --save-dev @types/react-window
```

---

## ✅ Checklist

- [ ] 3 columns on mobile
- [ ] Minimal gaps (2px)
- [ ] Square aspect ratio
- [ ] First 12 cards prioritized
- [ ] Infinite scroll
- [ ] Tap to view profile
- [ ] Distance sorting
- [ ] Online status visible
- [ ] Fast performance (60fps scroll)
- [ ] Image lazy loading

---

**Ready to implement!** 🚀

Choose Option 1 for simplicity, Option 2 for infinite scroll, or Option 3 for maximum performance with 1000+ users.

