import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Button, Tag, Tooltip, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FastForwardOutlined,
  AimOutlined,
  RobotOutlined
} from '@ant-design/icons';

export const SchematicNetworkMap = ({
  areaData,
  activeOverlayView,
  layers,
  setLayers,
  onSelectStation,
  onSelectSignal,
  onSelectPoint,
  onSelectBlock,
  onSelectTrain,
  onSelectAiOpportunity,
  selectedTrainId
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [tick, setTick] = useState(0);

  // Simulation playback ticker
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setTick(prev => (prev + 1) % 1000);
      }, 1000 / simSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, simSpeed]);

  if (!areaData) return <div>No schematic network data available</div>;

  const { stations, yards, tracks, points, signals, blocks, trains, aiOpportunities } = areaData;

  const getSignalColor = (aspect) => {
    switch (aspect) {
      case 'CLEAR': return '#059669'; // Emerald
      case 'CAUTION': return '#d97706'; // Amber
      case 'STOP': return '#dc2626'; // Red
      case 'FAILURE': return '#64748b'; // Grey
      default: return '#64748b';
    }
  };

  const toggleLayer = (layerKey) => {
    setLayers({ ...layers, [layerKey]: !layers[layerKey] });
  };

  return (
    <Card
      bodyStyle={{ padding: 0, position: 'relative' }}
      style={{ borderRadius: 10, border: '1px solid var(--ir-border)', background: 'var(--ir-card-bg)', overflow: 'hidden' }}
    >
      {/* Top Map Action Bar & Layers Control */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--ir-bg)',
        borderBottom: '1px solid var(--ir-border)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 11,
        color: 'var(--ir-text-sub)'
      }}>
        {/* Layer Toggles */}
        <Space wrap size="small">
          <span style={{ fontWeight: 700, color: 'var(--ir-text-main)', marginRight: 4 }}>LAYERS:</span>
          <Checkbox checked={layers.stations} onChange={() => toggleLayer('stations')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Stations</span>
          </Checkbox>
          <Checkbox checked={layers.signals} onChange={() => toggleLayer('signals')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Signals</span>
          </Checkbox>
          <Checkbox checked={layers.tracks} onChange={() => toggleLayer('tracks')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Tracks</span>
          </Checkbox>
          <Checkbox checked={layers.blocks} onChange={() => toggleLayer('blocks')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Blocks</span>
          </Checkbox>
          <Checkbox checked={layers.trains} onChange={() => toggleLayer('trains')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Trains</span>
          </Checkbox>
          <Checkbox checked={layers.points} onChange={() => toggleLayer('points')}>
            <span style={{ color: 'var(--ir-text-main)' }}>Points</span>
          </Checkbox>
          <Checkbox checked={layers.aiOpportunities} onChange={() => toggleLayer('aiOpportunities')}>
            <span style={{ color: '#059669', fontWeight: 700 }}>AI Opportunities</span>
          </Checkbox>
        </Space>

        {/* Simulation Controls */}
        <Space size="small">
          <Button
            size="small"
            type={isPlaying ? "default" : "primary"}
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ fontSize: 11 }}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </Button>
          <Button
            size="small"
            type={simSpeed === 2 ? "primary" : "default"}
            icon={<FastForwardOutlined />}
            onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
            style={{ fontSize: 11 }}
          >
            {simSpeed}x SPEED
          </Button>
          <Button
            size="small"
            icon={<AimOutlined />}
            onClick={() => setZoomLevel(1)}
            style={{ fontSize: 11 }}
          >
            FIT NETWORK
          </Button>
        </Space>
      </div>

      {/* Dynamic Theme Schematic Railway Viewport Canvas */}
      <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'auto', background: 'var(--ir-card-bg)' }}>
        <svg
          viewBox="0 0 1000 340"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
          }}
        >
          {/* Background Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--ir-border)" strokeWidth="0.8" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="1000" height="340" fill="url(#grid)" />

          {/* 1. TRACK LAYOUT */}
          {layers.tracks && (
            <g id="track-lines">
              {/* UP Main Line (Top Track y=130) */}
              <line x1="60" y1="130" x2="940" y2="130" stroke="var(--ir-navy)" strokeWidth="6" />
              <line x1="60" y1="130" x2="940" y2="130" stroke="#0284c7" strokeWidth="2" strokeDasharray="8 4" />
              <text x="20" y="134" fill="var(--ir-text-sub)" fontSize="10" fontWeight="bold" fontFamily="monospace">← UP MAIN</text>

              {/* DN Main Line (Bottom Track y=170) */}
              <line x1="60" y1="170" x2="940" y2="170" stroke="var(--ir-navy)" strokeWidth="6" />
              <line x1="60" y1="170" x2="940" y2="170" stroke="#0284c7" strokeWidth="2" strokeDasharray="8 4" />
              <text x="20" y="174" fill="var(--ir-text-sub)" fontSize="10" fontWeight="bold" fontFamily="monospace">→ DN MAIN</text>

              {/* Branch / Yard Junction Split Lines */}
              <path d="M 780 170 L 860 260 L 940 260" fill="none" stroke="var(--ir-text-sub)" strokeWidth="3" strokeDasharray="4 2" />
              <path d="M 100 260 L 160 170" fill="none" stroke="var(--ir-text-sub)" strokeWidth="3" strokeDasharray="4 2" />
            </g>
          )}

          {/* 2. BLOCK SECTIONS */}
          {layers.blocks && blocks.map(blk => {
            const isOccupied = blk.status === 'OCCUPIED';
            const strokeColor = isOccupied ? '#dc2626' : '#059669';

            return (
              <g key={blk.id} onClick={() => onSelectBlock && onSelectBlock(blk)} style={{ cursor: 'pointer' }}>
                <line
                  x1={blk.startX}
                  y1={blk.trackY}
                  x2={blk.endX}
                  y2={blk.trackY}
                  stroke={strokeColor}
                  strokeWidth="4"
                  opacity={isOccupied ? "0.9" : "0.7"}
                />
                <line x1={blk.startX} y1={blk.trackY - 8} x2={blk.startX} y2={blk.trackY + 8} stroke="var(--ir-text-main)" strokeWidth="2" />
                <line x1={blk.endX} y1={blk.trackY - 8} x2={blk.endX} y2={blk.trackY + 8} stroke="var(--ir-text-main)" strokeWidth="2" />

                <text x={(blk.startX + blk.endX) / 2} y={blk.trackY - 14} fill="var(--ir-text-sub)" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {blk.code} ({blk.status})
                </text>
              </g>
            );
          })}

          {/* 3. AI OPPORTUNITY OVERLAY HIGHLIGHT */}
          {(layers.aiOpportunities || activeOverlayView === 'AI Opportunity View') && aiOpportunities.map(opp => (
            <g key={opp.id} onClick={() => onSelectAiOpportunity && onSelectAiOpportunity(opp)} style={{ cursor: 'pointer' }}>
              <rect
                x={opp.startX - 10}
                y={opp.trackY - 24}
                width={(opp.endX - opp.startX) + 20}
                height="48"
                rx="6"
                fill="rgba(5, 150, 105, 0.15)"
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="6 3"
                className="pulse-active"
              />
              <rect
                x={(opp.startX + opp.endX) / 2 - 60}
                y={opp.trackY - 36}
                width="120"
                height="18"
                rx="4"
                fill="#059669"
              />
              <text
                x={(opp.startX + opp.endX) / 2}
                y={opp.trackY - 24}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                ★ AI OPPORTUNITY: {opp.durationMins}m GAP
              </text>
            </g>
          ))}

          {/* 4. POINTS / SWITCHES */}
          {layers.points && points.map(pt => {
            const isReverse = pt.state === 'REVERSE';
            const pointX = pt.station === 'LKO' ? 140 : pt.station === 'BCN' ? 620 : 800;
            const pointY = 150;

            return (
              <g key={pt.id} onClick={() => onSelectPoint && onSelectPoint(pt)} style={{ cursor: 'pointer' }}>
                <polygon
                  points={`${pointX},${pointY - 6} ${pointX + 6},${pointY} ${pointX},${pointY + 6} ${pointX - 6},${pointY}`}
                  fill={isReverse ? '#d97706' : '#0284c7'}
                  stroke="var(--ir-card-bg)"
                  strokeWidth="1.5"
                />
                <text x={pointX} y={pointY + 16} fill="var(--ir-blue)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {pt.id}
                </text>
              </g>
            );
          })}

          {/* 5. SIGNALS */}
          {layers.signals && signals.map(sig => {
            const color = getSignalColor(sig.aspect);

            return (
              <g key={sig.id} onClick={() => onSelectSignal && onSelectSignal(sig)} style={{ cursor: 'pointer' }}>
                <line x1={sig.positionX} y1={sig.trackY - 4} x2={sig.positionX} y2={sig.trackY - 16} stroke="var(--ir-text-sub)" strokeWidth="1.5" />
                <circle
                  cx={sig.positionX}
                  cy={sig.trackY - 18}
                  r="5"
                  fill={color}
                  stroke="var(--ir-card-bg)"
                  strokeWidth="1.5"
                />
                <text x={sig.positionX} y={sig.trackY - 26} fill="var(--ir-text-sub)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {sig.id}
                </text>
              </g>
            );
          })}

          {/* 6. STATIONS & YARDS */}
          {layers.stations && (
            <g id="stations-and-yards">
              {yards.map(yrd => (
                <g key={yrd.id} style={{ cursor: 'pointer' }}>
                  <rect x={yrd.x - 30} y={yrd.y - 12} width="60" height="24" rx="3" fill="var(--ir-bg)" stroke="var(--ir-border)" strokeWidth="1.5" />
                  <text x={yrd.x} y={yrd.y + 4} fill="var(--ir-text-sub)" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    □ {yrd.code}
                  </text>
                </g>
              ))}

              {stations.map(st => {
                const isJunction = st.type === 'junction' || st.type === 'terminal';

                return (
                  <g key={st.id} onClick={() => onSelectStation && onSelectStation(st)} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={isJunction ? "9" : "7"}
                      fill={isJunction ? "#1e3a8a" : "var(--ir-card-bg)"}
                      stroke={isJunction ? "#0284c7" : "var(--ir-text-sub)"}
                      strokeWidth="2.5"
                    />
                    <circle cx={st.x} cy={st.y} r="3" fill="var(--ir-card-bg)" />

                    <text x={st.x} y={st.y + 24} fill="var(--ir-text-main)" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="Outfit, sans-serif">
                      {st.name}
                    </text>
                    <text x={st.x} y={st.y + 36} fill="var(--ir-text-sub)" fontSize="9" textAnchor="middle" fontFamily="monospace">
                      ({st.code})
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* 7. LIVE MOVING TRAINS */}
          {layers.trains && trains.map(trn => {
            const offset = (tick * (trn.speed / 50)) % 120;
            const currentX = (trn.positionX + offset) % 880 + 60;
            const isSelected = selectedTrainId === trn.id;

            return (
              <g key={trn.id} onClick={() => onSelectTrain && onSelectTrain(trn)} style={{ cursor: 'pointer' }}>
                <rect
                  x={currentX - 25}
                  y={trn.trackY - 9}
                  width="50"
                  height="18"
                  rx="4"
                  fill={trn.status === 'DELAYED' ? '#dc2626' : trn.status === 'HELD' ? '#d97706' : '#1e3a8a'}
                  stroke={isSelected ? '#0284c7' : '#ffffff'}
                  strokeWidth={isSelected ? '2.5' : '1'}
                />
                <text x={currentX} y={trn.trackY + 4} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {trn.number}
                </text>
                <text x={currentX + 18} y={trn.trackY + 3} fill="#ffffff" fontSize="8">
                  {trn.direction === 'UP' ? '►' : '◄'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Visual Legend Bar at Bottom */}
      <div style={{
        padding: '8px 16px',
        background: 'var(--ir-bg)',
        borderTop: '1px solid var(--ir-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 11,
        color: 'var(--ir-text-sub)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
            <span>Signal Clear</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706', display: 'inline-block' }}></span>
            <span>Signal Caution</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
            <span>Signal Stop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748b', display: 'inline-block' }}></span>
            <span>Signal Failure</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 4, background: '#059669', display: 'inline-block' }}></span>
            <span>Block Clear</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 4, background: '#dc2626', display: 'inline-block' }}></span>
            <span>Block Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 12, border: '2px dashed #059669', background: 'rgba(5, 150, 105, 0.15)', display: 'inline-block' }}></span>
            <span style={{ color: '#059669', fontWeight: 700 }}>AI Maintenance Opportunity</span>
          </div>
        </div>

        <div style={{ fontSize: 10, color: 'var(--ir-text-sub)' }}>
          Direction: ← UP (Towards Origin) • DN → (Towards Destination)
        </div>
      </div>
    </Card>
  );
};
