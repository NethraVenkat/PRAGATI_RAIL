import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Modal, Form, Input, InputNumber, Switch, Space, Badge, Tabs, Alert, message, Timeline } from 'antd';
import {
  AlertOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BellOutlined,
  SettingOutlined,
  MailOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { SYSTEM_ALERTS } from '../mock/apiData';

export const AlertsPage = ({ userRole }) => {
  const [alerts, setAlerts] = useState(SYSTEM_ALERTS);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isReadOnly = userRole === 'Viewer';

  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const highCount = alerts.filter(a => a.severity === 'High').length;
  const mediumCount = alerts.filter(a => a.severity === 'Medium').length;
  const lowCount = alerts.filter(a => a.severity === 'Low').length;

  const filteredAlerts = alerts.filter(a => severityFilter === 'ALL' || a.severity === severityFilter);

  const handleAcknowledge = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    message.success(`Acknowledged alert ${id}`);
  };

  const handleOpenDetail = (alertItem) => {
    setSelectedAlert(alertItem);
    setIsDetailOpen(true);
  };

  const columns = [
    { title: 'Alert ID', dataIndex: 'id', key: 'id', render: id => <strong style={{ fontFamily: 'monospace' }}>{id}</strong> },
    {
      title: 'Severity Level',
      dataIndex: 'severity',
      key: 'severity',
      render: sev => (
        <Tag color={sev === 'Critical' ? 'error' : sev === 'High' ? 'warning' : 'processing'} style={{ fontWeight: 700 }}>
          {sev}
        </Tag>
      )
    },
    { title: 'Alert Title', dataIndex: 'title', key: 'title', render: title => <span style={{ fontWeight: 600 }}>{title}</span> },
    { title: 'Location / Section', dataIndex: 'location', key: 'location' },
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', render: ts => <span style={{ fontSize: 12 }}>{ts}</span> },
    {
      title: 'Status',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      render: ack => ack ? <Tag color="success">Acknowledged</Tag> : <Badge status="error" text="Pending Review" />
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<AlertOutlined />} onClick={() => handleOpenDetail(record)}>
            Inspect
          </Button>
          {!record.acknowledged && (
            <Button size="small" type="primary" disabled={isReadOnly} onClick={() => handleAcknowledge(record.id)}>
              Acknowledge
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertOutlined style={{ color: '#dc2626' }} /> Alert System & Emergency Notifications
          </h1>
          <p style={{ color: 'var(--ir-text-sub)', margin: 0, fontSize: 13 }}>
            Automated defect detection, S1 emergency escalation, and SMS/Email notification dispatch
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Live Feed (30s):</span>
          <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
        </div>
      </div>

      {/* Severity Filter Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => setSeverityFilter(severityFilter === 'Critical' ? 'ALL' : 'Critical')}
            style={{
              borderRadius: 8,
              border: severityFilter === 'Critical' ? '2px solid #dc2626' : '1px solid var(--ir-border)',
              background: severityFilter === 'Critical' ? 'rgba(220, 38, 38, 0.05)' : 'transparent'
            }}
          >
            <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>CRITICAL (S1)</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{criticalCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ir-text-sub)' }}>Emergency Escalation Triggered</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => setSeverityFilter(severityFilter === 'High' ? 'ALL' : 'High')}
            style={{
              borderRadius: 8,
              border: severityFilter === 'High' ? '2px solid #d97706' : '1px solid var(--ir-border)',
              background: severityFilter === 'High' ? 'rgba(217, 119, 6, 0.05)' : 'transparent'
            }}
          >
            <div style={{ fontSize: 12, color: '#d97706', fontWeight: 700 }}>HIGH SEVERITY</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{highCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ir-text-sub)' }}>Requires Same-Day Action</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => setSeverityFilter(severityFilter === 'Medium' ? 'ALL' : 'Medium')}
            style={{
              borderRadius: 8,
              border: severityFilter === 'Medium' ? '2px solid #0284c7' : '1px solid var(--ir-border)',
              background: severityFilter === 'Medium' ? 'rgba(2, 132, 199, 0.05)' : 'transparent'
            }}
          >
            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700 }}>MEDIUM</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{mediumCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ir-text-sub)' }}>Merged into Joint Queue</div>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            hoverable
            onClick={() => setSeverityFilter(severityFilter === 'Low' ? 'ALL' : 'Low')}
            style={{
              borderRadius: 8,
              border: severityFilter === 'Low' ? '2px solid #64748b' : '1px solid var(--ir-border)',
              background: severityFilter === 'Low' ? 'rgba(100, 116, 139, 0.05)' : 'transparent'
            }}
          >
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>LOW</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{lowCount}</div>
            <div style={{ fontSize: 11, color: 'var(--ir-text-sub)' }}>Routine Monitoring</div>
          </Card>
        </Col>
      </Row>

      {/* Alert Feed Tabs */}
      <Tabs
        type="card"
        items={[
          {
            key: 'feed',
            label: '1. Live System Alert Feed',
            children: (
              <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Table
                  columns={columns}
                  dataSource={filteredAlerts}
                  rowKey="id"
                  pagination={{ pageSize: 6 }}
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            )
          },
          {
            key: 'config',
            label: '2. Threshold & Recipient Configuration',
            children: (
              <Card style={{ borderRadius: 10, border: '1px solid var(--ir-border)' }}>
                <Form layout="vertical" initialValues={{ criticalEmail: 'drm.dli@indianrailways.gov.in', smsGateway: '+91 9876543210', autoEscalate: true }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="criticalEmail" label="S1 Critical Emergency Email Dispatch" rules={[{ required: true }]}>
                        <Input prefix={<MailOutlined />} disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="smsGateway" label="Emergency SMS Alert Recipient" rules={[{ required: true }]}>
                        <Input prefix={<MobileOutlined />} disabled={isReadOnly} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="autoEscalate" label="Auto-Escalate Critical Defects to DRM Operations Desk" valuePropName="checked">
                    <Switch disabled={isReadOnly} />
                  </Form.Item>

                  <Button type="primary" disabled={isReadOnly} onClick={() => message.success('Updated Alert Configurations')}>
                    Save Threshold Settings
                  </Button>
                </Form>
              </Card>
            )
          }
        ]}
      />

      {/* Alert Detail Modal */}
      <Modal
        title={selectedAlert ? `Alert Details: ${selectedAlert.id}` : 'Alert Inspector'}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>Close</Button>,
          selectedAlert && !selectedAlert.acknowledged && (
            <Button key="ack" type="primary" disabled={isReadOnly} onClick={() => { handleAcknowledge(selectedAlert.id); setIsDetailOpen(false); }}>
              Acknowledge Alert
            </Button>
          )
        ]}
      >
        {selectedAlert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type={selectedAlert.severity === 'Critical' ? 'error' : 'warning'}
              showIcon
              message={selectedAlert.title}
              description={selectedAlert.message}
            />

            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Incident Timeline:</div>
              <Timeline
                items={[
                  { color: 'red', children: `Defect Detected at ${selectedAlert.timestamp}` },
                  { color: 'orange', children: 'Automated AI Priority Score calculated (95/100)' },
                  { color: 'blue', children: 'Dispatched to Engineering & Control Office' },
                  { color: selectedAlert.acknowledged ? 'green' : 'gray', children: selectedAlert.acknowledged ? 'Acknowledged by DRM Desk' : 'Pending Resolution' }
                ]}
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Resolution Notes:</div>
              <div style={{ padding: 12, background: 'var(--ir-bg)', borderRadius: 6, fontSize: 12 }}>
                {selectedAlert.resolutionNotes}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
