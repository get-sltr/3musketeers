import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { createMapboxMarker } from './MapPinWithDrawer';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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

interface MapViewProps {
  users: User[];
  onChatUser: (userId: string) => void;
  onVideoCallUser: (userId: string) => void;
  onTapUser: (userId: string) => void;
  onProfileClick: (userId: string) => void;
  center?: [number, number];
  zoom?: number;
  onMapReady?: () => void;
  onMapError?: (message: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  users,
  onChatUser,
  onVideoCallUser,
  onTapUser,
  onProfileClick,
  center = [-118.2437, 34.0522],
  zoom = 12,
  onMapReady,
  onMapError,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Temporary instrumentation to help diagnose blank map render.
    // eslint-disable-next-line no-console
    console.log('Mapbox token present?', Boolean(mapboxgl.accessToken));

    if (!mapboxgl.accessToken) {
      onMapError?.('Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN to enable maps.');
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAPBOX_SLTR_STYLE || 'mapbox://styles/sltr/cmhum4i1k001x01rlasmoccvm',
      center,
      zoom,
      pitch: 0,
      bearing: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right',
    );

    const handleMapError = (event: mapboxgl.ErrorEvent) => {
      // eslint-disable-next-line no-console
      console.error('Mapbox map error:', event?.error ?? event);
      const message =
        (event?.error && 'message' in event.error && typeof event.error.message === 'string'
          ? event.error.message
          : undefined) || 'Error loading map data. Please try again.';
      onMapError?.(message);
    };

    const handleMapLoad = () => {
      onMapReady?.();
    };

    map.current.on('error', handleMapError);
    map.current.once('load', handleMapLoad);

    return () => {
      map.current?.off('error', handleMapError);
      map.current?.off('load', handleMapLoad);
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom, onMapError, onMapReady]);

  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    users.forEach((user) => {
      const el = createMapboxMarker(
        user,
        onChatUser,
        onVideoCallUser,
        onTapUser,
        onProfileClick,
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [users, onChatUser, onVideoCallUser, onTapUser, onProfileClick]);

  return (
    <div className="map-view-container">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default MapView;

