# Geofencing Implementation for Attendance

## Overview
This document describes the geofencing system implemented for attendance tracking. The system allows HR/Admin to set up geofences (circular or polygonal) for sites using addresses, and validates employee location when marking attendance.

## Features

### 1. Geocoding Service
- **Location**: `lib/utils/geocoding.js`
- **Purpose**: Converts addresses to GPS coordinates
- **Service**: Uses Nominatim (OpenStreetMap) - free, no API key required
- **Functions**:
  - `geocodeAddress(address)` - Geocode a full address string
  - `geocodeStructuredAddress(address)` - Geocode from structured address object
  - `reverseGeocode(lat, lng)` - Get address from coordinates

### 2. Geofence Utilities
- **Location**: `lib/utils/geofence.js`
- **Purpose**: Check if a point is within a geofence
- **Functions**:
  - `isPointInCircle(point, center, radius)` - Check if point is in circle
  - `isPointInPolygon(point, polygon)` - Check if point is in polygon (ray casting algorithm)
  - `isPointInGeofence(point, geofence)` - Universal function for both types

### 3. Site Model Updates
- **Location**: `lib/models/Site.js`
- **New Field**: `geofence` (optional)
  ```javascript
  geofence: {
    type: 'circle' | 'polygon',
    // For circle:
    center: { latitude, longitude },
    radius: Number, // meters
    // For polygon:
    polygon: [{ latitude, longitude }, ...] // Array of vertices
  }
  ```
- **Backward Compatibility**: If no geofence is set, system falls back to `attendanceRadius` circle

### 4. Geocoding API
- **Endpoint**: `/api/v1/geocoding`
- **Method**: POST
- **Access**: HR Officers, Admin, Site Managers
- **Request Body**:
  ```json
  {
    "address": "123 Main St, London, UK, SW1A 1AA"
  }
  ```
  OR
  ```json
  {
    "structuredAddress": {
      "street": "123 Main St",
      "city": "London",
      "postcode": "SW1A 1AA",
      "country": "UK"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "latitude": 51.5074,
      "longitude": -0.1278,
      "formattedAddress": "123 Main St, London, UK"
    }
  }
  ```

### 5. Geofence Manager Component
- **Location**: `components/hr/GeofenceManager.jsx`
- **Purpose**: Interactive map-based geofence configuration
- **Features**:
  - Address geocoding
  - Circle geofence (drag center, adjust radius)
  - Polygon geofence (click to add points)
  - Visual map display with Leaflet
  - Save/Cancel functionality

### 6. Integration with Site Forms
- **CreateSiteForm**: Added "Setup Geofence" button
- **EditSiteModal**: Can be added similarly
- **Workflow**:
  1. Enter site address
  2. Click "Setup Geofence"
  3. Geocode address (or enter coordinates manually)
  4. Choose geofence type (circle or polygon)
  5. Configure geofence on map
  6. Save geofence

### 7. Attendance Validation
- **Location**: `app/api/v1/attendance/mark/route.js`
- **Logic**:
  1. Find nearest site to user location
  2. Check if site has geofence configured
  3. If geofence exists, use `isPointInGeofence()`
  4. If no geofence, fallback to radius check (backward compatibility)
  5. Reject attendance if outside geofence

## Usage

### For HR/Admin: Setting Up Geofences

1. **Navigate to Sites Page** (`/hr/sites`)
2. **Create or Edit a Site**
3. **Enter Site Address** (street, city, postcode)
4. **Click "Setup Geofence"** button
5. **Geocode Address**:
   - Enter full address in the address field
   - Click "Find" to geocode
   - Map will center on the location
6. **Choose Geofence Type**:
   - **Circle**: Simple radius-based geofence
     - Adjust radius slider/input
     - Drag center marker to adjust
   - **Polygon**: Custom shape geofence
     - Click "Start Drawing"
     - Click on map to add points
     - At least 3 points required
     - Click "Stop Editing" when done
7. **Save Geofence**: Click "Save Geofence"
8. **Complete Site Creation/Update**

### For Employees: Marking Attendance

1. Employee logs in
2. System checks if attendance marked today
3. If not, redirects to `/attendance/scan`
4. Employee scans QR code
5. System:
   - Gets employee GPS location
   - Finds nearest site
   - Checks if location is within geofence
   - If yes: Marks attendance ✅
   - If no: Shows error with distance ⚠️

## Technical Details

### Geofence Types

#### Circle Geofence
- **Use Case**: Simple, uniform sites
- **Configuration**: Center point + radius
- **Validation**: Distance from center ≤ radius

#### Polygon Geofence
- **Use Case**: Irregular site boundaries
- **Configuration**: Array of vertices (minimum 3)
- **Validation**: Point-in-polygon algorithm (ray casting)

### Backward Compatibility

- Sites without geofence configuration still work
- System uses `attendanceRadius` as circle geofence
- Existing sites don't need immediate update

### Map Library

- **Leaflet**: Open-source mapping library
- **react-leaflet**: React bindings for Leaflet
- **Tile Provider**: OpenStreetMap (free)

## API Endpoints

### Geocoding
- `POST /api/v1/geocoding` - Geocode address or reverse geocode coordinates

### Site Management
- `POST /api/v1/sites` - Create site (includes geofence)
- `PATCH /api/v1/sites/:id` - Update site (includes geofence)
- `GET /api/v1/sites` - Get all sites (includes geofence)

### Attendance
- `POST /api/v1/attendance/mark` - Mark attendance (validates geofence)

## Error Handling

### Geocoding Errors
- Address not found → User-friendly error message
- API rate limits → Retry with delay
- Network errors → Retry button

### Geofence Validation Errors
- Outside geofence → Shows distance and required area
- Invalid geofence → Falls back to radius check
- No geofence → Uses attendanceRadius

## Future Enhancements

1. **Multiple Geofences per Site**: Support for multiple zones
2. **Geofence Templates**: Pre-defined shapes (rectangle, etc.)
3. **Geofence History**: Track changes over time
4. **Visual Feedback**: Show geofence on attendance scan page
5. **Geofence Analytics**: Track attendance patterns by location

## Dependencies

```json
{
  "leaflet": "^1.x.x",
  "react-leaflet": "^5.x.x",
  "@radix-ui/react-radio-group": "^1.x.x"
}
```

## Notes

- Nominatim (geocoding service) has rate limits: 1 request per second
- For production, consider using a paid geocoding service (Google Maps, Mapbox)
- Leaflet requires CSS import: `import 'leaflet/dist/leaflet.css'`
- Default marker icons need to be configured for Next.js


