import React, { useState } from 'react';
import { Modal, Form, Input, Select, TimePicker, Button, Tag, Alert, message, Row, Col, Descriptions } from 'antd';
import { BlockOutlined, SendOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

export const SendBlockRequestModal = ({ open, onClose, targetItem = null, onRequestSubmitted }) => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);

  const dept = currentUser?.department || 'TMS';

  const handleCheckConflict = () => {
    setCheckingConflict(true);
    setTimeout(() => {
      setCheckingConflict(false);
      setConflictResult({
        status: 'CLEAR',
        gapMins: 14,
        nextTrain: 'Train 15014 LKO-CNB Exp (Passes at 16:08)',
        recommendation: 'Target window 16:10–16:22 is 100% CLEAR of passenger train paths.'
      });
      message.success('Corridor Availability Check Complete: Clear 14-min gap found!');
    }, 600);
  };

  const handleFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const reqId = `REQ-${dept}-${Math.floor(100 + Math.random() * 900)}`;
      const blockRequest = {
        requestId: reqId,
        department: dept,
        section: values.section || targetItem?.section || 'LKO–CNB UP Main',
        blockType: values.blockType,
        startTime: values.startTime || '16:10',
        endTime: values.endTime || '16:22',
        durationHours: values.durationHours || 2.0,
        reason: values.reason,
        targetAsset: values.targetAsset || targetItem?.id || 'Track Asset',
        status: 'PENDING', // CRITICAL DOMAIN RULE: Starts as PENDING!
        conflictStatus: conflictResult ? 'CLEAR' : 'CHECK NEEDED',
        submittedBy: currentUser?.name || 'Engineer',
        submittedTime: new Date().toLocaleTimeString()
      };

      message.success(`Submitted ${dept} Block Request ${reqId} to BDMS Planner (Status: PENDING Approval)`);
      if (onRequestSubmitted) onRequestSubmitted(blockRequest);
      form.resetFields();
      setConflictResult(null);
      onClose();
    }, 600);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ir-text-main)' }}>
          <BlockOutlined style={{ color: '#059669' }} />
          <span>SEND MAINTENANCE BLOCK REQUEST ({dept} DEPARTMENT)</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={650}
    >
      <Alert
        type="warning"
        showIcon
        message="APPROVAL WORKFLOW ADVISORY"
        description="Block requests are submitted as PENDING to the BDMS Planner & COA Controller Desk. Requests are NOT automatically approved."
        style={{ marginBottom: 16, fontSize: 11 }}
      />

      {targetItem && (
        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Item / Defect ID">{targetItem.id || targetItem.Defect_ID}</Descriptions.Item>
          <Descriptions.Item label="Department"><Tag color="blue">{dept}</Tag></Descriptions.Item>
          <Descriptions.Item label="Location">{targetItem.location || targetItem.section}</Descriptions.Item>
          <Descriptions.Item label="Defect Type">{targetItem.defectType || targetItem.title}</Descriptions.Item>
        </Descriptions>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          blockType: dept === 'TMS' ? 'Traffic / Line Block' : dept === 'SMMS' ? 'Disconnection Block' : 'Power Block (OHE Cut)',
          durationHours: 2.0,
          section: targetItem?.section || 'LKO–CNB UP Main',
          targetAsset: targetItem?.id || 'T-104 Rail Head'
        }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Block Category / Type" name="blockType" rules={[{ required: true }]}>
              <Select options={[
                { label: 'Traffic / Line Block (Engineering TMS)', value: 'Traffic / Line Block' },
                { label: 'Power Block (Traction OHE Cut TDMS)', value: 'Power Block (OHE Cut)' },
                { label: 'Disconnection Block (Signal SMMS)', value: 'Disconnection Block' },
                { label: 'Integrated Multi-Department Block', value: 'Integrated Block' }
              ]} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Required Block Duration (Hours)" name="durationHours" rules={[{ required: true }]}>
              <Input suffix="hrs" type="number" step="0.5" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Target Section & Line" name="section" rules={[{ required: true }]}>
          <Input placeholder="e.g. LKO–CNB UP Main Line" />
        </Form.Item>

        <Form.Item label="Maintenance Work Reason & Machine Requirement" name="reason" rules={[{ required: true }]}>
          <Input.TextArea rows={2} placeholder="Explain maintenance necessity (e.g. Required for Tamping Machine #CS-04 & Rail Weld Protection)..." />
        </Form.Item>

        {/* Corridor Conflict Check Simulator Button */}
        <div style={{ background: 'var(--ir-bg)', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid var(--ir-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>COA Corridor Train Path Conflict Checker</span>
            <Button size="small" type="dashed" loading={checkingConflict} onClick={handleCheckConflict}>
              Check Timetable Gap
            </Button>
          </div>

          {conflictResult && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleOutlined />
              <span>{conflictResult.recommendation} ({conflictResult.nextTrain})</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} style={{ background: '#059669', borderColor: '#059669' }}>
            SUBMIT BLOCK REQUEST (PENDING APPROVAL)
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
