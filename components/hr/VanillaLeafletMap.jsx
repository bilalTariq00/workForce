'use client';

import { useEffect, useRef } from 'react';

/**
 * Vanilla Leaflet Map Component
 * Uses Leaflet directly (not react-leaflet) to avoid Context API issues
 * This is equivalent to the vanilla Leaflet setup from the docs
 */
export default function VanillaLeafletMap({
  center = [51.5074, -0.1278],
  zoom = 15,
  geofenceType = 'circle',
  circleCenter = null,
  circleRadius = 100,
  polygonPoints = [],
  onMapClick = null,
  onCircleCenterDrag = null,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const polygonRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet
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
        const map = L.map(mapRef.current, {
          center: Array.isArray(center) && center.length === 2 ? center : [51.5074, -0.1278],
          zoom: zoom || 15,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

  // Update map center and zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      const newCenter = Array.isArray(center) && center.length === 2 ? center : [51.5074, -0.1278];
      const newZoom = zoom || 15;

      map.setView(newCenter, newZoom);
    });
  }, [center, zoom]);

  // Handle map click for polygon drawing
  useEffect(() => {
    if (!mapInstanceRef.current || geofenceType !== 'polygon' || !onMapClick) return;

    let cleanup = null;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const handleClick = (e) => {
        if (onMapClick && typeof onMapClick === 'function') {
          onMapClick(e);
        }
      };

      map.on('click', handleClick);

      cleanup = () => {
        if (map) {
          map.off('click', handleClick);
        }
      };
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [geofenceType, onMapClick]);

  // Draw/update circle geofence
  useEffect(() => {
    if (!mapInstanceRef.current || geofenceType !== 'circle' || !circleCenter) {
      // Clean up if switching away from circle
      if (circleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing circle
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      const centerLatLng = [circleCenter.latitude, circleCenter.longitude];
      const radius = parseFloat(circleRadius) || 100;

      // Add marker (draggable)
      const marker = L.marker(centerLatLng, {
        draggable: true,
      }).addTo(map);

      // Handle marker drag
      if (onCircleCenterDrag && typeof onCircleCenterDrag === 'function') {
        marker.on('dragend', (e) => {
          const newLatLng = e.target.getLatLng();
          // Match the format expected by GeofenceManager
          onCircleCenterDrag({
            target: {
              getLatLng: () => ({
                lat: newLatLng.lat,
                lng: newLatLng.lng,
              }),
            },
            latlng: newLatLng,
          });
        });
      }

      // Add circle
      const circle = L.circle(centerLatLng, {
        radius: radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      }).addTo(map);

      markerRef.current = marker;
      circleRef.current = circle;
    });

    // Cleanup
    return () => {
      if (circleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [geofenceType, circleCenter, circleRadius, onCircleCenterDrag]);

  // Draw/update polygon geofence
  useEffect(() => {
    if (!mapInstanceRef.current || geofenceType !== 'polygon' || !polygonPoints || polygonPoints.length === 0) {
      // Remove existing polygon
      if (polygonRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      return;
    }

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing polygon
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }

      // Create polygon from points
      const latlngs = polygonPoints.map((p) => [p.latitude, p.longitude]);

      const polygon = L.polygon(latlngs, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      }).addTo(map);

      polygonRef.current = polygon;
    });

    // Cleanup
    return () => {
      if (polygonRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
    };
  }, [geofenceType, polygonPoints]);

  return (
    <div
      ref={mapRef}
      style={{
        height: '100%',
        width: '100%',
        minHeight: '400px',
      }}
    />
  );
}

