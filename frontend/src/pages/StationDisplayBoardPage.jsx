import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Switch,
  Tag,
  Badge,
  Tooltip,
  Spin,
  Alert,
  Tabs,
  Empty,
  Statistic,
  Space,
  DatePicker
} from 'antd';
import {
  LineChartOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  NotificationOutlined,
  CloudOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  LockOutlined,
  ThunderboltOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRegion } from '../context/RegionContext';
import { useAuth } from '../context/AuthContext';
import { stationService } from '../services/stationService';
import { useNavigate } from 'react-router-dom';

export const StationDisplayBoardPage = () => {
  const { currentUser } = useAuth();
  const { selectedZone, selectedDivision } = useRegion();
  const navigate = useNavigate();

  // Read current user & division directly from localStorage / context
  const storedUser = useMemo(() => {
    try {
      const saved = localStorage.getItem('pragati_rail_user');
      return saved ? JSON.parse(saved) : currentUser;
    } catch {
      return currentUser;
    }
  }, [currentUser]);

  // Determine active operational division & zone strictly from user profile with fallback to region context
  const activeDivision = useMemo(() => {
    if (storedUser?.division) return storedUser.division;
    if (selectedDivision && selectedDivision !== 'ALL') return selectedDivision;
    return 'Chennai';
  }, [selectedDivision, storedUser]);

  const activeZone = useMemo(() => {
    if (storedUser?.zone) return storedUser.zone;
    if (selectedZone && selectedZone !== 'ALL') return selectedZone;
    return 'Southern Railway';
  }, [selectedZone, storedUser]);

  // State
  const todayDate = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(todayDate || '2026-09-07');
  const [displayData, setDisplayData] = useState(null);
  const [loadingDisplay, setLoadingDisplay] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState('ALL');
  const [trainFilter, setTrainFilter] = useState('');

  // 1. Live Digital Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 2. Fetch Divisional Real-time Display Board Data
  const fetchDisplayBoard = () => {
    setLoadingDisplay(true);
    stationService.getDivisionalDisplay({
      division: activeDivision,
      zone: activeZone,
      date: selectedDate
    })
    .then(res => {
      setDisplayData(res);
      setLastRefreshed(new Date());
    })
    .catch(err => {
      console.error('Error fetching divisional display board:', err);
    })
    .finally(() => {
      setLoadingDisplay(false);
    });
  };

  useEffect(() => {
    fetchDisplayBoard();
  }, [activeDivision, activeZone, selectedDate]);

  // 3. 30-sec Auto Refresh Timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      fetchDisplayBoard();
    }, 30000);

    return () => clearInterval(timer);
  }, [autoRefresh, activeDivision, activeZone, selectedDate]);

  // Filter trains by tab and train name/number search, strictly filtering out any record with missing/empty Sched Time
  const filteredTrains = useMemo(() => {
    if (!displayData) return [];
    let list = [];

    if (activeTab === 'ARRIVALS') {
      list = (displayData.arrivals || displayData.trains || [])
        .filter(t => t.scheduledArrival && t.scheduledArrival !== '--:--')
        .sort((a, b) => (a.scheduledArrival || '').localeCompare(b.scheduledArrival || ''));
    } else if (activeTab === 'DEPARTURES') {
      list = (displayData.departures || displayData.trains || [])
        .filter(t => t.scheduledDeparture && t.scheduledDeparture !== '--:--')
        .sort((a, b) => (a.scheduledDeparture || '').localeCompare(b.scheduledDeparture || ''));
    } else if (activeTab === 'DELAYED') {
      list = (displayData.delayed || displayData.trains || [])
        .filter(t => (t.scheduledArrival !== '--:--' || t.scheduledDeparture !== '--:--') && (t.delayMinutes > 0 || t.status === 'DELAYED'))
        .sort((a, b) => b.delayMinutes - a.delayMinutes);
    } else {
      list = (displayData.trains || [])
        .filter(t => t.scheduledArrival !== '--:--' || t.scheduledDeparture !== '--:--');
    }

    if (trainFilter.trim()) {
      const q = trainFilter.toLowerCase().trim();
      list = list.filter(t =>
        t.trainNo?.toLowerCase().includes(q) ||
        t.trainName?.toLowerCase().includes(q) ||
        t.source?.toLowerCase().includes(q) ||
        t.destination?.toLowerCase().includes(q) ||
        t.stationName?.toLowerCase().includes(q) ||
        t.stationCode?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [displayData, activeTab, trainFilter]);

  const divisionTitle = displayData?.division ? `${displayData.division.toUpperCase()} DIVISION` : `${activeDivision.toUpperCase()} DIVISION`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <LineChartOutlined style={{ color: '#d97706' }} /> Station Passenger Information Display System (PIDS)
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: 0, fontSize: 13 }}>
            Real-time divisional train timetable matrix feed for <strong>{divisionTitle}</strong> • Indian Railways National Database
          </p>
        </div>

        <Space size="middle" wrap>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Date:</span>
            <Select
              value={selectedDate}
              onChange={setSelectedDate}
              style={{ width: 150 }}
              options={[
                { value: '2026-09-02', label: '02 Sep 2026' },
                { value: '2026-09-03', label: '03 Sep 2026' },
                { value: '2026-09-04', label: '04 Sep 2026' },
                { value: '2026-09-05', label: '05 Sep 2026' },
                { value: '2026-09-06', label: '06 Sep 2026' },
                { value: '2026-09-07', label: '07 Sep 2026 (Today)' },
                { value: '2026-09-08', label: '08 Sep 2026' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>30s Auto Refresh:</span>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
          </div>

          <Button
            type="primary"
            icon={<ReloadOutlined spin={loadingDisplay} />}
            onClick={fetchDisplayBoard}
            style={{ background: '#059669', borderColor: '#059669' }}
          >
            Refresh Feed
          </Button>
        </Space>
      </div>

      {/* Full-Width Authentic Indian Railways PIDS LED Board */}
      <div
        className="led-container-bg"
        style={{
          borderRadius: 12,
          padding: '24px 28px',
          background: '#1f2937',
          border: '2px solid #222',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* LED Top Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px dashed #333',
            paddingBottom: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div className="led-board-font led-amber-text" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '1px' }}>
              INDIAN RAILWAYS • {divisionTitle} ({activeZone})
            </div>
            <div className="led-board-font" style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>
              OPERATIONAL DIVISION: {activeDivision?.toUpperCase()} • ALL DIVISIONAL CORRIDOR MOVEMENTS (CROSSING / ARRIVING / DEPARTING) • DATE: {selectedDate}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="led-board-font led-amber-text" style={{ fontSize: 30, fontWeight: 800 }}>
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
            <div className="led-board-font" style={{ color: '#9ca3af', fontSize: 12 }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Scrolling Live Marquee Announcement */}
        <div
          style={{
            background: '#111827',
            border: '1px solid #262626',
            padding: '8px 16px',
            borderRadius: 6,
            marginBottom: 20,
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          <span className="led-board-font led-amber-text marquee-scroll" style={{ fontSize: 14 }}>
            *** PASSENGER &amp; CONTROLLER ADVISORY: REAL-TIME TRAIN TIMETABLE FEED SYNCED FOR {divisionTitle}. PLATFORM ASSIGNMENTS UPDATED AUTOMATICALLY. ACTIVE SPEED RESTRICTIONS APPLIED ON SELECT CORRIDORS. ***
          </span>
        </div>

        {/* PIDS Filter & Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[
              { key: 'ALL', label: <span className="led-board-font" style={{ color: '#ffb700', fontSize: 14 }}>ALL TRAINS ({displayData?.trains?.length || 0})</span> },
              { key: 'ARRIVALS', label: <span className="led-board-font" style={{ color: '#00ff66', fontSize: 14 }}>ARRIVALS ({displayData?.arrivals?.length || 0}) / आगमन</span> },
              { key: 'DEPARTURES', label: <span className="led-board-font" style={{ color: '#38bdf8', fontSize: 14 }}>DEPARTURES ({displayData?.departures?.length || 0}) / प्रस्थान</span> },
              { key: 'DELAYED', label: <span className="led-board-font" style={{ color: '#ef4444', fontSize: 14 }}>DELAYED ({displayData?.delayed?.length || displayData?.summary?.delayedTrains || 0})</span> }
            ]}
          />

          <Input
            placeholder="Search train no / name / station / destination..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={trainFilter}
            onChange={e => setTrainFilter(e.target.value)}
            allowClear
            style={{ width: 320, background: '#243244', borderColor: '#333', color: '#ffb700' }}
          />
        </div>

        {/* PIDS LED Table Matrix: Scrollable container showing ~10 schedules initially with smooth internal scrolling */}
        <div className="led-table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#111827' }}>
              <tr style={{ borderBottom: '2px solid #ffb700', color: '#ffb700', fontSize: 13, textTransform: 'uppercase', background: '#111827' }} className="led-board-font">
                <th style={{ padding: '12px 10px', width: 75, background: '#111827' }}>PF</th>
                <th style={{ padding: '12px 10px', width: 95, background: '#111827' }}>TRAIN NO</th>
                <th style={{ padding: '12px 10px', background: '#111827' }}>TRAIN NAME</th>
                <th style={{ padding: '12px 10px', width: 140, background: '#111827' }}>STATION</th>
                <th style={{ padding: '12px 10px', background: '#111827' }}>ORIGIN ➔ DESTINATION</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: 110, background: '#111827' }}>
                  {activeTab === 'ARRIVALS' ? 'SCHED ARRIVAL' : activeTab === 'DEPARTURES' ? 'SCHED DEPARTURE' : 'SCHED TIME'}
                </th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: 110, background: '#111827' }}>
                  {activeTab === 'ARRIVALS' ? 'EXP ARRIVAL' : activeTab === 'DEPARTURES' ? 'EXP DEPARTURE' : 'EXPECTED'}
                </th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: 80, background: '#111827' }}>DELAY</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', width: 130, background: '#111827' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loadingDisplay ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 50 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Spin size="large" />
                      <span className="led-board-font" style={{ color: '#ffb700', fontSize: 13 }}>
                        Loading real-time timetable feed from MongoDB for this division...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredTrains.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#666' }} className="led-board-font">
                    NO TRAINS SCHEDULED IN THIS DIVISION ON {selectedDate}
                  </td>
                </tr>
              ) : (
                filteredTrains.map((train, idx) => {
                  const isDelayed = train.delayMinutes > 0;
                  const statusColor = train.status === 'ON TIME'
                    ? '#00ff66'
                    : isDelayed
                    ? '#ef4444'
                    : '#38bdf8';

                  const schedDisplay = activeTab === 'ARRIVALS'
                    ? (train.scheduledArrival !== '--:--' ? train.scheduledArrival : 'ORIGIN')
                    : activeTab === 'DEPARTURES'
                    ? (train.scheduledDeparture !== '--:--' ? train.scheduledDeparture : 'TERMINUS')
                    : (train.scheduledArrival !== '--:--' ? train.scheduledArrival : train.scheduledDeparture);

                  const expDisplay = activeTab === 'ARRIVALS'
                    ? (train.expectedArrival !== '--:--' ? train.expectedArrival : 'ORIGIN')
                    : activeTab === 'DEPARTURES'
                    ? (train.expectedDeparture !== '--:--' ? train.expectedDeparture : 'TERMINUS')
                    : (train.expectedArrival !== '--:--' ? train.expectedArrival : train.expectedDeparture);

                  return (
                    <tr
                      key={train.id || idx}
                      style={{
                        borderBottom: '1px solid #1a1a1a',
                        background: idx % 2 === 0 ? '#263442' : '#1f2b38',
                        transition: 'background 0.2s'
                      }}
                    >
                      {/* Platform */}
                      <td style={{ padding: '10px 10px' }}>
                        <span
                          className="led-board-font"
                          style={{
                            background: '#ffb700',
                            color: '#000000',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 13
                          }}
                        >
                          PF {String(train.platform).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Train No */}
                      <td style={{ padding: '10px 10px' }} className="led-board-font led-amber-text">
                        <strong>{train.trainNo}</strong>
                      </td>

                      {/* Train Name */}
                      <td style={{ padding: '10px 10px', color: '#ffffff', fontWeight: 600 }} className="led-board-font">
                        {train.trainName}
                      </td>

                      {/* Station */}
                      <td style={{ padding: '10px 10px' }}>
                        <Tag color="geekblue" style={{ fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
                          {train.stationCode}
                        </Tag>
                        <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 6 }}>
                          {train.stationName}
                        </span>
                      </td>

                      {/* Origin / Dest */}
                      <td style={{ padding: '10px 10px', color: '#d1d5db', fontSize: 12 }} className="led-board-font">
                        {train.source} <span style={{ color: '#ffb700' }}>➔</span> {train.destination}
                      </td>

                      {/* Sched Time */}
                      <td style={{ padding: '10px 10px', textAlign: 'center', color: '#9ca3af' }} className="led-board-font">
                        {schedDisplay}
                      </td>

                      {/* Expected Time */}
                      <td
                        style={{
                          padding: '10px 10px',
                          textAlign: 'center',
                          color: isDelayed ? '#ef4444' : '#00ff66',
                          fontWeight: 700
                        }}
                        className="led-board-font"
                      >
                        {expDisplay}
                      </td>

                      {/* Delay */}
                      <td style={{ padding: '10px 10px', textAlign: 'center' }} className="led-board-font">
                        {isDelayed ? (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>+{train.delayMinutes}m</span>
                        ) : (
                          <span style={{ color: '#00ff66' }}>0m</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 10px', textAlign: 'right' }} className="led-board-font">
                        <span
                          style={{
                            color: statusColor,
                            fontWeight: 800,
                            fontSize: 12,
                            letterSpacing: '0.5px'
                          }}
                        >
                          ● {train.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* LED Footer Status & Scroll Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, color: '#9ca3af', fontSize: 12, flexWrap: 'wrap', gap: 8 }} className="led-board-font">
          <span>Active Scope: <strong>{filteredTrains.length}</strong> train schedules in {activeDivision} Division</span>
          <span style={{ color: '#ffb700' }}>↕ Scroll inside board to navigate schedules (10 visible per viewport)</span>
        </div>
      </div>

      {/* Summary Statistics Bar */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic
              title="Total Scheduled Trains"
              value={displayData?.summary?.totalTrains || displayData?.trains?.length || 0}
              valueStyle={{ color: '#0284c7', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic
              title="On-Time Performance"
              value={displayData?.summary?.onTimePct || 92}
              suffix="%"
              valueStyle={{ color: '#059669', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic
              title="Delayed Trains"
              value={displayData?.summary?.delayedTrains || 0}
              valueStyle={{ color: '#d97706', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Statistic
              title="Avg. Delay Window"
              value={displayData?.summary?.avgDelayMinutes || 0}
              suffix="mins"
              valueStyle={{ color: '#7c3aed', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Auxiliary Real-Time Operations Telemetry */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card size="small" title={<><CloudOutlined /> Divisional Weather &amp; Signal Visibility</>} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Division Scope: <strong>{divisionTitle}</strong></div>
              <div>Weather: <strong>Optimal Atmospheric Conditions (30°C)</strong></div>
              <div>Signal Visibility Index: <strong>99.4% Green Corridor</strong></div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title={<><NotificationOutlined /> Active Block Traffic Advisory</>} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Corridor: <strong>{activeDivision} Section Main Lines</strong></div>
              <div>Maintenance Window: <strong>02:00 - 05:30 (Scheduled Night)</strong></div>
              <div>Traffic Speed Restriction: <strong>Controlled 30 km/h at Maintenance Zones</strong></div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card size="small" title={<><CheckCircleOutlined /> COA Database Sync</>} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>MongoDB Dataset: <Tag color="success">1,302,798 Records Active</Tag></div>
              <div>Last Synced: <strong>{lastRefreshed.toLocaleTimeString()}</strong></div>
              <div>Schedule Date: <strong>{selectedDate}</strong></div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
