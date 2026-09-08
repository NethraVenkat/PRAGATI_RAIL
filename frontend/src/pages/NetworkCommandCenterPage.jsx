import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Space,
  Badge,
  Segmented,
  Table,
  Spin,
  Alert,
  Tooltip,
  Divider,
  Empty
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CompassOutlined,
  AimOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CarOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import { trainService } from '../services/trainService';
import { LiveTrainTrackSchematic } from '../components/commandCenter/LiveTrainTrackSchematic';
import { LiveTrainGeoMap } from '../components/commandCenter/LiveTrainGeoMap';

// FIX: this page previously only fetched live status once, on train
// selection, and otherwise relied on the person clicking "Refresh" by
// hand. This interval makes it auto-sync on its own -- no manual action
// needed. Kept just under the backend's LIVE_CACHE_TTL_MS (12s) so each
// tick has a good chance of reaching a fresh RailRadar fetch rather than
// just re-serving the same cached copy.
const AUTO_REFRESH_INTERVAL_MS = 15000;

const DEFAULT_COMMAND_CENTER_DATA = {
  isMock: true,
  trainNumber: 'SIM-15014',
  trainName: 'Network Express',
  status: 'RUNNING',
  speed: 68,
  delayMinutes: 4,
  source: { name: 'Lucknow Junction', code: 'LKO', lat: 26.8317, lng: 80.9234 },
  destination: { name: 'Kanpur Central', code: 'CNB', lat: 26.4547, lng: 80.3507 },
  totalDistance: 72,
  totalHalts: 6,
  currentStationIndex: 2,
  currentLocation: {
    stationCode: 'HRN',
    stationName: 'Harauni',
    sequence: 3,
    lat: 26.705,
    lng: 80.751,
    status: 'en-route',
    distanceFromLastStationKm: 8.4,
    distanceFromOriginKm: 24.6
  },
  nextHalt: { stationCode: 'JTU', stationName: 'Jaitipur', distance: 14 },
  previousHalt: { stationCode: 'AMS', stationName: 'Amausi' },
  route: [
    { sequence: 1, stationCode: 'LKO', stationName: 'Lucknow Junction', lat: 26.8317, lng: 80.9234, isHalt: true },
    { sequence: 2, stationCode: 'AMS', stationName: 'Amausi', lat: 26.762, lng: 80.881, isHalt: true },
    { sequence: 3, stationCode: 'HRN', stationName: 'Harauni', lat: 26.705, lng: 80.751, isHalt: true },
    { sequence: 4, stationCode: 'JTU', stationName: 'Jaitipur', lat: 26.612, lng: 80.62, isHalt: true },
    { sequence: 5, stationCode: 'BCN', stationName: 'Bachhrawan', lat: 26.54, lng: 80.52, isHalt: true },
    { sequence: 6, stationCode: 'CNB', stationName: 'Kanpur Central', lat: 26.4547, lng: 80.3507, isHalt: true }
  ]
};

export const NetworkCommandCenterPage = () => {
  const { currentUser } = useAuth();
  const { selectedZone, selectedDivision } = useRegion();

  const userZone = currentUser?.zone || selectedZone || 'Northern Railway';
  const userDivision = currentUser?.division || selectedDivision || 'Lucknow';

  const [availableTrains, setAvailableTrains] = useState([]);
  const [loadingTrainsList, setLoadingTrainsList] = useState(false);
  const [trainSearchQuery, setTrainSearchQuery] = useState('');
  const [manualTrainNo, setManualTrainNo] = useState('');

  const [selectedTrainNo, setSelectedTrainNo] = useState(null);
  const [liveData, setLiveData] = useState(DEFAULT_COMMAND_CENTER_DATA);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [viewMode, setViewMode] = useState('2D');
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const loadAvailableTrains = useCallback(async () => {
    setLoadingTrainsList(true);
    try {
      const data = await trainService.getAvailableTrains({
        division: userDivision,
        limit: 150,
        source: 'command-center'
      });
      const normalizedTrains = data.map((train) => ({
        ...train,
        trainNo: train.trainNo || train.trainNumber,
        trainName: train.trainName || train.name,
        sourceStation: train.sourceStation || train.sourceStationName,
        destinationStation: train.destinationStation || train.destinationStationName
      })).filter((train) => train.trainNo);
      setAvailableTrains(normalizedTrains);

      if (normalizedTrains.length > 0) {
        setSelectedTrainNo((prev) => {
          if (!prev || !normalizedTrains.some((t) => t.trainNo === prev)) {
            return null;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load available trains for division:', err);
    } finally {
      setLoadingTrainsList(false);
    }
  }, [userDivision]);

  useEffect(() => {
    loadAvailableTrains();
  }, [userZone, userDivision]);

  const fetchLiveStatus = useCallback(async (trainNo) => {
    if (!trainNo) return;
    setLoadingLive(true);
    setLiveError(null);

    try {
      const data = await trainService.getLiveTrainStatus(trainNo, 'command-center');
      setLiveData({ ...DEFAULT_COMMAND_CENTER_DATA, ...data, isMock: false });
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error(`Error fetching live tracking for ${trainNo}:`, err);
      const msg = err.response?.data?.message || err.message || 'Live tracking data unavailable for this train.';
      setLiveError(msg);
      setLiveData(null);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  // When selected train changes: fetch immediately, then keep AUTO-SYNCING
  // on a fixed interval for as long as that train stays selected -- no
  // manual click required. Interval clears on train change / unmount.
  useEffect(() => {
    if (!selectedTrainNo) return;

    fetchLiveStatus(selectedTrainNo);

    const intervalId = setInterval(() => {
      fetchLiveStatus(selectedTrainNo);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedTrainNo, fetchLiveStatus]);

  const handleManualTrack = (e) => {
    e?.preventDefault();
    const clean = manualTrainNo.trim();
    if (clean) {
      setSelectedTrainNo(clean);
      setManualTrainNo('');
    }
  };

  const filteredTrains = availableTrains.filter((t) => {
    if (!trainSearchQuery) return true;
    const q = trainSearchQuery.toLowerCase();
    return (
      t.trainNo?.toLowerCase().includes(q) ||
      t.trainName?.toLowerCase().includes(q) ||
      t.sourceStationName?.toLowerCase().includes(q) ||
      t.destinationStationName?.toLowerCase().includes(q)
    );
  });

  const routeColumns = [
    {
      title: '#',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 50,
      render: (seq, record, index) => {
        const isCurrent = record.stationCode === liveData?.currentLocation?.stationCode || Number(record.sequence) === Number(liveData?.currentLocation?.sequence);
        const isPast = record.sequence < (liveData?.currentLocation?.sequence || liveData?.currentStationIndex + 1);
        if (isCurrent) {
          return <span className="pulse-active" style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />;
        }
        if (isPast) {
          return <CheckCircleOutlined style={{ color: '#10b981' }} />;
        }
        return <span style={{ color: '#94a3b8' }}>{index + 1}</span>;
      }
    },
    {
      title: 'Station',
      key: 'station',
      render: (_, r) => {
        const isCurrent = r.stationCode === liveData?.currentLocation?.stationCode || Number(r.sequence) === Number(liveData?.currentLocation?.sequence);
        return (
          <div>
            <span style={{ fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#0284c7' : 'var(--ir-text-main)' }}>
              {r.stationName}
            </span>
            <Tag color={r.isHalt ? 'blue' : 'default'} style={{ marginLeft: 6, fontSize: 10 }}>
              {r.stationCode}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'PF',
      dataIndex: 'platform',
      key: 'platform',
      width: 60,
      render: (pf) => <Tag color="geekblue">PF {pf || '1'}</Tag>
    },
    {
      title: 'Sched Arr / Dep',
      key: 'sched',
      render: (_, r) => {
        const arr = r.scheduledArrival ? new Date(r.scheduledArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
        const dep = r.scheduledDeparture ? new Date(r.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
        return <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{arr} / {dep}</span>;
      }
    },
    {
      title: 'Act Arr / Dep',
      key: 'act',
      render: (_, r) => {
        const arr = r.actualArrival ? new Date(r.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
        const dep = r.actualDeparture ? new Date(r.actualDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
        return <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ir-navy)' }}>{arr} / {dep}</span>;
      }
    },
    {
      title: 'Delay',
      key: 'delay',
      render: (_, r) => {
        const delay = r.delayArrival || r.delayDeparture || 0;
        if (delay <= 0) return <Tag color="success">On Time</Tag>;
        return <Tag color="error">+{delay}m</Tag>;
      }
    },
    {
      title: 'Distance',
      dataIndex: 'distance',
      key: 'distance',
      width: 90,
      render: (d) => `${d || 0} km`
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 12,
          borderBottom: '1px solid var(--ir-border)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                color: '#fff',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 13,
                letterSpacing: 1
              }}
            >
              PRAGATI
            </div>
            <span style={{ fontSize: 11, color: 'var(--ir-text-sub)', fontWeight: 600, letterSpacing: 0.5 }}>
              INDIAN RAILWAYS LIVE TELEMETRY & TRAIN TRACKING
            </span>
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              margin: '4px 0 0 0',
              color: 'var(--ir-text-main)',
              letterSpacing: '0.5px'
            }}
          >
            NETWORK COMMAND CENTER
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--ir-card-bg)',
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--ir-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: 'var(--ir-text-sub)', fontWeight: 800 }}>ASSIGNED JURISDICTION</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ir-navy)' }}>
                {userZone} <span style={{ color: '#94a3b8' }}>/</span> {userDivision} Division
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--ir-card-bg)',
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--ir-border)'
            }}
          >
            <span
              style={{
                color: '#059669',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span
                className="pulse-active"
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block' }}
              />
              LIVE RADAR &bull; AUTO-SYNC {AUTO_REFRESH_INTERVAL_MS / 1000}s
            </span>
            {lastRefreshedAt && (
              <>
                <span style={{ color: 'var(--ir-border)' }}>|</span>
                <span style={{ color: 'var(--ir-text-sub)', fontSize: 11, fontFamily: 'monospace' }}>
                  Updated: {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </>
            )}
            <Button
              size="small"
              icon={<ReloadOutlined spin={loadingLive} />}
              onClick={() => fetchLiveStatus(selectedTrainNo)}
              style={{ fontSize: 11 }}
            >
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={7} xl={6} style={{ display: 'flex' }}>
          <Card
            size="small"
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--ir-text-main)' }}>
                  AVAILABLE TRAINS ({filteredTrains.length})
                </span>
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                  {userDivision}
                </Tag>
              </div>
            }
            style={{
              borderRadius: 10,
              border: '1px solid var(--ir-border)',
              background: 'var(--ir-card-bg)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: 16,
              maxHeight: 'calc(100vh - 32px)'
            }}
            bodyStyle={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0
            }}
          >
            <form onSubmit={handleManualTrack} style={{ marginBottom: 12, flexShrink: 0 }}>
              <Input.Search
                placeholder="Track any train (e.g. 12601)"
                value={manualTrainNo}
                onChange={(e) => setManualTrainNo(e.target.value)}
                onSearch={() => handleManualTrack()}
                enterButton={
                  <Button type="primary" style={{ background: '#0284c7', fontWeight: 700 }}>
                    Track
                  </Button>
                }
                size="middle"
                allowClear
              />
            </form>

            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search train no. or name..."
              value={trainSearchQuery}
              onChange={(e) => setTrainSearchQuery(e.target.value)}
              size="middle"
              allowClear
              style={{ marginBottom: 12, borderRadius: 6, flexShrink: 0 }}
            />

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingRight: 4
              }}
            >
              {loadingTrainsList ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin tip="Loading division trains..." />
                </div>
              ) : filteredTrains.length === 0 ? (
                <Empty description="No trains found for this division" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                filteredTrains.map((train) => {
                  const isSelected = selectedTrainNo === train.trainNo;
                  return (
                    <div
                      key={train.trainNo}
                      onClick={() => setSelectedTrainNo(train.trainNo)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #0284c7' : '1px solid var(--ir-border)',
                        background: isSelected ? '#f0f9ff' : 'var(--ir-bg)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.16)' : '0 1px 3px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: 14,
                            color: isSelected ? '#0284c7' : 'var(--ir-navy)',
                            letterSpacing: 0.5,
                            lineHeight: '20px'
                          }}
                        >
                          {train.trainNo}
                        </span>
                        {isSelected ? (
                          <Tag color="processing" style={{ fontSize: 10, fontWeight: 700, margin: 0, padding: '0 6px', lineHeight: '18px' }}>
                            ACTIVE
                          </Tag>
                        ) : (
                          <Tag color="default" style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px', color: '#64748b' }}>
                            {train.division || userDivision}
                          </Tag>
                        )}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: isSelected ? '#0f172a' : 'var(--ir-text-main)',
                          lineHeight: '20px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {train.trainName}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ir-text-sub)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          lineHeight: '18px',
                          marginTop: 2
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{train.sourceStation || train.sourceStationName || 'Origin'}</span>
                        <ArrowRightOutlined style={{ fontSize: 9, color: '#94a3b8' }} />
                        <span style={{ fontWeight: 600 }}>{train.destinationStation || train.destinationStationName || 'Terminus'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={17} xl={18}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              size="small"
              style={{
                borderRadius: 10,
                border: '1px solid var(--ir-border)',
                background: 'var(--ir-card-bg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: 8,
                      textAlign: 'center',
                      minWidth: 70
                    }}
                  >
                    <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700 }}>TRAIN NO</div>
                    <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}>
                      {liveData?.trainNumber || selectedTrainNo || '----'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ir-text-main)' }}>
                        {liveData?.trainName || (loadingLive ? 'Fetching Live Status...' : 'Select a train')}
                      </h2>
                      {liveData && (
                        <Tag
                          color={liveData.status === 'RUNNING' ? 'success' : 'processing'}
                          style={{ fontWeight: 800, fontSize: 11 }}
                        >
                          ● {liveData.status}
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ir-text-sub)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{liveData?.source?.name || 'Origin'}</span>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                      <span>{liveData?.destination?.name || 'Destination'}</span>
                      {liveData?.totalDistance && (
                        <>
                          <span style={{ color: '#94a3b8' }}>•</span>
                          <span>{liveData.totalDistance} km</span>
                        </>
                      )}
                      {liveData?.totalHalts && (
                        <>
                          <span style={{ color: '#94a3b8' }}>•</span>
                          <span>{liveData.totalHalts} Halts</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {liveData && (
                    <>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 700 }}>SPEED</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: liveData.speed > 0 ? '#059669' : '#dc2626' }}>
                          {liveData.speed} km/h
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 700 }}>PUNCTUALITY</div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: liveData.delayMinutes <= 0 ? '#10b981' : '#dc2626'
                          }}
                        >
                          {liveData.delayMinutes <= 0 ? 'On Time' : `+${liveData.delayMinutes}m`}
                        </div>
                      </div>
                    </>
                  )}

                  <Segmented
                    value={viewMode}
                    onChange={setViewMode}
                    options={[
                      { label: '2D Track View', value: '2D', icon: <AimOutlined /> },
                      { label: 'Geographic Map', value: 'GEO', icon: <GlobalOutlined /> }
                    ]}
                  />
                </div>
              </div>
            </Card>

            {liveError && (
              <Alert
                type="warning"
                showIcon
                message="Live Telemetry Notice"
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{liveError}</span>
                    <Button size="small" onClick={() => fetchLiveStatus(selectedTrainNo)}>
                      Retry
                    </Button>
                  </div>
                }
              />
            )}

            {loadingLive && !liveData ? (
              <Card style={{ borderRadius: 10, textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" tip="Connecting to Indian Railways RailRadar Live Feed..." />
              </Card>
            ) : !selectedTrainNo && !liveData?.isMock ? (
              <Card style={{ borderRadius: 10, textAlign: 'center', padding: '60px 0' }}>
                <Empty description="Select a train from the list or enter a train number to start live tracking" />
              </Card>
            ) : liveData ? (
              <>
                {viewMode === '2D' ? (
                  <LiveTrainTrackSchematic liveData={liveData} />
                ) : (
                  <LiveTrainGeoMap liveData={liveData} />
                )}

                <Row gutter={[16, 16]}>
                  {liveData.coachPosition && (
                    <Col span={24}>
                      <Card
                        size="small"
                        title={
                          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--ir-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CarOutlined style={{ color: '#0284c7' }} />
                            COACH COMPOSITION & RAKE POSITION
                          </span>
                        }
                        style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}
                      >
                        <div style={{ overflowX: 'auto', padding: '4px 0' }}>
                          <Space size={4}>
                            {liveData.coachPosition.split('-').map((coach, idx) => (
                              <Tag
                                key={coach + '_' + idx}
                                color={
                                  coach.includes('ENG')
                                    ? 'red'
                                    : coach.includes('HA') || coach.includes('A')
                                    ? 'gold'
                                    : coach.includes('B')
                                    ? 'cyan'
                                    : coach.includes('S')
                                    ? 'blue'
                                    : 'default'
                                }
                                style={{
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  padding: '4px 8px',
                                  borderRadius: 4
                                }}
                              >
                                {coach}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  )}

                  <Col span={24}>
                    <Card
                      size="small"
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--ir-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClockCircleOutlined style={{ color: '#0284c7' }} />
                            SCHEDULED HALTS & RUNNING STATUS TIMELINE
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--ir-text-sub)' }}>
                            Total Stops: {liveData.route?.length || 0}
                          </span>
                        </div>
                      }
                      style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}
                    >
                      <Table
                        columns={routeColumns}
                        dataSource={liveData.route || []}
                        rowKey={(r) => r.stationCode + '_' + r.sequence}
                        pagination={{ pageSize: 8, showSizeChanger: false }}
                        size="small"
                        rowClassName={(record) =>
                          record.stationCode === liveData.currentLocation?.stationCode ? 'ant-table-row-selected' : ''
                        }
                      />
                    </Card>
                  </Col>
                </Row>
              </>
            ) : null}
          </div>
        </Col>
      </Row>
    </div>
  );
};