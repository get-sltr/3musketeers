'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/map-view.css';
import '../styles/map-pin-drawer.css';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

type RawProfile = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  avatar_url?: string | null;
  age: number | null;
  position: string | null;
  dtfn: boolean | null;
  latitude: number;
  longitude: number;
};

type MapUser = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  age: number;
  position: string;
  dtfn: boolean;
  latitude: number;
  longitude: number;
  distance?: string;
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
  const [users, setUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

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
    let isCancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(
          'id, display_name, photo_url, avatar_url, age, position, dtfn, latitude, longitude',
        )
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('incognito_mode', false)
        .limit(200);

      if (isCancelled) return;

      if (fetchError) {
        console.error('Error loading map users:', fetchError);
        setError('Failed to load nearby profiles.');
        setUsers([]);
        setLoading(false);
        return;
      }

      const enriched = (data || []).map((profile: RawProfile) => {
        const base: MapUser = {
          id: profile.id,
          display_name: profile.display_name || 'Anonymous',
          avatar_url: profile.photo_url || profile.avatar_url || null,
          age: profile.age ?? 0,
          position: profile.position || 'Unknown',
          dtfn: Boolean(profile.dtfn),
          latitude: profile.latitude,
          longitude: profile.longitude,
        };

        if (userLocation) {
          const distanceMiles = calculateDistanceInMiles(userLocation, [
            profile.longitude,
            profile.latitude,
          ]);
          const distance = formatDistance(distanceMiles);
          if (distance) {
            base.distance = distance;
          }
        }

        return base;
      });

      setUsers(enriched);
      setLoading(false);
    };

    fetchUsers();

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
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [userLocation]);

  const center = useMemo(() => userLocation || DEFAULT_CENTER, [userLocation]);

  const handleChatUser = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const handleVideoCallUser = (userId: string) => {
    router.push(`/messages?user=${userId}&startVideo=1`);
    window.dispatchEvent(
      new CustomEvent('eros_start_video_call', {
        detail: { userId },
      }),
    );
  };

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
    }
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

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
    </div>
  );
}

