import React, { useState } from 'react';
import { Card, Row, Col, Segmented, DatePicker, Button, Table, Tag, Space, Modal, Form, Input, message, Alert } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  MailOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MergeCellsOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportReportToPDF } from '../utils/pdfExport';
import { exportReportToExcel } from '../utils/excelExport';
import { MERGED_BLOCK_PROPOSALS, SYSTEM_STATS } from '../mock/apiData';

export const ReportsPage = ({ userRole }) => {
  const [reportScope, setReportScope] = useState('Weekly');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm] = Form.useForm();

  const isReadOnly = userRole === 'Viewer';

  const reportSummaryData = [
    { label: 'Report Scope', value: `${reportScope} (Week 36, 2026)` },
    { label: 'Total Executed Blocks', value: '84 Blocks' },
    { label: 'Joint Merged Rate', value: '68% (46 Merged)' },
    { label: 'Block Hours Saved', value: '164.5 Hours' },
    { label: 'Priority Completion Rate', value: '94.2%' },
    { label: 'Train Detentions Avoided', value: '38 Trains' },
  ];

  const handleExportPDF = () => {
    const headers = ['Joint Block ID', 'Section', 'Departments Consolidated', 'Hours Saved', 'Status'];
    const rows = MERGED_BLOCK_PROPOSALS.map(p => [p.jointBlockCode, p.section, p.departmentsMerged.join(', '), `${p.hoursSaved} hrs`, p.status]);
    exportReportToPDF(`JointBlock_AI_${reportScope}_Executive_Report`, reportSummaryData, headers, rows);
    message.success('PDF Executive Report generated successfully!');
  };

  const handleExportExcel = () => {
    const headers = ['Joint Block ID', 'Section', 'Departments Consolidated', 'Single Dept Hours', 'Joint Hours', 'Hours Saved', 'Status', 'AI Justification'];
    const rows = MERGED_BLOCK_PROPOSALS.map(p => [p.jointBlockCode, p.section, p.departmentsMerged.join(', '), p.singleDeptTotalHours, p.optimizedJointHours, p.hoursSaved, p.status, p.aiReasoning]);
    exportReportToExcel(`JointBlock_AI_${reportScope}_Data`, 'Summary', headers, rows);
    message.success('Excel workbook exported successfully!');
  };

  const handleSendEmail = (values) => {
    // TODO: API - POST /api/reports/send-email
    message.success(`Executive PDF report dispatched to ${values.recipientEmail}!`);
    setIsEmailModalOpen(false);
    emailForm.resetFields();
  };

  const columns = [
    { title: 'Block Code', dataIndex: 'jointBlockCode', key: 'jointBlockCode', render: c => <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{c}</strong> },
    { title: 'Section / Corridor', dataIndex: 'section', key: 'section' },
    { title: 'Departments Consolidated', dataIndex: 'departmentsMerged', key: 'departmentsMerged', render: depts => depts.join(' + ') },
    { title: 'Single Dept Hours', dataIndex: 'singleDeptTotalHours', key: 'singleDeptTotalHours', render: h => `${h} hrs` },
    { title: 'Optimized Joint Hours', dataIndex: 'optimizedJointHours', key: 'optimizedJointHours', render: h => <Tag color="success">{h} hrs</Tag> },
    { title: 'Hours Saved', dataIndex: 'hoursSaved', key: 'hoursSaved', render: h => <strong>{h} hrs</strong> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => <Tag color="blue">{s}</Tag> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextOutlined style={{ color: '#059669' }} /> Weekly & Monthly Executive Report Generator
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: 0, fontSize: 13 }}>
            Comprehensive performance audits and executive block schedule reports for Divisional Railway Manager (DRM)
          </p>
        </div>

        <Space size="middle" style={{ flexWrap: 'wrap' }}>
          <Segmented
            value={reportScope}
            onChange={setReportScope}
            options={['Weekly', 'Monthly']}
          />
          <DatePicker picker={reportScope === 'Weekly' ? 'week' : 'month'} value={selectedDate} onChange={setSelectedDate} />

          <Button icon={<EyeOutlined />} onClick={() => setIsPreviewModalOpen(true)}>
            Interactive Preview
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF} style={{ background: '#1e3a8a' }}>
            Export PDF Report
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button icon={<MailOutlined />} disabled={isReadOnly} onClick={() => setIsEmailModalOpen(true)}>
            Email to DRM
          </Button>
        </Space>
      </div>

      {/* KPI Cards Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>TOTAL BLOCKS</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>84</div>
            <div style={{ fontSize: 11, color: '#059669' }}>+12% vs last {reportScope.toLowerCase()}</div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>JOINT MERGED BLOCKS</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>46</div>
            <div style={{ fontSize: 11, color: '#059669' }}>68% Merge Ratio</div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>BLOCK HOURS SAVED</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', marginTop: 4 }}>164.5 hrs</div>
            <div style={{ fontSize: 11, color: '#0284c7' }}>+38.2 hrs saved</div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>PRIORITY COMPLETION</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>94.2%</div>
            <div style={{ fontSize: 11, color: '#7c3aed' }}>S1/S2 Defects Cleared</div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>TRAIN IMPACT REDUCTION</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 4 }}>-74%</div>
            <div style={{ fontSize: 11, color: '#d97706' }}>38 Detentions Avoided</div>
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ir-text-sub)' }}>INTER-DIVISION DELTA</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>0 Conflicts</div>
            <div style={{ fontSize: 11, color: '#059669' }}>100% Coordinated</div>
          </Card>
        </Col>
      </Row>

      {/* Main Report Table Preview */}
      <Card title={`${reportScope} Joint Maintenance Block Execution Log`} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
        <Table
          columns={columns}
          dataSource={MERGED_BLOCK_PROPOSALS}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Interactive Report Document Preview Modal */}
      <Modal
        title={`Executive PDF Document Preview — ${reportScope} Report`}
        open={isPreviewModalOpen}
        onCancel={() => setIsPreviewModalOpen(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>,
          <Button key="pdf" type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF}>Download PDF</Button>
        ]}
      >
        <div style={{ padding: 20, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1e3a8a', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e3a8a' }}>PRAGATI-RAIL — INDIAN RAILWAYS</div>
              <div style={{ fontSize: 12, color: '#475569' }}>Divisional Maintenance Block Optimization Executive Report</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#64748b' }}>
              <div>Division: Delhi (NR)</div>
              <div>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
            <Row gutter={[12, 12]}>
              {reportSummaryData.map((item, idx) => (
                <Col span={12} key={idx}>
                  <strong>{item.label}:</strong> {item.value}
                </Col>
              ))}
            </Row>
          </div>

          <Table
            size="small"
            pagination={false}
            columns={columns}
            dataSource={MERGED_BLOCK_PROPOSALS}
            rowKey="id"
          />
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal
        title="Dispatch Executive Report via Email"
        open={isEmailModalOpen}
        onCancel={() => setIsEmailModalOpen(false)}
        onOk={() => emailForm.submit()}
      >
        <Form form={emailForm} layout="vertical" onFinish={handleSendEmail} initialValues={{ recipientEmail: 'drm.dli@indianrailways.gov.in', subject: `[JointBlock AI] ${reportScope} Maintenance Executive Audit Report` }}>
          <Form.Item name="recipientEmail" label="Recipient Email Address" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="subject" label="Subject Line" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Additional Operational Remarks">
            <Input.TextArea rows={3} placeholder="Attached is the verified week 36 joint block optimization performance summary." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
