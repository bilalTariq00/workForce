/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
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

/**
 * Check if user location is within allowed radius of site
 * @param {Object} siteLocation - { latitude, longitude }
 * @param {Object} userLocation - { latitude, longitude }
 * @param {number} radiusMeters - Allowed radius in meters
 * @returns {Object} { isWithinRadius: boolean, distance: number }
 */
export function isWithinRadius(siteLocation, userLocation, radiusMeters) {
  const distance = calculateDistance(
    siteLocation.latitude,
    siteLocation.longitude,
    userLocation.latitude,
    userLocation.longitude
  );

  return {
    isWithinRadius: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}

/**
 * Find nearest site to user location
 * @param {Array} sites - Array of site objects with location
 * @param {Object} userLocation - { latitude, longitude }
 * @returns {Object|null} Nearest site or null
 */
export function findNearestSite(sites, userLocation) {
  if (!sites || sites.length === 0) {
    return null;
  }

  let nearestSite = null;
  let minDistance = Infinity;

  for (const site of sites) {
    if (!site.location || !site.location.latitude || !site.location.longitude) {
      continue;
    }

    const distance = calculateDistance(
      site.location.latitude,
      site.location.longitude,
      userLocation.latitude,
      userLocation.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestSite = { ...site, distance };
    }
  }

  return nearestSite;
}

