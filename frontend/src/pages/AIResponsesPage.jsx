import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Progress, Divider, Alert, Space, Typography, Tooltip, Spin, Empty, Button } from 'antd';
import {
  RobotOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  SwapOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
  MergeCellsOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export const AIResponsesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: {
      unoptimizedHours: 0,
      optimizedHours: 0,
      savedHours: 0,
      savingsPercent: 0,
      trainsAvoided: 0,
      conflictsResolved: 0,
      totalApprovedCount: 0
    },
    priorityDistData: [],
    durationAccuracyData: [],
    deptSplitData: [],
    approvedList: [],
    isCOA: false,
    userRole: '',
    userDept: ''
  });

  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const fetchOptimizationResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/ai-optimization/results');
      if (res.data?.success) {
        setData(res.data);
        if (Array.isArray(res.data.approvedList) && res.data.approvedList.length > 0) {
          // Default expand first item
          setExpandedRowKeys([res.data.approvedList[0].id || res.data.approvedList[0].blockId]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI Optimization Results:', err);
      setError(err.response?.data?.message || err.message || 'Error loading COA approved optimization results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizationResults();
  }, [user]);

  const { summary, priorityDistData, durationAccuracyData, deptSplitData, approvedList, isCOA, userDept } = data;

  const departmentTitle = isCOA
    ? 'All Departments (TMS + SMMS + TDMS) — Consolidated COA Approved View'
    : `${userDept === 'TMS' ? 'Engineering (Track / TMS)' : (userDept === 'SMMS' ? 'Signal & Telecom (SMMS)' : 'Traction OHE (TDMS)')} — Department Possessions`;

  const columns = [
    {
      title: 'Defect / Block ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (id, record) => (
        <div>
          <strong style={{ fontFamily: 'monospace', color: '#1e3a8a', fontSize: 13 }}>{id}</strong>
          {record.blockId && record.blockId !== id && (
            <div style={{ fontSize: 10, color: '#64748b' }}>{record.blockId}</div>
          )}
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'deptLabel',
      key: 'deptLabel',
      width: 150,
      render: (dept, r) => {
        const color = r.department === 'TMS' ? 'blue' : (r.department === 'SMMS' ? 'gold' : 'purple');
        return <Tag color={color} style={{ fontWeight: 600 }}>{dept || r.department}</Tag>;
      }
    },
    {
      title: 'Defect / Work Scope',
      dataIndex: 'defectType',
      key: 'defectType',
      width: 220,
      render: (text, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{text}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.location || r.section}</div>
        </div>
      )
    },
    {
      title: 'Possession Window',
      key: 'window',
      width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {r.startTime} – {r.endTime}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.date} ({r.durationHours}h)
          </div>
        </div>
      )
    },
    {
      title: 'AI Priority Score',
      dataIndex: 'priorityScore',
      key: 'priorityScore',
      width: 130,
      sorter: (a, b) => a.priorityScore - b.priorityScore,
      render: (score) => (
        <Tag color={score >= 85 ? 'red' : score >= 70 ? 'orange' : (score >= 50 ? 'blue' : 'green')} style={{ fontWeight: 700, fontSize: 12 }}>
          {Number(score || 50).toFixed(1)} / 100
        </Tag>
      )
    },
    {
      title: 'Optimization Decision',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (status, r) => {
        if (r.isJointBlock || String(status).includes('Merged')) {
          return <Tag color="success" icon={<MergeCellsOutlined />} style={{ fontWeight: 600 }}>Merged Joint Block</Tag>;
        }
        return <Tag color="cyan" icon={<SafetyCertificateOutlined />} style={{ fontWeight: 600 }}>{status}</Tag>;
      }
    }
  ];

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <Title level={5} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#1e3a8a' }}>
          <BulbOutlined style={{ color: '#d97706' }} /> AI Explainability & Formula Decomposition
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 700, color: '#334155' }}>
              Weighted Priority Score Formula Components:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, background: '#ffffff', padding: 12, borderRadius: 6, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Severity Weight (35%):</span>
                <strong>{record.severityScore || 60} × 0.35 = {((record.severityScore || 60) * 0.35).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Urgency Weight (25%):</span>
                <strong>{record.urgencyScore || 70} × 0.25 = {((record.urgencyScore || 70) * 0.25).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Asset Impact Weight (20%):</span>
                <strong>{record.assetImpactScore || 50} × 0.20 = {((record.assetImpactScore || 50) * 0.20).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Train Impact Weight (12%):</span>
                <strong>{record.trainImpactScore || 40} × 0.12 = {((record.trainImpactScore || 40) * 0.12).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Overdue Days Weight (8%):</span>
                <strong>{record.overdueDaysScore || 20} × 0.08 = {((record.overdueDaysScore || 20) * 0.08).toFixed(1)}</strong>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#059669' }}>
                <span>Calculated Final Score:</span>
                <span>{Number(record.priorityScore || 50).toFixed(1)} / 100</span>
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 700, color: '#334155' }}>
              Plain-English Operational Justification & COA Approval:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={`Approved by COA: ${record.approvedBy || 'Chief Controller'}`}
                description={record.aiReasoning || record.justification || 'Optimized possession window approved for live execution.'}
              />
              <div style={{ fontSize: 11, color: '#64748b', background: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #f1f5f9' }}>
                <strong>Possession Target:</strong> {record.date} from {record.startTime} to {record.endTime} ({record.durationHours} Hours) • <strong>Location:</strong> {record.location || record.section}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <RobotOutlined style={{ color: '#0284c7' }} /> AI Optimization Results & Explainability Matrix
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
            {departmentTitle} • Transparent decision rationale, scoring decomposition, and before/after schedule optimization metrics
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchOptimizationResults}
          loading={loading}
        >
          Refresh Approved Data
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          closable
          message="Error loading results"
          description={error}
        />
      )}

      {/* Before vs After Impact Banner */}
      <Card style={{ borderRadius: 10, background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', color: '#fff', border: 'none' }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={7}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, opacity: 0.8 }}>Before Optimization</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
              {summary.unoptimizedHours} Block Hours
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {summary.totalApprovedCount} Separate Department Possessions
            </div>
          </Col>

          <Col xs={24} md={2} style={{ textAlign: 'center' }}>
            <SwapOutlined style={{ fontSize: 28, color: '#10b981' }} />
          </Col>

          <Col xs={24} md={7}>
            <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, color: '#10b981' }}>After AI Joint Merging</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: '#10b981' }}>
              {summary.optimizedHours} Block Hours
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {isCOA ? 'Unified COA Optimized Corridors' : 'Approved Possession Windows'}
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 16, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Operational Savings Delta</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
                {summary.savedHours} Block Hours Saved ({summary.savingsPercent}% Reduction)
              </div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>
                {summary.trainsAvoided} Train Detentions Avoided • {summary.conflictsResolved} Block Possessions Approved
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Analytics Charts Row */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 14 }}>Priority Score Distribution</span>}
            style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
          >
            <div style={{ height: 220 }}>
              {priorityDistData && priorityDistData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityDistData}>
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="No Approved Priority Data Yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 14 }}>Single vs Merged Duration (Hrs)</span>}
            style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
          >
            <div style={{ height: 220 }}>
              {durationAccuracyData && durationAccuracyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationAccuracyData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="unoptimized" name="Single Dept (Hrs)" fill="#dc2626" />
                    <Bar dataKey="optimized" name="Joint Merged (Hrs)" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="No Corridor Data Available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={<span style={{ fontWeight: 700, fontSize: 14 }}>{isCOA ? 'Department Maintenance Workload Share' : 'Approved Severity Distribution'}</span>}
            style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
          >
            <div style={{ height: 220 }}>
              {deptSplitData && deptSplitData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label>
                      {deptSplitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="No Department Share Data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Optimization Results Table with Explainability Drawer */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              COA Approved AI Priority Scoring & Decision Justification Matrix ({approvedList.length} Items)
            </span>
          </div>
        }
        style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
      >
        <Table
          columns={columns}
          dataSource={approvedList}
          rowKey={(r) => r.id || r.blockId}
          expandedRowRender={expandedRowRender}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowsChange={setExpandedRowKeys}
          loading={loading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <span>
                    No COA-approved blocks found for {isCOA ? 'any department' : userDept}.
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Once a block request is approved by COA in the BDMS Planner or COA Database, it will appear here automatically.
                    </Text>
                  </span>
                }
              />
            )
          }}
        />
      </Card>
    </div>
  );
};
