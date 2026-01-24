/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 * 
 * CRITICAL: SDK Loading Pattern (MUST use this exact approach)
 * ============================================================
 * 
 * ❌ WRONG: script.src = url  (gets blocked by ad blockers)
 * ✅ CORRECT: fetch(url).then(text => script.textContent = text)
 * 
 * const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
 * const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL;
 * const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;
 * 
 * const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization`;
 * 
 * fetch(scriptUrl, { headers: { 'Origin': window.location.origin } })
 *   .then(r => r.text())
 *   .then(content => {
 *     const script = document.createElement('script');
 *     script.textContent = content;  // NOT script.src!
 *     document.head.appendChild(script);
 *     // Poll for window.google.maps availability
 *   });
 * 
 * Available Libraries:
 * - places: PlacesService, AutocompleteService
 * - drawing: DrawingManager (markers, polygons, circles, polylines, rectangles)
 * - geometry: distance/area calculations
 * - visualization: HeatmapLayer
 * 
 * Common Services (initialize after map creation):
 * - new google.maps.places.PlacesService(map)
 * - new google.maps.Geocoder()
 * - new google.maps.DirectionsService()
 * - new google.maps.DistanceMatrixService()
 * - new google.maps.ElevationService()
 * - new google.maps.drawing.DrawingManager(options)
 * 
 * Layers:
 * - new google.maps.TrafficLayer()
 * - new google.maps.TransitLayer()
 * - new google.maps.BicyclingLayer()
 * - new google.maps.visualization.HeatmapLayer({ data: [] })
 */

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL || "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

interface MarkerConfig {
  position: { lat: number; lng: number };
  title?: string;
  draggable?: boolean;
  onClick?: (marker: any, event: any) => void;
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  markers?: MarkerConfig[];
  onClick?: (event: { lat: number; lng: number }) => void;
  onMapReady?: (map: any) => void;
}

export function MapView({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  className = "w-full h-[500px]",
  markers = [],
  onClick,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (!window.google) {
      const scriptUrl = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&libraries=places,drawing,geometry,visualization,marker`;

      fetch(scriptUrl, {
        method: 'GET',
        headers: { 'Origin': window.location.origin },
      })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.text();
        })
        .then(scriptContent => {
          const script = document.createElement('script');
          script.textContent = scriptContent;
          document.head.appendChild(script);

          const checkGoogle = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkGoogle);
              initMap();
            }
          }, 100);

          setTimeout(() => clearInterval(checkGoogle), 10000);
        })
        .catch(error => console.error('Failed to fetch Google Maps script:', error));
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainer.current || !window.google || map.current) return;

      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom,
        center,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: 'DEMO_MAP_ID',
      });

      // Add click event listener to the map
      map.current.addListener('click', (event: any) => {
        if (onClickRef.current) {
          onClickRef.current({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        }
      });

      if (onMapReady) {
        onMapReady(map.current);
      }
    }
  }, []);

  useEffect(() => {
    if (map.current) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    markers.forEach(markerConfig => {
      const marker = new window.google.maps.Marker({
        position: markerConfig.position,
        map: map.current,
        title: markerConfig.title,
        draggable: markerConfig.draggable ?? false,
      });

      if (markerConfig.onClick) {
        marker.addListener('click', (event: any) => {
          markerConfig.onClick!(marker, event);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  return <div ref={mapContainer} className={className} />;
}
