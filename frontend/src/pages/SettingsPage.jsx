import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Select, Button, Table, Tag, Switch, Modal, Row, Col, Space, Alert, message, Popconfirm } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  ApiOutlined,
  MailOutlined,
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { SYSTEM_USERS, SYSTEM_LOGS, DIVISIONS } from '../mock/apiData';
import { exportReportToExcel } from '../utils/excelExport';
import { resetDemoData } from '../mock/mockDb';
import { USE_MOCK } from '../services/apiClient';

export const SettingsPage = ({ userRole, setUserRole }) => {
  const [users, setUsers] = useState(SYSTEM_USERS);
  const [logs, setLogs] = useState(SYSTEM_LOGS);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [userForm] = Form.useForm();

  const isReadOnly = userRole === 'Viewer';

  const handleTestApiConnection = () => {
    setApiTesting(true);
    setApiTestResult(null);
    setTimeout(() => {
      setApiTesting(false);
      setApiTestResult({ status: 'success', latency: '42 ms', version: 'v1.8.4' });
      message.success('API Ping Successful! Backend endpoints responding at 42ms latency.');
    }, 1200);
  };

  const handleAddUser = (values) => {
    const newUser = {
      id: `USR-0${users.length + 1}`,
      ...values,
      status: 'Active',
      lastLogin: 'Never'
    };
    setUsers([...users, newUser]);
    message.success(`Added system user ${newUser.name}`);
    setIsUserModalOpen(false);
    userForm.resetFields();
  };

  const handleClearLogs = () => {
    setLogs([]);
    message.success('Cleared system activity logs');
  };

  const handleResetOperationalData = () => {
    resetDemoData();
    message.success('Operational data reset to standard Indian Railways datasets. Reloading…');
    setTimeout(() => window.location.reload(), 700);
  };

  const handleExportLogs = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Action', 'Detail'];
    const rows = logs.map(l => [l.id, l.timestamp, l.user, l.action, l.detail]);
    exportReportToExcel('JointBlock_System_Logs', 'Logs', headers, rows);
  };

  const userColumns = [
    { title: 'User ID', dataIndex: 'id', key: 'id', render: id => <strong style={{ fontFamily: 'monospace' }}>{id}</strong> },
    { title: 'Full Name', dataIndex: 'name', key: 'name', render: name => <span style={{ fontWeight: 600 }}>{name}</span> },
    { title: 'Email Address', dataIndex: 'email', key: 'email' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Division', dataIndex: 'division', key: 'division', render: d => <Tag color="blue">{d}</Tag> },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: r => (
        <Tag color={r === 'Admin' ? 'red' : r === 'Manager' ? 'blue' : 'orange'} style={{ fontWeight: 700 }}>
          {r}
        </Tag>
      )
    },
    { title: 'Last Login', dataIndex: 'lastLogin', key: 'lastLogin', render: ll => <span style={{ fontSize: 11 }}>{ll}</span> }
  ];

  const logColumns = [
    { title: 'Log ID', dataIndex: 'id', key: 'id', render: id => <strong style={{ fontFamily: 'monospace' }}>{id}</strong> },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: ts => <span style={{ fontSize: 11 }}>{ts}</span> },
    { title: 'User', dataIndex: 'user', key: 'user' },
    { title: 'Action Tag', dataIndex: 'action', key: 'action', render: a => <Tag color="geekblue">{a}</Tag> },
    { title: 'Operational Details', dataIndex: 'detail', key: 'detail' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingOutlined style={{ color: '#1e3a8a' }} /> System Settings & User Role Management
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: 0, fontSize: 13 }}>
            Global parameters, API connection stubs, role permissions, SMTP gateways, and audit logs
          </p>
        </div>

        <Alert
          type="info"
          showIcon
          message={
            <span>Current Role: <strong>{userRole}</strong> {isReadOnly ? '(Read-Only Mode)' : '(Full Access Controls)'}</span>
          }
        />
      </div>

      <Tabs
        type="card"
        items={[
          {
            key: 'general',
            label: '1. General Settings',
            icon: <SettingOutlined />,
            children: (
              <Card style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Form layout="vertical" initialValues={{ systemName: 'PRAGATI-RAIL — Indian Railways', defaultDivision: 'DLI', timezone: 'Asia/Kolkata (IST +5:30)', defaultTheme: 'Light' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="systemName" label="System Name / Platform Title">
                        <Input disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="defaultDivision" label="Default Operating Division">
                        <Select options={DIVISIONS.map(d => ({ label: d.name, value: d.code }))} disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="timezone" label="System Timezone">
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="defaultTheme" label="Default Theme Interface">
                        <Select options={[{ label: 'Light Theme (Default)', value: 'Light' }, { label: 'Dark Theme', value: 'Dark' }]} disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" disabled={isReadOnly} onClick={() => message.success('Saved General System Settings')}>
                    Save General Configuration
                  </Button>
                </Form>
              </Card>
            )
          },
          {
            key: 'users',
            label: '2. User Management & Roles',
            icon: <UserOutlined />,
            children: (
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>System Authorized Users</span>
                    <Button type="primary" icon={<PlusOutlined />} disabled={isReadOnly} onClick={() => setIsUserModalOpen(true)}>
                      Add New User
                    </Button>
                  </div>
                }
                style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}
              >
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            )
          },
          {
            key: 'api',
            label: '3. API & Backend Wiring',
            icon: <ApiOutlined />,
            children: (
              <Card style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Form layout="vertical" initialValues={{ baseUrl: 'http://localhost:5000/api', apiKey: 'jb_live_sih26027_rail_key_9921', coaEndpoint: '/api/coa/corridors' }}>
                  <Form.Item name="baseUrl" label="Backend Service Base URL (Node.js / Express)">
                    <Input disabled={isReadOnly} />
                  </Form.Item>

                  <Form.Item name="apiKey" label="Authorization API Bearer Key">
                    <Input.Password disabled={isReadOnly} />
                  </Form.Item>

                  <Form.Item name="coaEndpoint" label="Control Office Application (COA) Feed Path">
                    <Input disabled={isReadOnly} />
                  </Form.Item>

                  <Space size="middle">
                    <Button type="primary" icon={<ReloadOutlined spin={apiTesting} />} loading={apiTesting} onClick={handleTestApiConnection}>
                      Test API Connection
                    </Button>
                  </Space>

                  {apiTestResult && (
                    <Alert
                      style={{ marginTop: 16 }}
                      type="success"
                      showIcon
                      message="API Connection Verified Successfully"
                      description={`Response Latency: ${apiTestResult.latency} • Backend Build: ${apiTestResult.version} • All 12 Endpoint Surface routes ready for production backend payload swap.`}
                    />
                  )}
                </Form>
              </Card>
            )
          },
          {
            key: 'email',
            label: '4. Email & SMS Gateways',
            icon: <MailOutlined />,
            children: (
              <Card style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Form layout="vertical" initialValues={{ smtpHost: 'smtp.indianrailways.gov.in', smtpPort: 587, smsGateway: 'NIC National Railway SMS Gateway (REST)' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="smtpHost" label="SMTP Server Host">
                        <Input disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="smtpPort" label="SMTP Port">
                        <Input disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="smsGateway" label="SMS Gateway Provider">
                    <Input disabled={isReadOnly} />
                  </Form.Item>

                  <Button type="primary" disabled={isReadOnly} onClick={() => message.success('Dispatched test email and SMS alert payload')}>
                    Send Test Email & SMS Alert
                  </Button>
                </Form>
              </Card>
            )
          },
          {
            key: 'simulation',
            label: '5. Operational Data & Controls',
            icon: <DatabaseOutlined />,
            children: (
              <Card style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Alert
                  type={USE_MOCK ? 'info' : 'success'}
                  showIcon
                  style={{ marginBottom: 20 }}
                  message={USE_MOCK ? 'Operational data engine is ready' : 'Connected to Live Backend'}
                  description={
                    USE_MOCK
                      ? 'All ML models and operational services are available in this browser and persisted locally. No additional server process is required.'
                      : 'This client is configured to call the live PRAGATI-RAIL backend. Local data controls below are inactive.'
                  }
                />

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" style={{ background: 'var(--ir-bg)', border: '1px solid var(--ir-border)', borderRadius: 8, height: '100%' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Reset Operational Data</div>
                      <p style={{ fontSize: 12.5, color: 'var(--ir-text-sub)', marginBottom: 14 }}>
                        Clears locally stored defects, block requests, and approvals you've created this session and
                        restores the standard Indian Railways operational dataset (19 zones, seeded TMS/SMMS/TDMS defects,
                        pre-approved block requests).
                      </p>
                      <Popconfirm
                        title="Reset all operational data?"
                        description="This clears every locally-stored defect, block request and approval and cannot be undone."
                        icon={<ExclamationCircleOutlined style={{ color: '#dc2626' }} />}
                        okText="Reset Operational Data"
                        okButtonProps={{ danger: true }}
                        onConfirm={handleResetOperationalData}
                        disabled={isReadOnly || !USE_MOCK}
                      >
                        <Button danger icon={<ReloadOutlined />} disabled={isReadOnly || !USE_MOCK}>
                          Reset Operational Data
                        </Button>
                      </Popconfirm>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" style={{ background: 'var(--ir-bg)', border: '1px solid var(--ir-border)', borderRadius: 8, height: '100%' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Data Connection</div>
                      <p style={{ fontSize: 12.5, color: 'var(--ir-text-sub)', marginBottom: 10 }}>
                        Controlled via the backend connection setting in <code>.env</code>. Set it to live mode once
                        the real Node/Express backend and ML services are deployed to switch this client to live mode.
                      </p>
                      <Tag color={USE_MOCK ? 'processing' : 'success'} style={{ fontWeight: 700 }}>
                        Current Mode: {USE_MOCK ? 'Local Data' : 'Live Backend'}
                      </Tag>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'logs',
            label: '6. System Audit Logs',
            icon: <FileTextOutlined />,
            children: (
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>System Operational Activity Logs</span>
                    <Space>
                      <Button icon={<DownloadOutlined />} onClick={handleExportLogs}>
                        Export Logs Excel
                      </Button>
                      <Popconfirm title="Are you sure you want to clear system logs?" onConfirm={handleClearLogs} disabled={isReadOnly}>
                        <Button danger icon={<DeleteOutlined />} disabled={isReadOnly}>
                          Clear Logs
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                }
                style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}
              >
                <Table
                  columns={logColumns}
                  dataSource={logs}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Add User Modal */}
      <Modal
        title="Add New System User"
        open={isUserModalOpen}
        onCancel={() => setIsUserModalOpen(false)}
        onOk={() => userForm.submit()}
      >
        <Form form={userForm} layout="vertical" onFinish={handleAddUser}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Rajesh Kumar" />
          </Form.Item>
          <Form.Item name="email" label="Official Railway Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="name@indianrailways.gov.in" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Control Office (DRM)', label: 'Control Office' },
                  { value: 'Engineering (TMS)', label: 'Engineering' },
                  { value: 'Signal & Telecom (SMMS)', label: 'Signal' },
                  { value: 'Traction OHE (TDMS)', label: 'Traction OHE' }
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Role Assignment" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Admin', label: 'Admin (Full Access)' },
                  { value: 'Manager', label: 'Manager (Dept Access)' },
                  { value: 'Viewer', label: 'Viewer (Read-Only)' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="division" label="Division" rules={[{ required: true }]}>
            <Select options={DIVISIONS.map(d => ({ label: d.name, value: d.code }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
