import React, { useEffect, useRef } from 'react';
import { Card, Tag } from 'antd';
import L from 'leaflet';

// Known station coordinates for common Indian Railways junctions
const STATION_COORDS = {
  'MAS': [13.0827, 80.2707],
  'AJJ': [13.0837, 79.6688],
  'KPD': [12.9702, 79.1367],
  'JTJ': [12.5694, 78.5794],
  'SA': [11.6643, 78.1460],
  'ED': [11.3410, 77.7172],
  'TUP': [11.1085, 77.3411],
  'CBE': [11.0016, 76.9629],
  'PGT': [10.7867, 76.6548],
  'SRR': [10.7410, 76.2750],
  'TIR': [10.9167, 75.9228],
  'CLT': [11.2480, 75.7839],
  'BDJ': [11.6094, 75.5906],
  'TLY': [11.7483, 75.4894],
  'CAN': [11.8745, 75.3704],
  'PAY': [12.0984, 75.2014],
  'NLE': [12.2536, 75.1278],
  'KZE': [12.3528, 75.0903],
  'KGQ': [12.4996, 74.9869],
  'MAQ': [12.8634, 74.8432],
  'NDLS': [28.6415, 77.2197],
  'CNB': [26.4547, 80.3507],
  'LKO': [26.8317, 80.9234],
  'BSB': [25.3267, 82.9863],
  'GKP': [26.7588, 83.3813],
  'BPL': [23.2599, 77.4126],
  'JHS': [25.4484, 78.5685],
  'MMCT': [18.9696, 72.8193],
  'HWH': [22.5830, 88.3426],
  'SBC': [12.9781, 77.5696],
  'HYB': [17.3927, 78.4711],
  'SC': [17.4334, 78.5042]
};

export const LiveTrainGeoMap = ({ liveData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers and route line
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current || !liveData) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const { route = [], currentLocation, trainNumber, trainName, speed, delayMinutes } = liveData;

    // Build route points with coordinates
    const srcLat = liveData.source?.lat;
    const srcLng = liveData.source?.lng;
    const destLat = liveData.destination?.lat;
    const destLng = liveData.destination?.lng;

    const latLngs = [];
    const validStations = [];

    route.forEach((st, idx) => {
      let lat = st.lat || STATION_COORDS[st.stationCode]?.[0];
      let lng = st.lng || STATION_COORDS[st.stationCode]?.[1];

      // Interpolate if missing and source/dest available
      if ((!lat || !lng) && srcLat && destLat) {
        const ratio = idx / Math.max(1, route.length - 1);
        lat = srcLat + (destLat - srcLat) * ratio;
        lng = srcLng + (destLng - srcLng) * ratio;
      }

      if (lat && lng) {
        const point = [lat, lng];
        latLngs.push(point);
        validStations.push({ ...st, point, idx });

        // Add station circle marker for halts
        if (st.isHalt || idx === 0 || idx === route.length - 1) {
          const isCurrent = st.stationCode === currentLocation?.stationCode;
          const marker = L.circleMarker(point, {
            radius: isCurrent ? 8 : 5,
            fillColor: isCurrent ? '#0284c7' : '#1e293b',
            color: isCurrent ? '#bae6fd' : '#ffffff',
            weight: isCurrent ? 3 : 2,
            opacity: 1,
            fillOpacity: 0.9
          });

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <strong>${st.stationName} (${st.stationCode})</strong><br/>
              Distance: ${st.distance} km<br/>
              Platform: ${st.platform || '1'}<br/>
              ${st.scheduledArrival ? `Arrival: ${new Date(st.scheduledArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Origin'}
            </div>
          `);

          layerGroup.addLayer(marker);
        }
      }
    });

    // Draw route polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        dashArray: '2, 6'
      }).addTo(layerGroup);

      // Fit map to route
      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // Place Live Train Marker with exact geocoded position
    let trainPos = null;
    if (typeof currentLocation?.lat === 'number' && typeof currentLocation?.lng === 'number' && !isNaN(currentLocation.lat) && !isNaN(currentLocation.lng)) {
      trainPos = [currentLocation.lat, currentLocation.lng];
    } else if (currentLocation?.stationCode && STATION_COORDS[currentLocation.stationCode]) {
      trainPos = STATION_COORDS[currentLocation.stationCode];
    } else if (validStations.length > 0) {
      const currIdx = liveData.currentStationIndex || 0;
      const st = validStations[Math.min(currIdx, validStations.length - 1)];
      if (st) trainPos = st.point;
    }

    if (trainPos) {
      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="
            background: #1e3a8a;
            color: #ffffff;
            border: 2px solid #38bdf8;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
            transform: translate(-50%, -50%);
          ">
            🚆
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const trainMarker = L.marker(trainPos, { icon: trainIcon });
      trainMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 150px;">
          <strong style="color: #1e3a8a;">🚆 ${trainNumber} - ${trainName}</strong><br/>
          <strong>Location:</strong> ${currentLocation?.stationName || 'In Transit'}<br/>
          <strong>Speed:</strong> ${speed} km/h<br/>
          <strong>Delay:</strong> ${delayMinutes > 0 ? `+${delayMinutes} min` : 'On Time'}
        </div>
      `);
      layerGroup.addLayer(trainMarker);
      trainMarker.openPopup();
    }
  }, [liveData]);

  return (
    <Card
      bodyStyle={{ padding: 0 }}
      style={{ borderRadius: 10, border: '1px solid var(--ir-border)', overflow: 'hidden' }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: 420 }} />
    </Card>
  );
};
