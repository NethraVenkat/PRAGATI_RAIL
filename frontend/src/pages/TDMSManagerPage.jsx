import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Tabs, Space, Progress, Drawer, Descriptions, Alert, Row, Col, message, Input, Select, Divider } from 'antd';
import {
  BlockOutlined,
  PlusOutlined,
  SendOutlined,
  EyeOutlined,
  RobotOutlined,
  DownloadOutlined,
  SearchOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useRegion } from '../context/RegionContext';
import { AddDefectModal } from '../components/common/AddDefectModal';
import { SendBlockRequestModal } from '../components/common/SendBlockRequestModal';
import { DispatchDefectModal } from '../components/common/DispatchDefectModal';
import { defectService } from '../services/defectService';
import { blockService } from '../services/blockService';
import { useAuth } from '../context/AuthContext';
import { exportReportToExcel } from '../utils/excelExport';

export const TDMSManagerPage = () => {
  const { currentUser } = useAuth();
  const isCOA = currentUser?.role === 'COA' || currentUser?.department === 'COA';
  const [activeTab, setActiveTab] = useState('NOT_SENT');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sendBlockModalOpen, setSendBlockModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetDispatchRecord, setTargetDispatchRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
  const [dbDefects, setDbDefects] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [searchText, setSearchText] = useState('');

  const loadDefects = () => {
    defectService.getTDMSDefects()
      .then(list => {
        setDbDefects(Array.isArray(list) ? list : []);
      })
      .catch(err => {
        console.error('Failed to load TDMS defects from tdms_defects collection:', err);
        setDbDefects([]);
      });
  };

  useEffect(() => {
    loadDefects();
  }, []);

  // Use only live defects from DB collection (tdms_defects)
  const baseDefects = dbDefects;
  
  const finalFilteredData = baseDefects.filter(item => {
    return !searchText || Object.values(item).some(val => val && String(val).toLowerCase().includes(searchText.toLowerCase()));
  });

  const handleExportExcel = () => {
    const headers = [
      'Defect ID', 'Section ID', 'Station 1', 'Station 2', 'Chainage KM', 'Asset ID', 'Asset Type', 'Defect Type', 'Severity Level', 'Detection Method', 'Reported Date',
      'Due Date', 'Overdue Days', 'Voltage (V)', 'Current (A)', 'Power Load (MW)', 'Wind Speed', 'Weather', 'Priority Score', 'Priority Class', 'Predicted Resolution Hrs', 'Risk If Delayed', 'Confidence Score'
    ];
    const rows = finalFilteredData.map(d => [
      d.Defect_ID || d.id || d.defectId, d.Section_ID || d.sectionId || 'SEC-NDLS-CNB-DN', d.Station1 || d.station1 || 'NDLS', d.Station2 || d.station2 || 'CNB', d.Chainage_KM || d.chainageKm || '142.100', d.Asset_ID || d.assetId || 'OHE-MAST-142/14', d.Asset_Type || d.assetType || 'OHE_CONTACT_LINE', d.Defect_Type || d.defectType || 'Line Breakage', d.Severity_Level || d.severityLevel || 'Critical', d.Detection_Method || d.detectionMethod || 'Sensor_Alert', d.Reported_Date || d.reportedDate || '2026-09-01',
      d.Due_Date || '2026-09-02', d.Overdue_Days || d.overdueDays || 0, d.Voltage_V || d.voltageV || 25000, d.Current_A || d.currentA || 420, d.Power_Load_MW || d.powerLoadMW || 12.5, d.Wind_Speed_kmh ? `${d.Wind_Speed_kmh} km/h` : '25 km/h', d.Weather_Condition || 'Clear', d.Priority_Score || d.priorityScore || 88.0, d.Priority_Class || d.priorityClass || 'Critical', d.Predicted_Resolution_Time_Hours || d.predictedResolutionTimeHours || 3.5, d.Risk_If_Delayed || d.riskIfDelayed || 'High Risk of Traction Cut', d.Confidence_Score || '96%'
    ]);
    exportReportToExcel('TDMS_Traction_Defects_Full_Schema', 'TDMS_Defects', headers, rows);
  };

  const handleSendToBDMS = async (record, dateRangePayload) => {
    const defectId = record.defectId || record.Defect_ID || record.id;
    try {
      setSendingId(defectId);
      message.loading({ content: `Evaluating XGBoost Joint Corridor Placement for TDMS Defect ${defectId}...`, key: `send-${defectId}` });
      const res = await blockService.sendDefectToBlockPlanning('TDMS', defectId, dateRangePayload);

      setDbDefects(prev => prev.map(d => {
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
      console.error('Error sending TDMS defect to BDMS:', err);
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
      render: (t, record) => (
        <strong style={{ color: '#7c3aed' }}>
          {t || record.defectType || 'OHE Cantilever Insulator Breakdown'}
        </strong>
      )
    },
    {
      title: 'Location / Mast',
      key: 'location',
      render: (_, r) => r.location || `KM ${r.chainageKm || r.Chainage_KM || '142.100'} (${r.Asset_ID || r.assetId || 'MAST-142/14'})`
    },
    {
      title: 'Traction System Info',
      key: 'tractionSystem',
      render: (_, r) => (
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          <div>Voltage: <strong>{r.Voltage_V ? `${(r.Voltage_V / 1000).toFixed(1)} kV` : (r.voltageV ? `${r.voltageV} kV` : '25.0 kV')}</strong></div>
          <div>Power Load: <strong>{r.Power_Load_MW ? `${r.Power_Load_MW} MW` : (r.powerLoadMW ? `${r.powerLoadMW} MW` : '12.5 MW')} ({r.Current_A ? `${r.Current_A} A` : (r.currentA ? `${r.currentA} A` : '420 A')})</strong></div>
        </div>
      )
    },
    {
      title: 'Comm Link Status',
      dataIndex: 'Communication_Link_Status',
      key: 'Communication_Link_Status',
      render: (status, r) => {
        const st = status || r.Component_Health || r.componentHealth || 'Healthy';
        const isHealthy = String(st).includes('Healthy') || String(st).includes('Normal') || String(st).includes('Good') || parseInt(st) > 70;
        const isWarning = String(st).includes('Degraded') || String(st).includes('Attention') || (parseInt(st) > 40 && parseInt(st) <= 70);
        const color = isHealthy ? 'success' : isWarning ? 'warning' : 'error';
        return <Tag color={color}>● {st}</Tag>;
      }
    },
    {
      title: 'Simulated AI Priority',
      dataIndex: 'Priority_Score',
      key: 'Priority_Score',
      render: (score, record) => {
        const pScore = Number(score || record.priorityScore || 88.0);
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
              onClick={() => {
                setSelectedDetailRecord(record);
                setDetailDrawerOpen(true);
              }}
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

  const tabFilteredData = finalFilteredData.filter(item => {
    if (activeTab === 'SENT') return item.isSent === true;
    return !item.isSent; // NOT_SENT
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <BlockOutlined style={{ color: '#7c3aed' }} /> TDMS — Traction Distribution OHE Manager
        </h1>
        <p style={{ color: 'var(--ir-text-sub)', margin: '4px 0 16px 0', fontSize: 13 }}>
          Official CRIS TDMS Protocol: 25 kV AC OHE wires, insulators, neutral sections, &amp; XGBoost joint power block optimizer
        </p>

        {!isCOA && (
          <Space size="middle">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              onClick={() => setAddModalOpen(true)}
            >
              Log OHE Traction Defect (Manual Input)
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
              placeholder="Search TDMS defects..."
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

      {/* Add Defect Modal */}
      <AddDefectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onDefectAdded={(newDefect) => {
          setDbDefects(prev => [newDefect, ...prev]);
        }}
      />
      <DispatchDefectModal
        open={dispatchModalOpen}
        onClose={() => {
          setDispatchModalOpen(false);
          setTargetDispatchRecord(null);
        }}
        defectRecord={targetDispatchRecord}
        department="TDMS"
        onDispatched={handleSendToBDMS}
      />
      {/* Comprehensive TDMS Defect Inspector & AI Analytics Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed' }}>
            <BlockOutlined />
            <span>TDMS Defect Telemetry &amp; Decision-Support: {selectedDetailRecord?.defectId || selectedDetailRecord?.Defect_ID || selectedDetailRecord?.id}</span>
          </div>
        }
        placement="right"
        width={620}
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
      >
        {selectedDetailRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Alert Header */}
            <Alert
              type="info"
              showIcon
              message="CRIS TDMS TRACTION DISTRIBUTION DATABASE RECORD &amp; AI RESULTS"
              description="Record loaded directly from MongoDB tdms_defects collection with AI-evaluated priority scores and resolution metrics."
              style={{ fontSize: 12 }}
            />

            {/* ============================================================ */}
            {/* 1. DEFECT & ASSET INFORMATION */}
            {/* ============================================================ */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                1. Defect &amp; Traction Diagnostics
              </div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Asset Structure ID">
                  <strong>{selectedDetailRecord.assetId || selectedDetailRecord.Asset_ID || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Asset Type">
                  <strong>{selectedDetailRecord.assetType || selectedDetailRecord.Asset_Type || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Defect Type">
                  <strong style={{ color: '#7c3aed' }}>{selectedDetailRecord.defectType || selectedDetailRecord.Defect_Type || 'N/A'}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Detection Method">
                  {selectedDetailRecord.detectionMethod || selectedDetailRecord.Detection_Method || 'Field Patrol Inspection'}
                </Descriptions.Item>
                <Descriptions.Item label="Section ID">{selectedDetailRecord.sectionId || selectedDetailRecord.Section_ID || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Chainage">KM {selectedDetailRecord.chainageKm || selectedDetailRecord.Chainage_KM || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Station Stretch" span={2}>
                  {selectedDetailRecord.station1 || selectedDetailRecord.Station1 || 'N/A'} → {selectedDetailRecord.station2 || selectedDetailRecord.Station2 || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Line Voltage">
                  <strong>{selectedDetailRecord.voltageV !== undefined ? (selectedDetailRecord.voltageV >= 1000 ? `${(selectedDetailRecord.voltageV / 1000).toFixed(1)} kV (${selectedDetailRecord.voltageV.toLocaleString()} V)` : `${selectedDetailRecord.voltageV} V`) : (selectedDetailRecord.Voltage_V ? `${selectedDetailRecord.Voltage_V} V` : '25.0 kV')}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Traction Current">
                  <strong>{selectedDetailRecord.currentA !== undefined ? `${selectedDetailRecord.currentA} A` : (selectedDetailRecord.Current_A ? `${selectedDetailRecord.Current_A} A` : 'N/A')}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Power Load">
                  <strong>{selectedDetailRecord.powerLoadMW !== undefined ? `${selectedDetailRecord.powerLoadMW} MW` : (selectedDetailRecord.Power_Load_MW ? `${selectedDetailRecord.Power_Load_MW} MW` : 'N/A')}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Component Health">
                  <Tag color="cyan">
                    ● {selectedDetailRecord.componentHealth || selectedDetailRecord.Component_Health || 'Normal'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Reported Date">
                  {selectedDetailRecord.reportedDate || selectedDetailRecord.Reported_Date || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={selectedDetailRecord.isSent ? 'green' : 'gold'}>
                    {selectedDetailRecord.status || (selectedDetailRecord.isSent ? 'Scheduled Block' : 'Pending Block')}
                  </Tag>
                </Descriptions.Item>
                {selectedDetailRecord.remarks && (
                  <Descriptions.Item label="Remarks" span={2}>
                    {selectedDetailRecord.remarks}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            {/* ============================================================ */}
            {/* 2. ML ANALYSIS & SEVERITY ASSESSMENT */}
            {/* ============================================================ */}
            <Card
              size="small"
              title={
                <span style={{ color: '#059669', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RobotOutlined /> 2. ML ANALYSIS &amp; SEVERITY ASSESSMENT
                </span>
              }
              style={{ background: 'rgba(5, 150, 105, 0.04)', border: '1px solid #059669', borderRadius: 8 }}
            >
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PREDICTED SEVERITY</div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color={
                      (selectedDetailRecord.severity || selectedDetailRecord.Severity || '').toUpperCase() === 'CRITICAL' ? 'red' :
                      (selectedDetailRecord.severity || selectedDetailRecord.Severity || '').toUpperCase() === 'HIGH' ? 'volcano' :
                      (selectedDetailRecord.severity || selectedDetailRecord.Severity || '').toUpperCase() === 'MEDIUM' ? 'gold' : 'blue'
                    } style={{ fontSize: 13, fontWeight: 800, padding: '2px 10px' }}>
                      {(selectedDetailRecord.severity || selectedDetailRecord.Severity || 'CRITICAL').toUpperCase()}
                    </Tag>
                    {selectedDetailRecord.confidenceScore !== undefined && (
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                        ({(selectedDetailRecord.confidenceScore * 100).toFixed(0)}% Conf.)
                      </span>
                    )}
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PRIORITY SCORE &amp; CLASS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#1e3a8a' }}>
                      {selectedDetailRecord.priorityScore !== undefined ? Number(selectedDetailRecord.priorityScore).toFixed(1) : (selectedDetailRecord.Priority_Score || 'N/A')}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>/ 100</span>
                    <Tag color={Number(selectedDetailRecord.priorityScore || selectedDetailRecord.Priority_Score || 0) >= 75 ? 'red' : 'orange'}>
                      Class {selectedDetailRecord.priorityClass || selectedDetailRecord.Priority_Class || 'A'}
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
                    {selectedDetailRecord.severityReason || selectedDetailRecord.Severity_Reason || (
                      selectedDetailRecord.defectType
                        ? `Classified based on TDMS electrical safety standards and operational risk for ${selectedDetailRecord.defectType}.`
                        : 'Not available'
                    )}
                  </div>
                </Col>

                {/* Additional SLA & Risk Context */}
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Resolution SLA / Due Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {selectedDetailRecord.slaDays ? `${selectedDetailRecord.slaDays} Days` : '3 Days'} (Due: {selectedDetailRecord.dueDate || selectedDetailRecord.Due_Date || 'Not available'})
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Estimated Work Duration</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                    {selectedDetailRecord.workDurationHrs || selectedDetailRecord.predictedResolutionTimeHours || 3.5} Hours
                  </div>
                </Col>
                <Col span={24}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Risk If Delayed</div>
                  <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                    {selectedDetailRecord.riskIfDelayed || selectedDetailRecord.Risk_If_Delayed || 'OHE catenary/traction power disruption risk.'}
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
                    {selectedDetailRecord.requestedDate || selectedDetailRecord.Requested_Date || (
                      selectedDetailRecord.requestedStartDate
                        ? `${selectedDetailRecord.requestedStartDate}${selectedDetailRecord.requestedEndDate && selectedDetailRecord.requestedEndDate !== selectedDetailRecord.requestedStartDate ? ` to ${selectedDetailRecord.requestedEndDate}` : ''}`
                        : 'Not available'
                    )}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Requested Time">
                  <strong>
                    {selectedDetailRecord.requestedTime || selectedDetailRecord.Requested_Time || (
                      selectedDetailRecord.requestedStartTime
                        ? `${selectedDetailRecord.requestedStartTime} – ${selectedDetailRecord.requestedEndTime || ''}`
                        : 'Not available'
                    )}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Optimal Date">
                  <strong style={{ color: '#059669', fontSize: 13 }}>
                    {selectedDetailRecord.optimalDate || selectedDetailRecord.Optimal_Date || (selectedDetailRecord.isSent ? '08 Sep 2026' : 'Not available')}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Optimal Time">
                  <strong style={{ color: '#059669', fontSize: 13 }}>
                    {selectedDetailRecord.optimalTime || selectedDetailRecord.Optimal_Time || (selectedDetailRecord.optimalStartTime ? `${selectedDetailRecord.optimalStartTime} – ${selectedDetailRecord.optimalEndTime || ''}` : (selectedDetailRecord.isSent ? '02:00 – 05:30' : 'Not available'))}
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Reason why Optimal Date/Time is better" span={2}>
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    {selectedDetailRecord.optimalScheduleReason || selectedDetailRecord.Optimal_Schedule_Reason || (
                      selectedDetailRecord.isSent
                        ? 'Selected optimal schedule maximizes corridor throughput, provides clear passenger train headway, and prevents overlap with existing maintenance possessions.'
                        : 'Not available (Click "Send" to prompt for requested schedule and calculate optimal slot)'
                    )}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Action Footer inside Drawer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button onClick={() => setDetailDrawerOpen(false)}>Close</Button>
              {!isCOA && !selectedDetailRecord.isSent && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    setTargetDispatchRecord(selectedDetailRecord);
                    setDispatchModalOpen(true);
                  }}
                >
                  SUBMIT POWER BLOCK REQUEST
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
      <SendBlockRequestModal open={sendBlockModalOpen} onClose={() => setSendBlockModalOpen(false)} targetItem={selectedItem} />
    </div>
  );
};
