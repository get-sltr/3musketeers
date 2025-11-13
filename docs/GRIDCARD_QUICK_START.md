# GridCard - Quick Start Guide

## 🚀 5-Minute Implementation

### Step 1: Copy the Improved Component
```bash
# Copy the improved component to your project
cp GridCard_IMPROVED.tsx src/components/grid/GridCard.tsx
```

### Step 2: Add Default Avatar
```bash
# Add a default avatar image to your public folder
# You can use any placeholder image service or create your own
```

Create `/public/default-avatar.png` or use a placeholder:
```typescript
// Or update the fallback in the component to use an existing image
const DEFAULT_AVATAR = '/black-white-silhouette-man-600nw-1677576007.webp';
```

### Step 3: Update Your Usage

#### Before:
```typescript
<GridCard
  id={user.id}
  name={user.name}
  avatar={user.photo}
  distance={user.distance}
  status={user.isOnline ? 'online' : 'offline'}
  vibe={user.vibe}
  age={user.age}
  headline={user.bio}
  onTap={() => handleUserClick(user.id)}
  onQuickAction={(action) => console.log(action)}
/>
```

#### After (with new features):
```typescript
<GridCard
  id={user.id}
  name={user.name}
  avatar={user.photo}
  distance={user.distance}
  status={user.isOnline ? 'online' : 'offline'}
  vibe={user.vibe}
  age={user.age}
  headline={user.bio}
  // ✨ New optional props
  isPriority={index < 6} // Prioritize first 6 images
  isPopular={user.viewCount > 1000} // Show "Hot" badge
  lastActive={new Date(user.lastActiveAt)} // Show last active time
  viewCount={user.viewCount}
  // Handlers
  onTap={() => handleUserClick(user.id)}
  onQuickAction={(action) => handleQuickAction(user.id, action)}
/>
```

### Step 4: Implement Quick Action Handler
```typescript
const handleQuickAction = (userId: string, action: string) => {
  switch (action) {
    case '❤️ Like':
      // Handle like action
      likeUser(userId);
      break;
    case '⚡ Boost':
      // Handle boost action
      boostProfile(userId);
      break;
    case '💬 Message':
      // Handle message action
      openChat(userId);
      break;
  }
};
```

### Step 5: Test It!
```bash
npm run dev
```

---

## 🎯 Feature Checklist

### Core Features (Already Working)
- ✅ Click to view profile
- ✅ Status indicator (online/away/offline)
- ✅ Distance badge
- ✅ Hover effects
- ✅ Smooth animations

### New Features (Now Available)
- ✅ **Long press** - Hold for 500ms to show quick actions
- ✅ **Double tap** - Double-tap anywhere to like
- ✅ **Swipe gestures** - Swipe right to like, left to skip
- ✅ **Keyboard navigation** - Press Enter or Space to open
- ✅ **Image error handling** - Graceful fallback if image fails
- ✅ **Last active time** - Shows when user was last online
- ✅ **Popular badge** - Highlights trending profiles
- ✅ **Optimized loading** - Lazy load images below the fold

---

## 🧪 Testing Guide

### Manual Testing

#### 1. Desktop Testing
```
✓ Hover over card - should show glow effect
✓ Click card - should trigger onTap
✓ Double-click card - should show heart animation
✓ Press and hold - should show quick actions after 500ms
✓ Press Tab - should focus card with visible outline
✓ Press Enter/Space - should trigger onTap
✓ Click quick action - should trigger onQuickAction
```

#### 2. Mobile Testing
```
✓ Tap card - should trigger onTap
✓ Double-tap card - should show heart animation + vibrate
✓ Long press card - should show quick actions + vibrate
✓ Swipe right - should trigger like action
✓ Swipe left - should trigger skip action
✓ Tap quick action - should vibrate
```

#### 3. Accessibility Testing
```
✓ Use screen reader - should announce card details
✓ Navigate with keyboard only - should be fully functional
✓ Check focus indicators - should be clearly visible
✓ Test with high contrast mode - should remain readable
```

#### 4. Performance Testing
```
✓ Render 100+ cards - should scroll smoothly
✓ Check re-renders - should only re-render when props change
✓ Monitor memory - should not leak on mount/unmount
✓ Test on slow network - images should lazy load
```

---

## 🐛 Troubleshooting

### Issue: Images not loading
**Solution:**
```typescript
// Check Next.js image configuration in next.config.js
images: {
  domains: ['your-image-domain.com'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
}
```

### Issue: Haptic feedback not working
**Solution:**
```typescript
// Haptic feedback only works on mobile devices
// Test on actual mobile device, not desktop browser
// Some browsers require user interaction first
```

### Issue: Long press not triggering
**Solution:**
```typescript
// Make sure you're not moving your finger/mouse during the press
// Try adjusting the timeout in useLongPress hook
const longPressHandlers = useLongPress(handleLongPress, 300); // Shorter timeout
```

### Issue: Component re-rendering too much
**Solution:**
```typescript
// Make sure parent component isn't creating new function references
// Bad:
<GridCard onTap={() => handleClick(user.id)} />

// Good:
const handleTap = useCallback(() => handleClick(user.id), [user.id]);
<GridCard onTap={handleTap} />
```

### Issue: Animations are janky
**Solution:**
```typescript
// Reduce animation complexity or disable on low-end devices
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.02 }}
/>
```

---

## 📊 Performance Optimization Tips

### 1. Virtualize Long Lists
```typescript
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={3}
  columnWidth={200}
  height={600}
  rowCount={Math.ceil(users.length / 3)}
  rowHeight={300}
  width={650}
>
  {({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      <GridCard {...users[rowIndex * 3 + columnIndex]} />
    </div>
  )}
</FixedSizeGrid>
```

### 2. Prioritize Above-the-Fold Images
```typescript
const CARDS_PER_ROW = 3;
const ROWS_VISIBLE = 2;
const PRIORITY_COUNT = CARDS_PER_ROW * ROWS_VISIBLE; // 6 cards

{users.map((user, index) => (
  <GridCard
    key={user.id}
    {...user}
    isPriority={index < PRIORITY_COUNT}
  />
))}
```

### 3. Debounce Quick Actions
```typescript
import { debounce } from 'lodash';

const handleQuickAction = debounce((userId: string, action: string) => {
  // Handle action
}, 300);
```

---

## 🎨 Customization Examples

### Change Colors
```typescript
// In GridCard_IMPROVED.tsx, update STATUS_COLORS
const STATUS_COLORS = {
  online: { 
    bg: 'bg-green-500', // Change to your brand color
    pulse: 'animate-pulse', 
    glow: 'shadow-lg shadow-green-500/50',
    text: 'text-green-300'
  },
  // ... rest
} as const;
```

### Add More Quick Actions
```typescript
// In GridCard_IMPROVED.tsx, update QUICK_ACTIONS
const QUICK_ACTIONS = [
  '❤️ Like', 
  '⚡ Boost', 
  '💬 Message',
  '⭐ Favorite', // New action
  '🚫 Block'     // New action
] as const;
```

### Customize Animation Speed
```typescript
// In GridCard_IMPROVED.tsx, update HALO_VARIANTS
const HALO_VARIANTS = {
  hover: { 
    boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)',
    scale: 1.02,
    transition: { duration: 0.1 } // Faster animation
  },
  // ... rest
};
```

---

## 📱 Mobile-Specific Features

### Disable Swipe on Desktop
```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

<motion.div
  drag={isMobile ? "x" : false} // Only enable on mobile
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={handleDragEnd}
/>
```

### Adjust Haptic Intensity
```typescript
const triggerHaptic = (duration = 50) => {
  if ('vibrate' in navigator) {
    // Pattern: vibrate, pause, vibrate
    navigator.vibrate([duration, 50, duration]); // More intense
  }
};
```

---

## 🔗 Integration with Existing Code

### With Your GridView Component
```typescript
// In src/components/GridView.tsx
import GridCard from './grid/GridCard';

<div className="profile-grid">
  {filteredUsers.map((user, index) => (
    <GridCard
      key={user.id}
      id={user.id}
      name={user.display_name || user.username}
      avatar={user.photo || DEFAULT_PROFILE_IMAGE}
      distance={parseFloat(user.distance) || 0}
      status={user.isOnline ? 'online' : 'offline'}
      vibe={user.tags?.[0] || 'Member'}
      age={user.age}
      headline={user.bio}
      isPriority={index < 6}
      isPopular={user.dtfn} // Use DTFN as popularity indicator
      onTap={() => handleUserClick(user.id)}
      onQuickAction={(action) => handleQuickAction(user.id, action)}
    />
  ))}
</div>
```

---

## 📚 Next Steps

1. **Add Analytics**
   ```typescript
   const handleQuickAction = (userId: string, action: string) => {
     // Track interaction
     analytics.track('quick_action', { userId, action });
     // Handle action
   };
   ```

2. **Add Unit Tests**
   ```typescript
   describe('GridCard', () => {
     it('should render user information', () => {
       render(<GridCard {...mockProps} />);
       expect(screen.getByText('John')).toBeInTheDocument();
     });
   });
   ```

3. **Create Storybook Stories**
   ```typescript
   export default {
     title: 'Components/GridCard',
     component: GridCard,
   };
   
   export const Online = () => <GridCard {...mockProps} status="online" />;
   export const Popular = () => <GridCard {...mockProps} isPopular />;
   ```

4. **Monitor Performance**
   ```typescript
   import { useEffect } from 'react';
   
   useEffect(() => {
     const observer = new PerformanceObserver((list) => {
       for (const entry of list.getEntries()) {
         console.log('LCP:', entry.startTime);
       }
     });
     observer.observe({ entryTypes: ['largest-contentful-paint'] });
   }, []);
   ```

---

## ✅ Launch Checklist

- [ ] Component copied to project
- [ ] Default avatar added
- [ ] Props updated in parent components
- [ ] Quick action handler implemented
- [ ] Tested on desktop (Chrome, Firefox, Safari)
- [ ] Tested on mobile (iOS, Android)
- [ ] Tested with keyboard only
- [ ] Tested with screen reader
- [ ] Performance tested with 100+ cards
- [ ] Analytics tracking added
- [ ] Error monitoring configured
- [ ] Documentation updated
- [ ] Team trained on new features

---

**Ready to ship! 🚀**

For detailed information, see:
- `GRIDCARD_COMPREHENSIVE_REVIEW.md` - Full analysis
- `GRIDCARD_IMPROVEMENTS_SUMMARY.md` - Summary of changes
- `GRIDCARD_BEFORE_AFTER.md` - Side-by-side comparison

