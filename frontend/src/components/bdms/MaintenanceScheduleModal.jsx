import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Row,
  Col,
  Card,
  Button,
  Tag,
  Segmented,
  Table,
  Select,
  Space,
  Badge,
  Tooltip,
  Popover,
  Spin,
  Empty,
  Alert,
  Descriptions,
  Progress,
  Divider
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  BlockOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { blockService } from '../../services/blockService';

const TIME_MARKS = [
  '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
];

const DEPT_CONFIG = {
  TMS: {
    name: 'TMS (Track)',
    label: 'Track Maintenance',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: 'blue',
    icon: <ToolOutlined style={{ color: '#1e40af' }} />
  },
  SMMS: {
    name: 'SMMS (Signal)',
    label: 'Signal & Interlocking',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    badge: 'orange',
    icon: <SafetyCertificateOutlined style={{ color: '#d97706' }} />
  },
  TDMS: {
    name: 'TDMS (Traction)',
    label: 'Traction Distribution (OHE)',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    badge: 'purple',
    icon: <ThunderboltOutlined style={{ color: '#7c3aed' }} />
  }
};

export const MaintenanceScheduleModal = ({
  open,
  onClose,
  initialDivision = 'ALL',
  initialSection = 'ALL',
  initialDate = 'ALL'
}) => {
  const [activeTab, setActiveTab] = useState('24-Hour Schedule');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Backend response data
  const [scheduleData, setScheduleData] = useState(null);
  const [selectedBlockDetail, setSelectedBlockDetail] = useState(null);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (initialDivision && initialDivision !== 'ALL') {
        params.division = initialDivision;
      }
      if (selectedDate && selectedDate !== 'ALL') {
        params.date = selectedDate;
      }
      if (selectedSection && selectedSection !== 'ALL') {
        params.section = selectedSection;
      }
      if (selectedDept && selectedDept !== 'ALL') {
        params.department = selectedDept;
      }

      const res = await blockService.getMaintenanceSchedule(params);
      if (res && res.success !== false) {
        setScheduleData(res);
        // If initial date was ALL and dates exist, synchronize if unset
        if (selectedDate === 'ALL' && res.availableDates?.length > 0 && !params.date) {
          // keep ALL or set first date
        }
      } else {
        setError(res?.message || 'Failed to load maintenance schedule data');
      }
    } catch (err) {
      console.error('[MaintenanceScheduleModal] Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to BDMS Schedule API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSchedule();
    }
  }, [open, selectedDate, selectedSection, selectedDept, initialDivision]);

  // Derived filtered blocks
  const blocks = useMemo(() => {
    return scheduleData?.blocks || [];
  }, [scheduleData]);

  // Filtered by department for timeline rows
  const tmsBlocks = useMemo(() => {
    return blocks.filter(b => b.department === 'TMS' || (Array.isArray(b.departments) && b.departments.includes('TMS')));
  }, [blocks]);

  const smmsBlocks = useMemo(() => {
    return blocks.filter(b => b.department === 'SMMS' || (Array.isArray(b.departments) && b.departments.includes('SMMS')));
  }, [blocks]);

  const tdmsBlocks = useMemo(() => {
    return blocks.filter(b => b.department === 'TDMS' || (Array.isArray(b.departments) && b.departments.includes('TDMS')));
  }, [blocks]);

  // Department breakdown stats
  const deptBreakdown = scheduleData?.departmentBreakdown || {};
  const summary = scheduleData?.summary || {
    totalRequests: blocks.length,
    totalIndividualHours: 0,
    optimizedDurationHours: 0,
    hoursSaved: 0,
    savingsPercentage: 0,
    jointBlocksCount: 0,
    approvedCount: 0,
    pendingCount: 0
  };

  const renderBlockPopoverContent = (block) => {
    if (!block) return null;
    return (
      <div style={{ width: 320, padding: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: 13 }}>{block.blockId}</strong>
          <Tag color={block.status === 'Approved' ? 'success' : 'warning'} style={{ fontWeight: 700 }}>
            {block.status}
          </Tag>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>
          {block.activity}
        </div>
        <Descriptions size="small" column={1} bordered={false} styles={{ label: { color: '#64748b', fontSize: 11 }, content: { fontSize: 12, fontWeight: 600, color: '#0f172a' } }}>
          <Descriptions.Item label="Department">{block.deptLabel || block.department}</Descriptions.Item>
          <Descriptions.Item label="Corridor Section">{block.section} ({block.location})</Descriptions.Item>
          <Descriptions.Item label="Execution Date">{block.date}</Descriptions.Item>
          <Descriptions.Item label="Scheduled Slot">
            <span style={{ color: '#059669', fontWeight: 700 }}>{block.startTime} – {block.endTime} ({block.durationHours} hrs)</span>
          </Descriptions.Item>
          <Descriptions.Item label="Block Classification">{block.blockType}</Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={block.priorityScore >= 80 ? 'red' : block.priorityScore >= 60 ? 'orange' : 'blue'}>
              {block.priority} ({block.priorityScore}/100)
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Hours Saved">
            <span style={{ color: block.hoursSaved > 0 ? '#059669' : '#64748b', fontWeight: 700 }}>
              {block.hoursSaved > 0 ? `+${block.hoursSaved} hrs saved` : '0 hrs'}
            </span>
          </Descriptions.Item>
          {block.justification && (
            <Descriptions.Item label="Justification">
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.3 }}>{block.justification}</div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    );
  };

  const renderTimelineRow = (deptKey, deptLabel, deptBlocks) => {
    const config = DEPT_CONFIG[deptKey];
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #e2e8f0', minHeight: 72 }}>
        {/* Left Label */}
        <div
          style={{
            width: 140,
            minWidth: 140,
            background: config.bg,
            borderRight: `2px solid ${config.border}`,
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {config.icon}
            <strong style={{ fontSize: 13, color: config.color }}>{deptKey}</strong>
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{deptLabel}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
            {deptBlocks.length} {deptBlocks.length === 1 ? 'Block' : 'Blocks'}
          </div>
        </div>

        {/* Right 24-Hour Gantt Canvas */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff', minHeight: 72, padding: '10px 0' }}>
          {/* Vertical 2-Hour Grid Guidelines */}
          {TIME_MARKS.map((mark, idx) => {
            const leftPct = (idx / 12) * 100;
            return (
              <div
                key={mark}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: idx % 2 === 0 ? '#e2e8f0' : '#f1f5f9',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
            );
          })}

          {/* Render Actual Block Items */}
          {deptBlocks.map((block) => {
            const startHour = Number(block.startHour || 0);
            const duration = Number(block.durationHours || 2.0);
            const leftPct = Math.max(0, Math.min(100, (startHour / 24) * 100));
            const widthPct = Math.max(5.5, Math.min(100 - leftPct, (duration / 24) * 100));
            const isApproved = block.status === 'Approved';

            return (
              <Popover
                key={block._id || block.blockId}
                content={renderBlockPopoverContent(block)}
                title={<span style={{ fontWeight: 700, color: '#0f172a' }}>Maintenance Block Overview</span>}
                trigger="click"
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: 10,
                    bottom: 10,
                    background: isApproved ? '#ecfdf5' : config.bg,
                    border: `1.5px solid ${isApproved ? '#059669' : config.color}`,
                    borderRadius: 6,
                    padding: '4px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(15, 23, 42, 0.16)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: config.color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {block.blockId}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: isApproved ? '#059669' : '#d97706',
                        background: isApproved ? '#d1fae5' : '#fef3c7',
                        padding: '1px 4px',
                        borderRadius: 3
                      }}
                    >
                      {block.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {block.startTime} – {block.endTime} ({block.durationHours}h)
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {block.activity}
                  </div>
                </div>
              </Popover>
            );
          })}

          {/* Empty Row Indicator */}
          {deptBlocks.length === 0 && (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, fontStyle: 'italic', zIndex: 2, position: 'relative' }}>
              No maintenance blocks scheduled for {deptKey} in selected filter.
            </div>
          )}
        </div>
      </div>
    );
  };

  const blockColumns = [
    {
      title: 'Block ID',
      dataIndex: 'blockId',
      key: 'blockId',
      width: 130,
      render: (text) => <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{text}</strong>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 100,
      render: (dept) => (
        <Tag color={dept === 'TMS' ? 'blue' : dept === 'SMMS' ? 'orange' : 'purple'} style={{ fontWeight: 700 }}>
          {dept}
        </Tag>
      )
    },
    {
      title: 'Maintenance Activity',
      dataIndex: 'activity',
      key: 'activity',
      width: 220,
      render: (act, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 12 }}>{act}</div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>Defect Ref: {r.defectId || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Block Type',
      dataIndex: 'blockType',
      key: 'blockType',
      width: 140,
      render: (bt, r) => (
        <Tag color={r.isJointBlock ? 'purple' : 'default'} style={{ fontWeight: 600 }}>
          {bt}
        </Tag>
      )
    },
    {
      title: 'Section / Corridor',
      dataIndex: 'section',
      key: 'section',
      width: 160,
      render: (sec, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{sec}</div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>{r.location || 'Corridor Path'}</div>
        </div>
      )
    },
    {
      title: 'Date & Window',
      key: 'dateWindow',
      width: 160,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{r.date}</div>
          <strong style={{ color: '#059669', fontSize: 11.5 }}>
            {r.startTime} – {r.endTime} ({r.durationHours}h)
          </strong>
        </div>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'durationHours',
      key: 'durationHours',
      width: 90,
      align: 'center',
      render: (hrs) => <Tag color="geekblue" style={{ fontWeight: 700 }}>{hrs} hrs</Tag>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (p, r) => (
        <Tag color={r.priorityScore >= 80 ? 'red' : r.priorityScore >= 60 ? 'orange' : 'blue'} style={{ fontWeight: 600 }}>
          {p} ({r.priorityScore || 75}/100)
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (st) => (
        <Tag color={st === 'Approved' ? 'success' : 'warning'} style={{ fontWeight: 700 }}>
          ● {st}
        </Tag>
      )
    },
    {
      title: 'Hours Saved',
      dataIndex: 'hoursSaved',
      key: 'hoursSaved',
      width: 100,
      render: (hrs) => (
        <strong style={{ color: hrs > 0 ? '#059669' : '#64748b', fontSize: 11.5 }}>
          {hrs > 0 ? `+${hrs} hrs` : '0 hrs'}
        </strong>
      )
    }
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1320}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: '16px 20px',
          maxHeight: '86vh',
          overflowY: 'auto',
          background: '#f8fafc'
        }
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ApartmentOutlined style={{ color: '#1e3a8a' }} /> Maintenance Block Schedule &amp; Visualization
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              24-Hour Diurnal Timeline • Departmental Coordinated Windows • BDMS Plan Optimizer
            </div>
          </div>
          <Space size="small">
            <Tag color="blue" style={{ fontWeight: 600 }}>
              Division: {initialDivision !== 'ALL' ? initialDivision : 'All Divisions'}
            </Tag>
            <Tag color="geekblue" style={{ fontWeight: 600 }}>
              Date: {selectedDate !== 'ALL' ? selectedDate : 'All Available Dates'}
            </Tag>
          </Space>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Filter Toolbar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 8,
            padding: '10px 14px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <Space size="middle" wrap align="center">
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 6 }}>Execution Date:</span>
              <Select
                size="small"
                style={{ width: 140 }}
                value={selectedDate}
                onChange={setSelectedDate}
                options={[
                  { label: 'All Dates', value: 'ALL' },
                  ...(scheduleData?.availableDates || []).map(d => ({ label: d, value: d }))
                ]}
              />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 6 }}>Corridor / Section:</span>
              <Select
                size="small"
                style={{ width: 170 }}
                value={selectedSection}
                onChange={setSelectedSection}
                options={[
                  { label: 'All Sections', value: 'ALL' },
                  ...(scheduleData?.availableSections || []).map(s => ({ label: s, value: s }))
                ]}
              />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 6 }}>Department:</span>
              <Segmented
                size="small"
                value={selectedDept}
                onChange={setSelectedDept}
                options={[
                  { label: 'All', value: 'ALL' },
                  { label: 'TMS', value: 'TMS' },
                  { label: 'SMMS', value: 'SMMS' },
                  { label: 'TDMS', value: 'TDMS' }
                ]}
              />
            </div>
          </Space>

          <Space size="small">
            <Button
              size="small"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchSchedule}
            >
              Refresh Data
            </Button>
            <Button size="small" onClick={onClose}>
              Close
            </Button>
          </Space>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { label: '24-Hour Schedule', value: '24-Hour Schedule', icon: <ClockCircleOutlined /> },
              { label: 'Department-wise Blocks', value: 'Department-wise Blocks', icon: <ApartmentOutlined /> },
              { label: 'Block Details', value: 'Block Details', icon: <BlockOutlined /> },
              { label: 'Block Summary', value: 'Block Summary', icon: <LineChartOutlined /> }
            ]}
          />

          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Displaying <strong style={{ color: '#1e3a8a' }}>{blocks.length}</strong> Maintenance Possessions
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="BDMS Schedule Sync Notice"
            description={error}
            action={
              <Button size="small" danger onClick={fetchSchedule}>
                Retry
              </Button>
            }
          />
        )}

        {/* Main Content Area */}
        <Spin spinning={loading}>
          {/* TAB 1: 24-HOUR MAINTENANCE TIMELINE */}
          {activeTab === '24-Hour Schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                }}
              >
                {/* Timeline Axis Header */}
                <div style={{ overflowX: 'auto', width: '100%', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ minWidth: 980 }}>
                    {/* Hour Axis Labels */}
                    <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                      <div
                        style={{
                          width: 140,
                          minWidth: 140,
                          padding: '8px 10px',
                          fontWeight: 700,
                          fontSize: 11,
                          color: '#475569',
                          borderRight: '1px solid #e2e8f0',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        Department
                      </div>
                      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                        {TIME_MARKS.map((mark, idx) => (
                          <div
                            key={mark}
                            style={{
                              flex: 1,
                              textAlign: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#334155',
                              padding: '8px 0',
                              borderRight: idx === 12 ? 'none' : '1px solid #e2e8f0'
                            }}
                          >
                            {mark}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Rows */}
                    {(selectedDept === 'ALL' || selectedDept === 'TMS') &&
                      renderTimelineRow('TMS', 'Engineering (Track)', tmsBlocks)}

                    {(selectedDept === 'ALL' || selectedDept === 'SMMS') &&
                      renderTimelineRow('SMMS', 'Signal & Telecom (S&T)', smmsBlocks)}

                    {(selectedDept === 'ALL' || selectedDept === 'TDMS') &&
                      renderTimelineRow('TDMS', 'Traction Distribution (OHE)', tdmsBlocks)}
                  </div>
                </div>

                {/* Timeline Footer Legend */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12, padding: '6px 4px', fontSize: 11, color: '#64748b' }}>
                  <Space size="middle">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1e40af', display: 'inline-block' }} /> TMS Track
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', display: 'inline-block' }} /> SMMS Signal
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed', display: 'inline-block' }} /> TDMS Traction
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid #059669', background: '#ecfdf5', display: 'inline-block' }} /> COA Approved
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid #d97706', background: '#fffbeb', display: 'inline-block' }} /> Pending Approval
                    </span>
                  </Space>

                  <span style={{ fontStyle: 'italic' }}>
                    Tip: Click any time block to inspect defect activity, corridor location, and priority justification.
                  </span>
                </div>
              </div>

              {/* Quick Summary Strip under timeline */}
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ borderRadius: 6, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total Blocks</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>{summary.totalRequests}</div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ borderRadius: 6, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Individual Work Hours</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#475569' }}>{summary.totalIndividualHours} hrs</div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ borderRadius: 6, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Optimized Block Duration</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{summary.optimizedDurationHours} hrs</div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card size="small" style={{ borderRadius: 6, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Corridor Savings</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>
                      +{summary.hoursSaved} hrs ({summary.savingsPercentage}%)
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* TAB 2: DEPARTMENT-WISE BLOCKS */}
          {activeTab === 'Department-wise Blocks' && (
            <Row gutter={[14, 14]}>
              {['TMS', 'SMMS', 'TDMS'].map((deptKey) => {
                const config = DEPT_CONFIG[deptKey];
                const data = deptBreakdown[deptKey] || {
                  count: 0,
                  totalHours: 0,
                  earliestBlock: 'N/A',
                  latestBlock: 'N/A',
                  approvedCount: 0,
                  pendingCount: 0,
                  blocks: []
                };

                return (
                  <Col xs={24} lg={8} key={deptKey}>
                    <Card
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {config.icon}
                            <span style={{ color: config.color, fontWeight: 800, fontSize: 14 }}>{config.name}</span>
                          </div>
                          <Tag color={config.badge} style={{ fontWeight: 700 }}>
                            {data.count} {data.count === 1 ? 'Block' : 'Blocks'}
                          </Tag>
                        </div>
                      }
                      size="small"
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${config.border}`,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      styles={{ body: { padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 } }}
                    >
                      {/* Metric Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: config.bg, padding: 10, borderRadius: 6 }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Total Possession Time</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: config.color }}>{data.totalHours} hrs</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Operating Window</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                            {data.earliestBlock} – {data.latestBlock}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Approved by COA</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{data.approvedCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>Pending Review</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{data.pendingCount}</div>
                        </div>
                      </div>

                      {/* Department Block Items */}
                      <div style={{ flex: 1, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {data.blocks && data.blocks.length > 0 ? (
                          data.blocks.map((b) => (
                            <div
                              key={b._id || b.blockId}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                padding: '8px 10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontFamily: 'monospace', fontSize: 12, color: '#0f172a' }}>{b.blockId}</strong>
                                <Tag color={b.status === 'Approved' ? 'success' : 'warning'} style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>
                                  {b.status}
                                </Tag>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}>
                                {b.activity}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                                <span>{b.date} • <strong style={{ color: '#059669' }}>{b.startTime}–{b.endTime}</strong> ({b.durationHours}h)</span>
                                <span>{b.section}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                            No active {deptKey} maintenance blocks found.
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

          {/* TAB 3: BLOCK DETAILS TABLE */}
          {activeTab === 'Block Details' && (
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 4 }}>
              <Table
                columns={blockColumns}
                dataSource={blocks}
                rowKey={r => r._id || r.blockId}
                pagination={{ pageSize: 8, showTotal: (total) => `Total ${total} blocks` }}
                scroll={{ x: 1200 }}
                size="middle"
              />
            </div>
          )}

          {/* TAB 4: BLOCK SUMMARY */}
          {activeTab === 'Block Summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Top Row KPI Cards */}
              <Row gutter={[14, 14]}>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total Maintenance Requests</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>{summary.totalRequests}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total Individual Hours</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#475569', marginTop: 4 }}>{summary.totalIndividualHours} hrs</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Integrated Joint Blocks</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>{summary.jointBlocksCount}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Optimized Duration</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{summary.optimizedDurationHours} hrs</div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[14, 14]}>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Corridor Hours Saved</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>+{summary.hoursSaved} hrs</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Efficiency Improvement</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>{summary.savingsPercentage}%</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>COA Approved Blocks</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{summary.approvedCount}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Pending Review</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{summary.pendingCount}</div>
                  </Card>
                </Col>
              </Row>

              {/* Mathematical Summary Card */}
              <Card
                title={<span style={{ fontWeight: 700, color: '#0f172a' }}>Corridor Capacity &amp; Joint Synchronization Efficiency</span>}
                size="small"
                style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        Joint Synchronization Reduction Ratio: {summary.optimizedDurationHours} hrs / {summary.totalIndividualHours} hrs
                      </span>
                      <strong style={{ color: '#059669', fontSize: 13 }}>{summary.savingsPercentage}% Net Gain</strong>
                    </div>
                    <Progress
                      percent={Math.min(100, summary.savingsPercentage)}
                      strokeColor="#059669"
                      trailColor="#e2e8f0"
                      size={['100%', 12]}
                    />
                  </div>

                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Baseline Single Dept Possessions">
                      {summary.totalIndividualHours} Hours Total
                    </Descriptions.Item>
                    <Descriptions.Item label="Unified Multi-Disciplinary Window">
                      {summary.optimizedDurationHours} Hours Actual
                    </Descriptions.Item>
                    <Descriptions.Item label="Corridor Capacity Reclaimed">
                      +{summary.hoursSaved} Train Running Hours
                    </Descriptions.Item>
                    <Descriptions.Item label="TMS Maintenance Requests">
                      {deptBreakdown.TMS?.count || 0} Blocks ({deptBreakdown.TMS?.totalHours || 0} hrs)
                    </Descriptions.Item>
                    <Descriptions.Item label="SMMS Maintenance Requests">
                      {deptBreakdown.SMMS?.count || 0} Blocks ({deptBreakdown.SMMS?.totalHours || 0} hrs)
                    </Descriptions.Item>
                    <Descriptions.Item label="TDMS Maintenance Requests">
                      {deptBreakdown.TDMS?.count || 0} Blocks ({deptBreakdown.TDMS?.totalHours || 0} hrs)
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </Card>
            </div>
          )}
        </Spin>
      </div>
    </Modal>
  );
};

export default MaintenanceScheduleModal;
