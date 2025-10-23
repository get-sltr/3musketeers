/**
 * Custom SVG pin component for user markers
 * Lightweight, scalable, and matches the app's design
 */

interface UserPinProps {
  isOnline: boolean
  isPartyFriendly?: boolean
  isDTFN?: boolean
  size?: number
  className?: string
}

export default function UserPin({ 
  isOnline, 
  isPartyFriendly = false, 
  isDTFN = false, 
  size = 24,
  className = ""
}: UserPinProps) {
  const baseColor = isOnline ? '#00d4ff' : '#666666'
  const accentColor = isPartyFriendly ? '#ff6b6b' : isDTFN ? '#ffd93d' : baseColor
  
  return (
    <div 
      className={`user-pin ${className}`}
      style={{ 
        width: size, 
        height: size,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer glow ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={baseColor}
          opacity="0.2"
        />
        
        {/* Main pin body */}
        <circle
          cx="12"
          cy="12"
          r="8"
          fill={baseColor}
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Status indicator dot */}
        <circle
          cx="12"
          cy="12"
          r="3"
          fill={accentColor}
        />
        
        {/* Online pulse animation */}
        {isOnline && (
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke={baseColor}
            strokeWidth="1"
            opacity="0.6"
            className="animate-pulse"
          />
        )}
      </svg>
      
      <style jsx>{`
        .user-pin {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .user-pin:hover {
          transform: scale(1.1);
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  )
}
