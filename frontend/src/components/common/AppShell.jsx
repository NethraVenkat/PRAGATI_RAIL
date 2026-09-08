import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Select, Badge, Avatar, Tag, Tooltip, Switch, Space, Drawer, Grid } from 'antd';
import {
  RobotOutlined,
  BlockOutlined,
  DesktopOutlined,
  ToolOutlined,
  AlertOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SunOutlined,
  MoonOutlined,
  UserOutlined,
  BellOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  CalendarOutlined,
  SettingOutlined,
  CompassOutlined,
  DashboardOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegion } from '../../context/RegionContext';
import { useAuth } from '../../context/AuthContext';
import { USE_MOCK } from '../../services/apiClient';
import { subscribeMockStatus } from '../../mock/mockAdapter';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export const AppShell = ({ children, isDarkMode, setIsDarkMode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.lg; // < 992px: collapse sidebar into a drawer

  useEffect(() => {
    if (!USE_MOCK) return undefined;
    const unsubscribe = subscribeMockStatus((status) => setSimActive(status.active > 0));
    return unsubscribe;
  }, []);

  // Close the mobile drawer automatically whenever the route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);
  const { currentUser, logout, hasPermission } = useAuth();
  const {
    selectedZone,
    setSelectedZone,
    selectedDivision,
    setSelectedDivision,
    ZONES,
    availableDivisions
  } = useRegion();

  // Master base menu list (Un-numbered; items will be filtered and indexed dynamically from 1 to N)
  const masterMenuItems = [
    { key: '/command-center', icon: <CompassOutlined />, rawLabel: 'Network Command Center' },
    { key: '/overview', icon: <DashboardOutlined />, rawLabel: 'Executive Overview Dashboard' },
    { key: '/ai-responses', icon: <RobotOutlined />, rawLabel: 'AI Optimization Results' },
    { key: '/digital-twin', icon: <DesktopOutlined />, rawLabel: 'GIS Infrastructure Map' },
    { key: '/tms', icon: <ToolOutlined />, rawLabel: 'TMS Track Maintenance' },
    { key: '/smms', icon: <ThunderboltOutlined />, rawLabel: 'SMMS Signal & Telecom' },
    { key: '/tdms', icon: <BlockOutlined />, rawLabel: 'TDMS Traction (OHE)' },
    { key: '/bdms-planner', icon: <CalendarOutlined />, rawLabel: 'BDMS Block Planner' },
    { key: '/coa-database', icon: <DatabaseOutlined />, rawLabel: 'COA Corridor DB' },
    { key: '/station-board', icon: <LineChartOutlined />, rawLabel: 'Station Display Board (PIDS)' },
    { key: '/alerts', icon: <Badge count={1} dot><AlertOutlined /></Badge>, rawLabel: 'Alert System' },
    { key: '/reports', icon: <FileTextOutlined />, rawLabel: 'Reports & Analytics' },
    { key: '/settings', icon: <SettingOutlined />, rawLabel: 'Settings & Users' },
  ];

  // Filter allowed menu items by user role permissions and dynamically generate 1-to-N sequential numbering
  const allowedMenuItems = masterMenuItems
    .filter(item => hasPermission(item.key))
    .map((item, index) => ({
      key: item.key,
      icon: item.icon,
      label: `${index + 1}. ${item.rawLabel}`
    }));

  const deptColors = {
    TMS: '#0284c7',
    SMMS: '#d97706',
    TDMS: '#7c3aed',
    COA: '#059669'
  };

  const getScopeBadge = () => {
    const zoneText = currentUser?.zone || selectedZone || 'Northern Railway';
    const divText = currentUser?.division || selectedDivision || 'Lucknow';
    return (
      <Tag color="cyan" icon={<SafetyCertificateOutlined />}>
        Scope: {divText} Division ({zoneText})
      </Tag>
    );
  };

  const sidebarInner = (forceExpanded = false) => {
    const collapsedNow = forceExpanded ? false : collapsed;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Top Fixed Section: Brand Logo & Region Selectors */}
          <div style={{ flexShrink: 0 }}>
            {/* Brand Crest & Title */}
            <div style={{
              height: 64,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid var(--ir-border)'
            }}>
              <img
                src="/indian_railways_logo.png"
                alt="Indian Railways Seal Logo"
                style={{
                  width: 38,
                  height: 38,
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
              {!collapsedNow && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: 'var(--ir-text-main)', letterSpacing: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    PRAGATI-RAIL
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    Indian Railways
                  </div>
                </div>
              )}
            </div>

            {/* Operational Scope: User Assigned Zone & Division (Fetched from Backend Profile) */}
            {!collapsedNow && (
              <div style={{ padding: '12px 16px 14px 16px', borderBottom: '1px solid var(--ir-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    OPERATIONAL SCOPE
                  </div>
                  <Tag color="geekblue" style={{ fontSize: 9, padding: '0 6px', margin: 0, borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                    Profile Assigned
                  </Tag>
                </div>

                <div style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                  border: '1px solid var(--ir-border)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                      Zone
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ir-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
                      <span>{currentUser?.zone || selectedZone || 'Northern Railway'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--ir-border)', paddingTop: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
                      Division
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ir-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CompassOutlined style={{ color: '#059669' }} />
                      <span>{currentUser?.division || selectedDivision || 'Lucknow'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Navigation Menu Section */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 8 }}>
            {!collapsedNow && (
              <div style={{ padding: '0 16px 6px 16px', fontSize: 10, color: 'var(--ir-text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                MODULES
              </div>
            )}
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={allowedMenuItems}
              onClick={({ key }) => navigate(key)}
              style={{ borderRight: 0, paddingBottom: 16 }}
            />
          </div>
        </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop / Laptop Sidebar (>= 1024px): persistent collapsible Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            background: isDarkMode ? '#131b2e' : '#ffffff',
            borderRight: '1px solid var(--ir-border)',
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            zIndex: 100,
            overflow: 'hidden'
          }}
        >
          {sidebarInner()}
        </Sider>
      )}

      {/* Mobile / Tablet (< 1024px): sidebar becomes a slide-over Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          width={Math.min(280, typeof window !== 'undefined' ? window.innerWidth * 0.82 : 280)}
          closable={false}
          bodyStyle={{ padding: 0, background: isDarkMode ? '#131b2e' : '#ffffff' }}
        >
          {sidebarInner(true)}
        </Drawer>
      )}

      <Layout style={!isMobile ? { marginLeft: collapsed ? 80 : 250, minWidth: 0 } : undefined}>
        {/* Header Bar */}
        <Header className="app-shell-header" style={{
          padding: isMobile ? '8px 12px' : '8px 24px',
          height: 'auto',
          minHeight: 64,
          lineHeight: 'normal',
          background: isDarkMode ? '#131b2e' : '#ffffff',
          borderBottom: '1px solid var(--ir-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          overflow: 'visible',
          position: 'fixed',
          left: isMobile ? 0 : (collapsed ? 80 : 250),
          right: 0,
          top: 0,
          zIndex: 99,
          boxShadow: '0 1px 8px rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flexWrap: 'wrap' }}>
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => (isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed))}
              style={{ fontSize: 16 }}
            />
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {getScopeBadge()}
                <Tooltip title={USE_MOCK ? 'Operational data engine ready — no live backend required.' : 'Connected to the live PRAGATI-RAIL backend & ML services.'}>
                  <Tag color={USE_MOCK ? (simActive ? 'processing' : 'green') : 'blue'} icon={simActive ? undefined : undefined} style={{ fontWeight: 600 }}>
                    {USE_MOCK ? `⚡ AI Engine ${simActive ? '· Calculating…' : 'Ready'}` : '● Live AI Engine: Online'}
                  </Tag>
                </Tooltip>
              </div>
            )}
            {isMobile && (
              <Tag color={USE_MOCK ? (simActive ? 'processing' : 'green') : 'blue'} style={{ fontWeight: 600, fontSize: 10 }}>
                {USE_MOCK ? '⚡ System Ready' : '● Live'}
              </Tag>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Authenticated Department & User Info (Display-Only Badge) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ir-bg)', padding: '4px 12px', borderRadius: 6, border: '1px solid var(--ir-border)' }}>
              <Tag color={deptColors[currentUser?.department || 'COA']} style={{ fontWeight: 700, margin: 0 }}>
                {currentUser?.department || 'COA'}
              </Tag>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ir-text-main)' }}>
                {currentUser?.name || 'Controller'}
              </span>
            </div>

            {/* Quick Alerts Bell */}
            <Tooltip title="Emergency Alerts (1 Pending)">
              <Button 
                type="text" 
                icon={
                  <Badge count={1} offset={[-2, 2]}>
                    <BellOutlined style={{ fontSize: 18, color: '#dc2626' }} />
                  </Badge>
                }
                onClick={() => navigate('/alerts')}
              />
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Switch to Light Theme (Default)' : 'Switch to Dark Theme'}>
              <Switch
                checked={isDarkMode}
                onChange={setIsDarkMode}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </Tooltip>

            {/* User Profile Avatar & Logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--ir-border)' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: deptColors[currentUser?.department || 'COA'] || '#1e3a8a' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>{currentUser?.name || 'Controller'}</div>
                <div style={{ fontSize: 10, color: 'var(--ir-text-sub)' }}>
                  {currentUser?.designation || 'Indian Railways'}
                </div>
              </div>
              <Tooltip title="Sign Out">
                <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login'); }} />
              </Tooltip>
            </div>
          </div>
        </Header>

        {/* Viewport Content */}
        <Content className="app-shell-content" style={{
          margin: isMobile ? '12px 8px' : '20px',
          paddingTop: 76,
          minHeight: 'calc(100vh - 20px)',
          overflowX: 'hidden'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};