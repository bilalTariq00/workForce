/**
 * Geocoding Service
 * Converts addresses to coordinates using Nominatim (OpenStreetMap)
 * Free, no API key required, but has rate limits
 */

/**
 * Search for address suggestions (autocomplete)
 * @param {string} query - Search query string
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array<{latitude: number, longitude: number, formattedAddress: string, displayName: string}>>}
 */
export async function searchAddressSuggestions(query, limit = 5) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  try {
    const trimmedQuery = query.trim();
    
    // Try multiple search strategies for better results
    const searchQueries = [
      trimmedQuery, // Full query
      // If query is very long, also try simplified version
      trimmedQuery.length > 50 
        ? trimmedQuery.split(',').slice(-3).join(',').trim() // Last 3 parts
        : null,
    ].filter(Boolean);

    let allResults = [];

    for (const searchQuery of searchQueries) {
      if (searchQuery.length < 2) continue;

      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=${limit}&addressdetails=1&accept-language=en`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Workforce Management System',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        continue; // Try next query
      }

      const data = await response.json();

      if (data && data.length > 0) {
        allResults.push(...data);
      }
    }

    // Remove duplicates based on coordinates
    const uniqueResults = [];
    const seenCoords = new Set();
    
    for (const result of allResults) {
      const coordKey = `${result.lat},${result.lon}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        uniqueResults.push(result);
      }
    }

    // Limit results
    const limitedResults = uniqueResults.slice(0, limit);

    return limitedResults.map((result) => ({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formattedAddress: result.display_name,
      displayName: result.display_name,
      address: result.address || {},
    }));
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

/**
 * Geocode an address to get coordinates
 * Tries multiple search strategies if the full address doesn't work
 * @param {string} address - Full address string
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Address is required');
  }

  const searchStrategies = [
    // Strategy 1: Full address
    address.trim(),
    // Strategy 2: Remove office/floor details, keep main location
    address.replace(/\b(Office|Shop|Unit)\s*(No\s*)?[A-Z0-9-]+\s*\d+(st|nd|rd|th)?\s*Floor\s*/gi, '').trim(),
    // Strategy 3: Extract key parts (road, area, city)
    (() => {
      const parts = address.split(',').map(p => p.trim());
      // Get last 2-3 parts (usually area, city, country)
      return parts.slice(-3).join(', ');
    })(),
    // Strategy 4: Just road and city
    (() => {
      const parts = address.split(',').map(p => p.trim());
      const roadMatch = address.match(/\b([A-Za-z\s]+(?:Rd|Road|Street|St|Avenue|Ave))\b/i);
      const cityMatch = parts.find(p => /^[A-Z]/.test(p) && p.length > 3);
      if (roadMatch && cityMatch) {
        return `${roadMatch[1]}, ${cityMatch}`;
      }
      return parts.slice(-2).join(', ');
    })(),
  ];

  // Remove duplicates and empty strings
  const uniqueStrategies = [...new Set(searchStrategies.filter(s => s && s.length > 3))];

  for (let i = 0; i < uniqueStrategies.length; i++) {
    const searchQuery = uniqueStrategies[i];
    
    try {
      const encodedAddress = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&accept-language=en`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Workforce Management System',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        continue; // Try next strategy
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Find the best match (prefer results that contain key terms from original address)
        const originalLower = address.toLowerCase();
        const bestMatch = data.find(result => {
          const resultLower = result.display_name.toLowerCase();
          // Check if result contains key location terms
          const keyTerms = ['rawalpindi', 'islamabad', 'e-8', 'markaz', 'saidpur'];
          return keyTerms.some(term => resultLower.includes(term) && originalLower.includes(term));
        }) || data[0]; // Fallback to first result

        return {
          latitude: parseFloat(bestMatch.lat),
          longitude: parseFloat(bestMatch.lon),
          formattedAddress: bestMatch.display_name,
        };
      }
    } catch (error) {
      console.error(`Geocoding strategy ${i + 1} failed:`, error);
      // Continue to next strategy
    }
  }

  // If all strategies failed, throw error with helpful message
  throw new Error(
    'Address not found. Try searching with a simpler address like "E-8 Markaz Rawalpindi" or "Saidpur Road Rawalpindi".'
  );
}

/**
 * Geocode address from structured address object
 * @param {Object} address - { street, city, postcode, country }
 * @returns {Promise<{latitude: number, longitude: number, formattedAddress: string}>}
 */
export async function geocodeStructuredAddress(address) {
  if (!address) {
    throw new Error('Address object is required');
  }

  // Build address string
  const addressParts = [];
  if (address.street) addressParts.push(address.street);
  if (address.city) addressParts.push(address.city);
  if (address.postcode) addressParts.push(address.postcode);
  if (address.country) addressParts.push(address.country);

  const fullAddress = addressParts.join(', ');

  if (fullAddress.trim().length === 0) {
    throw new Error('Address must have at least one field (street, city, postcode, or country)');
  }

  return geocodeAddress(fullAddress);
}

/**
 * Format address from Nominatim address object to readable format
 * Format: "Office No T-07 3rd Floor E-8 Markaz Haidri Chowk, Saidpur Rd, Block E Satellite Town, Rawalpindi"
 * @param {Object} address - Address object from Nominatim
 * @returns {string} Formatted address string
 */
function formatAddress(address) {
  if (!address || typeof address !== 'object') return '';

  const parts = [];

  // Office/Shop/Unit number (e.g., "Office No T-07", "Shop 5", "Unit 12")
  if (address.office) {
    parts.push(`Office ${address.office}`);
  } else if (address.shop) {
    parts.push(`Shop ${address.shop}`);
  } else if (address.unit) {
    parts.push(`Unit ${address.unit}`);
  }

  // Floor/Level (e.g., "3rd Floor", "Ground Floor")
  if (address.level) {
    const floor = address.level;
    // Convert numeric floors to ordinal (1st, 2nd, 3rd, etc.)
    if (/^\d+$/.test(floor)) {
      const num = parseInt(floor);
      const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
      parts.push(`${num}${suffix} Floor`);
    } else {
      parts.push(`${floor} Floor`);
    }
  }

  // House/Building number
  if (address.house_number) {
    parts.push(`House ${address.house_number}`);
  }
  if (address.house && !address.house_number) {
    parts.push(address.house);
  }

  // Building/Complex name (e.g., "E-8 Markaz", "Plaza Name")
  if (address.building) {
    parts.push(address.building);
  }
  if (address.commercial) {
    parts.push(address.commercial);
  }

  // Landmark/Chowk/Intersection (e.g., "Haidri Chowk", "Main Chowk")
  if (address.landmark) {
    parts.push(address.landmark);
  }
  // Check for chowk in various fields
  if (address.place && address.place.toLowerCase().includes('chowk')) {
    parts.push(address.place);
  }

  // Street/Road (e.g., "Saidpur Rd", "Main Street")
  if (address.road) {
    // Add "Rd" or "Street" suffix if not present
    const road = address.road.trim();
    if (!/\b(road|rd|street|st|avenue|ave|boulevard|blvd|drive|dr|lane|ln)\b/i.test(road)) {
      parts.push(`${road} Road`);
    } else {
      parts.push(road);
    }
  }
  if (address.street && address.street !== address.road) {
    parts.push(address.street);
  }

  // Block/Sector (e.g., "Block E", "Sector 5")
  if (address.block) {
    parts.push(`Block ${address.block}`);
  }
  if (address.sector) {
    parts.push(`Sector ${address.sector}`);
  }

  // Area/Neighborhood/Suburb (e.g., "Satellite Town", "G-13")
  if (address.neighbourhood) {
    parts.push(address.neighbourhood);
  }
  if (address.suburb) {
    parts.push(address.suburb);
  }
  if (address.quarter) {
    parts.push(address.quarter);
  }

  // City/Town/Village
  if (address.city) {
    parts.push(address.city);
  } else if (address.town) {
    parts.push(address.town);
  } else if (address.village) {
    parts.push(address.village);
  }

  // District/State (if different from city)
  if (address.state_district && address.state_district !== address.city && address.state_district !== address.town) {
    parts.push(address.state_district);
  }
  if (address.state && address.state !== address.city && address.state !== address.town) {
    parts.push(address.state);
  }

  // Postcode (optional, usually at the end)
  if (address.postcode) {
    parts.push(address.postcode);
  }

  // Country (at the very end)
  if (address.country) {
    parts.push(address.country);
  }

  return parts.join(' ');
}

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<{formattedAddress: string, address: Object}>}
 */
export async function reverseGeocode(latitude, longitude) {
  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid latitude and longitude are required');
  }

  try {
    // Use addressdetails=1 to get structured address data
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Workforce Management System',
        'Accept-Language': 'en', // Request English language responses
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.address) {
      throw new Error('Address not found for these coordinates');
    }

    // Format address in readable format (e.g., "House 16, Street 66, G-13, Islamabad, Pakistan")
    const formattedAddress = formatAddress(data.address) || data.display_name;

    return {
      formattedAddress: formattedAddress,
      displayName: data.display_name, // Keep original for reference
      address: data.address,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}
