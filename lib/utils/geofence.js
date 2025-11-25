/**
 * Geofence Utilities
 * Functions to check if a point is within a geofence (circle or polygon)
 */

/**
 * Check if a point is within a circle geofence
 * @param {Object} point - { latitude, longitude }
 * @param {Object} center - { latitude, longitude }
 * @param {number} radiusMeters - Radius in meters
 * @returns {boolean}
 */
export function isPointInCircle(point, center, radiusMeters) {
  if (!point || !center || radiusMeters == null) {
    return false;
  }

  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    center.latitude,
    center.longitude
  );

  return distance <= radiusMeters;
}

/**
 * Check if a point is within a polygon geofence
 * Uses ray casting algorithm
 * @param {Object} point - { latitude, longitude }
 * @param {Array<{latitude: number, longitude: number}>} polygon - Array of polygon vertices
 * @returns {boolean}
 */
export function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) {
    return false;
  }

  const { latitude, longitude } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a point is within a geofence (supports circle or polygon)
 * @param {Object} point - { latitude, longitude }
 * @param {Object} geofence - Geofence object with type and data
 * @returns {boolean}
 */
export function isPointInGeofence(point, geofence) {
  if (!point || !geofence) {
    return false;
  }

  if (geofence.type === 'circle') {
    return isPointInCircle(point, geofence.center, geofence.radius);
  } else if (geofence.type === 'polygon') {
    return isPointInPolygon(point, geofence.polygon);
  }

  return false;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}


