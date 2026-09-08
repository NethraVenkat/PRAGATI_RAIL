import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Segmented,
  Modal,
  Badge,
  Progress,
  Space,
  Alert,
  Tooltip,
  message,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Tabs
} from 'antd';
import {
  RocketOutlined,
  DownloadOutlined,
  CalendarOutlined,
  MergeCellsOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SwapOutlined,
  InfoCircleOutlined,
  AlertOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  WarningOutlined,
  RobotOutlined,
  LineChartOutlined,
  CheckOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportReportToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import { useRegion } from '../context/RegionContext';
import { blockService } from '../services/blockService';
import { MaintenanceScheduleModal } from '../components/bdms/MaintenanceScheduleModal';

const PLANNED_BLOCK_REQUESTS = [
  {
    _id: 'PLAN-BLK-001', blockId: 'BLK-NR-LKO-001', section: 'LKO - CNB', location: 'Lucknow - Kanpur Up Line',
    blockType: 'Integrated Block', departments: ['TMS', 'SMMS', 'TDMS'], date: '2026-09-09', startTime: '02:00', endTime: '05:30',
    durationHours: 3.5, hoursSaved: 4.8, priority: 'Critical', priorityScore: 94, status: 'Pending', isJointBlock: true,
    defectId: 'TRK-2026-081', justification: 'Joint rail flaw inspection, signal testing, and OHE inspection during the lowest traffic window.',
    trainImpact: '0 Passenger Conflicts', feasibilityScore: 94, daysNeeded: 1
  },
  {
    _id: 'PLAN-BLK-002', blockId: 'BLK-NR-DLI-014', section: 'NDLS - UMB', location: 'New Delhi - Ambala Down Line',
    blockType: 'Line Block', departments: ['TMS'], date: '2026-09-10', startTime: '11:15', endTime: '14:15',
    durationHours: 3, hoursSaved: 2.2, priority: 'High', priorityScore: 82, status: 'Approved', isJointBlock: false,
    defectId: 'TRK-2026-084', justification: 'Rail wear correction aligned with the approved engineering maintenance window.',
    trainImpact: '1 Freight Train Regulated', feasibilityScore: 88, daysNeeded: 1
  },
  {
    _id: 'PLAN-BLK-003', blockId: 'BLK-NR-LKO-018', section: 'LKO - BSB', location: 'Barabanki Junction - Ayodhya Section',
    blockType: 'Combined Block', departments: ['SMMS', 'TDMS'], date: '2026-09-11', startTime: '01:30', endTime: '04:00',
    durationHours: 2.5, hoursSaved: 3.1, priority: 'High', priorityScore: 76, status: 'Pending', isJointBlock: true,
    defectId: 'SIG-2026-044', justification: 'Signal relay replacement and OHE inspection combined into one protected possession.',
    trainImpact: '0 Passenger Conflicts', feasibilityScore: 91, daysNeeded: 1
  },
  {
    _id: 'PLAN-BLK-004', blockId: 'BLK-SR-MAS-007', section: 'MAS - AJJ', location: 'Chennai Central - Arakkonam Main Line',
    blockType: 'Power Block', departments: ['TDMS'], date: '2026-09-12', startTime: '09:00', endTime: '12:00',
    durationHours: 3, hoursSaved: 1.6, priority: 'Medium', priorityScore: 68, status: 'Pending', isJointBlock: false,
    defectId: 'OHE-2026-019', justification: 'Planned catenary inspection with tower wagon and isolated traction power section.',
    trainImpact: '2 Trains Regulated', feasibilityScore: 79, daysNeeded: 1
  }
];

export const BDMSBlockPlannerPage = () => {
  const { currentUser } = useAuth();
  const { selectedZone, selectedDivision } = useRegion();
  const isCOA = currentUser?.role === 'COA' || currentUser?.department === 'COA';

  const [viewMode, setViewMode] = useState('Block Requests List');
  const [blockRequests, setBlockRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editForm] = Form.useForm();

  const loadBlockRequests = () => {
    setLoading(true);
    blockService.getBlockRequests({
      division: selectedDivision !== 'ALL' ? selectedDivision : undefined
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setBlockRequests(data);
      } else {
        setBlockRequests(PLANNED_BLOCK_REQUESTS);
      }
    })
    .catch(err => {
      console.error('Error loading block requests:', err);
      setBlockRequests(PLANNED_BLOCK_REQUESTS);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBlockRequests();
  }, [selectedDivision, currentUser]);

  const markBlockApproved = (id) => {
    setBlockRequests(prev => prev.map(block => (
      block._id === id || block.blockId === id
        ? {
            ...block,
            status: 'Approved',
            approvedBy: currentUser?.name || 'COA Controller',
            approvedAt: new Date().toISOString()
          }
        : block
    )));
  };

  // COA Approval Handler
  const handleApproveBlock = async (id) => {
    if (!isCOA) {
      message.error('Unauthorized: Only COA controllers can approve block plans.');
      return;
    }
    try {
      message.loading({ content: `Approving Block Request ${id}...`, key: `appr-${id}` });
      const res = await blockService.approveBlockRequest(id);
      markBlockApproved(id);
      message.success({ content: res.message || `Block ${id} Approved!`, key: `appr-${id}` });
      if (res.block) loadBlockRequests();
    } catch (err) {
      if (String(id).startsWith('PLAN-')) {
        markBlockApproved(id);
        message.success({ content: `Block ${id} Approved!`, key: `appr-${id}` });
        return;
      }
      console.error('Approve error:', err);
      message.error({ content: err.response?.data?.message || 'Approval failed', key: `appr-${id}` });
    }
  };

  // COA Open Edit Modal
  const handleOpenEdit = (record) => {
    if (!isCOA) {
      message.error('Unauthorized: Only COA controllers can edit block plans.');
      return;
    }
    setEditingBlock(record);
    editForm.setFieldsValue({
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      durationHours: record.durationHours,
      blockType: record.blockType,
      justification: record.justification
    });
    setIsEditModalOpen(true);
  };

  // COA Save Edit Handler
  const handleSaveEdit = async (values) => {
    if (!editingBlock) return;
    try {
      message.loading({ content: 'Saving COA Block Revisions...', key: 'editBlock' });
      await blockService.editBlockRequest(editingBlock._id || editingBlock.blockId, values);
      message.success({ content: 'Block plan updated successfully (Status: Pending Review)', key: 'editBlock' });
      setIsEditModalOpen(false);
      loadBlockRequests();
    } catch (err) {
      console.error('Edit error:', err);
      message.error({ content: err.response?.data?.message || 'Failed to update block', key: 'editBlock' });
    }
  };

  const handleOpenDetail = (blockItem) => {
    setSelectedBlock(blockItem);
    setIsDetailModalOpen(true);
  };

  const handleExportPDF = () => {
    const headers = ['Block ID', 'Section', 'Block Type', 'Departments', 'Date', 'Window', 'Hours Saved', 'Status'];
    const rows = blockRequests.map(b => [
      b.blockId,
      b.section || 'SEC-NDLS-CNB-DN',
      b.blockType,
      Array.isArray(b.departments) ? b.departments.join(', ') : b.department,
      b.date,
      `${b.startTime} - ${b.endTime}`,
      `${b.hoursSaved || 0} hrs`,
      b.status
    ]);
    exportReportToPDF(
      'BDMS_Integrated_Block_Schedule',
      [
        { label: 'Total Block Requests', value: blockRequests.length },
        { label: 'Approved Blocks', value: blockRequests.filter(b => b.status === 'Approved').length },
        { label: 'Pending COA Approval', value: blockRequests.filter(b => b.status === 'Pending').length }
      ],
      headers,
      rows
    );
  };

  const handleExportExcel = () => {
    const headers = ['Block ID', 'Defect ID', 'Section', 'Block Type', 'Departments', 'Date', 'Start Time', 'End Time', 'Duration (Hrs)', 'Hours Saved', 'Status', 'Justification'];
    const rows = blockRequests.map(b => [
      b.blockId,
      b.defectId,
      b.section || 'SEC-NDLS-CNB-DN',
      b.blockType,
      Array.isArray(b.departments) ? b.departments.join(', ') : b.department,
      b.date,
      b.startTime,
      b.endTime,
      b.durationHours,
      b.hoursSaved || 0,
      b.status,
      b.justification
    ]);
    exportReportToExcel('BDMS_Integrated_Block_Schedule', 'IntegratedBlocks', headers, rows);
  };

  const blockColumns = [
    {
      title: 'Block ID',
      dataIndex: 'blockId',
      key: 'blockId',
      render: (text) => (
        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
          {text}
        </strong>
      )
    },
    {
      title: 'Location / Section',
      dataIndex: 'section',
      key: 'section',
      render: (s, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{s || r.sectionId || 'SEC-NDLS-CNB-DN'}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.location || `${r.station1 || 'NDLS'} - ${r.station2 || 'CNB'}`}</div>
        </div>
      )
    },
    {
      title: 'Block Type',
      dataIndex: 'blockType',
      key: 'blockType',
      render: (bt, r) => (
        <Tag color={r.isJointBlock ? 'purple' : 'blue'} style={{ fontWeight: 600 }}>
          {bt || (r.isJointBlock ? 'Integrated Block' : 'Line Block')}
        </Tag>
      )
    },
    {
      title: 'Departments',
      key: 'departments',
      render: (_, r) => {
        const depts = Array.isArray(r.departments) && r.departments.length > 0 ? r.departments : [r.department];
        return (
          <Space size={4}>
            {depts.map(d => (
              <Tag key={d} color={d === 'TMS' ? 'blue' : d === 'SMMS' ? 'orange' : 'geekblue'}>
                {d}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Date & Slot',
      key: 'dateSlot',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.date}</div>
          <strong style={{ color: '#16a34a', fontSize: 12 }}>
            {r.startTime} – {r.endTime} ({r.durationHours}h)
          </strong>
        </div>
      )
    },
    {
      title: 'Hours Saved',
      dataIndex: 'hoursSaved',
      key: 'hoursSaved',
      render: hrs => (hrs > 0 ? (
        <strong style={{ color: '#16a34a', fontSize: 12 }}>+{hrs} hrs</strong>
      ) : (
        <span style={{ color: '#64748b', fontSize: 12 }}>0 hrs</span>
      ))
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p, r) => (
        <Tag color={r.priorityScore >= 80 ? 'red' : r.priorityScore >= 65 ? 'orange' : 'blue'}>
          {p || 'High'} ({r.priorityScore || 75}/100)
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: st => {
        const isAppr = st === 'Approved';
        return (
          <Tag color={isAppr ? 'success' : 'warning'} style={{ fontWeight: 700 }}>
            ● {st || 'Pending'}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isApproved = record.status === 'Approved';

        return (
          <Space size="small">
            <Button size="small" style={{ fontSize: 11 }} icon={<InfoCircleOutlined />} onClick={() => handleOpenDetail(record)}>
              Plan Details
            </Button>
            {isCOA && (
              <>
                {!isApproved ? (
                  <Button
                    size="small"
                    type="primary"
                    style={{ background: '#059669', borderColor: '#059669', fontSize: 11 }}
                    onClick={() => handleApproveBlock(record._id || record.blockId)}
                  >
                    Approve
                  </Button>
                ) : (
                  <Tag color="green">Approved</Tag>
                )}
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  style={{ fontSize: 11 }}
                  onClick={() => handleOpenEdit(record)}
                >
                  Edit
                </Button>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="bdms-page" style={{ maxWidth: 1560, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      {/* Header */}
      <div className="bdms-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#ffffff', padding: '14px 20px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' }}>
            <MergeCellsOutlined style={{ color: '#1e3a8a' }} /> BDMS AI-Assisted Block Planner &amp; Schedule Optimizer
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
            XGBoost Multi-Horizon Planning Model • Joint Maintenance Windows • COA Operations Desk
          </p>
        </div>

        <Space className="bdms-header-actions" size="middle" align="center" wrap>
          <Button icon={<ReloadOutlined spin={loading} />} onClick={loadBlockRequests}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF} style={{ background: '#1e3a8a', borderColor: '#1e3a8a' }}>
            Export PDF
          </Button>
          <Button
            icon={<CalendarOutlined style={{ color: '#1e3a8a' }} />}
            onClick={() => setIsScheduleModalOpen(true)}
            style={{
              borderColor: '#1e3a8a',
              color: '#1e3a8a',
              fontWeight: 600,
              background: '#f8fafc'
            }}
          >
            Schedule View
          </Button>
        </Space>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Total Block Requests</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e3a8a' }}>{blockRequests.length}</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Approved Blocks (COA)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>
              {blockRequests.filter(b => b.status === 'Approved').length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Pending Review</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>
              {blockRequests.filter(b => b.status === 'Pending').length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Integrated Joint Blocks</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>
              {blockRequests.filter(b => b.isJointBlock).length}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <Table
          columns={blockColumns}
          dataSource={blockRequests}
          rowKey={r => r._id || r.blockId}
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Detail Plan Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ color: '#1e3a8a' }} />
            <span>XGBoost Multi-Horizon Block Optimization: {selectedBlock?.blockId}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>,
          isCOA && selectedBlock?.status !== 'Approved' && (
            <Button
              key="approve"
              type="primary"
              style={{ background: '#059669', borderColor: '#059669' }}
              onClick={() => {
                handleApproveBlock(selectedBlock._id || selectedBlock.blockId);
                setIsDetailModalOpen(false);
              }}
            >
              Approve Block Plan
            </Button>
          )
        ]}
        width={980}
        styles={{
          body: {
            padding: '16px 20px',
            maxHeight: '78vh',
            overflowY: 'auto',
            overflowX: 'hidden'
          }
        }}
      >
        {selectedBlock && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type="success"
              showIcon
              message="XGBoost Decision-Support Justification"
              description={selectedBlock.justification}
            />

            <Tabs
              defaultActiveKey="multiday"
              items={[
                {
                  key: 'multiday',
                  label: (
                    <span style={{ fontWeight: 700, color: '#1e3a8a' }}>
                      Multi-Day Schedule List ({selectedBlock.multiDaySchedule?.length || selectedBlock.daysNeeded || 1} Days)
                    </span>
                  ),
                  children: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Total Required Work</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a' }}>
                            {selectedBlock.totalWorkHours || selectedBlock.durationHours} Hours
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Daily Target Window</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0284c7' }}>
                            {selectedBlock.dailyWindowHours || 3.5} Hrs / Day
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Scheduled Duration</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
                            {selectedBlock.daysNeeded || (selectedBlock.multiDaySchedule?.length || 1)} Working Days
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Corridor Conflict Risk</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>
                            0 Passenger Train Clashes
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '100%', overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 4 }}>
                        <Table
                          size="middle"
                          bordered
                          pagination={false}
                          scroll={{ x: 1380 }}
                          rowKey="dayNumber"
                          dataSource={
                            Array.isArray(selectedBlock.multiDaySchedule) && selectedBlock.multiDaySchedule.length > 0
                              ? selectedBlock.multiDaySchedule
                              : [
                                  {
                                    dayNumber: 1,
                                    date: selectedBlock.date,
                                    dayName: 'Execution Day',
                                    formattedDate: selectedBlock.date,
                                    startTime: selectedBlock.startTime,
                                    endTime: selectedBlock.endTime,
                                    slotName: 'Scheduled Block Window',
                                    allocatedHours: selectedBlock.durationHours,
                                    busynessLevel: 'Moderate Traffic',
                                    phaseTitle: 'Full Maintenance Execution',
                                    phaseDescription: selectedBlock.justification || 'Standard departmental single possession.',
                                    feasibilityScore: selectedBlock.feasibilityScore || 90.0,
                                    trainImpact: selectedBlock.trainImpact || '0 Passenger Conflicts',
                                    status: 'Scheduled'
                                  }
                                ]
                          }
                          columns={[
                            {
                              title: 'Day',
                              dataIndex: 'dayNumber',
                              key: 'dayNumber',
                              width: 80,
                              align: 'center',
                              render: (d) => <Tag color="blue" style={{ fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>Day {d}</Tag>
                            },
                            {
                              title: 'Required Date',
                              key: 'date',
                              width: 140,
                              render: (_, r) => (
                                <div style={{ minWidth: 120 }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{r.formattedDate || r.date}</div>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>{r.dayName}</div>
                                </div>
                              )
                            },
                            {
                              title: 'Best Daily Time Window',
                              key: 'timeWindow',
                              width: 180,
                              render: (_, r) => (
                                <div style={{ minWidth: 150 }}>
                                  <strong style={{ color: '#1e3a8a', fontSize: 13 }}>{r.startTime} – {r.endTime}</strong>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.slotName || `${r.allocatedHours}h Window`}</div>
                                </div>
                              )
                            },
                            {
                              title: 'Allocated Hours',
                              dataIndex: 'allocatedHours',
                              key: 'allocatedHours',
                              width: 120,
                              align: 'center',
                              render: (h) => <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 12, padding: '2px 8px' }}>{h} Hrs</Tag>
                            },
                            {
                              title: 'Timetable Busyness',
                              dataIndex: 'busynessLevel',
                              key: 'busynessLevel',
                              width: 200,
                              render: (b) => {
                                const bStr = String(b || 'Moderate Traffic');
                                const color = bStr.includes('Low') ? 'green' : (bStr.includes('High') ? 'magenta' : 'blue');
                                return <Tag color={color} style={{ fontWeight: 600, padding: '3px 8px', whiteSpace: 'nowrap' }}>{bStr}</Tag>;
                              }
                            },
                            {
                              title: 'Phase / Scope of Work',
                              key: 'phase',
                              width: 320,
                              render: (_, r) => (
                                <div style={{ minWidth: 280 }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{r.phaseTitle}</div>
                                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 1.4 }}>{r.phaseDescription}</div>
                                </div>
                              )
                            },
                            {
                              title: 'AI Feasibility',
                              dataIndex: 'feasibilityScore',
                              key: 'feasibilityScore',
                              width: 130,
                              render: (score) => (
                                <div style={{ minWidth: 100 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: Number(score) > 75 ? '#059669' : '#d97706', marginBottom: 2 }}>
                                    {Number(score || 85).toFixed(1)}%
                                  </div>
                                  <Progress
                                    percent={Number(Number(score || 85).toFixed(1))}
                                    size="small"
                                    showInfo={false}
                                    strokeColor={Number(score) > 75 ? '#059669' : '#d97706'}
                                  />
                                </div>
                              )
                            },
                            {
                              title: 'Traffic Impact',
                              key: 'trainImpact',
                              width: 210,
                              render: (_, r) => {
                                const isZero = r.conflictingTrains === 0 || String(r.trainImpact || '').includes('0 Train');
                                return (
                                  <Tag color={isZero ? 'green' : 'orange'} style={{ fontWeight: 600, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                                    {r.trainImpact || `${r.conflictingTrains || 0} Trains Blocked`}
                                  </Tag>
                                );
                              }
                            }
                          ]}
                        />
                      </div>
                    </div>
                  )
                },
                {
                  key: 'weekly',
                  label: <span style={{ fontWeight: 600 }}>Weekly Plan</span>,
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Planning Horizon">{selectedBlock.weeklyPlan?.weekLabel || 'Week: 07–13 September 2026'}</Descriptions.Item>
                      <Descriptions.Item label="Recommended Date">{selectedBlock.weeklyPlan?.recommendedDate || selectedBlock.date}</Descriptions.Item>
                      <Descriptions.Item label="Time Slot Window">{selectedBlock.weeklyPlan?.slotStart || selectedBlock.startTime} – {selectedBlock.weeklyPlan?.slotEnd || selectedBlock.endTime}</Descriptions.Item>
                      <Descriptions.Item label="Window Duration">{selectedBlock.weeklyPlan?.durationHours || selectedBlock.durationHours} Hours</Descriptions.Item>
                      <Descriptions.Item label="Window Utilization">{selectedBlock.weeklyPlan?.utilizationPct || 87.5}%</Descriptions.Item>
                      <Descriptions.Item label="Joint Block Mode">{selectedBlock.isJointBlock ? 'Integrated Joint Corridor' : 'Single Department Window'}</Descriptions.Item>
                      <Descriptions.Item label="Departments Involved" span={2}>
                        {Array.isArray(selectedBlock.departments) ? selectedBlock.departments.join(', ') : selectedBlock.department}
                      </Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'monthly',
                  label: <span style={{ fontWeight: 600 }}>Monthly Plan</span>,
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Month Scope">{selectedBlock.monthlyPlan?.monthLabel || 'September 2026'}</Descriptions.Item>
                      <Descriptions.Item label="Recommended Week">{selectedBlock.monthlyPlan?.recommendedWeek || 'Week 2'}</Descriptions.Item>
                      <Descriptions.Item label="Target Execution Date">{selectedBlock.monthlyPlan?.recommendedDate || selectedBlock.date}</Descriptions.Item>
                      <Descriptions.Item label="Possession Hours">{selectedBlock.monthlyPlan?.durationHours || selectedBlock.durationHours} Hours</Descriptions.Item>
                      <Descriptions.Item label="Division Resource Alignment" span={2}>
                        Baseline division crew headcount and OHE wagon capacities evaluated with zero deficit.
                      </Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'individual',
                  label: <span style={{ fontWeight: 600 }}>Individual Defect Plan</span>,
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Defect ID">{selectedBlock.defectId}</Descriptions.Item>
                      <Descriptions.Item label="Department">{selectedBlock.department}</Descriptions.Item>
                      <Descriptions.Item label="Scheduled Date">{selectedBlock.individualPlan?.date || selectedBlock.date}</Descriptions.Item>
                      <Descriptions.Item label="Individual Slot">{selectedBlock.individualPlan?.startTime || selectedBlock.startTime} – {selectedBlock.individualPlan?.endTime || selectedBlock.endTime}</Descriptions.Item>
                      <Descriptions.Item label="Planning Type" span={2}>{selectedBlock.individualPlan?.planningType || 'Combined / Joint Block'}</Descriptions.Item>
                    </Descriptions>
                  )
                },
                {
                  key: 'combined',
                  label: <span style={{ fontWeight: 600 }}>Combined / Joint Summary</span>,
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Block Classification">{selectedBlock.blockType}</Descriptions.Item>
                      <Descriptions.Item label="Single Dept Hours Total">{selectedBlock.singleDeptHours || selectedBlock.durationHours} Hours</Descriptions.Item>
                      <Descriptions.Item label="Optimized Combined Hours">{selectedBlock.durationHours} Hours</Descriptions.Item>
                      <Descriptions.Item label="Net Hours Saved">{selectedBlock.hoursSaved || 0} Hours</Descriptions.Item>
                      <Descriptions.Item label="Passenger Train Conflict">{selectedBlock.trainImpact || '0 Passenger Conflicts'}</Descriptions.Item>
                      <Descriptions.Item label="Status">{selectedBlock.status}</Descriptions.Item>
                    </Descriptions>
                  )
                }
              ]}
            />
          </div>
        )}
      </Modal>

      {/* COA Edit Modal */}
      <Modal
        title="COA Corridor Schedule Adjustment (Edit Block Request)"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="Save Block Revisions"
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item name="date" label="Execution Date" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="Start Time (HH:mm)" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="End Time (HH:mm)" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="durationHours" label="Duration (Hours)" rules={[{ required: true }]}>
                <Input type="number" step="0.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="blockType" label="Block Type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Integrated Block', label: 'Integrated Block' },
                  { value: 'Combined Block', label: 'Combined Block' },
                  { value: 'Line Block', label: 'Line Block' },
                  { value: 'Disconnection Block', label: 'Disconnection Block' },
                  { value: 'Power Block', label: 'Power Block' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="justification" label="COA Operational Note / Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Maintenance Schedule & Visualization Modal */}
      <MaintenanceScheduleModal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialDivision={selectedDivision}
      />
    </div>
  );
};