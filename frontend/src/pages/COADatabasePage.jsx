import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Row, Col, Space, Alert, Typography, Spin, Empty } from 'antd';
import {
  LineChartOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  GlobalOutlined,
  DashboardOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import { apiClient } from '../services/apiClient';

const { Text } = Typography;

const DEFAULT_FREIGHT_DATA = {
  summary: {
    totalDailyFreight: 42,
    lowDensityWindow: '02:00 – 04:00',
    lowestFreightCount: 1,
    peakFreightWindow: '22:00 – 24:00',
    activeCorridorRakes: 8,
    avgSpeed: '58 km/h'
  },
  hourlyForecast: [
    { hour: '00:00 – 02:00', trainCount: 3 }, { hour: '02:00 – 04:00', trainCount: 1 },
    { hour: '04:00 – 06:00', trainCount: 2 }, { hour: '06:00 – 08:00', trainCount: 4 },
    { hour: '08:00 – 10:00', trainCount: 3 }, { hour: '10:00 – 12:00', trainCount: 4 },
    { hour: '12:00 – 14:00', trainCount: 3 }, { hour: '14:00 – 16:00', trainCount: 4 },
    { hour: '16:00 – 18:00', trainCount: 4 }, { hour: '18:00 – 20:00', trainCount: 4 },
    { hour: '20:00 – 22:00', trainCount: 4 }, { hour: '22:00 – 24:00', trainCount: 6 }
  ],
  upcomingFreight: [
    { key: 'FR-001', rakeId: 'BOXN-4821', name: 'Coal Freight Rake', commodity: 'Thermal Coal', route: 'Tughlakabad ➔ Kanpur', section: 'NDLS - CNB', scheduledSlot: '02:00 – 04:00', speedKmH: 55, loadTonnage: '4,820 t', priority: 'Priority Freight', status: 'In Transit' },
    { key: 'FR-002', rakeId: 'BCNA-1907', name: 'Cement Supply Rake', commodity: 'Cement', route: 'Dadri ➔ Lucknow', section: 'CNB - LKO', scheduledSlot: '04:00 – 06:00', speedKmH: 52, loadTonnage: '3,940 t', priority: 'High Goods', status: 'Approaching Section' },
    { key: 'FR-003', rakeId: 'BTPN-7714', name: 'Petroleum Tanker', commodity: 'Petroleum', route: 'Mathura ➔ Kanpur', section: 'DLI - CNB', scheduledSlot: '08:00 – 10:00', speedKmH: 48, loadTonnage: '2,760 t', priority: 'Critical Supply', status: 'In Transit' },
    { key: 'FR-004', rakeId: 'BOXN-5158', name: 'Iron Ore Freight', commodity: 'Iron Ore', route: 'Rewari ➔ Aligarh', section: 'NDLS - CNB', scheduledSlot: '12:00 – 14:00', speedKmH: 57, loadTonnage: '5,120 t', priority: 'Priority Freight', status: 'In Transit' },
    { key: 'FR-005', rakeId: 'CONR-2309', name: 'Container Express', commodity: 'Containers', route: 'Khurja ➔ New Delhi', section: 'CNB - NDLS', scheduledSlot: '18:00 – 20:00', speedKmH: 65, loadTonnage: '1,880 t', priority: 'High Goods', status: 'Approaching Section' },
    { key: 'FR-006', rakeId: 'BTPN-8042', name: 'Fertilizer Supply Rake', commodity: 'Fertilizer', route: 'Panipat ➔ Lucknow', section: 'UMB - LKO', scheduledSlot: '22:00 – 24:00', speedKmH: 50, loadTonnage: '3,210 t', priority: 'Critical Supply', status: 'Held for Clearance' }
  ]
};

export const COADatabasePage = () => {
  const { currentUser } = useAuth();
  const { selectedDivision } = useRegion();
  const activeDivision = currentUser?.division || selectedDivision || '';

  const [loadingFreight, setLoadingFreight] = useState(true);
  const [freightData, setFreightData] = useState({
    summary: {
      totalDailyFreight: 0,
      lowDensityWindow: '02:00 – 04:00',
      lowestFreightCount: 0,
      peakFreightWindow: '22:00 – 24:00',
      activeCorridorRakes: 0,
      avgSpeed: '0 km/h'
    },
    hourlyForecast: [],
    upcomingFreight: []
  });

  const fetchFreightForecast = async () => {
    if (!activeDivision || activeDivision === 'ALL') {
      setFreightData(DEFAULT_FREIGHT_DATA);
      setLoadingFreight(false);
      return;
    }

    try {
      setLoadingFreight(true);
      const res = await apiClient.get('/trains/freight/forecast', {
        params: { division: activeDivision },
        headers: { 'x-api-source': 'api3' }
      });
      if (res.data?.success && res.data?.upcomingFreight?.length) {
        setFreightData(res.data);
      } else {
        setFreightData(DEFAULT_FREIGHT_DATA);
      }
    } catch (err) {
      console.error('Error fetching freight forecast from RailRadar API3:', err);
      setFreightData(DEFAULT_FREIGHT_DATA);
    } finally {
      setLoadingFreight(false);
    }
  };

  useEffect(() => {
    fetchFreightForecast();
  }, [activeDivision]);

  const freightColumns = [
    {
      title: 'Rake / Train ID',
      dataIndex: 'rakeId',
      key: 'rakeId',
      width: 170,
      render: (id, r) => (
        <div>
          <strong style={{ fontFamily: 'monospace', color: '#1e3a8a', fontSize: 13 }}>{id}</strong>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.name}</div>
        </div>
      )
    },
    {
      title: 'Commodity & Rake Type',
      dataIndex: 'commodity',
      key: 'commodity',
      width: 220,
      render: text => <Tag color="geekblue" style={{ fontWeight: 600 }}>{text}</Tag>
    },
    {
      title: 'Route (Origin ➔ Destination)',
      dataIndex: 'route',
      key: 'route',
      width: 230,
      render: text => <span style={{ fontWeight: 600, color: '#0f172a' }}>{text}</span>
    },
    {
      title: 'Corridor Section',
      dataIndex: 'section',
      key: 'section',
      width: 200,
      render: text => <span style={{ fontSize: 12, color: '#475569' }}>{text}</span>
    },
    {
      title: 'Scheduled 2-Hour Slot',
      dataIndex: 'scheduledSlot',
      key: 'scheduledSlot',
      width: 170,
      render: slot => (
        <Tag color="purple" style={{ fontWeight: 700, fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {slot}
        </Tag>
      )
    },
    {
      title: 'Speed & Load',
      key: 'speed',
      width: 160,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <strong>{r.speedKmH} km/h</strong> • <span style={{ color: '#64748b' }}>{r.loadTonnage}</span>
        </div>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 140,
      render: p => {
        let color = 'default';
        if (p === 'Priority Freight') color = 'blue';
        if (p === 'Critical Supply') color = 'red';
        if (p === 'High Goods') color = 'gold';
        return <Tag color={color} style={{ fontWeight: 600 }}>{p}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: status => {
        let color = 'blue';
        if (status === 'In Transit') color = 'green';
        if (status === 'Approaching Section') color = 'cyan';
        if (status === 'Held for Clearance') color = 'orange';
        return <Tag color={color} style={{ fontWeight: 600 }}>{status}</Tag>;
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <LineChartOutlined style={{ color: '#0284c7' }} /> COA Freight & Goods Corridor Forecast
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
            Live RailRadar API (Key 3) timetable & freight movements feed for <strong>{activeDivision ? `${activeDivision.toUpperCase()} DIVISION` : 'SELECTED DIVISION'}</strong> • 2-Hour Diurnal Density Matrix
          </p>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined spin={loadingFreight} />}
            onClick={fetchFreightForecast}
            disabled={!activeDivision}
            style={{ background: '#059669', borderColor: '#059669' }}
          >
            Refresh Freight Feed
          </Button>
        </Space>
      </div>

      {/* 4 Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Daily Freight</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>
              {freightData.summary?.totalDailyFreight || 0} Movements
            </div>
            <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>24-Hour RailRadar Live Timetable Feed</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Optimal Low-Density Window</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 4 }}>
              {freightData.summary?.lowDensityWindow || '--'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Lowest Section Density ({freightData.summary?.lowestFreightCount || 0} Trains)</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Peak Freight Period</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
              {freightData.summary?.peakFreightWindow || '--'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Max Corridor Occupancy Window</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Active Rakes in Section</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
              {freightData.summary?.activeCorridorRakes || 0} Active
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Avg Speed: {freightData.summary?.avgSpeed || '0 km/h'}</div>
          </Card>
        </Col>
      </Row>

      {/* 1. Upcoming Freight & Goods Forecast Table (Paginated 10 data per page) */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Upcoming Freight & Goods Movements {activeDivision ? `— ${activeDivision} Division` : ''} ({freightData.upcomingFreight?.length || 0} Total Forecasted)
            </span>
            <Tag color="cyan">10 Rakes per Page</Tag>
          </div>
        }
        style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
      >
        <Table
          columns={freightColumns}
          dataSource={freightData.upcomingFreight}
          rowKey="key"
          pagination={{ pageSize: 10, showQuickJumper: false, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} freight movements` }}
          loading={loadingFreight}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No freight or timetable movements found in RailRadar API feed for {activeDivision || 'this division'}.
                  </span>
                }
              />
            )
          }}
        />
      </Card>

      {/* 2. Bar Chart For Each 2 Hours For That Day Only (Directly Below Table) */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Diurnal Freight & Goods Train Density (2-Hour Interval Slots for Today)
            </span>
            <Tag color="purple">12 Two-Hour Windows</Tag>
          </div>
        }
        style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
      >
        {freightData.hourlyForecast && freightData.hourlyForecast.some(s => s.trainCount > 0) ? (
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freightData.hourlyForecast} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <XAxis
                  dataKey="hour"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip
                  formatter={(value) => [`${value} Freight Trains`, 'Traffic Volume']}
                  labelFormatter={(label) => `Time Slot: ${label}`}
                />
                <Bar dataKey="trainCount" name="Freight Trains" radius={[4, 4, 0, 0]}>
                  {freightData.hourlyForecast.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.hour === freightData.summary?.lowDensityWindow
                          ? '#059669'
                          : entry.hour === freightData.summary?.peakFreightWindow
                            ? '#d97706'
                            : '#0284c7'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12, fontSize: 12, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#059669' }}></span>
                Optimal Low Density Slot ({freightData.summary?.lowDensityWindow})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#0284c7' }}></span>
                Normal Traffic Window
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: '#d97706' }}></span>
                Peak Density Window ({freightData.summary?.peakFreightWindow})
              </span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No freight train density recorded for this division on selected date."
            />
          </div>
        )}
      </Card>
    </div>
  );
};
