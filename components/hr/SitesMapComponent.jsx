'use client';

import { useEffect, useRef } from 'react';

/**
 * SitesMapComponent
 * 
 * Uses vanilla Leaflet to display all sites on a map
 * Shows markers with popups and radius circles for each site
 */
export default function SitesMapComponent({ sites = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      // Fix icon paths for Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map if not already initialized
      if (!mapInstanceRef.current && mapRef.current) {
        // Calculate center from all sites or use default
        let center = [51.5074, -0.1278]; // Default: London
        let zoom = 10;

        if (sites.length > 0) {
          const sitesWithLocation = sites.filter(
            (site) => site.location?.latitude && site.location?.longitude
          );

          if (sitesWithLocation.length > 0) {
            // Calculate average center
            const avgLat =
              sitesWithLocation.reduce(
                (sum, site) => sum + parseFloat(site.location.latitude),
                0
              ) / sitesWithLocation.length;
            const avgLng =
              sitesWithLocation.reduce(
                (sum, site) => sum + parseFloat(site.location.longitude),
                0
              ) / sitesWithLocation.length;
            center = [avgLat, avgLng];
            zoom = sitesWithLocation.length === 1 ? 15 : 12;
          }
        }

        const map = L.map(mapRef.current, {
          center: center,
          zoom: zoom,
          scrollWheelZoom: true,
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
      }
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Add markers and circles for sites
  useEffect(() => {
    if (!mapInstanceRef.current || sites.length === 0) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing markers and circles
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker);
      });
      circlesRef.current.forEach((circle) => {
        map.removeLayer(circle);
      });
      markersRef.current = [];
      circlesRef.current = [];

      // Add marker and circle for each site
      sites.forEach((site) => {
        if (!site.location?.latitude || !site.location?.longitude) return;

        const lat = parseFloat(site.location.latitude);
        const lng = parseFloat(site.location.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const position = [lat, lng];
        const radius = parseFloat(site.attendanceRadius) || 100;

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${site.name || 'Unnamed Site'}</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Site Code:</strong> ${site.siteCode || 'N/A'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Address:</strong> ${site.address?.street || ''}${site.address?.city ? `, ${site.address.city}` : ''}${site.address?.postcode ? `, ${site.address.postcode}` : ''}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: ${site.status === 'active' ? 'green' : 'red'}">${site.status || 'N/A'}</span></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Radius:</strong> ${radius}m</p>
            ${site.siteManagers && site.siteManagers.length > 0 ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Site Managers:</strong> ${site.siteManagers.length}</p>` : '<p style="margin: 4px 0; font-size: 14px;"><strong>Site Managers:</strong> Not assigned</p>'}
          </div>
        `;

        // Create marker
        const marker = L.marker(position).addTo(map);
        marker.bindPopup(popupContent);

        // Create circle for attendance radius
        const circle = L.circle(position, {
          radius: radius,
          color: site.status === 'active' ? '#10b981' : '#ef4444',
          fillColor: site.status === 'active' ? '#10b981' : '#ef4444',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);

        // Add hover tooltip to circle
        circle.bindTooltip(`${site.name || 'Site'}: ${radius}m radius`, {
          permanent: false,
          direction: 'center',
        });

        markersRef.current.push(marker);
        circlesRef.current.push(circle);
      });

      // Fit map bounds to show all sites
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
        }
      }
    });
  }, [sites]);

  return (
    <div
      ref={mapRef}
      style={{
        height: '100%',
        width: '100%',
        minHeight: '500px',
      }}
    />
  );
}

