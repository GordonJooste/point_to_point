'use client';

import { useState } from 'react';
import { Crosshair, Loader2, AlertCircle, Navigation2 } from 'lucide-react';
import GoogleMapContainer from '@/components/map/GoogleMapContainer';
import { useWaypoints } from '@/hooks/useWaypoints';
import { useWaypointCompletions } from '@/hooks/useWaypointCompletions';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { useUser } from '@/contexts/UserContext';
import { useLocationTracking } from '@/contexts/LocationTrackingContext';

export default function MapPage() {
  const [isCompleting, setIsCompleting] = useState(false);
  const [followMode, setFollowMode] = useState(false);

  const { user } = useUser();

  // Location tracking is now handled by LocationTrackingContext in the app layout
  const {
    latitude,
    longitude,
    accuracy,
    error: geoError,
    isTracking,
  } = useLocationTracking();

  const { waypoints, isLoading: waypointsLoading } = useWaypoints();
  const { completedIds, completeWaypoint } = useWaypointCompletions();

  // Fetch other users' locations
  const { locations: liveLocations } = useLiveLocations(user?.id);

  const userLocation =
    latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : null;

  const handleWaypointComplete = async (
    waypointId: string,
    lat: number,
    lng: number
  ) => {
    setIsCompleting(true);
    await completeWaypoint(waypointId, lat, lng);
    setIsCompleting(false);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Map */}
      <div className="absolute inset-0">
        {waypointsLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : (
          <GoogleMapContainer
            waypoints={waypoints}
            userLocation={userLocation}
            completedWaypointIds={completedIds}
            onWaypointComplete={handleWaypointComplete}
            isCompleting={isCompleting}
            liveLocations={liveLocations}
            followMode={followMode}
            onFollowModeChange={setFollowMode}
          />
        )}
      </div>

      {/* Location Status */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* GPS Status */}
        <div className="pointer-events-auto">
          {geoError ? (
            <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="max-w-[200px] truncate">{geoError}</span>
            </div>
          ) : isTracking && accuracy !== null ? (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                GPS: ±{Math.round(accuracy)}m
              </span>
            </div>
          ) : (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-gray-600">Getting location...</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-auto">
          <span className="text-gray-600">
            {completedIds.length}/{waypoints.length} waypoints
          </span>
        </div>
      </div>

      {/* Bottom Button - above nav bar */}
      <div className="absolute right-4" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        {/* Follow Mode Toggle */}
        <button
          onClick={() => setFollowMode(!followMode)}
          className={`p-3 rounded-lg shadow-lg transition-colors ${
            followMode
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
          title={followMode ? 'Stop following' : 'Follow my location'}
        >
          <Navigation2 className={`w-5 h-5 ${followMode ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
