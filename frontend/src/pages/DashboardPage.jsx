import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Space, Progress, Tooltip, Spin, Alert } from 'antd';
import {
  RocketOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MergeCellsOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  RightOutlined,
  GlobalOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/common/StatCard';
import { useRegion } from '../context/RegionContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedZone,
    selectedDivision
  } = useRegion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState({
    dynamicStats: {
      totalDefects: 37,
      totalDefectsTrend: '+4.8%',
      pendingBlocks: 25,
      pendingBlocksTrend: '-8.3%',
      approvedBlocks: 4,
      approvedBlocksTrend: '+15.4%',
      emergencyBlocks: 12,
      emergencyBlocksTrend: '-12.5%',
      blockHoursSaved: 24.5,
      blockHoursSavedTrend: '+22.1%',
      tasksMerged: 4,
      tasksMergedTrend: '+18.0%'
    },
    zonalMatrix: [],
    topPriorityTasks: [],
    recentAlerts: []
  });

  const fetchOverviewDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const zoneParam = selectedZone || 'ALL';
      const divParam = selectedDivision || 'ALL';
      const res = await apiClient.get(`/overview/dashboard?zone=${encodeURIComponent(zoneParam)}&division=${encodeURIComponent(divParam)}`);
      if (res.data?.success) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.error('Error fetching overview dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load real-time overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewDashboard();
  }, [selectedZone, selectedDivision, user]);

  const { dynamicStats, zonalMatrix, topPriorityTasks, recentAlerts } = overviewData;

  const deptTag = (dept) => {
    const d = String(dept || '').toUpperCase();
    switch (d) {
      case 'TMS': return <Tag color="blue" icon={<ToolOutlined />}>TMS Track</Tag>;
      case 'SMMS': return <Tag color="gold" icon={<ThunderboltOutlined />}>SMMS Signal</Tag>;
      case 'TDMS': return <Tag color="purple" icon={<BlockOutlined />}>TDMS OHE</Tag>;
      default: return <Tag color="default">{dept}</Tag>;
    }
  };

  const severityTag = (severity) => {
    const s = String(severity || '').toUpperCase();
    switch (s) {
      case 'CRITICAL': return <Tag color="error">Critical (S1)</Tag>;
      case 'HIGH': return <Tag color="warning">High (S2)</Tag>;
      case 'MEDIUM': return <Tag color="processing">Medium (S3)</Tag>;
      default: return <Tag color="default">Low (S4)</Tag>;
    }
  };

  const columns = [
    {
      title: 'Defect ID',
      dataIndex: 'id',
      key: 'id',
      render: text => <strong style={{ fontFamily: 'monospace', color: '#1e3a8a' }}>{text}</strong>
    },
    {
      title: 'Zone / Div',
      key: 'zoneDiv',
      render: (_, r) => <Tag color="geekblue">{r.zone} / {r.division}</Tag>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: dept => deptTag(dept)
    },
    {
      title: 'Defect / Work Item',
      dataIndex: 'defectType',
      key: 'defectType',
      render: text => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Location / Corridor',
      dataIndex: 'location',
      key: 'location',
      render: text => <span style={{ fontSize: 12, color: '#475569' }}>{text}</span>
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: sev => severityTag(sev)
    },
    {
      title: 'AI Priority Score',
      dataIndex: 'priorityScore',
      key: 'priorityScore',
      sorter: (a, b) => a.priorityScore - b.priorityScore,
      render: score => (
        <Space style={{ minWidth: 120 }}>
          <Progress
            percent={Number(Number(score || 50).toFixed(0))}
            size="small"
            status={score > 85 ? 'exception' : score > 70 ? 'active' : 'normal'}
            strokeColor={score > 85 ? '#dc2626' : score > 70 ? '#d97706' : '#059669'}
          />
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const s = String(status || '');
        if (s.includes('Merged') || s.includes('Joint')) return <Tag color="success" icon={<MergeCellsOutlined />}>Joint Merged</Tag>;
        if (s.includes('Approved')) return <Tag color="blue" icon={<CheckCircleOutlined />}>Approved</Tag>;
        if (s.includes('Emergency') || s.includes('Critical')) return <Tag color="volcano">Emergency S1</Tag>;
        return <Tag color="gold">Pending</Tag>;
      }
    }
  ];

  const zonalMatrixColumns = [
    { title: 'Zone Code', dataIndex: 'zone', key: 'zone', render: z => <strong style={{ color: '#1e3a8a' }}>{z}</strong> },
    { title: 'Zone Name', dataIndex: 'zoneName', key: 'zoneName' },
    { title: 'Total Defects', dataIndex: 'totalDefects', key: 'totalDefects' },
    { title: 'Pending Blocks', dataIndex: 'pendingBlocks', key: 'pendingBlocks' },
    { title: 'Approved Blocks', dataIndex: 'approvedBlocks', key: 'approvedBlocks', render: a => <Tag color="blue">{a}</Tag> },
    { title: 'Block Hours Saved', dataIndex: 'hoursSaved', key: 'hoursSaved', render: h => <strong style={{ color: '#059669' }}>{h} hrs</strong> },
    { title: 'Joint Merge Rate', dataIndex: 'mergeRate', key: 'mergeRate', render: m => <Tag color="success">{m}</Tag> },
    { title: 'Critical S1', dataIndex: 'criticalDefects', key: 'criticalDefects', render: c => <Tag color="error">{c} S1</Tag> }
  ];

  const scopeLabel = selectedZone === 'ALL'
    ? 'All India National View (19 Zones)'
    : selectedDivision === 'ALL'
      ? `${selectedZone} Zonal View`
      : `${selectedDivision} Division (${selectedZone}) View`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Title & Quick Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          paddingBottom: 18,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', letterSpacing: '-0.3px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <GlobalOutlined style={{ fontSize: 18 }} />
            </span>
            Indian Railways Joint Block Dashboard
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 13.5 }}>
            Active Scope: <strong style={{ color: '#334155' }}>{scopeLabel}</strong> · Multi-department maintenance optimization oversight
          </p>
        </div>

        <Space size="middle" style={{ flexWrap: 'wrap' }}>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 0,
              fontWeight: 600,
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28)'
            }}
            onClick={() => navigate('/bdms-planner')}
          >
            Run Joint Optimization
          </Button>
          <Button icon={<UnorderedListOutlined />} style={{ borderRadius: 8 }} onClick={() => navigate('/tms')}>
            View All Tasks
          </Button>
          <Button icon={<FileTextOutlined />} style={{ borderRadius: 8 }} onClick={() => navigate('/reports')}>
            Generate Report
          </Button>
          <Button icon={<AlertOutlined />} danger style={{ borderRadius: 8 }} onClick={() => navigate('/alerts')}>
            Manage Alerts
          </Button>
          <Button icon={<ReloadOutlined />} style={{ borderRadius: 8 }} onClick={fetchOverviewDashboard} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          closable
          message="Error Loading Live Metrics"
          description={error}
          style={{ borderRadius: 10 }}
        />
      )}

      {/* Dynamic Stat Cards Grid */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Total Defects"
              value={dynamicStats?.totalDefects || 0}
              trend={dynamicStats?.totalDefectsTrend || '+4.8%'}
              icon={<ToolOutlined />}
              color="#1e3a8a"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Pending Blocks"
              value={dynamicStats?.pendingBlocks || 0}
              trend={dynamicStats?.pendingBlocksTrend || '-8.3%'}
              trendType="down"
              icon={<ClockCircleOutlined />}
              color="#d97706"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Approved Blocks"
              value={dynamicStats?.approvedBlocks || 0}
              trend={dynamicStats?.approvedBlocksTrend || '+15.4%'}
              icon={<CheckCircleOutlined />}
              color="#0284c7"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Emergency S1"
              value={dynamicStats?.emergencyBlocks || 0}
              trend={dynamicStats?.emergencyBlocksTrend || '-12.5%'}
              trendType="down"
              icon={<ExclamationCircleOutlined />}
              color="#dc2626"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Block Hours Saved"
              value={dynamicStats?.blockHoursSaved || 0}
              suffix="hrs"
              trend={dynamicStats?.blockHoursSavedTrend || '+22.1%'}
              icon={<ClockCircleOutlined />}
              color="#059669"
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div style={{ width: '100%', height: 168, display: 'flex' }}>
            <StatCard
              title="Tasks Merged"
              value={dynamicStats?.tasksMerged || 0}
              trend={dynamicStats?.tasksMergedTrend || '+18.0%'}
              icon={<MergeCellsOutlined />}
              color="#7c3aed"
            />
          </div>
        </Col>
      </Row>


      {/* All India Zonal Performance Matrix Card (Shown in National or Zonal View) */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              <GlobalOutlined style={{ color: '#0284c7', marginRight: 8 }} /> All India Zonal Joint Block Performance Matrix
            </span>
            <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>Railway Board Oversight</Tag>
          </div>
        }
        style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}
      >
        <Table
          columns={zonalMatrixColumns}
          dataSource={zonalMatrix}
          rowKey="zone"
          pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
          loading={loading}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Priority Tasks Table & Recent Alerts Panel */}
      <Row gutter={[20, 20]} align="stretch">
        <Col xs={24} lg={16} style={{ display: 'flex' }}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>Top Priority Maintenance Defects ({scopeLabel})</span>
                <Button type="link" style={{ paddingRight: 0 }} onClick={() => navigate('/ai-responses')}>
                  View Explainability Model <RightOutlined />
                </Button>
              </div>
            }
            style={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Table
              columns={columns}
              dataSource={topPriorityTasks}
              rowKey="id"
              pagination={{ pageSize: 8, showSizeChanger: false, size: 'small' }}
              loading={loading}
              size="middle"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8} style={{ display: 'flex' }}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  <AlertOutlined /> Recent System Alerts
                </span>
                <Button type="link" style={{ paddingRight: 0 }} onClick={() => navigate('/alerts')}>View All</Button>
              </div>
            }
            style={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flex: 1,
                minHeight: 0,
                maxHeight: 460,
                overflowY: 'auto',
                paddingRight: 4
              }}
            >
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/alerts')}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: alert.severity === 'Critical' ? 'rgba(220, 38, 38, 0.05)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    className="hover-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      {severityTag(alert.severity)}
                      <Tag color="geekblue" style={{ borderRadius: 6 }}>{alert.zone} / {alert.division}</Tag>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{alert.title}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>{alert.location}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#64748b', margin: 'auto' }}>
                  No critical safety alerts in selected scope.
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};