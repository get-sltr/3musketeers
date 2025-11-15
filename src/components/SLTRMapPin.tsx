import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile';
import '../styles/SLTRMapPin.css';

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number | null;
  position: string;
  dtfn: boolean;
  party_friendly?: boolean;
  latitude: number;
  longitude: number;
  distance?: string;
  is_online?: boolean;
  online?: boolean; // Support both field names
}

interface SLTRMapPinProps {
  user: User;
  onChat: (userId: string) => void;
  onVideo: (userId: string) => void;
  onTap: (userId: string) => void;
  onProfileClick: (userId: string) => void;
}

export const SLTRMapPin: React.FC<SLTRMapPinProps> = ({
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

  // Support both field names for online status
  const isOnline = user.is_online ?? user.online ?? false;
  const isDTFN = user.dtfn;
  
  // Define fallback avatar
  const defaultAvatar = DEFAULT_PROFILE_IMAGE;
  const avatarSrc = user.avatar_url || defaultAvatar;
  
  // Handler to prevent click on pin from bubbling when clicking a button
  const handleActionClick = (e: React.MouseEvent, action: (id: string) => void) => {
    e.stopPropagation(); // Stop the click from triggering onProfileClick
    action(user.id);
  };

  return (
    <div
      ref={pinRef}
      className="sltr-map-pin-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`sltr-map-pin ${isHovered ? 'hovered' : ''}`} onClick={() => onProfileClick(user.id)}>
        {/* Liquid Ring - CSS-based animation */}
        <div className={`liquid-ring ${isDTFN ? 'dtfn-ring' : isOnline ? 'online-ring' : 'offline-ring'}`} />

        {/* Profile Photo */}
        <div className="profile-photo">
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

        {/* Online Pulse Indicator */}
        {isOnline && (
          <div className="online-pulse">
            <div className="pulse-ring" />
          </div>
        )}

        {/* DTFN Badge */}
        {isDTFN && (
          <div className="dtfn-badge">
            ⚡
          </div>
        )}
      </div>

      {/* Info Drawer */}
      <div className={`info-drawer ${isHovered ? 'visible' : ''}`}>
        <div className="drawer-connector" />
        <div className="drawer-distance">{user.distance || 'Nearby'}</div>
        <div className="drawer-info">
          {user.age ? `${user.age}, ` : ''}{user.position || 'Unknown'}
        </div>
        <div className="drawer-actions">
          <button className="drawer-button" onClick={(e) => handleActionClick(e, onChat)} title="Chat">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm3.25.75a.75.75 0 000-1.5h-.5a.75.75 0 000 1.5h.5zM12 7.75a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="drawer-button" onClick={(e) => handleActionClick(e, onVideo)} title="Video">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" />
            </svg>
          </button>
          <button className="drawer-button" onClick={(e) => handleActionClick(e, onTap)} title="Tap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const createSLTRMapboxMarker = (
  user: User,
  onChat: (userId: string) => void,
  onVideo: (userId: string) => void,
  onTap: (userId: string) => void,
  onProfileClick: (userId: string) => void,
) => {
  const el = document.createElement('div');
  el.className = 'mapbox-marker-container';
  
  // Store root reference for cleanup
  const root = createRoot(el);
  (el as any)._reactRoot = root; // Store for cleanup
  
  root.render(
    <SLTRMapPin
      user={user}
      onChat={onChat}
      onVideo={onVideo}
      onTap={onTap}
      onProfileClick={onProfileClick}
    />,
  );

  return el;
};

// Cleanup function for marker removal
export const cleanupSLTRMarker = (markerElement: HTMLElement) => {
  const root = (markerElement as any)._reactRoot;
  if (root) {
    root.unmount();
    delete (markerElement as any)._reactRoot;
  }
};

export default SLTRMapPin;

