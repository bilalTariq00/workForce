'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Use vanilla Leaflet instead of react-leaflet to avoid Context API issues
// This is equivalent to the vanilla Leaflet setup from the docs
const VanillaLeafletMapComponent = dynamic(
  () => import('./VanillaLeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function MapWrapper(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure we're fully on client side before rendering map
    setMounted(true);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return <VanillaLeafletMapComponent {...props} />;
}

