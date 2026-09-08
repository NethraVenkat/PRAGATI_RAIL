import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Checkbox,
  Tag,
  Button,
  Drawer,
  Descriptions,
  Divider,
  Radio,
  Input,
  Select,
  Spin,
  Alert,
  Space,
  Statistic,
  message,
  Tooltip
} from 'antd';
import {
  DesktopOutlined,
  ReloadOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  SafetyCertificateOutlined,
  CompassOutlined,
  SearchOutlined,
  EyeOutlined,
  SendOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { gisService } from '../services/gisService';
import { trainService } from '../services/trainService';
import { GISGoogleMap } from '../components/gis/GISGoogleMap';
import { DispatchDefectModal } from '../components/common/DispatchDefectModal';
import { blockService } from '../services/blockService';

const { Search } = Input;
const { Option } = Select;

export const GISInfrastructureMapPage = () => {
  const { currentUser } = useAuth();

  // User context derived strictly from authenticated profile (No frontend overrides)
  const userDivision = currentUser?.division || 'Chennai';
  const userZone = currentUser?.zone || 'Southern Railway';
  const userRole = String(currentUser?.role || currentUser?.department || 'TMS').toUpperCase();

  // Map state
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(true);
  const [defectLoading, setDefectLoading] = useState(true);
  const [trackError, setTrackError] = useState(null);
  const [trackData, setTrackData] = useState({ tracks: [], stations: [], totalTrackKm: 0, trackDataVerified: false, trackDataAvailable: false });
  const [defects, setDefects] = useState([]);
  const [activeLayers, setActiveLayers] = useState(['tracks', 'stations', 'defects', 'trains']);
  const [mapStyle, setMapStyle] = useState('roadmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [resetTrigger, setResetTrigger] = useState(0);

  // Live Train Layer State
  const [availableTrains, setAvailableTrains] = useState([]);
  const [selectedTrainNo, setSelectedTrainNo] = useState(null);
  const [liveTrainData, setLiveTrainData] = useState(null);
  const [trainTrackingLoading, setTrainTrackingLoading] = useState(false);

  // Inspector Drawer & Modal state
  const [selectedEntity, setSelectedEntity] = useState(null); // { type: 'track' | 'defect' | 'station' | 'train', data: ... }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Load Tracks (Independent from defects)
  const loadTracks = async () => {
    setTrackLoading(true);
    setTrackError(null);
    try {
      const tRes = await gisService.getDivisionTracks();
      setTrackData(tRes || { tracks: [], stations: [], trackDataVerified: false, trackDataAvailable: false });
    } catch (err) {
      console.error('[GIS Tracks] Failed to fetch tracks:', err);
      setTrackError(err.response?.data?.message || 'Failed to load division railway tracks');
    } finally {
      setTrackLoading(false);
    }
  };

  // Load Defects (Independent from tracks)
  const loadDefects = async () => {
    setDefectLoading(true);
    try {
      const dRes = await gisService.getRoleDefects();
      setDefects(dRes.defects || []);
    } catch (err) {
      console.error('[GIS Defects] Failed to fetch defects:', err);
      message.error(err.response?.data?.message || 'Failed to load department defects');
    } finally {
      setDefectLoading(false);
    }
  };

  // Load Division Trains for live tracking selector (Using RAILRADAR_API2 via source: 'gis')
  const loadDivisionTrains = async () => {
    try {
      const list = await trainService.getAvailableTrains({ division: userDivision, source: 'gis' });
      setAvailableTrains(list || []);
      if (list && list.length > 0 && !selectedTrainNo) {
        setSelectedTrainNo(list[0].trainNo);
      }
    } catch (err) {
      // Non-blocking fallback
    }
  };

  // Combined Refresh
  const loadAllData = () => {
    setLoading(true);
    Promise.allSettled([loadTracks(), loadDefects(), loadDivisionTrains()]).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Live Train Status (Single request on train selection, using RAILRADAR_API2)
  useEffect(() => {
    if (!selectedTrainNo || !activeLayers.includes('trains')) {
      setLiveTrainData(null);
      return;
    }

    let isMounted = true;
    const fetchLiveStatus = async () => {
      setTrainTrackingLoading(true);
      try {
        const live = await trainService.getLiveTrainStatus(selectedTrainNo, 'gis');
        if (!isMounted) return;

        if (live) {
          // Extract current lat/lng from live position or route
          let lat = live.currentLocation?.lat;
          let lng = live.currentLocation?.lng;

          if (!lat && live.route && live.route.length > 0) {
            const currSt = live.route[live.currentStationIndex || 0] || live.route[0];
            lat = currSt?.lat;
            lng = currSt?.lng;
          }

          // Fallback to source station if lat/lng missing
          if (!lat && trackData.stations?.length > 0) {
            const st = trackData.stations.find(s => s.code === live.currentLocation?.stationCode) || trackData.stations[0];
            if (st) {
              lat = st.lat;
              lng = st.lng;
            }
          }

          setLiveTrainData({
            ...live,
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null
          });
        }
      } catch (e) {
        console.warn('[GIS Map] Live train tracking error:', e);
      } finally {
        if (isMounted) setTrainTrackingLoading(false);
      }
    };

    fetchLiveStatus();

    return () => {
      isMounted = false;
    };
  }, [selectedTrainNo, activeLayers, trackData.stations]);

  // Client-side search & severity filter on defects
  const filteredDefects = useMemo(() => {
    return defects.filter(d => {
      const matchesSeverity = severityFilter === 'ALL' || d.severityLevel?.toUpperCase() === severityFilter.toUpperCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || (
        (d.defectId && d.defectId.toLowerCase().includes(q)) ||
        (d.defectType && d.defectType.toLowerCase().includes(q)) ||
        (d.sectionId && d.sectionId.toLowerCase().includes(q)) ||
        (d.station1 && d.station1.toLowerCase().includes(q)) ||
        (d.station2 && d.station2.toLowerCase().includes(q)) ||
        (d.department && d.department.toLowerCase().includes(q))
      );
      return matchesSeverity && matchesQuery;
    });
  }, [defects, severityFilter, searchQuery]);

  const handleTrackSelect = (track) => {
    setSelectedEntity({ type: 'track', data: track });
    setDrawerOpen(true);
  };

  const handleDefectSelect = (defect) => {
    setSelectedEntity({ type: 'defect', data: defect });
    setDrawerOpen(true);
  };

  const handleStationSelect = (station) => {
    setSelectedEntity({ type: 'station', data: station });
    setDrawerOpen(true);
  };

  const handleTrainSelect = (train) => {
    setSelectedEntity({ type: 'train', data: train });
    setDrawerOpen(true);
  };

  const handleLayerToggle = (layerKey) => {
    setActiveLayers(prev =>
      prev.includes(layerKey) ? prev.filter(l => l !== layerKey) : [...prev, layerKey]
    );
  };

  const handleResetView = () => {
    setResetTrigger(prev => prev + 1);
    setSearchQuery('');
    setSeverityFilter('ALL');
    setMapStyle('roadmap');
  };

  // Dispatch defect handler from drawer
  const handleSendDefectToBDMS = async (record, dateRangePayload) => {
    const defectId = record.defectId || record.id;
    try {
      message.loading({ content: `Dispatching Defect ${defectId} to AI Block Optimizer...`, key: `send-${defectId}` });
      const res = await blockService.sendDefectToBlockPlanning(record.department || userRole, defectId, dateRangePayload);

      setDefects(prev => prev.map(d => {
        if (d.defectId === defectId || d.id === defectId) {
          return { ...d, isSent: true, status: 'Scheduled Block (Pending COA)' };
        }
        return d;
      }));

      message.success({
        content: `Defect ${defectId} successfully scheduled (${res.blockRequest?.blockId}). Status: AI Validated (Pending COA Approval)`,
        key: `send-${defectId}`,
        duration: 5
      });
      setDrawerOpen(false);
    } catch (err) {
      console.error('Error dispatching defect from GIS:', err);
      message.error({
        content: err.response?.data?.message || err.message || 'Failed to dispatch defect',
        key: `send-${defectId}`
      });
    }
  };

  // Role tag styling
  const renderRoleBadge = () => {
    switch (userRole) {
      case 'TMS':
        return (
          <Tag color="blue" icon={<ToolOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
            ROLE: TMS ENGINEERING &bull; SHOWING TRACK DEFECTS ONLY
          </Tag>
        );
      case 'SMMS':
        return (
          <Tag color="gold" icon={<ThunderboltOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
            ROLE: SMMS SIGNALLING &bull; SHOWING SIGNAL DEFECTS ONLY
          </Tag>
        );
      case 'TDMS':
        return (
          <Tag color="purple" icon={<BlockOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
            ROLE: TDMS TRACTION OHE &bull; SHOWING TRACTION DEFECTS ONLY
          </Tag>
        );
      case 'COA':
      default:
        return (
          <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
            ROLE: COA CONTROLLER &bull; ALL DEPARTMENT DEFECTS VISIBLE
          </Tag>
        );
    }
  };

  const criticalDefectsCount = useMemo(() => {
    return defects.filter(d => String(d.severityLevel || d.severity || '').toUpperCase().includes('CRITICAL')).length;
  }, [defects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with Division, Zone, Role info strictly from Auth */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <GlobalOutlined style={{ color: '#0284c7' }} /> GIS INFRASTRUCTURE MAP
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: '4px 0 0 0', fontSize: 13 }}>
            <strong>{trackData.division || userDivision} Division</strong> &bull; {trackData.zone || userZone} &bull; Complete Division Railway Corridors &amp; Role-Filtered Telemetry
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {renderRoleBadge()}
          <Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading}>
            Refresh GIS Layer
          </Button>
        </div>
      </div>

      {/* Top Metrics Banner */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 8, border: '1px solid var(--ir-border)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Division Track Network</span>}
              value={trackData.totalTrackKm || 0}
              suffix="KM"
              valueStyle={{ color: '#0284c7', fontWeight: 800, fontSize: 22 }}
              prefix={<CompassOutlined style={{ fontSize: 18 }} />}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {trackData.tracks?.length || 0} Corridors &bull; {trackData.division || userDivision} Division
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 8, border: '1px solid var(--ir-border)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Station GIS Nodes</span>}
              value={trackData.stations?.length || 0}
              suffix="Stations"
              valueStyle={{ color: '#1e3a8a', fontWeight: 800, fontSize: 22 }}
              prefix={<EnvironmentOutlined style={{ fontSize: 18 }} />}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Geocoded Division Waypoints
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 8, border: '1px solid var(--ir-border)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Authorized Defects</span>}
              value={filteredDefects.length}
              suffix="Defects"
              valueStyle={{ color: '#ea580c', fontWeight: 800, fontSize: 22 }}
              prefix={<ToolOutlined style={{ fontSize: 18 }} />}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Restricted to {userRole} Department
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card styles={{ body: { padding: '14px 18px' } }} style={{ borderRadius: 8, border: '1px solid var(--ir-border)' }}>
            <Statistic
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Live RailRadar Tracking</span>}
              value={liveTrainData?.trainNumber || (selectedTrainNo || 'Active')}
              valueStyle={{ color: '#10b981', fontWeight: 800, fontSize: 20 }}
              prefix={<RocketOutlined style={{ fontSize: 18 }} />}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {liveTrainData?.speed ? `${liveTrainData.speed} km/h • ${liveTrainData.status}` : 'Independent GIS Overlay'}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Track Error Banner if track data failed */}
      {trackError && (
        <Alert
          type="error"
          showIcon
          message="Track Network Data Warning"
          description={`No railway track data is available for this Division (${trackError}).`}
        />
      )}

      {/* Honest data-quality banners (distinct from an actual fetch error) */}
      {!trackError && !trackLoading && !trackData.trackDataAvailable && (
        <Alert
          type="warning"
          showIcon
          message="No track corridor data for this Division yet"
          description="Neither verified corridor geometry nor enough geocoded stations exist for this Division to draw any track. Defects and live trains are still shown below."
        />
      )}
      {!trackError && !trackLoading && trackData.trackDataAvailable && !trackData.trackDataVerified && (
        <Alert
          type="info"
          showIcon
          message="Showing approximate track routing"
          description="This Division has no hand-verified corridor geometry yet, so tracks below are drawn as straight station-to-station segments (dashed on the map) using real station coordinates -- not surveyed track curvature."
        />
      )}

      {/* Main Map Card with Integrated GIS Controls */}
      <Card
        styles={{ body: { padding: 16 } }}
        style={{ borderRadius: 10, border: '1px solid var(--ir-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        {/* Layer Controls & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          {/* Layer Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>GIS LAYERS:</span>
            <Checkbox
              checked={activeLayers.includes('tracks')}
              onChange={() => handleLayerToggle('tracks')}
            >
              <strong style={{ color: '#0284c7' }}>Railway Tracks ({trackData.tracks?.length || 0})</strong>
            </Checkbox>

            <Checkbox
              checked={activeLayers.includes('stations')}
              onChange={() => handleLayerToggle('stations')}
            >
              <strong style={{ color: '#1e3a8a' }}>Stations ({trackData.stations?.length || 0})</strong>
            </Checkbox>

            <Checkbox
              checked={activeLayers.includes('defects')}
              onChange={() => handleLayerToggle('defects')}
            >
              <strong style={{ color: '#dc2626' }}>{userRole} Defects ({filteredDefects.length})</strong>
            </Checkbox>

            <Checkbox
              checked={activeLayers.includes('trains')}
              onChange={() => handleLayerToggle('trains')}
            >
              <strong style={{ color: '#059669' }}>Live Train Layer</strong>
            </Checkbox>
          </div>

          {/* Quick Filters & Train Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeLayers.includes('trains') && (
              <Select
                placeholder="Select Train to Track..."
                value={selectedTrainNo}
                onChange={setSelectedTrainNo}
                style={{ width: 200 }}
                loading={trainTrackingLoading}
                showSearch
                optionFilterProp="children"
              >
                {availableTrains.map(t => (
                  <Option key={t.trainNo} value={t.trainNo}>
                    🚆 {t.trainNo} - {t.trainName}
                  </Option>
                ))}
              </Select>
            )}

            <Search
              placeholder="Search ID, Section, Station..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />

            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: 130 }}
            >
              <Option value="ALL">All Severities</Option>
              <Option value="CRITICAL">Critical Only</Option>
              <Option value="HIGH">High Only</Option>
              <Option value="MEDIUM">Medium Only</Option>
              <Option value="LOW">Low Only</Option>
            </Select>

            <Radio.Group value={mapStyle} onChange={e => setMapStyle(e.target.value)} size="small">
              <Radio.Button value="roadmap">Roadmap</Radio.Button>
              <Radio.Button value="satellite">Satellite</Radio.Button>
              <Radio.Button value="terrain">Terrain</Radio.Button>
            </Radio.Group>

            <Button icon={<CompassOutlined />} size="small" onClick={handleResetView}>
              Reset Bounds
            </Button>
          </div>
        </div>

        {/* Zero Defects Notice (Tracks remain 100% visible) */}
        {!defectLoading && defects.length === 0 && (
          <Alert
            type="info"
            showIcon
            message="No defects found for your current access scope."
            description="The complete division railway track network is active and displayed on Google Maps."
            style={{ marginBottom: 12 }}
          />
        )}

        {/* GIS Google Map Component */}
        <GISGoogleMap
          division={trackData.division || userDivision}
          zone={trackData.zone || userZone}
          userRole={userRole}
          tracks={trackData.tracks || []}
          stations={trackData.stations || []}
          defects={filteredDefects}
          liveTrain={liveTrainData}
          activeLayers={activeLayers}
          mapStyle={mapStyle}
          onTrackSelect={handleTrackSelect}
          onDefectSelect={handleDefectSelect}
          onStationSelect={handleStationSelect}
          onTrainSelect={handleTrainSelect}
          resetTrigger={resetTrigger}
        />
      </Card>

      {/* Inspector Side Drawer */}
      <Drawer
        title={
          selectedEntity?.type === 'track' ? (
            <span style={{ color: '#0284c7' }}><CompassOutlined /> Railway Track Details</span>
          ) : selectedEntity?.type === 'station' ? (
            <span style={{ color: '#1e3a8a' }}><EnvironmentOutlined /> Station Waypoint Info</span>
          ) : selectedEntity?.type === 'train' ? (
            <span style={{ color: '#059669' }}><RocketOutlined /> Live RailRadar Train Telemetry</span>
          ) : (
            <span style={{ color: '#dc2626' }}><ToolOutlined /> Infrastructure Defect Telemetry</span>
          )
        }
        placement="right"
        width={420}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        extra={
          selectedEntity?.type === 'defect' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => setDispatchModalOpen(true)}
              style={{ background: '#0284c7' }}
            >
              Send to AI Optimizer
            </Button>
          )
        }
      >
        {/* Track Inspection */}
        {selectedEntity?.type === 'track' && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Corridor Name">
              <strong style={{ color: '#0284c7' }}>{selectedEntity.data.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Track ID">
              <Tag color="blue">{selectedEntity.data.trackId}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Data Quality">
              {selectedEntity.data.dataQuality === 'approximate' ? (
                <Tag color="orange">Approximate (station-to-station estimate)</Tag>
              ) : (
                <Tag color="green">Verified Corridor Geometry</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Division / Zone">
              {selectedEntity.data.division} Division ({selectedEntity.data.zone})
            </Descriptions.Item>
            <Descriptions.Item label="Corridor Route">
              {selectedEntity.data.sourceStationName} &rarr; {selectedEntity.data.destStationName}
            </Descriptions.Item>
            <Descriptions.Item label="Track Type">
              {selectedEntity.data.trackType}
            </Descriptions.Item>
            <Descriptions.Item label="Track Gauge">
              {selectedEntity.data.gauge}
            </Descriptions.Item>
            <Descriptions.Item label="Electrification">
              {selectedEntity.data.electrification}
            </Descriptions.Item>
            <Descriptions.Item label="Max Speed">
              {selectedEntity.data.maxSpeedKm ? `${selectedEntity.data.maxSpeedKm} km/h` : 'Not verified'}
            </Descriptions.Item>
            <Descriptions.Item label="Track Distance">
              {selectedEntity.data.distanceKm} KM
            </Descriptions.Item>
            <Descriptions.Item label="GIS Waypoints">
              {selectedEntity.data.coordinates?.length || selectedEntity.data.pointCount || 0} precision points
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="green">{selectedEntity.data.status || 'Operational'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Defect Inspection */}
        {selectedEntity?.type === 'defect' && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Defect ID">
              <Tag color="red" style={{ fontWeight: 800 }}>{selectedEntity.data.defectId}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              <Tag color="purple">{selectedEntity.data.deptLabel || selectedEntity.data.department}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Defect Type">
              <strong>{selectedEntity.data.defectType}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Severity Level">
              <Tag color={
                String(selectedEntity.data.severityLevel).toUpperCase().includes('CRITICAL') ? 'error' :
                String(selectedEntity.data.severityLevel).toUpperCase().includes('HIGH') ? 'warning' : 'default'
              }>
                {selectedEntity.data.severityLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority Score">
              {selectedEntity.data.priorityScore || 'N/A'}/100
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              KM {selectedEntity.data.chainageKm} ({selectedEntity.data.station1} &rarr; {selectedEntity.data.station2})
            </Descriptions.Item>
            <Descriptions.Item label="Section ID">
              {selectedEntity.data.sectionId}
            </Descriptions.Item>
            <Descriptions.Item label="Division / Zone">
              {selectedEntity.data.division} ({selectedEntity.data.zone})
            </Descriptions.Item>
            <Descriptions.Item label="Coordinates">
              {selectedEntity.data.latitude?.toFixed(4)}&deg; N, {selectedEntity.data.longitude?.toFixed(4)}&deg; E
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedEntity.data.status === 'Pending' ? 'orange' : 'green'}>{selectedEntity.data.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Work Duration">
              {selectedEntity.data.workDurationHrs} Hours
            </Descriptions.Item>
            <Descriptions.Item label="Reported Date">
              {selectedEntity.data.reportedDate}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Station Inspection */}
        {selectedEntity?.type === 'station' && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Station Name">
              <strong style={{ color: '#1e3a8a' }}>{selectedEntity.data.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Station Code">
              <Tag color="geekblue">{selectedEntity.data.code}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="City / Division">
              {selectedEntity.data.city}, {selectedEntity.data.division} Division
            </Descriptions.Item>
            <Descriptions.Item label="Zone">
              {selectedEntity.data.zone}
            </Descriptions.Item>
            <Descriptions.Item label="Coordinates">
              {selectedEntity.data.lat?.toFixed(4)}&deg; N, {selectedEntity.data.lng?.toFixed(4)}&deg; E
            </Descriptions.Item>
            <Descriptions.Item label="Station Type">
              {selectedEntity.data.stationType || 'Junction'}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* Live Train Inspection */}
        {selectedEntity?.type === 'train' && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Train">
              <strong style={{ color: '#059669' }}>🚆 {selectedEntity.data.trainNumber} - {selectedEntity.data.trainName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Live Status">
              <Tag color="green">{selectedEntity.data.status || 'RUNNING'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Current Speed">
              {selectedEntity.data.speed || 0} km/h
            </Descriptions.Item>
            <Descriptions.Item label="Delay">
              {selectedEntity.data.delayMinutes ? `${selectedEntity.data.delayMinutes} mins delay` : 'Right Time (0 min)'}
            </Descriptions.Item>
            <Descriptions.Item label="Current Location">
              {selectedEntity.data.currentLocation?.stationName || 'En Route'} ({selectedEntity.data.currentLocation?.stationCode || ''})
            </Descriptions.Item>
            <Descriptions.Item label="Route">
              {selectedEntity.data.source?.name} &rarr; {selectedEntity.data.destination?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Last Update">
              {selectedEntity.data.lastUpdatedAt || 'Just now'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* Dispatch Defect Modal */}
      {selectedEntity?.type === 'defect' && (
        <DispatchDefectModal
          open={dispatchModalOpen}
          onClose={() => setDispatchModalOpen(false)}
          defectRecord={selectedEntity.data}
          department={selectedEntity.data.department || userRole}
          onDispatched={handleSendDefectToBDMS}
        />
      )}
    </div>
  );
};

export default GISInfrastructureMapPage;