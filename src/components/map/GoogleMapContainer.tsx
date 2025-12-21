'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Waypoint, LiveLocation } from '@/types';
import { getMarkerIcon, userLocationMarkerSvg } from '@/lib/maps/icons';
import { calculateDistance, formatDistance, openDirections } from '@/lib/maps/utils';
import { Navigation, MapPin, Check, Loader2 } from 'lucide-react';

interface Props {
  waypoints: Waypoint[];
  userLocation: { lat: number; lng: number } | null;
  completedWaypointIds: string[];
  onWaypointComplete: (waypointId: string, lat: number, lng: number) => void;
  isCompleting?: boolean;
  liveLocations?: LiveLocation[];
  followMode?: boolean;
  onFollowModeChange?: (follow: boolean) => void;
}

// Generate a consistent color from username
function stringToColor(str: string): string {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Create SVG data URL for user marker with initials
function createUserMarkerSvg(initials: string, color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="Arial, sans-serif">${initials}</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Default center (Hue, Vietnam)
const defaultCenter = { lat: 16.4637, lng: 107.5909 };

export default function GoogleMapContainer({
  waypoints,
  userLocation,
  completedWaypointIds,
  onWaypointComplete,
  isCompleting = false,
  liveLocations = [],
  followMode = false,
  onFollowModeChange,
}: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // Fit bounds to show all waypoints on initial load
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (waypoints.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        waypoints.forEach((wp) => {
          bounds.extend({ lat: wp.latitude, lng: wp.longitude });
        });
        map.fitBounds(bounds, 50);
      }
      setMap(map);
      // Mark as initialized after a short delay to allow initial positioning
      setTimeout(() => setHasInitialized(true), 1000);
    },
    [waypoints]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
    setHasInitialized(false);
  }, []);

  // Center map on user location when followMode is enabled
  useEffect(() => {
    if (map && userLocation && followMode && hasInitialized) {
      map.panTo(userLocation);
    }
  }, [map, userLocation, followMode, hasInitialized]);

  // Calculate initial center (only used for initial render)
  const initialCenter = useMemo(() => {
    if (waypoints.length > 0) {
      return { lat: waypoints[0].latitude, lng: waypoints[0].longitude };
    }
    return defaultCenter;
  }, [waypoints]);

  // Calculate distance to selected waypoint
  const distanceToSelected = useMemo(() => {
    if (!selectedWaypoint || !userLocation) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      selectedWaypoint.latitude,
      selectedWaypoint.longitude
    );
  }, [selectedWaypoint, userLocation]);

  const isWithinRange = distanceToSelected !== null && distanceToSelected <= 15;
  const isSelectedCompleted = selectedWaypoint
    ? completedWaypointIds.includes(selectedWaypoint.id)
    : false;

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-500 font-medium">Failed to load Google Maps</p>
          <p className="text-gray-500 text-sm mt-1">Please check your API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={initialCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      }}
    >
      {/* Waypoint Markers */}
      {waypoints.map((waypoint) => {
        const isCompleted = completedWaypointIds.includes(waypoint.id);
        return (
          <Marker
            key={waypoint.id}
            position={{ lat: waypoint.latitude, lng: waypoint.longitude }}
            icon={{
              url: getMarkerIcon(waypoint.icon, isCompleted),
              scaledSize: new google.maps.Size(40, 48),
              anchor: new google.maps.Point(20, 48),
            }}
            onClick={() => setSelectedWaypoint(waypoint)}
            opacity={isCompleted ? 0.7 : 1}
          />
        );
      })}

      {/* User Location Marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: userLocationMarkerSvg,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          zIndex={1000}
        />
      )}

      {/* Other Users Live Locations */}
      {liveLocations.map((loc) => {
        const username = loc.user?.username || 'Unknown';
        const initials = username.slice(0, 2).toUpperCase();
        const color = stringToColor(username);
        return (
          <Marker
            key={loc.user_id}
            position={{ lat: loc.latitude, lng: loc.longitude }}
            icon={{
              url: createUserMarkerSvg(initials, color),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            }}
            title={username}
            zIndex={500}
          />
        );
      })}

      {/* Info Window */}
      {selectedWaypoint && (
        <InfoWindow
          position={{
            lat: selectedWaypoint.latitude,
            lng: selectedWaypoint.longitude,
          }}
          onCloseClick={() => setSelectedWaypoint(null)}
          options={{
            pixelOffset: new google.maps.Size(0, -48),
          }}
        >
          <div className="p-1 max-w-[280px]">
            <h3 className="font-bold text-lg text-gray-800">
              {selectedWaypoint.name}
            </h3>
            {selectedWaypoint.description && (
              <p className="text-gray-600 text-sm mt-1">
                {selectedWaypoint.description}
              </p>
            )}

            {/* Points and Distance */}
            <div className="flex items-center gap-2 mt-3">
              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
                {selectedWaypoint.points} pts
              </span>
              {distanceToSelected !== null && (
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    isWithinRange
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {formatDistance(distanceToSelected)}
                </span>
              )}
            </div>

            {/* Directions Note */}
            {selectedWaypoint.directions_note && (
              <p className="text-xs text-gray-500 mt-2 italic border-l-2 border-gray-200 pl-2">
                {selectedWaypoint.directions_note}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  openDirections(
                    selectedWaypoint.latitude,
                    selectedWaypoint.longitude
                  )
                }
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-600"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>

              {!isSelectedCompleted && (
                <button
                  onClick={() => {
                    if (userLocation) {
                      onWaypointComplete(
                        selectedWaypoint.id,
                        userLocation.lat,
                        userLocation.lng
                      );
                    }
                  }}
                  disabled={!isWithinRange || !userLocation || isCompleting}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                    isWithinRange && userLocation
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      {isWithinRange ? 'Complete!' : 'Get Closer'}
                    </>
                  )}
                </button>
              )}

              {isSelectedCompleted && (
                <div className="flex-1 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  Completed
                </div>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
