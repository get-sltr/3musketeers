import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number;
  position: string;
  dtfn: boolean;
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
          src={user.avatar_url || '/default-avatar.png'}
          alt={user.display_name}
        />
        {user.dtfn && <div className="pin-badge">⚡</div>}
      </div>

      <div className={`horizontal-drawer ${isHovered ? 'visible' : ''}`}>
        <div className="drawer-info">
          <div className="drawer-name">{user.display_name}</div>
          <div className="drawer-stats">
            <span className="drawer-stat">
              <span className="stat-icon">{getPositionEmoji(user.position)}</span>
              {user.position}
            </span>
            <span className="drawer-stat">
              <span className="stat-icon">🎂</span>
              {user.age}
            </span>
            {user.distance && (
              <span className="drawer-stat">
                <span className="stat-icon">📍</span>
                {user.distance}
              </span>
            )}
          </div>
        </div>

        {user.dtfn && <div className="drawer-dtfn">⚡ DTFN</div>}

        <div className="drawer-actions">
          <button
            className="action-btn chat"
            onClick={(e) => {
              e.stopPropagation();
              onChat(user.id);
            }}
            title="Message"
          >
            <span className="action-icon">🫧</span>
            <span className="action-label">Chat</span>
          </button>
          <button
            className="action-btn video"
            onClick={(e) => {
              e.stopPropagation();
              onVideo(user.id);
            }}
            title="Video Call"
          >
            <span className="action-icon">📹</span>
            <span className="action-label">Video</span>
          </button>
          <button
            className="action-btn tap"
            onClick={(e) => {
              e.stopPropagation();
              onTap(user.id);
            }}
            title="Send Tap"
          >
            <span className="action-icon">😈</span>
            <span className="action-label">Tap</span>
          </button>
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

