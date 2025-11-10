import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile';

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number;
  position: string;
  dtfn: boolean;
  party_friendly: boolean;
  latitude: number;
  longitude: number;
  distance?: string;
}

interface MapPinProps {
  user: User;
  onChat: (userId: string) => void;
  onVideo: (userId: string) => void;
  onTap: (userId: string) => void;
  onProfileClick: (userId: string) => void;
}

export const MapPin: React.FC<MapPinProps> = ({
  user,
  onChat,
  onVideo,
  onTap,
  onProfileClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);

  const getPositionEmoji = (position: string) => {
    const map: Record<string, string> = {
      Top: '⬆️',
      Bottom: '⬇️',
      Vers: '🔄',
      Side: '↔️',
    };
    return map[position] || '🎯';
  };

  return (
    <div
      ref={pinRef}
      className="pin-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`map-pin ${user.dtfn ? 'dtfn' : ''}`}
        onClick={() => onProfileClick(user.id)}
      >
        <img
          src={user.avatar_url || DEFAULT_PROFILE_IMAGE}
          alt={user.display_name}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true'
              target.src = DEFAULT_PROFILE_IMAGE
            }
          }}
        />
        {user.dtfn && <div className="pin-badge">⚡</div>}
      </div>

      <div className={`horizontal-drawer compact ${isHovered ? 'visible' : ''}`}>
        <div className="drawer-compact-info">
          <div className="compact-line">
            {user.age}, {user.position}, {user.distance || 'Nearby'}
          </div>
          <div className="compact-line">
            {user.dtfn && <span>⚡️</span>}
            {user.party_friendly && <span>🥳</span>}
            {!user.dtfn && !user.party_friendly && <span>—</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const createMapboxMarker = (
  user: User,
  onChat: (userId: string) => void,
  onVideo: (userId: string) => void,
  onTap: (userId: string) => void,
  onProfileClick: (userId: string) => void,
) => {
  const el = document.createElement('div');
  el.className = 'mapbox-marker-container';

  const root = createRoot(el);
  root.render(
    <MapPin
      user={user}
      onChat={onChat}
      onVideo={onVideo}
      onTap={onTap}
      onProfileClick={onProfileClick}
    />,
  );

  return el;
};

export default MapPin;

