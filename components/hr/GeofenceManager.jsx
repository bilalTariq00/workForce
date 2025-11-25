'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed RadioGroup import - using native radio inputs instead to avoid Context issues
import { MapPin, Loader2, Save, X, Edit2 } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import MapWrapper from './MapWrapper';

/**
 * GeofenceManager Component
 * 
 * Allows HR/Admin to:
 * 1. Enter an address and geocode it to get coordinates
 * 2. Choose geofence type (circle or polygon)
 * 3. Draw/edit geofence on map
 * 4. Save geofence configuration
 */
export default function GeofenceManager({ 
  siteId, 
  initialGeofence = null, 
  initialLocation = null,
  initialAddress = null,
  onSave,
  onCancel,
  onLocationChange = null, // Callback when coordinates change
}) {
  const [geofenceType, setGeofenceType] = useState(initialGeofence?.type || 'circle');
  const [address, setAddress] = useState(initialAddress || '');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [center, setCenter] = useState(
    initialGeofence?.center || initialLocation || { latitude: 51.5074, longitude: -0.1278 }
  );
  const [radius, setRadius] = useState(initialGeofence?.radius || 100);
  const [polygon, setPolygon] = useState(initialGeofence?.polygon || []);
  const [mapCenter, setMapCenter] = useState([center.latitude, center.longitude]);
  const [mapZoom, setMapZoom] = useState(15);
  const [editingPolygon, setEditingPolygon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const lastNotifiedLocationRef = useRef(null); // Track last notified location to prevent infinite loops

  // Update map center when center changes
  useEffect(() => {
    if (center && center.latitude && center.longitude) {
      setMapCenter([center.latitude, center.longitude]);
      
      // Notify parent component of coordinate changes (only if coordinates actually changed)
      if (onLocationChange && typeof onLocationChange === 'function') {
        const currentLocation = `${center.latitude},${center.longitude}`;
        const lastLocation = lastNotifiedLocationRef.current;
        
        // Only notify if coordinates have actually changed
        if (currentLocation !== lastLocation) {
          lastNotifiedLocationRef.current = currentLocation;
          onLocationChange({
            latitude: center.latitude,
            longitude: center.longitude,
          });
        }
      }
    }
  }, [center?.latitude, center?.longitude]); // Only depend on actual coordinate values, not the callback

  // Reverse geocode coordinates to get readable address
  const fetchAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    setLoadingAddress(true);
    try {
      const response = await fetch('/api/v1/geocoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.formattedAddress) {
        setFormattedAddress(result.data.formattedAddress);
        // Also update the address input if it's empty
        if (!address.trim()) {
          setAddress(result.data.formattedAddress);
        }
      } else {
        setFormattedAddress('');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setFormattedAddress('');
    } finally {
      setLoadingAddress(false);
    }
  };

  // Fetch address when center coordinates change (only on initial load or when explicitly needed)
  // Skip automatic fetching if user is actively typing or has set an address
  useEffect(() => {
    // Only fetch address automatically on initial load (when initialLocation is provided)
    // For other cases, address will be fetched explicitly (e.g., when dragging marker)
    if (initialLocation && center && center.latitude === initialLocation.latitude && center.longitude === initialLocation.longitude) {
      if (!formattedAddress && !loadingAddress) {
        fetchAddressFromCoordinates(center.latitude, center.longitude);
      }
    }
  }, []); // Only run once on mount

  // Handle address selection from autocomplete
  const handleAddressSelect = async (suggestion) => {
    if (!suggestion) return;

    setGeocoding(true);
    setGeocodingError('');

    try {
      // Use the coordinates from the suggestion
      setCenter({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
      setMapCenter([suggestion.latitude, suggestion.longitude]);
      setMapZoom(16);
      
      // Set the formatted address from suggestion
      if (suggestion.displayName || suggestion.formattedAddress) {
        setFormattedAddress(suggestion.displayName || suggestion.formattedAddress);
        setAddress(suggestion.displayName || suggestion.formattedAddress);
      }
      
      setGeocodingError('');
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to set location. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  // Get current location using browser geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeocodingError('Geolocation is not supported by your browser.');
      return;
    }

    setGeocoding(true);
    setGeocodingError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Set the location on the map
          setCenter({ latitude, longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(16);

          // Reverse geocode to get the address
          const response = await fetch('/api/v1/geocoding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: latitude,
              longitude: longitude,
            }),
          });

          const result = await response.json();

          if (result.success && result.data?.formattedAddress) {
            setFormattedAddress(result.data.formattedAddress);
            setAddress(result.data.formattedAddress);
          }

          setGeocodingError('');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Location is still set, just address lookup failed
          setGeocodingError('Location found, but could not get address details.');
        } finally {
          setGeocoding(false);
        }
      },
      (error) => {
        setGeocoding(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeocodingError('Location access denied. Please enable location permissions in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeocodingError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setGeocodingError('Location request timed out. Please try again.');
            break;
          default:
            setGeocodingError('An error occurred while getting your location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Geocode address (manual geocode button)
  const handleGeocode = async () => {
    // If no address is entered, try to get current location
    if (!address.trim()) {
      handleGetCurrentLocation();
      return;
    }

    setGeocoding(true);
    setGeocodingError('');

    try {
      const response = await fetch('/api/v1/geocoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setCenter({
          latitude: result.data.latitude,
          longitude: result.data.longitude,
        });
        setMapCenter([result.data.latitude, result.data.longitude]);
        setMapZoom(16);
        
        // Set the formatted address
        if (result.data.formattedAddress) {
          setFormattedAddress(result.data.formattedAddress);
        }
        
        setGeocodingError('');
      } else {
        const errorMsg = result.error?.message || 'Failed to geocode address';
        // Provide helpful suggestions for common errors
        if (errorMsg.includes('not found') || errorMsg.includes('Address not found')) {
          setGeocodingError(
            `${errorMsg} Try a simpler search like "E-8 Markaz Rawalpindi" or "Saidpur Road Rawalpindi".`
          );
        } else {
          setGeocodingError(errorMsg);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Failed to geocode address. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  // Handle map click for polygon editing
  const handleMapClick = (e) => {
    if (geofenceType === 'polygon' && editingPolygon) {
      const { lat, lng } = e.latlng;
      setPolygon([...polygon, { latitude: lat, longitude: lng }]);
      // Optionally fetch address for the clicked location
      // fetchAddressFromCoordinates(lat, lng);
    }
  };

  // Handle circle center drag
  const handleCircleCenterDrag = (e) => {
    if (geofenceType === 'circle') {
      const { lat, lng } = e.target.getLatLng();
      setCenter({ latitude: lat, longitude: lng });
      // Fetch address for the new location when marker is dragged
      fetchAddressFromCoordinates(lat, lng);
    }
  };

  // Save geofence
  const handleSave = () => {
    if (geofenceType === 'circle') {
      if (!center || !radius) {
        setGeocodingError('Circle geofence requires center and radius');
        return;
      }
      onSave({
        type: 'circle',
        center,
        radius: parseFloat(radius),
      });
    } else if (geofenceType === 'polygon') {
      if (polygon.length < 3) {
        setGeocodingError('Polygon geofence requires at least 3 points');
        return;
      }
      onSave({
        type: 'polygon',
        polygon,
      });
    }
  };

  // Reset polygon
  const handleResetPolygon = () => {
    setPolygon([]);
    setEditingPolygon(false);
  };

  return (
    <div className="space-y-4">
      {/* Address Input with Autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="address">Site Address</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <AddressAutocomplete
              value={address}
              onChange={(value) => setAddress(value)}
              onSelect={handleAddressSelect}
              placeholder="Start typing address... (e.g., 123 Main St, London)"
              disabled={geocoding}
            />
          </div>
          <Button
            type="button"
            onClick={handleGeocode}
            disabled={geocoding}
            variant="outline"
            className="flex-shrink-0"
            title={address.trim() ? 'Geocode address' : 'Get current location'}
          >
            {geocoding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {address.trim() ? 'Geocoding...' : 'Getting location...'}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {address.trim() ? 'Find' : 'Use My Location'}
              </>
            )}
          </Button>
        </div>
        {geocodingError && (
          <p className="text-sm text-red-600">{geocodingError}</p>
        )}
        {center && (
          <div className="space-y-1">
            {loadingAddress ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading address...
              </p>
            ) : formattedAddress ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  📍 {formattedAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  Coordinates: {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Coordinates: {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          💡 Tip: Start typing to see address suggestions, click "Find" to geocode an address, or click "Use My Location" to get your current location
        </p>
      </div>

      {/* Geofence Type Selection */}
      <div className="space-y-2">
        <Label>Geofence Type</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="circle"
              name="geofenceType"
              value="circle"
              checked={geofenceType === 'circle'}
              onChange={(e) => {
                if (e.target.checked) {
                  setGeofenceType('circle');
                  setPolygon([]);
                  setEditingPolygon(false);
                }
              }}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <Label htmlFor="circle" className="font-normal cursor-pointer">
              Circle (radius-based)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="polygon"
              name="geofenceType"
              value="polygon"
              checked={geofenceType === 'polygon'}
              onChange={(e) => {
                if (e.target.checked) {
                  setGeofenceType('polygon');
                  setRadius(100);
                }
              }}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <Label htmlFor="polygon" className="font-normal cursor-pointer">
              Polygon (custom shape)
            </Label>
          </div>
        </div>
      </div>

      {/* Circle Configuration */}
      {geofenceType === 'circle' && (
        <div className="space-y-2">
          <Label htmlFor="radius">Radius (meters)</Label>
          <Input
            id="radius"
            type="number"
            min="10"
            max="1000"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>
      )}

      {/* Polygon Configuration */}
      {geofenceType === 'polygon' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Polygon Points ({polygon.length})</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingPolygon(!editingPolygon)}
              >
                {editingPolygon ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Stop Editing
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Start Drawing
                  </>
                )}
              </Button>
              {polygon.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetPolygon}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          {editingPolygon && (
            <p className="text-xs text-muted-foreground">
              Click on the map to add points to the polygon. At least 3 points required.
            </p>
          )}
        </div>
      )}

      {/* Map */}
      <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapWrapper
          center={mapCenter}
          zoom={mapZoom}
          geofenceType={geofenceType}
          circleCenter={center}
          circleRadius={radius}
          polygonPoints={polygon}
          onMapClick={handleMapClick}
          onCircleCenterDrag={handleCircleCenterDrag}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || (geofenceType === 'circle' && (!center || !radius)) || (geofenceType === 'polygon' && polygon.length < 3)}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Geofence
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

