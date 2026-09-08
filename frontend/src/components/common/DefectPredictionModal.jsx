import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Tag, Progress, Button, Space, Divider, Alert, Spin } from 'antd';
import {
  RobotOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  BlockOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

export const DefectPredictionModal = ({
  open,
  isPredicting,
  defect,
  mlAssessment,
  department = 'TMS',
  onBack
}) => {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (open && isPredicting) {
      setActiveStep(1);
      const timer = setTimeout(() => {
        setActiveStep(2);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [open, isPredicting]);

  if (!open) return null;

  const getDeptColor = (d) => {
    if (d === 'SMMS') return '#d97706';
    if (d === 'TDMS') return '#7c3aed';
    return '#1e3a8a';
  };

  const getSeverityColor = (sev) => {
    const s = String(sev || '').toUpperCase();
    if (s.includes('CRITICAL')) return '#dc2626';
    if (s.includes('HIGH')) return '#ea580c';
    if (s.includes('MEDIUM')) return '#0284c7';
    return '#059669';
  };

  const severity = mlAssessment?.severityLevel || defect?.severityLevel || 'High';
  const severityColor = getSeverityColor(severity);
  const priorityScore = Number(mlAssessment?.priorityScore || defect?.priorityScore || 75.0);
  const priorityClass = mlAssessment?.priorityClass || defect?.priorityClass || (priorityScore >= 80 ? 'Critical' : priorityScore >= 60 ? 'High' : priorityScore >= 40 ? 'Medium' : 'Low');
  const confidence = Math.round((mlAssessment?.severityConfidence || defect?.confidenceScore || 0.95) * 100);
  const slaDays = mlAssessment?.slaDays || (severity === 'Critical' ? 1 : severity === 'High' ? 3 : severity === 'Medium' ? 7 : 14);

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      footer={null}
      width={680}
      centered
      styles={{ body: { padding: '24px 28px' } }}
    >
      {isPredicting ? (
        /* ================= 1. PREDICTING ANIMATION VIEW ================= */
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(30, 58, 138, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: `2px dashed ${getDeptColor(department)}`
            }}
          >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: getDeptColor(department) }} spin />} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            AI Pipeline Predicting Defect Classification...
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
            Evaluating physical telemetry against Indian Railways Safety Rules &amp; LightGBM Priority Model
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
            {/* Step 1 */}
            <Card
              size="small"
              style={{
                borderRadius: 8,
                border: activeStep >= 1 ? `1px solid ${getDeptColor(department)}` : '1px solid #e2e8f0',
                background: activeStep >= 1 ? 'rgba(30, 58, 138, 0.03)' : '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {activeStep > 1 ? (
                  <CheckCircleFilled style={{ color: '#059669', fontSize: 20 }} />
                ) : (
                  <Spin size="small" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    Stage 1: {department} Severity Classification Engine
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Applying IR Track/Signal/Traction Safety Standards &amp; Overdue Risk Escalation rules...
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2 */}
            <Card
              size="small"
              style={{
                borderRadius: 8,
                border: activeStep >= 2 ? `1px solid ${getDeptColor(department)}` : '1px solid #e2e8f0',
                background: activeStep >= 2 ? 'rgba(30, 58, 138, 0.03)' : '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {activeStep >= 2 ? (
                  <Spin size="small" />
                ) : (
                  <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    Stage 2: LightGBM Priority Scoring Model (`lightgbm_model.pkl`)
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Computing multidimensional priority score, SLA deadline, and resolution urgency...
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= 2. PREDICTION RESULT CARD VIEW ================= */
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircleFilled style={{ color: '#059669', fontSize: 24 }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                AI Prediction &amp; Prioritization Results
              </h2>
              <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                Defect ID: <strong>{defect?.defectId || defect?.Defect_ID || 'TRK-2026-NEW'}</strong> • {defect?.deptLabel || `${department} Engineering`}
              </div>
            </div>
          </div>

          {/* Key Predicted Outputs Grid */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* Stage 1: Predicted Severity */}
            <Col xs={24} sm={12}>
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  border: `1.5px solid ${severityColor}`,
                  background: `${severityColor}08`,
                  height: '100%'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Stage 1 • Predicted Severity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 4px' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: severityColor }}>
                    {severity.toUpperCase()}
                  </span>
                  <Tag color={severityColor === '#dc2626' ? 'error' : severityColor === '#ea580c' ? 'warning' : 'processing'} style={{ fontWeight: 700 }}>
                    {confidence}% Confidence
                  </Tag>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Resolution SLA: <strong>{slaDays} {slaDays === 1 ? 'Day' : 'Days'}</strong></span>
                  {defect?.overdueDays > 0 && <Tag color="red">Overdue: {defect.overdueDays}d</Tag>}
                </div>
              </Card>
            </Col>

            {/* Stage 2: LightGBM Priority Score */}
            <Col xs={24} sm={12}>
              <Card
                size="small"
                style={{
                  borderRadius: 10,
                  border: '1.5px solid #1e3a8a',
                  background: 'rgba(30, 58, 138, 0.04)',
                  height: '100%'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Stage 2 • Priority Score {department === 'TDMS' ? '(Class A/B/C)' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 4px' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#1e3a8a' }}>
                    {priorityScore.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>/ 100</span>
                  </span>
                  <Tag color={priorityScore >= 75 ? 'red' : priorityScore >= 45 ? 'orange' : 'blue'} style={{ fontWeight: 700, fontSize: 13 }}>
                    Class {priorityClass}
                  </Tag>
                </div>
                <Progress
                  percent={priorityScore}
                  showInfo={false}
                  strokeColor={priorityScore >= 75 ? '#dc2626' : priorityScore >= 45 ? '#ea580c' : '#0284c7'}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Severity Classification Reason */}
          {(mlAssessment?.severityReason || defect?.severityReason) && (
            <Alert
              type="info"
              showIcon
              message={<span style={{ fontWeight: 700 }}>Reason for Predicted Severity:</span>}
              description={mlAssessment?.severityReason || defect?.severityReason}
              style={{ marginBottom: 16, fontSize: 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            />
          )}

          {/* Defect Details Summary */}
          <Card size="small" style={{ borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <Row gutter={[12, 10]} style={{ fontSize: 12 }}>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Section ID (Derived from Lat/Lon):</span><br />
                <strong style={{ color: '#0369a1' }}>{defect?.sectionId || defect?.Section_ID || 'GZB-CNB'}</strong>
              </Col>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Chainage / Stations:</span><br />
                <strong>KM {defect?.chainageKm || defect?.Chainage_KM || '142.1'} ({defect?.station1 || 'GZB'} - {defect?.station2 || 'CNB'})</strong>
              </Col>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Asset Type:</span><br />
                <Tag color="blue">{defect?.assetType || defect?.Asset_Type || 'Rail'}</Tag>
              </Col>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Observed Defect:</span><br />
                <strong style={{ color: '#0f172a' }}>{defect?.defectType || defect?.Defect_Type || 'Rail Flaw'}</strong>
              </Col>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Estimated Work Duration:</span><br />
                <strong>{defect?.workDurationHrs || 3.0} Hours</strong>
              </Col>
              <Col span={12}>
                <span style={{ color: '#64748b' }}>Escalation Status:</span><br />
                <Tag color={defect?.severityLevel === 'Critical' || defect?.overdueDays >= 60 ? 'red' : 'green'}>
                  {defect?.severityLevel === 'Critical' || defect?.overdueDays >= 60 ? 'ESCALATED (Immediate Action)' : 'NORMAL'}
                </Tag>
              </Col>
              {department === 'TDMS' && mlAssessment?.failureProbability72h !== undefined && (
                <Col span={24} style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 4 }}>
                  <span style={{ color: '#64748b' }}>72h Failure Probability (Computed Backend): </span>
                  <Tag color={mlAssessment.failureProbability72h >= 0.5 ? 'error' : 'default'} style={{ fontWeight: 700 }}>
                    {(mlAssessment.failureProbability72h * 100).toFixed(0)}% Probability
                  </Tag>
                </Col>
              )}
            </Row>
          </Card>

          <Alert
            type="success"
            showIcon
            message="Defect Successfully Saved in Database"
            description="The defect has been logged under the 'NOT SENT' tab. You can now inspect detailed telemetry or click 'Send' to dispatch it to the XGBoost Block Planner."
            style={{ marginBottom: 20, fontSize: 12 }}
          />

          {/* Back Navigation Button */}
          <Button
            type="primary"
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            style={{
              width: '100%',
              height: 48,
              fontSize: 15,
              fontWeight: 700,
              background: '#1e3a8a',
              borderColor: '#1e3a8a',
              borderRadius: 8
            }}
          >
            Back to {department} Defect Dashboard
          </Button>
        </div>
      )}
    </Modal>
  );
};
