import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Modal, Form, Row, Col, Progress, message, Tooltip, Alert } from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DownloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { DIVISIONS, calculatePriorityScore } from '../../mock/apiData';
import { exportReportToExcel } from '../../utils/excelExport';

export const DepartmentProtocolManager = ({
  deptCode, // 'TMS', 'SMMS', 'TDMS'
  deptName, // 'Engineering (Track)', 'Signal & Telecom', 'Traction (OHE)'
  apiEndpoint, // '/api/tms/*', '/api/smms/*', '/api/tdms/*'
  defectTypes, // Array of department specific defect strings
  initialData,
  userRole
}) => {
  const [data, setData] = useState(initialData);
  const [searchText, setSearchText] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDivision, setSelectedDivision] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);

  const [form] = Form.useForm();

  const isReadOnly = userRole === 'Viewer';

  // Filters
  const filteredData = data.filter(item => {
    const matchesSearch = !searchText || Object.values(item).some(val => val && String(val).toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesDivision = selectedDivision === 'ALL' || item.division === selectedDivision;
    return matchesSearch && matchesStatus && matchesDivision;
  });

  // Handlers
  const handleOpenAddModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setIsAddModalOpen(true);
  };

  const handleSaveForm = (values) => {
    // calculate priority score
    const newScore = calculatePriorityScore({
      severityScore: values.severity === 'Critical' ? 95 : values.severity === 'High' ? 80 : 50,
      urgencyScore: 75,
      assetImpactScore: 75,
      trainImpactScore: 70,
      overdueDaysScore: (values.overdueDays || 1) * 20,
    });

    if (editingRecord) {
      // TODO: API - PUT ${apiEndpoint}/${editingRecord.id}
      setData(data.map(item => item.id === editingRecord.id ? { ...item, ...values, priorityScore: newScore } : item));
      message.success(`Updated defect record ${editingRecord.id} successfully!`);
    } else {
      // TODO: API - POST ${apiEndpoint}/create
      const newRecord = {
        id: `${deptCode}-2026-${Math.floor(100 + Math.random() * 900)}`,
        department: deptCode,
        deptLabel: deptName,
        ...values,
        priorityScore: newScore,
        status: 'Pending Block',
        dateReported: new Date().toISOString().split('T')[0]
      };
      setData([newRecord, ...data]);
      message.success(`Created new ${deptCode} defect record ${newRecord.id}!`);
    }
    setIsAddModalOpen(false);
  };

  const handleDelete = (id) => {
    // TODO: API - DELETE ${apiEndpoint}/${id}
    setData(data.filter(item => item.id !== id));
    message.success(`Deleted record ${id}`);
  };

  const handleCsvSimulateUpload = () => {
    setCsvUploading(true);
    setCsvProgress(10);
    const timer = setInterval(() => {
      setCsvProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setCsvUploading(false);
          setCsvSummary({ total: 14, imported: 14, failed: 0, duplicates: 0 });
          message.success('Bulk CSV file imported successfully!');
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  const handleExportExcel = () => {
    const headers = ['Defect ID', 'Department', 'Defect Type', 'Location', 'Division', 'Severity', 'Priority Score', 'Status', 'Date Reported'];
    const rows = filteredData.map(d => [d.id, d.department, d.defectType, d.location, d.division, d.severity, d.priorityScore, d.status, d.dateReported]);
    exportReportToExcel(`${deptCode}_Maintenance_Defects`, deptCode, headers, rows);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: id => <strong style={{ fontFamily: 'monospace' }}>{id}</strong> },
    { title: 'Defect Type', dataIndex: 'defectType', key: 'defectType' },
    { title: 'Location / Section', dataIndex: 'location', key: 'location' },
    { title: 'Division', dataIndex: 'division', key: 'division', render: div => <Tag color="blue">{div}</Tag> },
    { 
      title: 'AI Score', 
      dataIndex: 'priorityScore', 
      key: 'priorityScore',
      render: score => <strong>{score} / 100</strong>
    },
    { title: 'Requested Window', dataIndex: 'requestedWindow', key: 'requestedWindow' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: st => <Tag color="purple">{st}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />} 
            disabled={isReadOnly}
            onClick={() => handleOpenAddModal(record)} 
          />
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            disabled={isReadOnly}
            onClick={() => handleDelete(record.id)} 
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            {deptName} ({deptCode}) Maintenance Protocol Manager
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: 0, fontSize: 13 }}>
            Ingest, validate, and queue maintenance requests for operational block scheduling
          </p>
        </div>

        <Space size="middle">
          <Button 
            icon={<UploadOutlined />} 
            disabled={isReadOnly} 
            onClick={() => setIsCsvModalOpen(true)}
          >
            Bulk CSV Upload
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            disabled={isReadOnly}
            onClick={() => handleOpenAddModal()}
          >
            Add Defect Request
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
        </Space>
      </div>

      {/* Filter Bar */}
      <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} lg={6}>
            <Input
              placeholder={`Search ${deptCode} defects...`}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={5} lg={4}>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: '100%' }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Pending Block', label: 'Pending Block' },
                { value: 'Merged Joint Block', label: 'Merged Joint Block' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Emergency Escalated', label: 'Emergency Escalated' },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} lg={4}>
            <Select
              value={selectedDivision}
              onChange={setSelectedDivision}
              style={{ width: '100%' }}
              options={[
                { value: 'ALL', label: 'All Divisions' },
                ...DIVISIONS.map(d => ({ value: d.code, label: d.code }))
              ]}
            />
          </Col>
          <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 13, color: 'var(--ir-text-sub)' }}>
              Showing <strong>{filteredData.length}</strong> of {data.length} records
            </span>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        title={editingRecord ? `Edit ${deptCode} Defect: ${editingRecord.id}` : `Add New ${deptCode} Maintenance Defect`}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveForm}>
          <Form.Item name="defectType" label="Defect / Maintenance Work Type" rules={[{ required: true }]}>
            <Select options={defectTypes.map(t => ({ label: t, value: t }))} />
          </Form.Item>

          <Form.Item name="location" label="Location / Kilometer Section" rules={[{ required: true }]}>
            <Input placeholder="e.g. NDLS-CNB Down Line (KM 142/10)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="division" label="Division" rules={[{ required: true }]}>
                <Select options={DIVISIONS.map(d => ({ label: d.name, value: d.code }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="requestedWindow" label="Requested Window" rules={[{ required: true }]}>
                <Input placeholder="e.g. 02:00 - 06:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requestedDurationHrs" label="Duration (Hours)" rules={[{ required: true }]}>
                <Input type="number" step="0.5" placeholder="4.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="equipmentRequired" label="Equipment / Machinery Required">
            <Input placeholder="e.g. Tower Wagon, Rail Tensor" />
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV Bulk Upload Modal */}
      <Modal
        title={`Bulk CSV Ingestion — ${deptCode} Maintenance Records`}
        open={isCsvModalOpen}
        onCancel={() => {
          setIsCsvModalOpen(false);
          setCsvSummary(null);
          setCsvProgress(0);
        }}
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Alert
            message="CSV Format Compliance"
            description={`Ensure CSV headers match: id, defectType, location, division, severity, requestedWindow, equipmentRequired. API Endpoint: POST ${apiEndpoint}/bulk-upload`}
            type="info"
            showIcon
          />

          <Button type="dashed" icon={<DownloadOutlined />} block>
            Download Official {deptCode} CSV Schema Template
          </Button>

          {!csvSummary ? (
            <div style={{ textAlign: 'center', padding: 24, border: '2px dashed var(--ir-border)', borderRadius: 8 }}>
              <UploadOutlined style={{ fontSize: 36, color: '#0284c7', marginBottom: 12 }} />
              <div>Select or drag {deptCode} CSV file to simulate bulk ingestion</div>
              {csvUploading && (
                <div style={{ marginTop: 16 }}>
                  <Progress percent={csvProgress} status="active" />
                </div>
              )}
              {!csvUploading && (
                <Button type="primary" style={{ marginTop: 16 }} onClick={handleCsvSimulateUpload}>
                  Simulate CSV File Import
                </Button>
              )}
            </div>
          ) : (
            <Alert
              type="success"
              showIcon
              message="Import Summary Complete"
              description={
                <div>
                  <div>Total Rows Parsed: <strong>{csvSummary.total}</strong></div>
                  <div>Successfully Imported: <strong>{csvSummary.imported}</strong></div>
                  <div>Schema Validation Failures: <strong>{csvSummary.failed}</strong></div>
                </div>
              }
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
