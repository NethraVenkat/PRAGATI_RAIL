import React, { useRef, useState, useMemo } from 'react';
import { Card, Tag, Tooltip, Button, Segmented, Space, Badge, Progress } from 'antd';
import {
  AimOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  CompassOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

export const LiveTrainTrackSchematic = ({ liveData }) => {
  const scrollRef = useRef(null);
  const [routeMode, setRouteMode] = useState('active-corridor'); // 'active-corridor' | 'full-route'

  if (!liveData) return null;

  const {
    trainNumber,
    trainName,
    status,
    speed = 0,
    delayMinutes = 0,
    currentLocation = {},
    previousHalt,
    nextHalt,
    route = [],
    direction,
    currentStationIndex = 0,
    totalDistance = 0
  } = liveData;

  const currentStCode = (currentLocation?.stationCode || '').toUpperCase();
  const currentStName = currentLocation?.stationName || 'En-Route';
  const currentSequence = Number(currentLocation?.sequence ?? (currentStationIndex + 1));
  const segmentProgress = Number(currentLocation?.segmentProgress ?? 0);
  const distanceFromLastKm = Number(currentLocation?.distanceFromLastStationKm ?? 0);
  const distanceFromOriginKm = Number(currentLocation?.distanceFromOriginKm ?? 0);
  const isAtStation = currentLocation?.status === 'at-station' || currentLocation?.status === 'arrived' || (segmentProgress === 0 && distanceFromLastKm === 0);

  // Exact resolved index of current position in full route
  const resolvedCurrentIndex = useMemo(() => {
    let idx = -1;
    if (currentSequence) {
      idx = route.findIndex(r => Number(r.sequence) === currentSequence);
    }
    if (idx === -1 && currentStCode) {
      idx = route.findIndex(r => r.stationCode?.toUpperCase() === currentStCode);
    }
    if (idx === -1) {
      idx = currentStationIndex >= 0 ? currentStationIndex : 0;
    }
    return idx;
  }, [route, currentSequence, currentStCode, currentStationIndex]);

  // Build display route: ensures exact current station, adjacent block stations, and key halts are preserved
  const displayRoute = useMemo(() => {
    if (route.length === 0) return [];

    if (routeMode === 'full-route' || route.length <= 16) {
      return route;
    }

    // 'active-corridor' mode: include origin, destination, all halts, plus the exact current station, previous block station, and next block station
    const selectedIndices = new Set([
      0,
      route.length - 1,
      resolvedCurrentIndex - 1,
      resolvedCurrentIndex,
      resolvedCurrentIndex + 1
    ]);

    route.forEach((st, idx) => {
      if (st.isHalt) {
        selectedIndices.add(idx);
      }
      if (previousHalt?.stationCode && st.stationCode === previousHalt.stationCode) {
        selectedIndices.add(idx);
      }
      if (nextHalt?.stationCode && st.stationCode === nextHalt.stationCode) {
        selectedIndices.add(idx);
      }
    });

    const sortedIndices = Array.from(selectedIndices)
      .filter(idx => idx >= 0 && idx < route.length)
      .sort((a, b) => a - b);

    return sortedIndices.map(idx => route[idx]);
  }, [route, routeMode, resolvedCurrentIndex, previousHalt, nextHalt]);

  // Precompute per-node states in displayRoute
  const stationStates = useMemo(() => {
    return displayRoute.map((st, dIdx) => {
      const seq = Number(st.sequence);
      const isExactCurrent = st.stationCode?.toUpperCase() === currentStCode || seq === currentSequence;
      const isPast = !isExactCurrent && seq < currentSequence;
      const isUpcoming = !isPast && !isExactCurrent;

      return {
        ...st,
        isPast,
        isExactCurrent,
        isUpcoming,
        displayIndex: dIdx
      };
    });
  }, [displayRoute, currentStCode, currentSequence]);

  // Auto-scroll to center active train position marker
  const centerOnTrain = () => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.live-train-active-marker') ||
                       scrollRef.current.querySelector('.active-station-marker');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const progressPercent = totalDistance > 0 && distanceFromOriginKm > 0
    ? Math.min(100, Math.max(0, Math.round((distanceFromOriginKm / totalDistance) * 100)))
    : Math.min(100, Math.max(0, Math.round((resolvedCurrentIndex / Math.max(1, route.length - 1)) * 100)));

  const delayColor = delayMinutes <= 0 ? '#10b981' : delayMinutes <= 15 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Real-time Telemetry & Location Banner (Strictly 1 Single Line with Increased Line Spacing) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 16,
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          alignItems: 'center',
          overflowX: 'auto'
        }}
      >
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 800, letterSpacing: 0.6, lineHeight: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            EXACT LIVE LOCATION
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 6, lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            <span className="pulse-active" style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentStName} ({currentStCode || 'LOC'})</span>
          </div>
          <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {isAtStation ? '● Halted at Station Platform' : `● En-route (${distanceFromLastKm > 0 ? `+${distanceFromLastKm} km` : 'In Transit'})`}
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 800, letterSpacing: 0.6, lineHeight: '16px', whiteSpace: 'nowrap' }}>
            SPEED &amp; TELEMETRY
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 900, color: speed > 0 ? '#059669' : '#dc2626', lineHeight: '22px', whiteSpace: 'nowrap' }}>
            {speed} <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>km/h</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: '18px', whiteSpace: 'nowrap' }}>
            GPS Real-Time Refined
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 800, letterSpacing: 0.6, lineHeight: '16px', whiteSpace: 'nowrap' }}>
            PUNCTUALITY &amp; DELAY
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: delayColor, lineHeight: '22px', whiteSpace: 'nowrap' }}>
            {delayMinutes <= 0 ? 'ON TIME (0m)' : `+${delayMinutes} MIN DELAY`}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: '18px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Running Status: {status}
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 800, letterSpacing: 0.6, lineHeight: '16px', whiteSpace: 'nowrap' }}>
            NEXT SCHEDULED HALT
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', lineHeight: '22px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {nextHalt?.stationName || route[resolvedCurrentIndex + 1]?.stationName || 'Destination'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: '18px', whiteSpace: 'nowrap' }}>
            {nextHalt?.distance ? `${nextHalt.distance} km mark` : 'Upcoming stop'}
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 800, letterSpacing: 0.6, lineHeight: '16px', whiteSpace: 'nowrap' }}>
            ROUTE TRAVERSAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 22 }}>
            <Progress
              percent={progressPercent}
              showInfo={false}
              size="small"
              strokeColor={{ '0%': '#10b981', '100%': '#0284c7' }}
              style={{ flex: 1, margin: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{progressPercent}%</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: '18px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {distanceFromOriginKm > 0 ? `${distanceFromOriginKm.toFixed(1)} km / ${totalDistance} km` : `Station ${resolvedCurrentIndex + 1} of ${route.length}`}
          </div>
        </div>
      </div>

      {/* Interactive 2D Schematic Track View */}
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AimOutlined style={{ color: '#0284c7' }} />
              2D SCHEMATIC TRACK LAYOUT &amp; REAL-TIME TRAIN POSITION
            </span>

            <Space size="middle" wrap>
              <Segmented
                size="small"
                value={routeMode}
                onChange={setRouteMode}
                options={[
                  { label: 'Key Halts & Live Section', value: 'active-corridor' },
                  { label: `Full Route (${route.length} Stations)`, value: 'full-route' }
                ]}
              />

              <Button
                size="small"
                icon={<AimOutlined />}
                type="primary"
                onClick={centerOnTrain}
                style={{ background: '#1e3a8a', borderColor: '#1e3a8a', fontSize: 11 }}
              >
                Center on Train
              </Button>
            </Space>
          </div>
        }
        style={{
          borderRadius: 10,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div
          ref={scrollRef}
          style={{
            overflowX: 'auto',
            padding: '48px 36px 36px 36px',
            position: 'relative',
            minHeight: 250,
            background: '#fafafa',
            borderRadius: 8
          }}
        >
          {/* Main Track Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 4,
              minWidth: Math.max(920, stationStates.length * 140)
            }}
          >
            {stationStates.map((st, index) => {
              const { isPast, isExactCurrent, isUpcoming } = st;
              const isLastNode = index === stationStates.length - 1;
              const isFirstNode = index === 0;

              // Check if the train is currently traveling along this segment (between this station and next)
              const isCurrentSegment = (isExactCurrent && !isAtStation) ||
                (isPast && stationStates[index + 1]?.isUpcoming);

              const segmentCrossed = isPast && !isCurrentSegment;
              const progressOnThisSegment = isCurrentSegment ? (segmentProgress > 0 ? segmentProgress : 0.5) : 0;

              return (
                <React.Fragment key={st.stationCode + '_' + st.sequence + '_' + index}>
                  {/* STATION NODE */}
                  <div
                    className={isExactCurrent ? 'active-station-marker' : ''}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: 110,
                      maxWidth: 150,
                      position: 'relative',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {/* Top Marker: Status Badge / At-Station Train Icon */}
                    <div style={{ height: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 12 }}>
                      {isPast ? (
                        <Tooltip title={`Departed: ${st.stationName} (${st.stationCode})`}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: '#10b981',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 900,
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            <CheckOutlined />
                          </div>
                        </Tooltip>
                      ) : isExactCurrent && isAtStation ? (
                        /* Train Halted At This Station */
                        <div
                          className="live-train-active-marker"
                          style={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.45)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            border: '2px solid #ffffff'
                          }}
                        >
                          <span style={{ fontSize: 13 }}>🚆</span>
                          <span>{trainNumber}</span>
                          <span style={{ fontSize: 10, opacity: 0.9 }}>{speed} km/h</span>
                        </div>
                      ) : isExactCurrent ? (
                        /* Train Just Passed / Reporting Station */
                        <div
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700
                          }}
                        >
                          Passed ({st.stationCode})
                        </div>
                      ) : (
                        /* Upcoming Regular Station */
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#ffffff',
                            border: st.isHalt ? '3px solid #64748b' : '2px solid #cbd5e1',
                            marginBottom: 4
                          }}
                        />
                      )}
                    </div>

                    {/* Rail Track Dot Anchor */}
                    <div
                      style={{
                        width: isExactCurrent ? 16 : 12,
                        height: isExactCurrent ? 16 : 12,
                        borderRadius: '50%',
                        background: isPast ? '#10b981' : isExactCurrent ? '#0284c7' : '#cbd5e1',
                        border: '2px solid #ffffff',
                        boxShadow: `0 0 0 2px ${isPast ? '#10b981' : isExactCurrent ? '#0284c7' : '#cbd5e1'}`,
                        zIndex: 5,
                        transition: 'all 0.3s ease'
                      }}
                    />

                    {/* Station Name and Code */}
                    <div
                      style={{
                        marginTop: 14,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <span
                        style={{
                          fontWeight: isExactCurrent ? 900 : 800,
                          fontSize: isExactCurrent ? 15 : 13,
                          color: isExactCurrent ? '#0284c7' : '#0f172a',
                          letterSpacing: 0.5,
                          lineHeight: '18px'
                        }}
                      >
                        {st.stationCode}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: isExactCurrent ? 700 : 500,
                          color: isExactCurrent ? '#0284c7' : '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 130,
                          lineHeight: '15px'
                        }}
                      >
                        {st.stationName}
                      </span>

                      {/* Distance marker & Platform */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Tag
                          color={isExactCurrent ? 'blue' : 'default'}
                          style={{ fontSize: 9.5, padding: '0 5px', margin: 0, fontWeight: 600 }}
                        >
                          PF {st.platform || '1'}
                        </Tag>
                        {st.distance !== undefined && (
                          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                            {st.distance}k
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONNECTING TRACK SEGMENT (Between this station and the next) */}
                  {!isLastNode && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: 80,
                        position: 'relative',
                        alignSelf: 'flex-start',
                        marginTop: 44 + 6 - 3
                      }}
                    >
                      {/* Railway Sleepers / Ties */}
                      <div
                        style={{
                          position: 'absolute',
                          top: -6,
                          left: 0,
                          right: 0,
                          height: 18,
                          backgroundImage: 'repeating-linear-gradient(90deg, #cbd5e1 0px, #cbd5e1 4px, transparent 4px, transparent 20px)',
                          opacity: segmentCrossed ? 0.6 : isCurrentSegment ? 0.9 : 0.4,
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Base Track Rail */}
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: segmentCrossed ? '#10b981' : '#cbd5e1',
                          boxShadow: segmentCrossed ? '0 0 6px rgba(16, 185, 129, 0.3)' : 'none',
                          position: 'relative',
                          zIndex: 2,
                          overflow: 'visible'
                        }}
                      >
                        {/* Partially Traversed Sub-track on Active Segment */}
                        {isCurrentSegment && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${Math.round(progressOnThisSegment * 100)}%`,
                              background: '#10b981',
                              borderRadius: '3px 0 0 3px',
                              boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                            }}
                          />
                        )}
                      </div>

                      {/* LIVE TRAIN BEACON ON THE ACTIVE TRACK SEGMENT */}
                      {isCurrentSegment && (
                        <div
                          className="live-train-active-marker"
                          style={{
                            position: 'absolute',
                            left: `${Math.max(10, Math.min(90, Math.round(progressOnThisSegment * 100)))}%`,
                            top: -26,
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Tooltip
                            title={
                              <div style={{ fontSize: 11 }}>
                                <strong>Train {trainNumber} ({trainName})</strong><br/>
                                Speed: {speed} km/h • {isAtStation ? 'At Station' : 'In Transit'}<br/>
                                Live Section: {st.stationName} ➔ {stationStates[index + 1]?.stationName}<br/>
                                Section Progress: {Math.round(progressOnThisSegment * 100)}%
                              </div>
                            }
                          >
                            <div
                              style={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                                color: '#ffffff',
                                padding: '3px 8px',
                                borderRadius: 14,
                                fontSize: 11,
                                fontWeight: 800,
                                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                border: '2px solid #ffffff',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{ fontSize: 12 }}>🚆</span>
                              <span>{trainNumber}</span>
                              <Tag color="cyan" style={{ fontSize: 9, padding: '0 4px', margin: 0, fontWeight: 700 }}>
                                {speed} km/h
                              </Tag>
                            </div>
                          </Tooltip>

                          {/* Radar Pulse Rings */}
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: '#0284c7',
                              marginTop: 4,
                              border: '2px solid #ffffff',
                              boxShadow: '0 0 0 4px rgba(2, 132, 199, 0.4)'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveTrainTrackSchematic;