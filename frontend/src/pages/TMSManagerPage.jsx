import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Row, Col, Descriptions, Drawer, Progress, Alert, message, Divider } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  RobotOutlined,
  ToolOutlined,
  SendOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Tabs } from 'antd';
import dayjs from 'dayjs';
import { useRegion } from '../context/RegionContext';
import { useAuth } from '../context/AuthContext';
import { exportReportToExcel } from '../utils/excelExport';
import { defectService } from '../services/defectService';
import { blockService } from '../services/blockService';
import { AddDefectModal } from '../components/common/AddDefectModal';
import { DispatchDefectModal } from '../components/common/DispatchDefectModal';

export const TMSManagerPage = ({ userRole }) => {
  const { filterByRegion } = useRegion();
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('NOT_SENT');
  const [sendingId, setSendingId] = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetDispatchRecord, setTargetDispatchRecord] = useState(null);

  const loadDefects = () => {
    defectService.getTMSDefects()
      .then(defects => {
        setData(Array.isArray(defects) ? defects : []);
      })
      .catch(err => {
        console.error('Failed to load TMS defects from tms_defects collection:', err);
        setData([]);
      });
  };

  useEffect(() => {
    loadDefects();
  }, []);

  // Modal & Drawer states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInspectDefect, setSelectedInspectDefect] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isReadOnly = userRole === 'Viewer';
  const isCOA = currentUser?.role === 'COA' || currentUser?.department === 'COA';

  const finalFilteredData = data.filter(item => {
    return !searchText || Object.values(item).some(val => val && String(val).toLowerCase().includes(searchText.toLowerCase()));
  });

  const tabFilteredData = finalFilteredData.filter(item => {
    if (activeTab === 'SENT') return item.isSent === true;
    return !item.isSent; // NOT_SENT
  });

  const handleOpenInspect = (record) => {
    setSelectedInspectDefect(record);
    setIsDrawerOpen(true);
  };

  const handleExportExcel = () => {
    const headers = [
      'Defect ID', 'Section ID', 'Station 1', 'Station 2', 'Chainage KM', 'Latitude', 'Longitude', 'Asset Type', 'Defect Type', 'Severity', 'Detection Method', 'Reported Date',
      'Due Date', 'Overdue Days', 'Joint Block Feasibility Score', 'Urgency Tier', 'Planning Horizon', 'Recommended Block Date', 'Recommended Duration (Hrs)', 'Joint Block Recommendation', 'Priority Score', 'Predicted Resolution Hrs', 'Risk If Delayed', 'Confidence Score'
    ];
    const rows = finalFilteredData.map(d => [
      d.Defect_ID || d.id, d.Section_ID || d.section, d.Station1 || 'NDLS', d.Station2 || 'CNB', d.Chainage_KM || '142.0', d.Latitude || '28.6139 N', d.Longitude || '77.2090 E', d.Asset_Type || 'Rail', d.Defect_Type || d.defectType, d.Severity_Level || d.severity, d.Detection_Method || 'UFD', d.Reported_Date || d.dateReported,
      d.Due_Date, d.Overdue_Days, `${d.Joint_Block_Feasibility_Score}%`, d.Task_Urgency_Tier, d.Planning_Horizon, d.Recommended_Block_Date, d.Recommended_Block_Duration_Hours, d.Joint_Block_Recommendation, d.Priority_Score, d.Predicted_Resolution_Time_Hours, d.Risk_If_Delayed, d.Confidence_Score
    ]);
    exportReportToExcel('TMS_Track_Maintenance_Full_Schema', 'TMS_Defects', headers, rows);
  };

  const handleSendToBDMS = async (record, dateRangePayload) => {
    const defectId = record.defectId || record.Defect_ID || record.id;
    try {
      setSendingId(defectId);
      message.loading({ content: `Evaluating XGBoost Joint Corridor Placement for Defect ${defectId}...`, key: `send-${defectId}` });
      const res = await blockService.sendDefectToBlockPlanning('TMS', defectId, dateRangePayload);
      
      // Update local state
      setData(prev => prev.map(d => {
        if ((d.defectId || d.Defect_ID || d.id) === defectId) {
          return { ...d, isSent: true, status: 'Scheduled Block (Pending COA)' };
        }
        return d;
      }));

      message.success({
        content: (
          <div>
            <strong>XGBoost Multi-Day Schedule ({res.blockRequest?.blockId})</strong><br />
            Dates: <strong>{dateRangePayload?.startDate} → {dateRangePayload?.endDate}</strong> ({dateRangePayload?.selectedDays} days, {dateRangePayload?.dailyWorkHours}h/day)<br />
            Window: <strong>{dateRangePayload?.startTime || '02:00'} – {dateRangePayload?.endTime || '06:00'}</strong> ({dateRangePayload?.timeWindowHours || 4}h capacity)<br />
            Status: <Tag color="gold">AI Validated (Pending COA Approval)</Tag>
          </div>
        ),
        key: `send-${defectId}`,
        duration: 5
      });
    } catch (err) {
      console.error('Error sending defect to BDMS:', err);
      message.error({
        content: err.response?.data?.message || err.message || 'Failed to dispatch to block planner',
        key: `send-${defectId}`
      });
    } finally {
      setSendingId(null);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'Defect_Type',
      key: 'Defect_Type',
      render: (d, r) => (
        <strong style={{ color: '#0284c7' }}>
          {r.defectType || r.Defect_Type || d || 'Rail Fracture'}
        </strong>
      )
    },
    {
      title: 'Location / Mast',
      key: 'location',
      render: (_, r) => r.location || `KM ${r.chainageKm || r.Chainage_KM || '142.100'} (${r.station1 || r.Station1 || 'NDLS'} - ${r.station2 || r.Station2 || 'CNB'})`
    },
    {
      title: 'Track Parameter Readings',
      key: 'trackReadings',
      render: (_, r) => (
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div>Asset: <strong>{r.Asset_Type || r.assetType || 'Rail Section'}</strong></div>
          <div>Detection: <strong>{r.Detection_Method || r.detectionMethod || 'UFD'}</strong></div>
          <div>Asset Age: <strong>{r.Asset_Age_Years ? `${r.Asset_Age_Years} Yrs` : (r.assetAgeYears ? `${r.assetAgeYears} Yrs` : '6.0 Yrs')}</strong></div>
        </div>
      )
    },
    {
      title: 'Environment Context',
      key: 'environment',
      render: (_, r) => (
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div>Wind: <strong>{r.Wind_Speed_kmh ? `${r.Wind_Speed_kmh} km/h` : '25 km/h'}</strong></div>
          <div>Weather: <Tag size="small" color="blue">{r.Weather_Condition || 'Clear'}</Tag></div>
        </div>
      )
    },
    {
      title: 'Simulated AI Priority',
      dataIndex: 'Priority_Score',
      key: 'Priority_Score',
      render: (score, record) => {
        const pScore = Number(score || record.priorityScore || 75.0);
        return <Progress percent={Number(pScore.toFixed(2))} size="small" strokeColor={pScore > 80 ? '#dc2626' : '#059669'} />;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st, r) => {
        const statusText = st || (r.isSent ? 'Scheduled Block (Pending COA)' : 'Pending Block');
        return (
          <Tag color={statusText.includes('Approved') ? 'blue' : statusText.includes('Scheduled') ? 'gold' : statusText.includes('Merged') ? 'green' : 'gold'}>
            {statusText}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const dId = record.defectId || record.Defect_ID || record.id;
        const isAlreadySent = record.isSent === true;

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleOpenInspect(record)}
            >
              Details
            </Button>
            {!isCOA && !isAlreadySent && (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined spin={sendingId === dId} />}
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={() => {
                  setTargetDispatchRecord(record);
                  setDispatchModalOpen(true);
                }}
              >
                Send
              </Button>
            )}
            {isAlreadySent && (
              <Tag color="green" style={{ fontWeight: 600 }}>
                Sent to BDMS
              </Tag>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ToolOutlined style={{ color: '#1e3a8a' }} /> TMS Engineering (Track) Defect &amp; Maintenance Protocol Manager
        </h1>
        <p style={{ color: 'var(--ir-text-sub)', margin: '4px 0 16px 0', fontSize: 13 }}>
          Track defect logging, automated SLA calculation, and XGBoost joint block optimizer dispatch
        </p>

        {!isCOA && (
          <Space size="middle">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={isReadOnly}
              style={{ background: '#1e3a8a', borderColor: '#1e3a8a' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              Log Track Defect (Manual Input)
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
              Export Full Schema Excel
            </Button>
          </Space>
        )}
      </div>

      {/* Filter Bar with NOT SENT / SENT Tabs */}
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'NOT_SENT',
                label: (
                  <span style={{ fontWeight: 600 }}>
                    NOT SENT ({finalFilteredData.filter(d => !d.isSent).length})
                  </span>
                )
              },
              {
                key: 'SENT',
                label: (
                  <span style={{ fontWeight: 600, color: '#059669' }}>
                    SENT TO BDMS ({finalFilteredData.filter(d => d.isSent).length})
                  </span>
                )
              }
            ]}
          />

          <span style={{ fontSize: 13, color: 'var(--ir-text-sub)' }}>
            Showing <strong>{tabFilteredData.length}</strong> defect records
          </span>
        </div>

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={16} md={10} lg={8}>
            <Input
              placeholder="Search TMS defects..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card styles={{ body: { padding: 16 } }} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
        <Table
          columns={columns}
          dataSource={tabFilteredData}
          rowKey={r => r.defectId || r.Defect_ID || r.id}
          pagination={{ pageSize: 7 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Add Defect Modal (Dataset-Driven Input Form) */}
      <AddDefectModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDefectAdded={(newDefect) => {
          setData(prev => [newDefect, ...prev]);
        }}
      />

      {/* Date-Range Constrained BDMS Dispatch Modal */}
      <DispatchDefectModal
        open={dispatchModalOpen}
        onClose={() => {
          setDispatchModalOpen(false);
          setTargetDispatchRecord(null);
        }}
        defectRecord={targetDispatchRecord}
        department="TMS"
        onDispatched={handleSendToBDMS}
      />

      {/* System Calculated Outputs Inspector Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e3a8a' }}>
            <RobotOutlined />
            <span>TMS Defect Telemetry &amp; Decision-Support: {selectedInspectDefect?.defectId || selectedInspectDefect?.Defect_ID || selectedInspectDefect?.id}</span>
          </div>
        }
        placement="right"
        width={620}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      >
        {selectedInspectDefect && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Alert Header */}
            <Alert
              type="info"
              showIcon
              message="CRIS TMS ENGINEERING DATABASE RECORD &amp; AI RESULTS"
              description="Record loaded directly from MongoDB tms_defects collection with AI-evaluated priority scores and resolution metrics."
              style={{ fontSize: 12 }}
            />

            {/* ============================================================ */}
            {/* 1. DEFECT INFORMATION */}
            {/* ============================================================ */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                1. Defect &amp; Track Information
              </div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Defect ID">
                  <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedInspectDefect.defectId || selectedInspectDefect.Defect_ID || selectedInspectDefect.id || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  <Tag color="blue">{selectedInspectDefect.department || 'TMS'} • Engineering (Track)</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Asset ID">
                  <strong>{selectedInspectDefect.assetId || selectedInspectDefect.Asset_ID || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Asset Type">
                  <strong>{selectedInspectDefect.assetType || selectedInspectDefect.Asset_Type || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Defect Type" span={2}>
                  <strong style={{ color: '#dc2626', fontSize: 13 }}>{selectedInspectDefect.defectType || selectedInspectDefect.Defect_Type || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Detection Method">
                  {selectedInspectDefect.detectionMethod || selectedInspectDefect.Detection_Method || 'Manual Patrol'}
                </Descriptions.Item>
                <Descriptions.Item label="Reported Date">
                  {selectedInspectDefect.reportedDate || selectedInspectDefect.Reported_Date || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Section ID">{selectedInspectDefect.sectionId || selectedInspectDefect.Section_ID || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Chainage">KM {selectedInspectDefect.chainageKm || selectedInspectDefect.Chainage_KM || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Station Stretch" span={2}>
                  {selectedInspectDefect.station1 || selectedInspectDefect.Station1 || 'N/A'} → {selectedInspectDefect.station2 || selectedInspectDefect.Station2 || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="GPS Coordinates" span={2}>
                  {selectedInspectDefect.latitude ? `${selectedInspectDefect.latitude}, ${selectedInspectDefect.longitude}` : (selectedInspectDefect.Latitude ? `${selectedInspectDefect.Latitude}, ${selectedInspectDefect.Longitude}` : 'Not available')}
                </Descriptions.Item>
                <Descriptions.Item label="Zone / Division" span={2}>
                  {selectedInspectDefect.zone || 'NR'} / {selectedInspectDefect.division || 'Delhi'}
                </Descriptions.Item>
                <Descriptions.Item label="Track Structure" span={2}>
                  {selectedInspectDefect.trackStructure || 'PSC Sleeper / 60kg Rail / Ballasted'}
                </Descriptions.Item>
                <Descriptions.Item label="Asset Age">
                  {selectedInspectDefect.assetAgeYears !== undefined ? `${selectedInspectDefect.assetAgeYears} Years` : (selectedInspectDefect.Asset_Age_Years ? `${selectedInspectDefect.Asset_Age_Years} Years` : 'Not available')}
                </Descriptions.Item>
                <Descriptions.Item label="Historical Failures">
                  {selectedInspectDefect.histFailures !== undefined ? `${selectedInspectDefect.histFailures} Failures` : (selectedInspectDefect.Historical_Failure_Count !== undefined ? `${selectedInspectDefect.Historical_Failure_Count} Failures` : '0 Failures')}
                </Descriptions.Item>
                <Descriptions.Item label="Overdue Days">
                  <Tag color={(selectedInspectDefect.overdueDays || selectedInspectDefect.Overdue_Days) > 0 ? 'red' : 'green'}>
                    {selectedInspectDefect.overdueDays ?? selectedInspectDefect.Overdue_Days ?? 0} Days
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Traffic Density">
                  {selectedInspectDefect.sectionTrafficDensity ? `${selectedInspectDefect.sectionTrafficDensity} Trains/Day` : (selectedInspectDefect.trafficTrainsPerDay ? `${selectedInspectDefect.trafficTrainsPerDay} Trains/Day` : 'Not available')}
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={2}>
                  <Tag color={selectedInspectDefect.isSent ? 'green' : 'gold'}>
                    {selectedInspectDefect.status || (selectedInspectDefect.isSent ? 'Scheduled Block (Pending COA)' : 'Pending Block')}
                  </Tag>
                </Descriptions.Item>
                {selectedInspectDefect.remarks && (
                  <Descriptions.Item label="Remarks" span={2}>
                    {selectedInspectDefect.remarks}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            {/* ============================================================ */}
            {/* 2. ML ANALYSIS */}
            {/* ============================================================ */}
            <Card
              size="small"
              title={
                <span style={{ color: '#059669', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RobotOutlined /> 2. ML ANALYSIS &amp; SEVERITY ASSESSMENT
                </span>
              }
              style={{ background: 'rgba(5, 150, 105, 0.03)', border: '1px solid #059669', borderRadius: 8 }}
            >
              <Row gutter={[12, 12]}>
                {/* Predicted Severity */}
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PREDICTED SEVERITY</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: String(selectedInspectDefect.severityLevel || selectedInspectDefect.Severity_Level || '').toUpperCase().includes('CRITICAL') ? '#dc2626' : '#ea580c'
                    }}>
                      {(selectedInspectDefect.severityLevel || selectedInspectDefect.Severity_Level || 'High').toUpperCase()}
                    </span>
                    <Tag color="blue">
                      {selectedInspectDefect.confidenceScore || (selectedInspectDefect.severityConfidence ? `${(selectedInspectDefect.severityConfidence * 100).toFixed(0)}%` : '95.0%')}
                    </Tag>
                  </div>
                </Col>

                {/* Priority Score */}
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PRIORITY SCORE &amp; CLASS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#1e3a8a' }}>
                      {selectedInspectDefect.priorityScore !== undefined ? Number(selectedInspectDefect.priorityScore).toFixed(1) : (selectedInspectDefect.Priority_Score || 'N/A')}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>/ 100</span>
                    <Tag color={Number(selectedInspectDefect.priorityScore || selectedInspectDefect.Priority_Score || 0) >= 75 ? 'red' : 'orange'}>
                      Class {selectedInspectDefect.priorityClass || selectedInspectDefect.Priority_Class || 'A'}
                    </Tag>
                  </div>
                </Col>

                {/* Reason for Severity */}
                <Col span={24}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
                    REASON FOR PREDICTED SEVERITY:
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    color: '#1e293b',
                    lineHeight: 1.5
                  }}>
                    {selectedInspectDefect.severityReason || selectedInspectDefect.Severity_Reason || (
                      selectedInspectDefect.defectType
                        ? `Classified based on ${selectedInspectDefect.department || 'TMS'} safety standards and operational risk for ${selectedInspectDefect.defectType}.`
                        : 'Not available'
                    )}
                  </div>
                </Col>

                {/* Additional SLA & Risk Context */}
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Resolution SLA / Due Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {selectedInspectDefect.slaDays ? `${selectedInspectDefect.slaDays} Days` : '3 Days'} (Due: {selectedInspectDefect.dueDate || selectedInspectDefect.Due_Date || 'Not available'})
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Estimated Work Duration</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                    {selectedInspectDefect.workDurationHrs || selectedInspectDefect.predictedResolutionTimeHours || 3.5} Hours
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Risk If Delayed</div>
                  <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                    {selectedInspectDefect.riskIfDelayed || selectedInspectDefect.Risk_If_Delayed || 'Structural track degradation risk under repeated dynamic axle loading.'}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* ============================================================ */}
            {/* 3. SCHEDULING INFORMATION (REQUESTED VS OPTIMAL) */}
            {/* ============================================================ */}
            <Card
              size="small"
              title={
                <span style={{ color: '#1e3a8a', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarOutlined /> 3. SCHEDULING &amp; POSSESSION INFORMATION
                </span>
              }
              style={{ background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: 8 }}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Requested Date">
                  <strong style={{ color: '#0284c7' }}>
                    {selectedInspectDefect.requestedDate || selectedInspectDefect.Requested_Date || (
                      selectedInspectDefect.requestedStartDate
                        ? `${selectedInspectDefect.requestedStartDate}${selectedInspectDefect.requestedEndDate && selectedInspectDefect.requestedEndDate !== selectedInspectDefect.requestedStartDate ? ` to ${selectedInspectDefect.requestedEndDate}` : ''}`
                        : 'Not available'
                    )}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Requested Time">
                  <strong>
                    {selectedInspectDefect.requestedTime || selectedInspectDefect.Requested_Time || (
                      selectedInspectDefect.requestedStartTime
                        ? `${selectedInspectDefect.requestedStartTime} – ${selectedInspectDefect.requestedEndTime || ''}`
                        : 'Not available'
                    )}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Optimal Date">
                  <strong style={{ color: '#059669', fontSize: 13 }}>
                    {selectedInspectDefect.optimalDate || selectedInspectDefect.Optimal_Date || (selectedInspectDefect.isSent ? '08 Sep 2026' : 'Not available')}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Optimal Time">
                  <strong style={{ color: '#059669', fontSize: 13 }}>
                    {selectedInspectDefect.optimalTime || selectedInspectDefect.Optimal_Time || (selectedInspectDefect.optimalStartTime ? `${selectedInspectDefect.optimalStartTime} – ${selectedInspectDefect.optimalEndTime || ''}` : (selectedInspectDefect.isSent ? '02:00 – 05:30' : 'Not available'))}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Reason why Optimal Date/Time is better" span={2}>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    {selectedInspectDefect.optimalScheduleReason || selectedInspectDefect.Optimal_Schedule_Reason || (
                      selectedInspectDefect.isSent
                        ? 'Selected optimal schedule maximizes corridor throughput, provides clear passenger train headway, and prevents overlap with existing maintenance possessions.'
                        : 'Not available (Click "Send" to prompt for requested schedule and calculate optimal slot)'
                    )}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Action Footer inside Drawer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button onClick={() => setIsDrawerOpen(false)}>Close</Button>
              {!isCOA && !selectedInspectDefect.isSent && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setTargetDispatchRecord(selectedInspectDefect);
                    setDispatchModalOpen(true);
                  }}
                >
                  SUBMIT TRACK POSSESSION REQUEST
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
