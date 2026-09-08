import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Alert, Tag } from 'antd';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

let optionsConfigured = false;

const toCoordinate = (lat, lng) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng };
};

const getTrackCoordinates = (track) => (track.coordinates || [])
  .map(point => toCoordinate(point?.lat, point?.lng))
  .filter(Boolean);

// Direct Google Maps script tag loader fallback
function loadGoogleMapsScriptFallback(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      return resolve(window.google.maps);
    }
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * GISGoogleMap Component
 * High-performance Google Maps viewport with full railway track geometry polylines,
 * station nodes, role-filtered department defect markers, and live train tracking.
 */
export const GISGoogleMap = ({
  division = 'Chennai',
  zone = 'Southern Railway',
  userRole = 'TMS',
  tracks = [],
  stations = [],
  defects = [],
  liveTrain = null,
  activeLayers = ['tracks', 'stations', 'defects', 'trains'],
  mapStyle = 'roadmap',
  onTrackSelect,
  onDefectSelect,
  onStationSelect,
  onTrainSelect,
  onStatusChange,
  resetTrigger
}) => {
  const googleMapRef = useRef(null);
  const leafletMapRef = useRef(null);

  const mapInstanceRef = useRef(null);
  const leafletInstanceRef = useRef(null);
  const mapsLibRef = useRef(null);
  const coreLibRef = useRef(null);
  const markerLibRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Overlay Trackers
  const googlePolylinesRef = useRef([]);
  const googleDefectMarkersRef = useRef([]);
  const googleStationMarkersRef = useRef([]);
  const googleTrainMarkerRef = useRef(null);
  const leafletLayersRef = useRef([]);
  const leafletTrainMarkerRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [useLeaflet, setUseLeaflet] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(10);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Handle Google Maps auth error
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[GIS Map] Google Maps API key auth failed. Switching to OpenStreetMap GIS View.');
      setUseLeaflet(true);
      setLoading(false);
      if (onStatusChange) onStatusChange('FALLBACK');
    };
  }, [onStatusChange]);

  // Safe helper to get Marker constructor
  const getMarkerClass = useCallback(() => {
    return (
      markerLibRef.current?.Marker ||
      window.google?.maps?.Marker ||
      mapsLibRef.current?.Marker
    );
  }, []);

  // Safe helper to get LatLngBounds constructor
  const getLatLngBoundsClass = useCallback(() => {
    return (
      window.google?.maps?.LatLngBounds ||
      coreLibRef.current?.LatLngBounds ||
      mapsLibRef.current?.LatLngBounds
    );
  }, []);

  // Safe helper to get Polyline constructor
  const getPolylineClass = useCallback(() => {
    return (
      mapsLibRef.current?.Polyline ||
      window.google?.maps?.Polyline
    );
  }, []);

  // Safe helper to get SymbolPath
  const getSymbolPath = useCallback(() => {
    return (
      window.google?.maps?.SymbolPath ||
      mapsLibRef.current?.SymbolPath ||
      coreLibRef.current?.SymbolPath
    );
  }, []);

  // Compute default center from tracks or stations or fallback
  const getDivisionCenter = useCallback(() => {
    const stationCoordinates = (stations || [])
      .map(station => toCoordinate(station?.lat, station?.lng))
      .filter(Boolean);
    if (stationCoordinates.length > 0) {
      const avgLat = stationCoordinates.reduce((sum, point) => sum + point.lat, 0) / stationCoordinates.length;
      const avgLng = stationCoordinates.reduce((sum, point) => sum + point.lng, 0) / stationCoordinates.length;
      return { lat: avgLat, lng: avgLng };
    }
    const firstTrackCoordinates = tracks?.flatMap(getTrackCoordinates) || [];
    if (firstTrackCoordinates.length > 0) {
      return firstTrackCoordinates[Math.floor(firstTrackCoordinates.length / 2)];
    }
    const divCoords = {
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Lucknow': { lat: 26.8467, lng: 80.9462 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Madurai': { lat: 9.9252, lng: 78.1198 },
      'Salem': { lat: 11.6643, lng: 78.1460 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Secunderabad': { lat: 17.4334, lng: 78.5017 },
      'Bengaluru': { lat: 12.9782, lng: 77.5695 },
      'Howrah': { lat: 22.5830, lng: 88.3426 },
      'Mumbai CR': { lat: 18.9400, lng: 72.8354 }
    };
    return divCoords[division] || { lat: 13.0827, lng: 80.2707 };
  }, [division, stations, tracks]);

  // 1. Initialize Google Maps
  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey.trim() === '') {
      setUseLeaflet(true);
      setLoading(false);
      if (onStatusChange) onStatusChange('FALLBACK');
      return;
    }

    setLoading(true);
    if (onStatusChange) onStatusChange('LOADING');

    const initMaps = async () => {
      try {
        if (!optionsConfigured && typeof setOptions === 'function') {
          try {
            setOptions({ key: apiKey, v: 'weekly' });
            optionsConfigured = true;
          } catch (e) {}
        }

        let mapsLib, markerLib, coreLib;
        try {
          if (typeof importLibrary === 'function') {
            mapsLib = await importLibrary('maps');
            coreLib = await importLibrary('core').catch(() => null);
            markerLib = await importLibrary('marker').catch(() => null);
          } else {
            mapsLib = await loadGoogleMapsScriptFallback(apiKey);
          }
        } catch (e) {
          mapsLib = await loadGoogleMapsScriptFallback(apiKey);
        }

        mapsLibRef.current = mapsLib || window.google?.maps;
        coreLibRef.current = coreLib || window.google?.maps;
        markerLibRef.current = markerLib || window.google?.maps;

        const center = getDivisionCenter();
        const MapClass = mapsLibRef.current?.Map || window.google?.maps?.Map;
        const InfoWindowClass = mapsLibRef.current?.InfoWindow || window.google?.maps?.InfoWindow;

        if (!MapClass) {
          throw new Error('Google Maps loaded without a map constructor');
        }

        if (googleMapRef.current && !mapInstanceRef.current) {
          const map = new MapClass(googleMapRef.current, {
            center,
            zoom: 10,
            mapTypeId: mapStyle,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            tilt: 0
          });

          mapInstanceRef.current = map;
          if (InfoWindowClass) {
            infoWindowRef.current = new InfoWindowClass();
          }

          map.addListener('zoom_changed', () => {
            const z = map.getZoom();
            if (z !== undefined) setCurrentZoom(z);
          });
        }

        setLoading(false);
        if (onStatusChange) onStatusChange('CONNECTED');
      } catch (err) {
        console.warn('[GIS Google Maps] Switching to OpenStreetMap fallback:', err);
        setUseLeaflet(true);
        setLoading(false);
        if (onStatusChange) onStatusChange('FALLBACK');
      }
    };

    initMaps();
  }, [apiKey, getDivisionCenter, mapStyle, onStatusChange]);

  // 2. Map Style Switch
  useEffect(() => {
    if (mapInstanceRef.current && !useLeaflet) {
      mapInstanceRef.current.setMapTypeId(mapStyle);
    }
  }, [mapStyle, useLeaflet]);

  // Fit Bounds Helper
  const fitDivisionBounds = useCallback(() => {
    const LatLngBoundsClass = getLatLngBoundsClass();
    const map = mapInstanceRef.current;

    if (!useLeaflet && map && LatLngBoundsClass) {
      const bounds = new LatLngBoundsClass();
      let count = 0;

      if (tracks && tracks.length > 0) {
        tracks.forEach(t => {
          getTrackCoordinates(t).forEach(pt => {
            bounds.extend(pt);
            count++;
          });
        });
      }

      if (stations && stations.length > 0) {
        stations.forEach(s => {
          const point = toCoordinate(s.lat, s.lng);
          if (point) {
            bounds.extend(point);
            count++;
          }
        });
      }

      if (defects && defects.length > 0) {
        defects.forEach(d => {
          const point = toCoordinate(d.latitude, d.longitude);
          if (point) {
            bounds.extend(point);
            count++;
          }
        });
      }

      if (count > 0) {
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      } else {
        map.panTo(getDivisionCenter());
        map.setZoom(10);
      }
    }

    if (useLeaflet && leafletInstanceRef.current) {
      const lmap = leafletInstanceRef.current;
      const points = [];

      if (tracks && tracks.length > 0) {
        tracks.forEach(t => {
          getTrackCoordinates(t).forEach(pt => points.push([pt.lat, pt.lng]));
        });
      }
      if (stations && stations.length > 0) {
        stations.forEach(s => {
          const point = toCoordinate(s.lat, s.lng);
          if (point) points.push([point.lat, point.lng]);
        });
      }
      if (defects && defects.length > 0) {
        defects.forEach(d => {
          const point = toCoordinate(d.latitude, d.longitude);
          if (point) points.push([point.lat, point.lng]);
        });
      }

      if (points.length > 0) {
        lmap.fitBounds(points, { padding: [40, 40] });
      } else {
        const c = getDivisionCenter();
        lmap.setView([c.lat, c.lng], 10);
      }
    }
  }, [tracks, stations, defects, useLeaflet, getDivisionCenter, getLatLngBoundsClass]);

  // Handle reset trigger or division change
  useEffect(() => {
    fitDivisionBounds();
  }, [resetTrigger, division, fitDivisionBounds]);

  // Clear Overlays
  const clearGoogleOverlays = useCallback(() => {
    googlePolylinesRef.current.forEach(p => p.setMap(null));
    googlePolylinesRef.current = [];

    googleStationMarkersRef.current.forEach(m => { if (m.setMap) m.setMap(null); });
    googleStationMarkersRef.current = [];

    googleDefectMarkersRef.current.forEach(m => { if (m.setMap) m.setMap(null); });
    googleDefectMarkersRef.current = [];

    if (googleTrainMarkerRef.current) {
      googleTrainMarkerRef.current.setMap(null);
      googleTrainMarkerRef.current = null;
    }
  }, []);

  const clearLeafletOverlays = useCallback(() => {
    if (!leafletInstanceRef.current) return;
    leafletLayersRef.current.forEach(layer => {
      leafletInstanceRef.current.removeLayer(layer);
    });
    leafletLayersRef.current = [];
    if (leafletTrainMarkerRef.current) {
      leafletInstanceRef.current.removeLayer(leafletTrainMarkerRef.current);
      leafletTrainMarkerRef.current = null;
    }
  }, []);

  // 3. Render Google Maps Overlays
  const renderGoogleOverlays = useCallback(() => {
    if (!mapInstanceRef.current || useLeaflet) return;

    clearGoogleOverlays();

    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    const MarkerClass = getMarkerClass();
    const PolylineClass = getPolylineClass();
    const symbolPathObj = getSymbolPath();
    const circleSymbol = symbolPathObj?.CIRCLE !== undefined ? symbolPathObj.CIRCLE : 0;

    // LAYER 1: Railway Tracks (Google Maps Dual-Layer Polylines)
    // Verified corridors render as solid navy/blue; divisions without
    // curated geometry render as dashed amber "approximate" segments so the
    // map never implies survey-grade accuracy it doesn't have.
    if (activeLayers.includes('tracks') && tracks && tracks.length > 0 && PolylineClass) {
      tracks.forEach(track => {
        const path = getTrackCoordinates(track);
        if (path.length < 2) return;
        const isApproximate = track.dataQuality === 'approximate';
        const coreColor = isApproximate ? '#d97706' : '#0284c7';
        const coreHoverColor = isApproximate ? '#f59e0b' : '#38bdf8';
        const dashIcon = isApproximate
          ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '14px' }]
          : undefined;

        // Outer track casing (dark navy border)
        const casing = new PolylineClass({
          path,
          geodesic: true,
          strokeColor: '#0f172a',
          strokeOpacity: isApproximate ? 0.5 : 0.9,
          strokeWeight: isApproximate ? 5 : 7,
          zIndex: 10,
          map: map
        });

        // Inner track core (vibrant high-contrast railway blue, or amber+dashed if approximate)
        const core = new PolylineClass({
          path,
          geodesic: true,
          strokeColor: isApproximate ? undefined : coreColor,
          strokeOpacity: isApproximate ? 0 : 1.0,
          strokeWeight: isApproximate ? 0 : 4,
          icons: dashIcon,
          zIndex: 11,
          map: map
        });

        core.addListener('mouseover', () => {
          if (isApproximate) {
            core.setOptions({ icons: [{ ...dashIcon[0], icon: { ...dashIcon[0].icon, scale: 4 } }] });
          } else {
            core.setOptions({ strokeColor: coreHoverColor, strokeWeight: 5 });
          }
        });
        core.addListener('mouseout', () => {
          if (isApproximate) {
            core.setOptions({ icons: dashIcon });
          } else {
            core.setOptions({ strokeColor: coreColor, strokeWeight: 4 });
          }
        });

        const handleTrackClick = (e) => {
          if (onTrackSelect) onTrackSelect(track);

          if (infoWindow) {
            infoWindow.setContent(`
              <div style="padding: 10px; font-family: sans-serif; color: #0f172a; max-width: 290px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-weight: 800; color: ${coreColor}; font-size: 13px;">${track.name}</span>
                  <span style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${track.status || 'Active'}</span>
                </div>
                <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Track ID: <span style="font-family: monospace; font-weight: bold;">${track.trackId}</span></div>
                <div style="margin-bottom: 6px;">
                  <span style="background: ${isApproximate ? '#fef3c7' : '#dcfce7'}; color: ${isApproximate ? '#b45309' : '#15803d'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                    ${isApproximate ? 'APPROXIMATE (station-to-station)' : 'VERIFIED CORRIDOR'}
                  </span>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
                <div style="font-size: 12px; line-height: 1.6; color: #334155;">
                  <div><strong>Division:</strong> ${track.division} (${track.zone})</div>
                  <div><strong>Corridor:</strong> ${track.sourceStationName} &rarr; ${track.destStationName}</div>
                  <div><strong>Track Type:</strong> ${track.trackType}</div>
                  <div><strong>Electrification:</strong> ${track.electrification}</div>
                  <div><strong>Line Speed:</strong> ${track.maxSpeedKm ? track.maxSpeedKm + ' km/h' : 'Not verified'} | <strong>Length:</strong> ${track.distanceKm} km</div>
                  <div><strong>Precision Waypoints:</strong> ${track.pointCount || track.coordinates?.length || 0} coordinates</div>
                </div>
              </div>
            `);
            infoWindow.setPosition(e.latLng);
            infoWindow.open(map);
          }
        };

        casing.addListener('click', handleTrackClick);
        core.addListener('click', handleTrackClick);

        googlePolylinesRef.current.push(casing, core);
      });
    }

    // LAYER 2: Railway Stations
    if (activeLayers.includes('stations') && stations && stations.length > 0 && MarkerClass) {
      stations.forEach(station => {
        const position = toCoordinate(station.lat, station.lng);
        if (!position) return;
        const marker = new MarkerClass({
          position,
          map,
          title: `${station.name} (${station.code})`,
          icon: {
            path: circleSymbol,
            scale: 6,
            fillColor: '#0f172a',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        marker.addListener('click', () => {
          if (onStationSelect) onStationSelect(station);

          if (infoWindow) {
            infoWindow.setContent(`
              <div style="padding: 8px; font-family: sans-serif; color: #0f172a;">
                <div style="font-weight: 800; font-size: 13px; color: #1e3a8a;">
                  ${station.name} (<span style="font-family: monospace;">${station.code}</span>)
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  ${station.stationType} &bull; ${station.division} Division
                </div>
              </div>
            `);
            infoWindow.setPosition({ lat: station.lat, lng: station.lng });
            infoWindow.open(map);
          }
        });

        googleStationMarkersRef.current.push(marker);
      });
    }

    // LAYER 3: Infrastructure Defects (Role-Filtered, merged across TMS/SMMS/TDMS by the backend)
    if (activeLayers.includes('defects') && defects && defects.length > 0 && MarkerClass) {
      defects.forEach(defect => {
        const position = toCoordinate(defect.latitude, defect.longitude);
        if (!position) return;
        let color = '#3b82f6';
        const sev = String(defect.severityLevel || defect.severity || '').toUpperCase();
        if (sev.includes('CRITICAL')) color = '#dc2626';
        else if (sev.includes('HIGH')) color = '#ea580c';
        else if (sev.includes('MEDIUM')) color = '#eab308';

        const marker = new MarkerClass({
          position,
          map,
          title: `Defect ${defect.defectId} - ${defect.defectType}`,
          zIndex: 999,
          icon: {
            path: circleSymbol,
            scale: 9,
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: 2.5,
            strokeColor: '#ffffff'
          }
        });

        marker.addListener('click', () => {
          if (onDefectSelect) onDefectSelect(defect);

          if (infoWindow) {
            infoWindow.setContent(`
              <div style="padding: 10px; font-family: sans-serif; color: #0f172a; max-width: 290px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-weight: 800; font-size: 13px; color: ${color}; font-family: monospace;">
                    ${defect.defectId}
                  </span>
                  <span style="background: ${color}20; color: ${color}; font-size: 10px; font-weight: 700; padding: 2px 6px; borderRadius: 4px;">
                    ${defect.severityLevel}
                  </span>
                </div>
                <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 6px;">
                  ${defect.defectType}
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
                <div style="font-size: 12px; line-height: 1.6; color: #334155;">
                  <div><strong>Department:</strong> ${defect.deptLabel || defect.department}</div>
                  <div><strong>Location:</strong> KM ${defect.chainageKm} (${defect.station1} &rarr; ${defect.station2})</div>
                  <div><strong>Coordinates:</strong> ${defect.latitude.toFixed(4)}&deg; N, ${defect.longitude.toFixed(4)}&deg; E</div>
                  <div><strong>Status:</strong> ${defect.status}</div>
                  <div><strong>Work Duration:</strong> ${defect.workDurationHrs} Hours</div>
                  <div><strong>Reported:</strong> ${defect.reportedDate}</div>
                </div>
              </div>
            `);
            infoWindow.setPosition({ lat: defect.latitude, lng: defect.longitude });
            infoWindow.open(map);
          }
        });

        googleDefectMarkersRef.current.push(marker);
      });
    }

    // LAYER 4: Live Train Marker (Independent from track network)
    if (activeLayers.includes('trains') && liveTrain && liveTrain.lat && liveTrain.lng && MarkerClass) {
      const position = toCoordinate(liveTrain.lat, liveTrain.lng);
      if (!position) return;
      const trainMarker = new MarkerClass({
        position,
        map,
        title: `Train ${liveTrain.trainNumber} - ${liveTrain.trainName}`,
        zIndex: 1000,
        icon: {
          path: circleSymbol,
          scale: 11,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: '#ffffff'
        }
      });

      trainMarker.addListener('click', () => {
        if (onTrainSelect) onTrainSelect(liveTrain);

        if (infoWindow) {
          infoWindow.setContent(`
            <div style="padding: 10px; font-family: sans-serif; color: #0f172a; max-width: 280px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #059669; font-size: 13px;">🚆 ${liveTrain.trainNumber}</span>
                <span style="background: #ecfdf5; color: #059669; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">LIVE</span>
              </div>
              <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 4px;">${liveTrain.trainName}</div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 6px 0;" />
              <div style="font-size: 12px; line-height: 1.6; color: #334155;">
                <div><strong>Speed:</strong> ${liveTrain.speed || 0} km/h</div>
                <div><strong>Delay:</strong> ${liveTrain.delayMinutes ? liveTrain.delayMinutes + ' min' : 'On Time'}</div>
                <div><strong>Current Station:</strong> ${liveTrain.currentLocation?.stationName || 'En Route'}</div>
                <div><strong>Status:</strong> ${liveTrain.status || 'RUNNING'}</div>
              </div>
            </div>
          `);
          infoWindow.setPosition({ lat: liveTrain.lat, lng: liveTrain.lng });
          infoWindow.open(map);
        }
      });

      googleTrainMarkerRef.current = trainMarker;
    }
  }, [activeLayers, tracks, stations, defects, liveTrain, useLeaflet, getMarkerClass, getPolylineClass, getSymbolPath, onTrackSelect, onStationSelect, onDefectSelect, onTrainSelect, clearGoogleOverlays]);

  // Execute Overlay Rendering on State Changes
  useEffect(() => {
    renderGoogleOverlays();
  }, [renderGoogleOverlays]);

  // 4. Leaflet / OpenStreetMap Fallback Engine
  useEffect(() => {
    if (!useLeaflet) return;

    const center = getDivisionCenter();

    if (leafletMapRef.current && !leafletInstanceRef.current) {
      const lmap = L.map(leafletMapRef.current).setView([center.lat, center.lng], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | PRAGATI-RAIL GIS Engine',
        maxZoom: 18
      }).addTo(lmap);

      leafletInstanceRef.current = lmap;

      lmap.on('zoomend', () => {
        setCurrentZoom(lmap.getZoom());
      });

      requestAnimationFrame(() => lmap.invalidateSize());
      lmap.once('load', () => lmap.invalidateSize());
    }

    if (leafletInstanceRef.current) {
      clearLeafletOverlays();
      const lmap = leafletInstanceRef.current;

      // Leaflet Tracks (Dual-layer railway styling; dashed amber = approximate)
      if (activeLayers.includes('tracks') && tracks && tracks.length > 0) {
        tracks.forEach(track => {
          const latLngs = getTrackCoordinates(track).map(point => [point.lat, point.lng]);
          if (latLngs.length < 2) return;
          const isApproximate = track.dataQuality === 'approximate';
          const coreColor = isApproximate ? '#d97706' : '#0284c7';

          const casing = L.polyline(latLngs, {
            color: '#0f172a',
            weight: isApproximate ? 5 : 7,
            opacity: isApproximate ? 0.5 : 0.9
          }).addTo(lmap);

          const core = L.polyline(latLngs, {
            color: coreColor,
            weight: 4,
            opacity: 1.0,
            dashArray: isApproximate ? '8, 8' : null
          }).addTo(lmap);

          const popupContent = `
            <div style="font-family: sans-serif; padding: 4px;">
              <strong style="color: ${coreColor}; font-size: 13px;">${track.name}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">Track ID: ${track.trackId}</span><br/>
              <span style="display:inline-block; margin-top:4px; background: ${isApproximate ? '#fef3c7' : '#dcfce7'}; color: ${isApproximate ? '#b45309' : '#15803d'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                ${isApproximate ? 'APPROXIMATE (station-to-station)' : 'VERIFIED CORRIDOR'}
              </span><br/>
              <span style="font-size: 12px; color: #334155;">Type: ${track.trackType} | Speed: ${track.maxSpeedKm ? track.maxSpeedKm + ' km/h' : 'n/a'} | Length: ${track.distanceKm} km</span>
            </div>
          `;

          core.bindPopup(popupContent);
          core.on('click', () => {
            if (onTrackSelect) onTrackSelect(track);
          });
          casing.on('click', () => {
            if (onTrackSelect) onTrackSelect(track);
          });

          leafletLayersRef.current.push(casing, core);
        });
      }

      // Leaflet Stations
      if (activeLayers.includes('stations') && stations && stations.length > 0) {
        stations.forEach(station => {
          const position = toCoordinate(station.lat, station.lng);
          if (!position) return;
          const marker = L.circleMarker([position.lat, position.lng], {
            radius: 5,
            fillColor: '#0f172a',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(lmap);

          marker.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong>${station.name} (${station.code})</strong><br/>
              <span style="font-size: 11px;">${station.stationType} &bull; ${station.division} Division</span>
            </div>
          `);

          marker.on('click', () => {
            if (onStationSelect) onStationSelect(station);
          });

          leafletLayersRef.current.push(marker);
        });
      }

      // Leaflet Defects
      if (activeLayers.includes('defects') && defects && defects.length > 0) {
        defects.forEach(defect => {
          const position = toCoordinate(defect.latitude, defect.longitude);
          if (!position) return;
          let color = '#3b82f6';
          const sev = String(defect.severityLevel || defect.severity || '').toUpperCase();
          if (sev.includes('CRITICAL')) color = '#dc2626';
          else if (sev.includes('HIGH')) color = '#ea580c';
          else if (sev.includes('MEDIUM')) color = '#eab308';

          const marker = L.circleMarker([position.lat, position.lng], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1
          }).addTo(lmap);

          marker.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="color: ${color};">${defect.defectId} - ${defect.defectType}</strong><br/>
              <span style="font-size: 11px;">Department: ${defect.deptLabel || defect.department} | Severity: ${defect.severityLevel}</span>
            </div>
          `);

          marker.on('click', () => {
            if (onDefectSelect) onDefectSelect(defect);
          });

          leafletLayersRef.current.push(marker);
        });
      }

      // Leaflet Live Train
      if (activeLayers.includes('trains') && liveTrain && liveTrain.lat && liveTrain.lng) {
        const position = toCoordinate(liveTrain.lat, liveTrain.lng);
        if (!position) return;
        const marker = L.circleMarker([position.lat, position.lng], {
          radius: 10,
          fillColor: '#10b981',
          color: '#ffffff',
          weight: 3,
          fillOpacity: 1
        }).addTo(lmap);

        marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="color: #059669;">🚆 ${liveTrain.trainNumber} - ${liveTrain.trainName}</strong><br/>
            <span>Speed: ${liveTrain.speed || 0} km/h | Status: ${liveTrain.status}</span>
          </div>
        `);

        marker.on('click', () => {
          if (onTrainSelect) onTrainSelect(liveTrain);
        });

        leafletTrainMarkerRef.current = marker;
      }
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined' && leafletMapRef.current
      ? new ResizeObserver(() => leafletInstanceRef.current?.invalidateSize())
      : null;
    if (resizeObserver && leafletMapRef.current) resizeObserver.observe(leafletMapRef.current);

    return () => resizeObserver?.disconnect();
  }, [useLeaflet, activeLayers, tracks, stations, defects, liveTrain, getDivisionCenter, clearLeafletOverlays, onTrackSelect, onStationSelect, onDefectSelect, onTrainSelect]);

  useEffect(() => () => {
    leafletInstanceRef.current?.remove();
    leafletInstanceRef.current = null;
    mapInstanceRef.current = null;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '620px', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--ir-border)' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Spin size="large" tip="Loading GIS infrastructure map..." />
        </div>
      )}

      {useLeaflet ? (
        <div ref={leafletMapRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <div ref={googleMapRef} style={{ width: '100%', height: '100%' }} />
      )}

      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#f8fafc',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 11,
        fontFamily: 'sans-serif',
        zIndex: 500,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, color: '#38bdf8' }}>
          GIS Map Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 4, background: '#0284c7', border: '1px solid #0f172a', borderRadius: 2 }}></span>
            <span>Verified Track (Corridor)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 0, borderTop: '3px dashed #d97706' }}></span>
            <span>Approximate Track (station-to-station)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f172a', border: '1.5px solid #ffffff' }}></span>
            <span>Station Node</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', border: '1.5px solid #ffffff' }}></span>
            <span>Critical Defect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', border: '1.5px solid #ffffff' }}></span>
            <span>High Severity Defect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', border: '1.5px solid #ffffff' }}></span>
            <span>Medium / Low Defect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1.5px solid #ffffff' }}></span>
            <span>Live Train Position</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISGoogleMap;