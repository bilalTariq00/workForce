'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, useMap } from 'react-leaflet';

// Fix Leaflet icon paths for Next.js
// Equivalent to vanilla Leaflet setup but adapted for React/Next.js
// react-leaflet automatically loads Leaflet JS (equivalent to <script src="leaflet.js">)
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  // Fix for default marker icon paths (Next.js issue)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Component to handle map instance and events (must be inside MapContainer)
function MapController({ geofenceType, onMapClick, center, zoom }) {
  const map = useMap();
  const handlersRef = useRef(null);

    useEffect(() => {
      if (!map) return;

      if (geofenceType === 'polygon' && onMapClick && typeof onMapClick === 'function') {
        const handleClick = (e) => {
          if (e && e.latlng) {
            try {
              onMapClick(e);
            } catch (error) {
              console.error('Error in map click handler:', error);
            }
          }
        };
        map.on('click', handleClick);
        handlersRef.current = { handleClick };
        
        return () => {
          if (handlersRef.current && handlersRef.current.handleClick) {
            try {
              map.off('click', handlersRef.current.handleClick);
            } catch (error) {
              console.error('Error removing map click handler:', error);
            }
          }
        };
      }
    }, [map, geofenceType, onMapClick]);

    useEffect(() => {
      if (!map) return;
      
      if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
        try {
          map.setView(center, zoom || 15);
        } catch (error) {
          console.error('Error setting map view:', error);
        }
      }
    }, [map, center, zoom]);

    return null;
}

export default function LeafletMap({
  center,
  zoom,
  geofenceType = 'circle',
  circleCenter,
  circleRadius,
  polygonPoints = [],
  onMapClick,
  onCircleCenterDrag,
}) {
  // Ensure we're on client side
  if (typeof window === 'undefined') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  // Ensure center is valid
  const mapCenter = center && Array.isArray(center) && center.length === 2 
    ? center 
    : [51.5074, -0.1278];
  const mapZoom = zoom || 15;

  // Ensure callbacks are functions
  const handleMapClick = typeof onMapClick === 'function' ? onMapClick : undefined;
  const handleCircleCenterDrag = typeof onCircleCenterDrag === 'function' 
    ? (e) => {
        try {
          onCircleCenterDrag(e);
        } catch (error) {
          console.error('Error handling circle drag:', error);
        }
      }
    : undefined;

  try {
    return (
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        key={`map-${mapCenter[0]}-${mapCenter[1]}`}
      >
      <MapController 
        geofenceType={geofenceType} 
        onMapClick={handleMapClick}
        center={center}
        zoom={zoom}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Center Marker */}
      {circleCenter && circleCenter.latitude && circleCenter.longitude && (
        <Marker
          position={[circleCenter.latitude, circleCenter.longitude]}
          draggable={geofenceType === 'circle'}
          eventHandlers={handleCircleCenterDrag ? {
            dragend: handleCircleCenterDrag,
          } : {}}
        />
      )}

      {/* Circle Geofence */}
      {geofenceType === 'circle' && circleCenter && circleRadius && (
        <Circle
          center={[circleCenter.latitude, circleCenter.longitude]}
          radius={parseFloat(circleRadius)}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          }}
        />
      )}

      {/* Polygon Geofence */}
      {geofenceType === 'polygon' && polygonPoints && polygonPoints.length > 0 && (
        <Polygon
          positions={polygonPoints.map((p) => [p.latitude, p.longitude])}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          }}
        />
      )}
      </MapContainer>
    );
  } catch (error) {
    console.error('Error rendering LeafletMap:', error);
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Error loading map</p>
          <p className="text-xs text-muted-foreground">Please refresh the page</p>
        </div>
      </div>
    );
  }
}

