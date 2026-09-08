import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Spin, Alert, Button } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import L from 'leaflet';
import {
  DIVISION_MAP_CONFIGS,
  GIS_DEFECTS,
  GIS_MAINTENANCE_BLOCKS,
  GIS_SIMULATED_TRAINS
} from '../../mock/gisData';

// Track setOptions initialization globally to avoid warning
let optionsConfigured = false;

// Dynamic script loader fallback
const loadGoogleMapsScriptFallback = (key) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }
    const existing = document.getElementById('google-maps-js-sdk');
    if (existing) {
      let checks = 0;
      const timer = setInterval(() => {
        checks++;
        if (window.google && window.google.maps) {
          clearInterval(timer);
          resolve(window.google.maps);
        } else if (checks > 50) {
          clearInterval(timer);
          reject(new Error('Google Maps script load timeout'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps not found on window object'));
      }
    };
    script.onerror = (err) => reject(new Error('Failed to load Google Maps script tag'));
    document.head.appendChild(script);
  });
};

/**
 * GoogleMapsViewport Component
 * 
 * Interactive Google Maps JavaScript API view using functional importLibrary('maps') and importLibrary('marker')
 * with automatic OpenStreetMap / Leaflet GIS fallback.
 */
export const GoogleMapsViewport = ({
  selectedDivision = 'DLI',
  activeLayers = ['track', 'signal', 'ohe', 'trains', 'defects', 'blocks'],
  mapStyle = 'roadmap',
  onStatusChange,
  onNodeSelected,
  resetTrigger
}) => {
  // DOM Container Refs
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Map Instance Refs
  const mapInstanceRef = useRef(null);
  const leafletInstanceRef = useRef(null);
  const mapsLibRef = useRef(null);
  const markerLibRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Overlay Trackers
  const googlePolylinesRef = useRef([]);
  const googleMarkersRef = useRef([]);
  const leafletLayersRef = useRef([]);

  // States
  const [loading, setLoading] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [useLeaflet, setUseLeaflet] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Listen for Google Maps Authentication Failures (e.g. key domain restrictions, unenabled API)
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[Google Maps Auth Warning] Google Maps API key authentication failed. Switching to OpenStreetMap GIS view.');
      setUseLeaflet(true);
      setLoading(false);
      if (onStatusChange) onStatusChange('CONNECTED');
    };
  }, [onStatusChange]);

  // Safe helper to get Marker constructor across version variants
  const getMarkerClass = useCallback(() => {
    return (
      markerLibRef.current?.Marker ||
      window.google?.maps?.Marker ||
      mapsLibRef.current?.Marker
    );
  }, []);

  // 1. Initialize Google Maps API cleanly
  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.trim() === '') {
      setApiKeyMissing(true);
      setUseLeaflet(true);
      setLoading(false);
      if (onStatusChange) onStatusChange('API_KEY_REQUIRED');
      return;
    }

    setApiKeyMissing(false);
    setLoading(true);
    if (onStatusChange) onStatusChange('LOADING');

    const initMaps = async () => {
      try {
        if (!optionsConfigured && typeof setOptions === 'function') {
          try {
            setOptions({ key: apiKey, v: 'weekly' });
            optionsConfigured = true;
          } catch (e) {
            // Already set
          }
        }

        let mapsLib, markerLib;
        try {
          if (typeof importLibrary === 'function') {
            mapsLib = await importLibrary('maps');
            markerLib = await importLibrary('marker').catch(() => null);
          } else {
            mapsLib = await loadGoogleMapsScriptFallback(apiKey);
          }
        } catch (e) {
          console.warn('importLibrary failed, using fallback script:', e);
          mapsLib = await loadGoogleMapsScriptFallback(apiKey);
        }

        mapsLibRef.current = mapsLib || window.google?.maps;
        markerLibRef.current = markerLib || window.google?.maps;

        const config = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

        if (googleMapRef.current && !mapInstanceRef.current && mapsLibRef.current) {
          const map = new mapsLibRef.current.Map(googleMapRef.current, {
            center: config.center,
            zoom: config.zoom,
            mapTypeId: mapStyle,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            tilt: 0
          });

          mapInstanceRef.current = map;
          infoWindowRef.current = new mapsLibRef.current.InfoWindow();

          map.addListener('zoom_changed', () => {
            const z = map.getZoom();
            if (z !== undefined) setCurrentZoom(z);
          });
        }

        setLoading(false);
        if (onStatusChange) onStatusChange('CONNECTED');
      } catch (err) {
        console.warn('[Google Maps Loader Fallback] Switching to OpenStreetMap GIS View:', err);
        setUseLeaflet(true);
        setLoading(false);
        if (onStatusChange) onStatusChange('CONNECTED');
      }
    };

    initMaps();
  }, [apiKey]);

  // 2. Handle Google Maps Map Style changes
  useEffect(() => {
    if (mapInstanceRef.current && mapsLibRef.current && !useLeaflet) {
      mapInstanceRef.current.setMapTypeId(mapStyle);
    }
  }, [mapStyle, useLeaflet]);

  // 3. Handle Division change -> update center and zoom
  useEffect(() => {
    const config = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

    if (mapInstanceRef.current && !useLeaflet) {
      mapInstanceRef.current.panTo(config.center);
      mapInstanceRef.current.setZoom(config.zoom);
      setCurrentZoom(config.zoom);
    }

    if (leafletInstanceRef.current && useLeaflet) {
      leafletInstanceRef.current.setView([config.center.lat, config.center.lng], config.zoom);
      setCurrentZoom(config.zoom);
    }
  }, [selectedDivision, useLeaflet]);

  // 4. Handle Reset Viewport trigger
  useEffect(() => {
    if (resetTrigger) {
      const config = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

      if (mapInstanceRef.current && !useLeaflet) {
        mapInstanceRef.current.panTo(config.center);
        mapInstanceRef.current.setZoom(config.zoom);
        setCurrentZoom(config.zoom);
        if (infoWindowRef.current) infoWindowRef.current.close();
      }

      if (leafletInstanceRef.current && useLeaflet) {
        leafletInstanceRef.current.setView([config.center.lat, config.center.lng], config.zoom);
        setCurrentZoom(config.zoom);
      }
    }
  }, [resetTrigger, selectedDivision, useLeaflet]);

  // Clear Google Maps Overlays
  const clearGoogleOverlays = useCallback(() => {
    googlePolylinesRef.current.forEach((p) => p.setMap(null));
    googlePolylinesRef.current = [];

    googleMarkersRef.current.forEach((m) => {
      if (m.setMap) m.setMap(null);
    });
    googleMarkersRef.current = [];
  }, []);

  // Clear Leaflet Overlays
  const clearLeafletOverlays = useCallback(() => {
    if (!leafletInstanceRef.current) return;
    leafletLayersRef.current.forEach((layer) => {
      leafletInstanceRef.current.removeLayer(layer);
    });
    leafletLayersRef.current = [];
  }, []);

  // 5. Render Google Maps Overlays
  const renderGoogleOverlays = useCallback(() => {
    if (!mapInstanceRef.current || !mapsLibRef.current || useLeaflet) return;

    clearGoogleOverlays();

    const map = mapInstanceRef.current;
    const mapsLib = mapsLibRef.current;
    const infoWindow = infoWindowRef.current;
    const divConfig = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

    // Track Geometry Polylines
    if (activeLayers.includes('track') && divConfig.corridors) {
      divConfig.corridors.forEach((corridor) => {
        const polyline = new mapsLib.Polyline({
          path: corridor.path,
          geodesic: true,
          strokeColor: corridor.color || '#0284c7',
          strokeOpacity: 0.85,
          strokeWeight: corridor.strokeWeight || 5,
          map: map
        });

        polyline.addListener('click', (e) => {
          const latLngStr = `${e.latLng.lat().toFixed(4)}° N, ${e.latLng.lng().toFixed(4)}° E`;
          if (onNodeSelected) {
            onNodeSelected({
              id: corridor.id,
              name: `${corridor.name} (${corridor.type})`,
              department: 'Engineering (TMS)',
              status: 'Operational',
              activeBlock: 'None',
              currentDefects: 1,
              lastScanDate: '2026-09-02 18:00',
              geoCoordinates: latLngStr,
              activeSpeedRestriction: 'Normal Speed (130 km/h)'
            });
          }

          infoWindow.setContent(`
            <div style="padding: 8px; font-family: sans-serif; color: #0f172a;">
              <div style="font-weight: 700; color: #0284c7; font-size: 13px;">${corridor.name}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Prototype Railway Corridor Geometry</div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
              <div style="font-size: 12px;"><strong>Type:</strong> ${corridor.type}</div>
              <div style="font-size: 12px;"><strong>Division:</strong> ${selectedDivision}</div>
            </div>
          `);
          infoWindow.setPosition(e.latLng);
          infoWindow.open(map);
        });

        googlePolylinesRef.current.push(polyline);
      });
    }

    // Defects
    if (activeLayers.includes('defects')) {
      const divDefects = GIS_DEFECTS.filter((d) => d.division === selectedDivision || selectedDivision === 'DLI');
      const MarkerClass = getMarkerClass();

      if (MarkerClass) {
        divDefects.forEach((defect) => {
          let color = '#3b82f6';
          if (defect.severity === 'Critical') color = '#dc2626';
          else if (defect.severity === 'High') color = '#f97316';
          else if (defect.severity === 'Medium') color = '#eab308';

          const marker = new MarkerClass({
            position: { lat: defect.lat, lng: defect.lng },
            map,
            title: defect.defectId,
            icon: {
              path: mapsLib.SymbolPath ? mapsLib.SymbolPath.CIRCLE : 0,
              scale: 9,
              fillColor: color,
              fillOpacity: 0.95,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });

          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 10px; font-family: sans-serif; color: #0f172a; max-width: 250px;">
                <div style="font-weight: 800; font-size: 13px; color: ${color}; margin-bottom: 4px;">
                  DEFECT ${defect.defectId} (${defect.severity.toUpperCase()})
                </div>
                <div style="font-size: 12px; line-height: 1.6; color: #334155;">
                  <div><strong>Section:</strong> ${defect.section}</div>
                  <div><strong>Chainage:</strong> ${defect.chainage}</div>
                  <div><strong>Asset:</strong> ${defect.assetType}</div>
                  <div><strong>Severity:</strong> ${defect.severity}</div>
                  <div><strong>Department:</strong> ${defect.department}</div>
                  <div><strong>Status:</strong> ${defect.status}</div>
                </div>
              </div>
            `);
            infoWindow.setPosition({ lat: defect.lat, lng: defect.lng });
            infoWindow.open(map);

            if (onNodeSelected) {
              onNodeSelected({
                id: defect.defectId,
                name: `${defect.assetType} - ${defect.defectType}`,
                department: defect.department,
                status: defect.status,
                activeBlock: defect.status === 'Merged Joint Block' ? 'JB-NDLS-CNB-01' : 'None',
                currentDefects: 1,
                lastScanDate: '2026-09-02',
                geoCoordinates: `${defect.lat}° N, ${defect.lng}° E`,
                activeSpeedRestriction: defect.severity === 'Critical' ? '30 km/h' : '60 km/h'
              });
            }
          });

          googleMarkersRef.current.push(marker);
        });
      }
    }

    // Maintenance Blocks
    if (activeLayers.includes('blocks')) {
      const divBlocks = GIS_MAINTENANCE_BLOCKS.filter((b) => b.division === selectedDivision || selectedDivision === 'DLI');
      divBlocks.forEach((block) => {
        const poly = new mapsLib.Polyline({
          path: block.path,
          geodesic: true,
          strokeColor: '#9333ea',
          strokeOpacity: 0.65,
          strokeWeight: 9,
          map: map
        });
        googlePolylinesRef.current.push(poly);
      });
    }

    // Trains
    if (activeLayers.includes('trains')) {
      const divTrains = GIS_SIMULATED_TRAINS.filter((t) => t.division === selectedDivision || selectedDivision === 'DLI');
      const MarkerClass = getMarkerClass();

      if (MarkerClass) {
        divTrains.forEach((train) => {
          const marker = new MarkerClass({
            position: { lat: train.lat, lng: train.lng },
            map,
            title: `Train ${train.trainNumber}`,
            icon: {
              path: mapsLib.SymbolPath ? mapsLib.SymbolPath.FORWARD_CLOSED_ARROW : 1,
              scale: 5,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });

          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 10px; font-family: sans-serif; color: #0f172a; max-width: 250px;">
                <div style="font-weight: 800; font-size: 13px; color: #059669; margin-bottom: 2px;">
                  Train ${train.trainName} (${train.trainNumber})
                </div>
                <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 6px;">
                  SIMULATED TRAIN POSITIONS
                </div>
                <div style="font-size: 12px; line-height: 1.6; color: #334155;">
                  <div><strong>Train Number:</strong> ${train.trainNumber}</div>
                  <div><strong>Direction:</strong> ${train.direction}</div>
                  <div><strong>Current Section:</strong> ${train.currentSection}</div>
                  <div><strong>Speed:</strong> ${train.speedKm} km/h</div>
                  <div><strong>Status:</strong> ${train.status}</div>
                </div>
              </div>
            `);
            infoWindow.setPosition({ lat: train.lat, lng: train.lng });
            infoWindow.open(map);
          });

          googleMarkersRef.current.push(marker);
        });
      }
    }
  }, [selectedDivision, activeLayers, useLeaflet, onNodeSelected, getMarkerClass, clearGoogleOverlays]);

  // 6. Initialize & Render OpenStreetMap / Leaflet Engine
  useEffect(() => {
    if (!useLeaflet) return;

    const config = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

    if (leafletMapRef.current && !leafletInstanceRef.current) {
      const lmap = L.map(leafletMapRef.current).setView([config.center.lat, config.center.lng], config.zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | PRAGATI-RAIL GIS Engine',
        maxZoom: 18
      }).addTo(lmap);

      leafletInstanceRef.current = lmap;

      lmap.on('zoomend', () => {
        setCurrentZoom(lmap.getZoom());
      });
    }

    if (leafletInstanceRef.current) {
      clearLeafletOverlays();

      const lmap = leafletInstanceRef.current;
      const divConfig = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

      // Leaflet Track Geometry Polylines
      if (activeLayers.includes('track') && divConfig.corridors) {
        divConfig.corridors.forEach((corridor) => {
          const latLngs = corridor.path.map((pt) => [pt.lat, pt.lng]);
          const polyline = L.polyline(latLngs, {
            color: corridor.color || '#0284c7',
            weight: corridor.strokeWeight || 5,
            opacity: 0.85
          }).addTo(lmap);

          polyline.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="color:#0284c7;">${corridor.name}</strong><br/>
              <span style="font-size:11px; color:#64748b;">Prototype Railway Corridor Geometry</span><br/>
              <span style="font-size:12px;">Type: ${corridor.type}</span>
            </div>
          `);

          polyline.on('click', () => {
            if (onNodeSelected) {
              onNodeSelected({
                id: corridor.id,
                name: `${corridor.name} (${corridor.type})`,
                department: 'Engineering (TMS)',
                status: 'Operational',
                activeBlock: 'None',
                currentDefects: 1,
                lastScanDate: '2026-09-02 18:00',
                geoCoordinates: `${corridor.path[0].lat}° N, ${corridor.path[0].lng}° E`,
                activeSpeedRestriction: 'Normal Speed (130 km/h)'
              });
            }
          });

          leafletLayersRef.current.push(polyline);
        });
      }

      // Leaflet Defects
      if (activeLayers.includes('defects')) {
        const divDefects = GIS_DEFECTS.filter((d) => d.division === selectedDivision || selectedDivision === 'DLI');
        divDefects.forEach((defect) => {
          let color = '#3b82f6';
          if (defect.severity === 'Critical') color = '#dc2626';
          else if (defect.severity === 'High') color = '#f97316';
          else if (defect.severity === 'Medium') color = '#eab308';

          const marker = L.circleMarker([defect.lat, defect.lng], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(lmap);

          marker.bindPopup(`
            <div style="font-family: sans-serif; max-width:220px;">
              <strong style="color:${color};">DEFECT ${defect.defectId}</strong> (${defect.severity.toUpperCase()})<br/>
              <div style="font-size:12px; margin-top:4px;">
                <strong>Section:</strong> ${defect.section}<br/>
                <strong>Chainage:</strong> ${defect.chainage}<br/>
                <strong>Asset:</strong> ${defect.assetType}<br/>
                <strong>Department:</strong> ${defect.department}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onNodeSelected) {
              onNodeSelected({
                id: defect.defectId,
                name: `${defect.assetType} - ${defect.defectType}`,
                department: defect.department,
                status: defect.status,
                activeBlock: defect.status === 'Merged Joint Block' ? 'JB-NDLS-CNB-01' : 'None',
                currentDefects: 1,
                lastScanDate: '2026-09-02',
                geoCoordinates: `${defect.lat}° N, ${defect.lng}° E`,
                activeSpeedRestriction: defect.severity === 'Critical' ? '30 km/h' : '60 km/h'
              });
            }
          });

          leafletLayersRef.current.push(marker);
        });
      }

      // Leaflet Maintenance Blocks
      if (activeLayers.includes('blocks')) {
        const divBlocks = GIS_MAINTENANCE_BLOCKS.filter((b) => b.division === selectedDivision || selectedDivision === 'DLI');
        divBlocks.forEach((block) => {
          const latLngs = block.path.map((pt) => [pt.lat, pt.lng]);
          const poly = L.polyline(latLngs, {
            color: '#9333ea',
            weight: 9,
            opacity: 0.65
          }).addTo(lmap);

          poly.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="color:#9333ea;">INTEGRATED BLOCK</strong><br/>
              <span style="font-size:12px;">Window: ${block.window} (${block.durationHours} hrs)</span><br/>
              <span style="font-size:11px; color:#6b21a8; font-weight:600;">Status: AI-Assisted Recommendation</span>
            </div>
          `);

          leafletLayersRef.current.push(poly);
        });
      }

      // Leaflet Simulated Trains
      if (activeLayers.includes('trains')) {
        const divTrains = GIS_SIMULATED_TRAINS.filter((t) => t.division === selectedDivision || selectedDivision === 'DLI');
        divTrains.forEach((train) => {
          const trainMarker = L.circleMarker([train.lat, train.lng], {
            radius: 7,
            fillColor: '#10b981',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(lmap);

          trainMarker.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="color:#059669;">Train ${train.trainName} (${train.trainNumber})</strong><br/>
              <span style="font-size:10px; color:#64748b; font-weight:bold;">SIMULATED TRAIN POSITIONS</span><br/>
              <span style="font-size:12px;">Speed: ${train.speedKm} km/h | Status: ${train.status}</span>
            </div>
          `);

          leafletLayersRef.current.push(trainMarker);
        });
      }
    }
  }, [useLeaflet, selectedDivision, activeLayers, clearLeafletOverlays, onNodeSelected]);

  // Trigger Google overlays when dependencies change
  useEffect(() => {
    renderGoogleOverlays();
  }, [renderGoogleOverlays, selectedDivision, activeLayers, mapStyle]);

  // Focus Corridor action
  const handleFocusCorridor = () => {
    const divConfig = DIVISION_MAP_CONFIGS[selectedDivision] || DIVISION_MAP_CONFIGS.DLI;

    if (!useLeaflet && mapInstanceRef.current && mapsLibRef.current) {
      if (divConfig.corridors && divConfig.corridors.length > 0) {
        const bounds = new mapsLibRef.current.LatLngBounds();
        divConfig.corridors[0].path.forEach((pt) => bounds.extend(pt));
        mapInstanceRef.current.fitBounds(bounds);
      }
    }

    if (useLeaflet && leafletInstanceRef.current && divConfig.corridors && divConfig.corridors.length > 0) {
      const latLngs = divConfig.corridors[0].path.map((pt) => [pt.lat, pt.lng]);
      leafletInstanceRef.current.fitBounds(latLngs);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 520 }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#38bdf8', fontWeight: 600, fontSize: 14 }}>
            Initializing GIS Infrastructure Viewport...
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Ingesting corridor geometry for {selectedDivision} Division
          </div>
        </div>
      )}

      {/* Google Maps DOM Container */}
      <div
        ref={googleMapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          display: useLeaflet ? 'none' : 'block'
        }}
      />

      {/* Leaflet / OpenStreetMap Fallback DOM Container */}
      <div
        ref={leafletMapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          display: useLeaflet ? 'block' : 'none'
        }}
      />

      {/* Top-Right Map Focus Action */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 8 }}>
        <Button
          size="small"
          type="primary"
          icon={<CompassOutlined />}
          style={{ background: 'rgba(15, 23, 42, 0.85)', borderColor: 'rgba(255,255,255,0.2)' }}
          onClick={handleFocusCorridor}
        >
          Focus Corridor
        </Button>
      </div>

      {/* Bottom-Left Compact Map Status Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 11,
          color: '#cbd5e1',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        <div>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>MAP ENGINE:</span>{' '}
          <strong style={{ color: useLeaflet ? '#38bdf8' : '#4ade80' }}>
            {useLeaflet ? 'OpenStreetMap GIS' : 'Google Maps'}
          </strong>
        </div>
        <div>Zoom: <strong>{currentZoom}</strong></div>
        <div>Division: <strong style={{ color: '#38bdf8' }}>{selectedDivision}</strong></div>
        <div>
          Layers: <strong style={{ color: '#f59e0b' }}>{activeLayers.length} Active</strong>
        </div>
      </div>
    </div>
  );
};