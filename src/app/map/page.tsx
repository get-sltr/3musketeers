'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile';
import { createClient } from '@/lib/supabase/client';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/map-view.css';
import '../styles/map-pin-drawer.css';

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

type RawProfile = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  avatar_url?: string | null;
  age: number | null;
  position: string | null;
  dtfn: boolean | null;
  party_friendly: boolean | null;
  latitude: number;
  longitude: number;
  incognito_mode?: boolean | null;
};

type MapUser = {
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
  distanceValue?: number;
};

const DEFAULT_CENTER: [number, number] = [-118.2437, 34.0522];

const formatDistance = (miles: number) => {
  if (Number.isNaN(miles)) return undefined;
  if (miles < 0.1) return '<0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
};

const calculateDistanceInMiles = (
  from: [number, number],
  to: [number, number],
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
      },
      (geoError) => {
        console.warn('Geolocation error:', geoError);
        setError('Unable to get your location. Showing default view.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    setIsMobile(media.matches);
    media.addEventListener('change', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchUsers = async (withSpinner: boolean) => {
      if (withSpinner) {
        setLoading(true);
      }
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(
          'id, display_name, photo_url, avatar_url, age, position, dtfn, party_friendly, latitude, longitude, incognito_mode',
        )
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .or('incognito_mode.is.null,incognito_mode.eq.false')
        .limit(200);

      if (isCancelled) return;

      if (fetchError) {
        console.error('Error loading map users:', fetchError);
        setError('Failed to load nearby profiles.');
        setUsers([]);
        if (withSpinner) {
          setLoading(false);
        }
        return;
      }

      const enriched = (data || []).map((profile: RawProfile) => {
        const base: MapUser = {
          id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          avatar_url: profile.photo_url || profile.avatar_url || null,
          age: profile.age ?? null,
          position: profile.position || 'Unknown',
          dtfn: Boolean(profile.dtfn),
          party_friendly: Boolean(profile.party_friendly),
          latitude: profile.latitude,
          longitude: profile.longitude,
        };

        if (userLocation) {
          const distanceMiles = calculateDistanceInMiles(userLocation, [
            profile.longitude,
            profile.latitude,
          ]);
          const distance = formatDistance(distanceMiles);
          base.distanceValue = distanceMiles;
          if (distance) {
            base.distance = distance;
          }
        }

        return base;
      });

      setUsers(enriched);
      if (withSpinner) {
        setLoading(false);
      }
      hasLoadedRef.current = true;
    };

    fetchUsers(!hasLoadedRef.current);

    const subscription = supabase
      .channel('public:profiles-map')
      .on(
        'postgres_changes',
        {
          schema: 'public',
          table: 'profiles',
          event: '*',
        },
        () => {
          fetchUsers(false);
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [supabase, userLocation]);

  useEffect(() => {
    if (!selectedUserId) return;
    const exists = users.some((user) => user.id === selectedUserId);
    if (!exists) {
      setSelectedUserId(null);
      setDrawerOpen(false);
    }
  }, [users, selectedUserId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const metrics = useMemo(() => {
    if (!users.length) {
      return {
        total: 0,
        dtfnPercent: 0,
        partyPercent: 0,
        averageAge: null as number | null,
      };
    }
    const total = users.length;
    const dtfnCount = users.filter((user) => user.dtfn).length;
    const partyCount = users.filter((user) => user.party_friendly).length;
    const ageValues = users
      .map((user) => user.age)
      .filter((age): age is number => age !== null);
    const ageAccumulator = ageValues.reduce((sum, age) => sum + age, 0);
    return {
      total,
      dtfnPercent: Math.round((dtfnCount / total) * 100),
      partyPercent: Math.round((partyCount / total) * 100),
      averageAge: ageValues.length ? Math.round(ageAccumulator / ageValues.length) : null,
    };
  }, [users]);

  const sortedUsers = useMemo(() => {
    if (!users.length) return [] as MapUser[];
    return [...users].sort((a, b) => {
      const aDistance = a.distanceValue ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanceValue ?? Number.POSITIVE_INFINITY;
      return aDistance - bDistance;
    });
  }, [users]);

  const vibeStatement = useMemo(() => {
    if (!users.length) return 'Signal calibrating…';
    if (metrics.dtfnPercent >= 60) return 'High-voltage energy detected';
    if (metrics.partyPercent >= 50) return 'Vibe hubs lighting up';
    return 'Steady connections nearby';
  }, [metrics.dtfnPercent, metrics.partyPercent, users.length]);

  const marqueeUsers = useMemo(() => sortedUsers.slice(0, 14), [sortedUsers]);

  const showUserPanel = Boolean(selectedUser && (!isMobile || drawerOpen));

  const handleSelectUser = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
      if (isMobile) {
        setDrawerOpen(true);
      }
    },
    [isMobile],
  );

  const handleClosePanel = useCallback(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setSelectedUserId(null);
    }
  }, [isMobile]);

  const highlightScore = useMemo(() => {
    if (!selectedUser) return 0;
    const base = 40 + (selectedUser.dtfn ? 25 : 10) + (selectedUser.party_friendly ? 20 : 8);
    const distanceFactor = selectedUser.distanceValue ? Math.max(0, 18 - selectedUser.distanceValue * 2) : 14;
    return Math.min(99, Math.round(base + distanceFactor));
  }, [selectedUser]);

  const center = useMemo(() => userLocation || DEFAULT_CENTER, [userLocation]);

  const handleChatUser = useCallback(
    (userId: string) => {
      setDrawerOpen(false);
      router.push(`/messages?user=${userId}`);
    },
    [router],
  );

  const handleVideoCallUser = useCallback(
    (userId: string) => {
      setDrawerOpen(false);
      router.push(`/messages?user=${userId}&startVideo=1`);
      window.dispatchEvent(
        new CustomEvent('eros_start_video_call', {
          detail: { userId },
        }),
      );
    },
    [router],
  );

  const handleTapUser = async (userId: string) => {
    if (!currentUserId) {
      console.warn('Cannot send tap: user not authenticated');
      return;
    }

    const { error: tapError } = await supabase
      .from('taps')
      .insert({ from_user_id: currentUserId, to_user_id: userId });

    if (tapError) {
      console.error('Failed to send tap:', tapError);
      return;
    }

    setDrawerOpen(false);
  };

  const handleProfileClick = useCallback(
    (userId: string) => {
      handleSelectUser(userId);
    },
    [handleSelectUser],
  );

  const handleOpenProfile = useCallback(
    (userId: string) => {
      setDrawerOpen(false);
      router.push(`/profile/${userId}`);
    },
    [router],
  );

  return (
    <div className="map-view-container">
      <MapView
        users={users}
        onChatUser={handleChatUser}
        onVideoCallUser={handleVideoCallUser}
        onTapUser={handleTapUser}
        onProfileClick={handleProfileClick}
        center={center}
      />

      <div className="map-overlay-stack">
        <div className="map-hero-panel">
          <div className="map-hero-heading">
            <span className="map-hero-title">SLTR Signal</span>
            <span className="map-hero-status">{vibeStatement}</span>
          </div>
          <div className="map-hero-metrics">
            <div className="map-hero-metric">
              <span className="map-hero-metric-label">Nearby</span>
              <span className="map-hero-metric-value">{metrics.total}</span>
            </div>
            <div className="map-hero-metric">
              <span className="map-hero-metric-label">Instant Chemistry</span>
              <span className="map-hero-metric-value">{metrics.dtfnPercent}%</span>
            </div>
            <div className="map-hero-metric">
              <span className="map-hero-metric-label">Party Sync</span>
              <span className="map-hero-metric-value">{metrics.partyPercent}%</span>
            </div>
            <div className="map-hero-metric">
              <span className="map-hero-metric-label">Pulse Age</span>
              <span className="map-hero-metric-value">
                {metrics.averageAge !== null ? `${metrics.averageAge}` : '—'}
              </span>
            </div>
          </div>
          <div className="map-hero-footer">innovation | intelligence | intuitive</div>
        </div>

        {!!marqueeUsers.length && (
          <div className="map-user-swimlane">
            <div className="map-user-swimlane-track">
              {marqueeUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`map-user-chip${selectedUserId === user.id ? ' active' : ''}`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <span className="map-user-chip-avatar">
                    <img
                      src={user.avatar_url || DEFAULT_PROFILE_IMAGE}
                      alt={user.display_name}
                    />
                  </span>
                  <span className="map-user-chip-info">
                    <span className="map-user-chip-name">{user.display_name}</span>
                    <span className="map-user-chip-meta">{user.distance || 'Nearby'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showUserPanel && selectedUser && (
          isMobile ? (
            <div className={`map-mobile-sheet${drawerOpen ? ' open' : ''}`}>
              <div className="map-sheet-handle" />
              <div className="map-sheet-header">
                <div className="map-sheet-avatar">
                  <img
                    src={selectedUser.avatar_url || DEFAULT_PROFILE_IMAGE}
                    alt={selectedUser.display_name}
                  />
                </div>
                <div className="map-sheet-overview">
                  <h3 className="map-sheet-name">{selectedUser.display_name}</h3>
                  <p className="map-sheet-meta">
                    {selectedUser.age !== null ? `${selectedUser.age}` : '—'} • {selectedUser.position || 'Unknown'}
                  </p>
                  <p className="map-sheet-distance">{selectedUser.distance || 'Nearby'}</p>
                </div>
                <button type="button" className="map-sheet-close" onClick={handleClosePanel}>
                  ×
                </button>
              </div>
              <div className="map-sheet-badges">
                {selectedUser.dtfn && <span className="map-sheet-badge electric">⚡ Ready now</span>}
                {selectedUser.party_friendly && <span className="map-sheet-badge neon">🥳 Party friendly</span>}
                <span className="map-sheet-badge ghost">{selectedUser.distance || 'Nearby'}</span>
              </div>
              <div className="map-sheet-score">
                <span className="map-sheet-score-label">SLTR Spark</span>
                <span className="map-sheet-score-value">{highlightScore}</span>
              </div>
              <div className="map-sheet-actions">
                <button
                  type="button"
                  className="map-sheet-action primary"
                  onClick={() => handleChatUser(selectedUser.id)}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className="map-sheet-action video"
                  onClick={() => handleVideoCallUser(selectedUser.id)}
                >
                  Video
                </button>
                <button
                  type="button"
                  className="map-sheet-action accent"
                  onClick={() => handleTapUser(selectedUser.id)}
                >
                  Tap
                </button>
                <button
                  type="button"
                  className="map-sheet-action ghost"
                  onClick={() => handleOpenProfile(selectedUser.id)}
                >
                  Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="map-desktop-panel">
              <div className="map-desktop-header">
                <div className="map-desktop-avatar">
                  <img
                    src={selectedUser.avatar_url || DEFAULT_PROFILE_IMAGE}
                    alt={selectedUser.display_name}
                  />
                </div>
                <div className="map-desktop-overview">
                  <h3 className="map-desktop-name">{selectedUser.display_name}</h3>
                  <p className="map-desktop-meta">
                    {selectedUser.age !== null ? `${selectedUser.age}` : '—'} • {selectedUser.position || 'Unknown'}
                  </p>
                  <p className="map-desktop-distance">{selectedUser.distance || 'Nearby'}</p>
                </div>
                <button type="button" className="map-desktop-close" onClick={handleClosePanel}>
                  ×
                </button>
              </div>
              <div className="map-desktop-badges">
                {selectedUser.dtfn && <span className="map-sheet-badge electric">⚡ Ready now</span>}
                {selectedUser.party_friendly && <span className="map-sheet-badge neon">🥳 Party friendly</span>}
                <span className="map-sheet-badge ghost">{selectedUser.distance || 'Nearby'}</span>
              </div>
              <div className="map-sheet-score">
                <span className="map-sheet-score-label">SLTR Spark</span>
                <span className="map-sheet-score-value">{highlightScore}</span>
              </div>
              <div className="map-desktop-actions">
                <button
                  type="button"
                  className="map-sheet-action primary"
                  onClick={() => handleChatUser(selectedUser.id)}
                >
                  Chat
                </button>
                <button
                  type="button"
                  className="map-sheet-action video"
                  onClick={() => handleVideoCallUser(selectedUser.id)}
                >
                  Video
                </button>
                <button
                  type="button"
                  className="map-sheet-action accent"
                  onClick={() => handleTapUser(selectedUser.id)}
                >
                  Tap
                </button>
                <button
                  type="button"
                  className="map-sheet-action ghost"
                  onClick={() => handleOpenProfile(selectedUser.id)}
                >
                  Profile
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {loading && (
        <div className="map-loading">
          <div className="map-loading-spinner" />
          <span>Loading nearby profiles…</span>
        </div>
      )}

      {error && !loading && (
        <div className="map-loading" style={{ gap: '8px' }}>
          <span>{error}</span>
        </div>
      )}

      <style jsx global>{`
        .map-overlay-stack {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          pointer-events: none;
        }

        .map-hero-panel {
          order: 1;
          align-self: flex-start;
          max-width: min(420px, 100%);
          background: linear-gradient(135deg, rgba(5, 12, 30, 0.84), rgba(8, 26, 48, 0.92));
          border: 1px solid rgba(0, 255, 255, 0.18);
          border-radius: 20px;
          padding: 18px 20px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
          pointer-events: auto;
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        .map-hero-heading {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .map-hero-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7af9ff;
        }

        .map-hero-status {
          font-size: 15px;
          font-weight: 600;
          color: #e5f5ff;
        }

        .map-hero-metrics {
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .map-hero-metric {
          background: rgba(0, 35, 50, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.18);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .map-hero-metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(220, 245, 255, 0.65);
        }

        .map-hero-metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #00ffff;
        }

        .map-hero-footer {
          margin-top: 16px;
          font-size: 11px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(190, 235, 255, 0.58);
        }

        .map-user-swimlane {
          order: 3;
          pointer-events: auto;
          margin-top: auto;
        }

        .map-user-swimlane-track {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 8px;
          background: rgba(6, 14, 30, 0.82);
          border: 1px solid rgba(0, 255, 255, 0.16);
          border-radius: 18px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .map-user-swimlane-track::-webkit-scrollbar {
          display: none;
        }

        .map-user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: rgba(0, 45, 60, 0.52);
          border-radius: 14px;
          padding: 10px 14px;
          color: #e5f9ff;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          min-width: 160px;
        }

        .map-user-chip.active {
          background: rgba(0, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .map-user-chip:hover {
          background: rgba(0, 255, 255, 0.24);
        }

        .map-user-chip-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid rgba(122, 249, 255, 0.35);
        }

        .map-user-chip-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-user-chip-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .map-user-chip-name {
          font-size: 14px;
          font-weight: 600;
        }

        .map-user-chip-meta {
          font-size: 12px;
          color: rgba(220, 245, 255, 0.7);
        }

        .map-mobile-sheet {
          order: 4;
          pointer-events: auto;
          margin-top: 16px;
          margin-left: -4px;
          margin-right: -4px;
          padding: 12px 16px 20px;
          background: rgba(4, 10, 24, 0.94);
          border: 1px solid rgba(0, 255, 255, 0.18);
          border-radius: 28px 28px 0 0;
          transform: translateY(120%);
          transition: transform 0.35s ease;
          backdrop-filter: blur(26px);
          -webkit-backdrop-filter: blur(26px);
        }

        .map-mobile-sheet.open {
          transform: translateY(0);
        }

        .map-sheet-handle {
          width: 52px;
          height: 5px;
          border-radius: 999px;
          background: rgba(220, 245, 255, 0.34);
          margin: 0 auto 14px;
        }

        .map-sheet-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .map-sheet-avatar {
          width: 68px;
          height: 68px;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(0, 255, 255, 0.32);
          flex-shrink: 0;
        }

        .map-sheet-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-sheet-overview {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .map-sheet-name {
          font-size: 20px;
          font-weight: 700;
          color: #e7faff;
        }

        .map-sheet-meta {
          font-size: 14px;
          color: rgba(215, 235, 255, 0.75);
        }

        .map-sheet-distance {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(122, 249, 255, 0.7);
        }

        .map-sheet-close {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid rgba(0, 255, 255, 0.22);
          background: rgba(10, 28, 45, 0.8);
          color: #9afaff;
          font-size: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .map-sheet-badges {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .map-sheet-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .map-sheet-badge.electric {
          background: linear-gradient(135deg, rgba(255, 0, 255, 0.74), rgba(255, 102, 204, 0.85));
          color: #ffffff;
        }

        .map-sheet-badge.neon {
          background: linear-gradient(135deg, rgba(255, 184, 77, 0.78), rgba(255, 95, 109, 0.88));
          color: #140b20;
        }

        .map-sheet-badge.ghost {
          background: rgba(0, 45, 60, 0.58);
          color: #aeefff;
          border: 1px solid rgba(0, 255, 255, 0.28);
        }

        .map-sheet-score {
          margin-top: 18px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          background: rgba(0, 35, 50, 0.7);
          border: 1px solid rgba(0, 255, 255, 0.22);
          border-radius: 18px;
          padding: 12px 18px;
        }

        .map-sheet-score-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(180, 240, 255, 0.7);
        }

        .map-sheet-score-value {
          font-size: 28px;
          font-weight: 700;
          color: #7af9ff;
        }

        .map-sheet-actions {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .map-sheet-action {
          border: 1px solid rgba(0, 255, 255, 0.24);
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #e7faff;
          background: rgba(0, 40, 50, 0.6);
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .map-sheet-action:hover {
          transform: translateY(-2px);
        }

        .map-sheet-action.primary {
          background: rgba(80, 210, 255, 0.35);
          border-color: rgba(122, 249, 255, 0.6);
          color: #10212f;
        }

        .map-sheet-action.video {
          background: rgba(120, 100, 255, 0.25);
          border-color: rgba(160, 145, 255, 0.6);
        }

        .map-sheet-action.accent {
          background: rgba(255, 130, 90, 0.28);
          border-color: rgba(255, 140, 90, 0.6);
        }

        .map-sheet-action.ghost {
          background: rgba(10, 28, 45, 0.65);
        }

        .map-desktop-panel {
          order: 2;
          pointer-events: auto;
          align-self: flex-end;
          width: min(360px, 100%);
          background: linear-gradient(160deg, rgba(5, 12, 30, 0.9), rgba(12, 36, 60, 0.95));
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .map-desktop-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .map-desktop-avatar {
          width: 78px;
          height: 78px;
          border-radius: 24px;
          overflow: hidden;
          border: 2px solid rgba(0, 255, 255, 0.32);
          flex-shrink: 0;
        }

        .map-desktop-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-desktop-overview {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .map-desktop-name {
          font-size: 22px;
          font-weight: 700;
          color: #f2feff;
        }

        .map-desktop-meta {
          font-size: 14px;
          color: rgba(214, 240, 255, 0.72);
        }

        .map-desktop-distance {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: rgba(122, 249, 255, 0.7);
        }

        .map-desktop-close {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(0, 255, 255, 0.22);
          background: rgba(10, 28, 45, 0.8);
          color: #9afaff;
          font-size: 26px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .map-desktop-badges {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .map-desktop-actions {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        @media (min-width: 768px) {
          .map-overlay-stack {
            padding: 20px 24px;
          }

          .map-hero-panel {
            max-width: 480px;
          }

          .map-hero-metrics {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .map-user-chip {
            min-width: 180px;
          }

          .map-mobile-sheet {
            display: none;
          }
        }

        @media (min-width: 1024px) {
          .map-overlay-stack {
            padding: 24px 32px;
          }

          .map-hero-panel {
            border-radius: 24px;
            padding: 22px 26px;
          }

          .map-desktop-panel {
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
}

