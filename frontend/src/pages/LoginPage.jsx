import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Checkbox, Row, Col, Space, Typography, Tooltip, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  LockFilled
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph, Text } = Typography;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ id: '', code: '' });

  const refreshCaptcha = async () => {
    try {
      const { data } = await apiClient.get('/auth/captcha');
      setCaptcha({ id: data.captchaId, code: data.captcha });
    } catch {
      message.error('Unable to load CAPTCHA. Check that the backend is running.');
    }
  };

  useEffect(() => { refreshCaptcha(); }, []);

  const handleFinish = (values) => {
    setLoading(true);
    login(values.userId, values.password, captcha.id, values.captcha).then((res) => {
      setLoading(false);
      if (res.success) {
        message.success(`Welcome back, ${res.user.name} (${res.user.designation})`);
        navigate(location.state?.from || res.user.defaultRoute || '/command-center', { replace: true });
      } else {
        message.error(res.message || 'Invalid User ID or Password.');
        refreshCaptcha();
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f8fafc 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '30px 20px',
      boxSizing: 'border-box'
    }}>
      {/* Outer Two-Column Container */}
      <div style={{
        width: '100%',
        maxWidth: 1120,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 20px 50px rgba(30, 58, 138, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <Row style={{ minHeight: 640 }}>
          {/* LEFT COLUMN: BRANDING & RAILWAY SYSTEM INTRODUCTION */}
          <Col xs={24} md={12} lg={13} style={{
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRight: '1px solid #e2e8f0'
          }}>
            <div>
              {/* Official Indian Railways Seal Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                <img
                  src="/indian_railways_logo.png"
                  alt="Indian Railways Official Logo"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(30, 58, 138, 0.2))'
                  }}
                />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    PRAGATI-RAIL
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                    Indian Railways Network Operations
                  </div>
                </div>
              </div>

              {/* System Main Title & Tagline */}
              <Title level={2} style={{
                color: '#1e3a8a',
                fontSize: 28,
                fontWeight: 800,
                margin: '0 0 12px 0',
                lineHeight: 1.25,
                fontFamily: 'Outfit, Inter, sans-serif'
              }}>
                Railways Maintenance &amp;<br />Operations Management System
              </Title>

              <Paragraph style={{
                color: '#64748b',
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 32
              }}>
                Smart Maintenance. Efficient Operations. Safer Railway.
              </Paragraph>

              {/* 3 Key Feature Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e3a8a',
                    fontSize: 18,
                    flexShrink: 0
                  }}>
                    <ToolOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Integrated Maintenance</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Track, Signaling &amp; Traction Management</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e3a8a',
                    fontSize: 18,
                    flexShrink: 0
                  }}>
                    <RobotOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>AI-Powered Insights</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Intelligent recommendations for better decisions</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e3a8a',
                    fontSize: 18,
                    flexShrink: 0
                  }}>
                    <CheckCircleOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Operational Excellence</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Real-time monitoring and control</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Railway Infrastructure Banner Image Visual */}
            <div style={{
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #cbd5e1',
              position: 'relative',
              marginTop: 10,
              maxHeight: 180
            }}>
              <img
                src="/railway_hero_banner.png"
                alt="Railway Operations Visual"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: 180,
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </Col>

          {/* RIGHT COLUMN: ENTERPRISE LOGIN CARD FORM */}
          <Col xs={24} md={12} lg={11} style={{
            padding: '48px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#ffffff'
          }}>
            <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
              {/* Top Security / User Icon Avatar Badge */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  fontSize: 22,
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)'
                }}>
                  <UserOutlined />
                </div>
                <Title level={3} style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px 0', fontSize: 24 }}>
                  Welcome Back
                </Title>
                <Text style={{ color: '#64748b', fontSize: 13 }}>
                  Please sign in to continue
                </Text>
              </div>

              {/* Login Form */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{
                  userId: 'user_coa',
                  password: 'rail123',
                  remember: true
                }}
              >
                {/* User ID Field */}
                <Form.Item
                  label={<span style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>User ID</span>}
                  name="userId"
                  rules={[{ required: true, message: 'Please enter your user ID' }]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                    placeholder="Enter your user ID"
                    style={{ borderRadius: 8, height: 44 }}
                  />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                  label={<span style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>Password</span>}
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                    placeholder="Enter your password"
                    style={{ borderRadius: 8, height: 44 }}
                  />
                </Form.Item>

                {/* CAPTCHA Field */}
                <Form.Item
                  label={<span style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>Captcha</span>}
                  required
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Form.Item
                      name="captcha"
                      noStyle
                      rules={[{ required: true, message: 'Enter captcha' }]}
                    >
                      <Input
                        size="large"
                        placeholder="Enter captcha"
                        style={{ borderRadius: 8, height: 44, flex: 1 }}
                      />
                    </Form.Item>

                    {/* CAPTCHA Code Display */}
                    <div style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      height: 44,
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1e3a8a',
                      fontFamily: 'Share Tech Mono, monospace',
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: 4,
                      userSelect: 'none',
                      flexShrink: 0
                    }}>
                      {captcha.code ? captcha.code.split('').join(' ') : '-----'}
                    </div>

                    <Tooltip title="Refresh CAPTCHA">
                      <Button
                        size="large"
                        icon={<ReloadOutlined />}
                        onClick={refreshCaptcha}
                        style={{ borderRadius: 8, height: 44, flexShrink: 0 }}
                      />
                    </Tooltip>
                  </div>
                </Form.Item>

                {/* Remember Me & Forgot Password Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox style={{ color: '#64748b', fontSize: 13 }}>Remember me</Checkbox>
                  </Form.Item>
                  <a
                    style={{ color: '#1e3a8a', fontSize: 13, fontWeight: 600 }}
                    onClick={() => message.info('Please contact your administrator for password recovery.')}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Full Width Primary Sign In Button */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  style={{
                    background: '#1e3a8a',
                    borderColor: '#1e3a8a',
                    fontWeight: 700,
                    fontSize: 15,
                    height: 46,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)'
                  }}
                >
                  <span>Sign In</span>
                  <ArrowRightOutlined />
                </Button>
              </Form>

              {/* OR Divider & Security Note */}
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#94a3b8',
                  fontSize: 11,
                  marginBottom: 16
                }}>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  <span>OR</span>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>

                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}>
                  <LockFilled style={{ color: '#059669', fontSize: 12 }} />
                  <span>This is a secure system. All activities are monitored.</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

    </div>
  );
};
