import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile';

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number | null;
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

  const avatarSrc = user.avatar_url || DEFAULT_PROFILE_IMAGE

  return (
    <div
      ref={pinRef}
      className="pin-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`map-pin-shell${user.dtfn ? ' is-dtfn' : ''}${user.party_friendly ? ' is-party' : ''}`}
        onClick={() => onProfileClick(user.id)}
      >
        <div className="map-pin-halo" />
        <div className="map-pin-core">
          <img
            src={avatarSrc}
            alt={user.display_name}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              if (!target.dataset.fallback) {
                target.dataset.fallback = 'true'
                target.src = DEFAULT_PROFILE_IMAGE
              }
            }}
          />
        </div>
        <div className="map-pin-ring" />
        <div className="map-pin-info">
          <span className="pin-name">{user.display_name}</span>
          <span className="pin-distance">{user.distance || 'Nearby'}</span>
        </div>
        <div className="pin-chips">
          {user.dtfn && <span className="pin-chip pin-chip-dtfn">⚡ Ready</span>}
          {user.party_friendly && <span className="pin-chip pin-chip-party">🎉 Party</span>}
          <span className="pin-chip pin-chip-position">{getPositionEmoji(user.position)}</span>
        </div>
      </div>

      <div className={`horizontal-drawer compact ${isHovered ? 'visible' : ''}`}>
        <div className="drawer-compact-info">
          <div className="compact-line">
            {user.age ?? '—'} • {user.position} • {user.distance || 'Nearby'}
          </div>
          <div className="compact-line">
            {user.dtfn && <span className="descriptor">⚡ Down Tonight</span>}
            {user.party_friendly && <span className="descriptor">🥳 Party Friendly</span>}
            {!user.dtfn && !user.party_friendly && <span className="descriptor">Chill</span>}
          </div>
          <div className="drawer-actions-mini">
            <button className="mini-action chat" onClick={() => onChat(user.id)}>Chat</button>
            <button className="mini-action video" onClick={() => onVideo(user.id)}>Video</button>
            <button className="mini-action tap" onClick={() => onTap(user.id)}>Tap</button>
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

