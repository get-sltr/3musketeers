# Grindr 3x4 Grid - Quick Reference

## 📱 What You Get

A **3-column grid** showing **12 users at once** (4 rows), just like Grindr:

```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │  ← Row 1
├─────┼─────┼─────┤
│  4  │  5  │  6  │  ← Row 2
├─────┼─────┼─────┤
│  7  │  8  │  9  │  ← Row 3
├─────┼─────┼─────┤
│ 10  │ 11  │ 12  │  ← Row 4
└─────┴─────┴─────┘
   ↓ Scroll for more
```

---

## 🚀 Quick Start (2 minutes)

### Step 1: Copy the Component
```bash
cp GrindrStyleGrid.tsx src/components/GrindrStyleGrid.tsx
```

### Step 2: Use It
```typescript
import GrindrStyleGrid from '@/components/GrindrStyleGrid';

export default function NearbyPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <>
      <GrindrStyleGrid
        users={users}
        onUserClick={(user) => setSelectedUser(user)}
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
```

### Step 3: Done! ✅

---

## 🎯 Key Features

### ✅ What's Included
- **3-column grid** (mobile-optimized)
- **Square cards** (aspect-square)
- **Minimal gaps** (2px between cards)
- **Compact info** (name, age, distance only)
- **Online status** (green dot)
- **DTFN badge** (pink "NOW" badge)
- **Infinite scroll** (auto-loads more)
- **Smart sorting** (online first, then by distance)
- **Image optimization** (first 12 prioritized)
- **Empty state** (when no users)
- **Loading state** (spinner at bottom)

### 📊 Each Card Shows
```
┌─────────────┐
│ 🟢      NOW │ ← Status + DTFN badge
│             │
│   [PHOTO]   │ ← User photo
│             │
│ John, 28    │ ← Name + age
│ 2.5mi       │ ← Distance
│ [Tag]       │ ← First tag only
└─────────────┘
```

---

## 🎨 Customization

### Change Column Count
```typescript
// In GrindrStyleGrid.tsx, line ~140
<div className="grid grid-cols-3 gap-[2px]">
//                         ↑ Change to 4, 5, etc.
```

### Change Gap Size
```typescript
<div className="grid grid-cols-3 gap-[2px]">
//                              ↑ Change to gap-1, gap-4, etc.
```

### Make Cards Taller (3:4 ratio)
```typescript
// In CompactCard component, line ~50
<button className="relative w-full aspect-square">
//                                  ↑ Change to aspect-[3/4]
```

### Show More Info
```typescript
// In CompactCard component, add after line ~95
<p className="text-[9px] text-gray-400">
  {user.bio}
</p>
```

---

## 📱 Responsive Variant

Want different columns on different screens?

```typescript
import { ResponsiveGrindrGrid } from '@/components/GrindrStyleGrid';

<ResponsiveGrindrGrid
  users={users}
  onUserClick={handleClick}
/>
```

This gives you:
- **Mobile:** 3 columns
- **Tablet:** 4 columns  
- **Desktop:** 5 columns
- **Large:** 6 columns
- **XL:** 8 columns

---

## 🔄 Infinite Scroll

### Enable Auto-Loading
```typescript
const loadMore = async () => {
  const response = await fetch(`/api/users?offset=${users.length}`);
  const newUsers = await response.json();
  setUsers(prev => [...prev, ...newUsers]);
};

<GrindrStyleGrid
  users={users}
  onUserClick={handleClick}
  onLoadMore={loadMore} // ← Add this
/>
```

When user scrolls to bottom, it automatically calls `loadMore()`.

---

## 🎯 Sorting Options

### Default (Online First, Then Distance)
```typescript
// Already built-in! No code needed.
```

### Distance Only
```typescript
// In GrindrStyleGrid.tsx, line ~145, replace with:
const sortedUsers = [...users].sort((a, b) => {
  const distA = parseFloat(a.distance || '999');
  const distB = parseFloat(b.distance || '999');
  return distA - distB;
});
```

### Newest First
```typescript
const sortedUsers = [...users].sort((a, b) => {
  return new Date(b.createdAt) - new Date(a.createdAt);
});
```

### Random
```typescript
const sortedUsers = [...users].sort(() => Math.random() - 0.5);
```

---

## 🐛 Troubleshooting

### Cards Not Square
**Problem:** Cards are rectangular
**Solution:** Make sure parent has no height constraints
```typescript
<div className="w-full"> {/* ✅ No height */}
  <GrindrStyleGrid ... />
</div>
```

### Images Not Loading
**Problem:** Next.js image optimization error
**Solution:** Add domain to `next.config.js`
```javascript
images: {
  domains: ['your-cdn.com'],
}
```

### Infinite Scroll Not Working
**Problem:** `onLoadMore` not triggering
**Solution:** Make sure container is scrollable
```typescript
<div className="h-screen overflow-y-auto"> {/* ✅ Scrollable */}
  <GrindrStyleGrid ... />
</div>
```

### Too Much White Space
**Problem:** Gaps too large
**Solution:** Reduce gap size
```typescript
<div className="grid grid-cols-3 gap-[1px]"> {/* ← Smaller gap */}
```

---

## 📊 Performance Tips

### 1. Limit Initial Load
```typescript
// Only load 24 users initially (2 screens worth)
const [users, setUsers] = useState(initialUsers.slice(0, 24));
```

### 2. Use Pagination
```typescript
const loadMore = async () => {
  const response = await fetch(`/api/users?page=${page}&limit=12`);
  // Load 12 at a time (1 screen)
};
```

### 3. Optimize Images
```typescript
// Already done! First 12 cards use priority loading
isPriority={index < 12}
```

### 4. Debounce Scroll
```typescript
// Already built-in with IntersectionObserver
```

---

## 🎨 Style Variants

### Dark Mode (Default)
```typescript
// Already dark! Black background.
```

### Light Mode
```typescript
// In GrindrStyleGrid.tsx, change:
<div className="w-full min-h-screen bg-white"> {/* ← White */}
```

### Colored Background
```typescript
<div className="w-full min-h-screen bg-gradient-to-b from-purple-900 to-black">
```

### Rounded Corners
```typescript
// In CompactCard, line ~50:
<button className="... overflow-hidden rounded-lg"> {/* ← Add rounded */}
```

---

## 📦 Props Reference

### GrindrStyleGrid Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `users` | `User[]` | ✅ Yes | Array of user objects |
| `onUserClick` | `(user: User) => void` | ✅ Yes | Called when card clicked |
| `onLoadMore` | `() => Promise<void>` | ❌ No | Called when scrolled to bottom |
| `loading` | `boolean` | ❌ No | Shows loading state |

### User Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | ✅ Yes | Unique user ID |
| `display_name` | `string` | ❌ No | Display name |
| `username` | `string` | ❌ No | Username (fallback) |
| `age` | `number` | ❌ No | User age |
| `photo` | `string` | ❌ No | Photo URL |
| `distance` | `string` | ❌ No | Distance (e.g., "2.5") |
| `isOnline` | `boolean` | ❌ No | Online status |
| `dtfn` | `boolean` | ❌ No | "Down to f*** now" |
| `tags` | `string[]` | ❌ No | User tags |

---

## ✅ Checklist

Before deploying:

- [ ] Component copied to project
- [ ] Users data fetching works
- [ ] Click handler opens profile
- [ ] Images loading correctly
- [ ] Infinite scroll working (if enabled)
- [ ] Tested on mobile device
- [ ] Tested with 100+ users
- [ ] Empty state shows correctly
- [ ] Loading state shows correctly
- [ ] Performance is smooth (60fps)

---

## 🚀 Next Steps

1. **Test with real data** - Use your actual user API
2. **Add filters** - Online only, distance range, etc.
3. **Add pull-to-refresh** - For mobile
4. **Add analytics** - Track card clicks
5. **A/B test** - Compare with old grid

---

## 📚 Files Created

1. **`GrindrStyleGrid.tsx`** - Main component (ready to use)
2. **`GRINDR_LAYOUT_GUIDE.md`** - Detailed guide
3. **`GRINDR_GRID_QUICK_REFERENCE.md`** - This file

---

## 💡 Pro Tips

1. **First 12 cards load fast** - They use `priority` loading
2. **Auto-sorts by online + distance** - No extra code needed
3. **Works with existing User type** - Compatible with your GridView
4. **Infinite scroll is optional** - Works without it too
5. **Mobile-first design** - Looks great on phones

---

## 🎯 Comparison

| Feature | Your GridCard | GrindrStyleGrid |
|---------|---------------|-----------------|
| Layout | Flexible | Fixed 3-column |
| Info Shown | Detailed | Compact |
| Animations | Rich | Minimal |
| Performance | Good | Optimized |
| Use Case | Full profiles | Quick browse |

**Use GrindrStyleGrid for:** Browse/discovery pages
**Use GridCard for:** Featured users, search results

---

**Ready to use! 🚀**

Just copy `GrindrStyleGrid.tsx` and start using it. It works out of the box with your existing user data structure.

