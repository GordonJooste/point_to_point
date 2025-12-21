/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Check if user is within range of a waypoint
 */
export function isWithinRange(
  userLat: number,
  userLng: number,
  waypointLat: number,
  waypointLng: number,
  rangeMeters: number = 15
): boolean {
  const distance = calculateDistance(userLat, userLng, waypointLat, waypointLng);
  return distance <= rangeMeters;
}

/**
 * Open Google Maps directions to a location
 */
export function openDirections(lat: number, lng: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
}

/**
 * Get center point of multiple coordinates
 */
export function getCenterPoint(
  coords: Array<{ latitude: number; longitude: number }>
): { lat: number; lng: number } {
  if (coords.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sum = coords.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.latitude,
      lng: acc.lng + coord.longitude,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coords.length,
    lng: sum.lng / coords.length,
  };
}

/**
 * Get bounds that contain all coordinates
 */
export function getBounds(
  coords: Array<{ latitude: number; longitude: number }>
): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (coords.length === 0) {
    return null;
  }

  let north = coords[0].latitude;
  let south = coords[0].latitude;
  let east = coords[0].longitude;
  let west = coords[0].longitude;

  coords.forEach((coord) => {
    if (coord.latitude > north) north = coord.latitude;
    if (coord.latitude < south) south = coord.latitude;
    if (coord.longitude > east) east = coord.longitude;
    if (coord.longitude < west) west = coord.longitude;
  });

  return { north, south, east, west };
}
