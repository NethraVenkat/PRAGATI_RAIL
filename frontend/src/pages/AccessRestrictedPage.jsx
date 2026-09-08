import React from 'react';
import { Result, Button, Tag, Card, Alert } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, HomeOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AccessRestrictedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, switchDemoRole } = useAuth();

  return (
    <div style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12, border: '1px solid var(--ir-border)', background: 'var(--ir-card-bg)' }}>
        <Result
          status="403"
          icon={<LockOutlined style={{ color: '#dc2626', fontSize: 64 }} />}
          title={<span style={{ color: 'var(--ir-text-main)', fontWeight: 800 }}>403 — ACCESS RESTRICTED</span>}
          subTitle={
            <div style={{ color: 'var(--ir-text-sub)', fontSize: 14, marginTop: 8 }}>
              Department Role Enforcement: Your authenticated profile (<strong>{currentUser?.name || 'User'}</strong> — <Tag color="blue">{currentUser?.designation}</Tag>) does not have permissions to access the requested module route: <code style={{ color: '#dc2626' }}>{location.pathname}</code>.
            </div>
          }
          extra={[
            <Button
              key="dashboard"
              type="primary"
              icon={<HomeOutlined />}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
              onClick={() => navigate('/command-center')}
            >
              RETURN TO AUTHORIZED DASHBOARD
            </Button>,
            <Button
              key="switch"
              icon={<HomeOutlined />}
              onClick={() => navigate('/login')}
            >
              LOG OUT &amp; RE-AUTHENTICATE
            </Button>
          ]}
        />

        <Alert
          type="warning"
          showIcon
          message="ROLE-BASED ACCESS CONTROL (RBAC) POLICY"
          description={
            <div style={{ fontSize: 12 }}>
              <div>• <strong>TMS Users</strong>: Access restricted to Track Maintenance, Digital Twin, BDMS Block Planner, and Alerts.</div>
              <div>• <strong>SMMS Users</strong>: Access restricted to Signal Maintenance, Digital Twin, BDMS Block Planner, and Alerts.</div>
              <div>• <strong>TDMS Users</strong>: Access restricted to Traction OHE Maintenance, Digital Twin, BDMS Block Planner, and Alerts.</div>
              <div>• <strong>COA Controllers</strong>: Full cross-department operational control office access across all modules.</div>
            </div>
          }
          style={{ marginTop: 24, borderRadius: 8 }}
        />
      </Card>
    </div>
  );
};
