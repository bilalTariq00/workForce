/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Validate inputs
  if (
    lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return Infinity; // Return large distance if invalid
  }

  // Ensure coordinates are numbers
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  // Validate ranges
  if (
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
  ) {
    console.error('Coordinates out of range:', { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  
  // Sanity check - if distance is unreasonably large, log for debugging
  if (distance > 20000000) { // More than 20,000 km (halfway around the world)
    console.warn('Unusually large distance calculated:', {
      distance: distance,
      lat1, lon1, lat2, lon2,
      distanceKm: (distance / 1000).toFixed(2)
    });
  }

  return distance;
}

/**
 * Check if user location is within allowed radius of site
 * @param {Object} siteLocation - { latitude, longitude }
 * @param {Object} userLocation - { latitude, longitude }
 * @param {number} radiusMeters - Allowed radius in meters
 * @returns {Object} { isWithinRadius: boolean, distance: number }
 */
export function isWithinRadius(siteLocation, userLocation, radiusMeters) {
  // Validate inputs
  if (!siteLocation || !userLocation) {
    console.error('Missing location data:', { siteLocation, userLocation });
    return {
      isWithinRadius: false,
      distance: Infinity,
    };
  }

  if (
    siteLocation.latitude == null || siteLocation.longitude == null ||
    userLocation.latitude == null || userLocation.longitude == null
  ) {
    console.error('Invalid location coordinates:', { siteLocation, userLocation });
    return {
      isWithinRadius: false,
      distance: Infinity,
    };
  }

  const distance = calculateDistance(
    siteLocation.latitude,
    siteLocation.longitude,
    userLocation.latitude,
    userLocation.longitude
  );

  // Log for debugging if distance seems wrong
  if (distance > 100000) { // More than 100 km
    console.warn('Large distance detected:', {
      siteLocation,
      userLocation,
      distance: Math.round(distance),
      distanceKm: (distance / 1000).toFixed(2),
      radiusMeters
    });
  }

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
    console.warn('No sites provided to findNearestSite');
    return null;
  }

  if (!userLocation || userLocation.latitude == null || userLocation.longitude == null) {
    console.error('Invalid user location:', userLocation);
    return null;
  }

  let nearestSite = null;
  let minDistance = Infinity;

  for (const site of sites) {
    if (!site.location) {
      console.warn('Site missing location:', site.name || site._id);
      continue;
    }

    if (site.location.latitude == null || site.location.longitude == null) {
      console.warn('Site has invalid location coordinates:', {
        siteName: site.name,
        location: site.location
      });
      continue;
    }

    // Validate coordinate ranges
    if (
      site.location.latitude < -90 || site.location.latitude > 90 ||
      site.location.longitude < -180 || site.location.longitude > 180
    ) {
      console.warn('Site coordinates out of range:', {
        siteName: site.name,
        latitude: site.location.latitude,
        longitude: site.location.longitude
      });
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

  if (!nearestSite) {
    console.warn('No valid site found near user location:', userLocation);
  }

  return nearestSite;
}

