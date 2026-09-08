import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme } from './theme/themeConfig';
import { RegionProvider } from './context/RegionContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/common/AppShell';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { AccessRestrictedPage } from './pages/AccessRestrictedPage';
import { NetworkCommandCenterPage } from './pages/NetworkCommandCenterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AIResponsesPage } from './pages/AIResponsesPage';
import { DigitalTwinPage, GISInfrastructureMapPage } from './pages/DigitalTwinPage';
import { StationDisplayBoardPage } from './pages/StationDisplayBoardPage';
import { TMSManagerPage } from './pages/TMSManagerPage';
import { SMMSManagerPage } from './pages/SMMSManagerPage';
import { TDMSManagerPage } from './pages/TDMSManagerPage';
import { BDMSBlockPlannerPage } from './pages/BDMSBlockPlannerPage';
import { COADatabasePage } from './pages/COADatabasePage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import SignIn from './pages/Signup';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userRole, setUserRole] = useState('Admin');

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  return (
    <ConfigProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <AuthProvider>
        <RegionProvider>
          <Router>
            <Routes>
              {/* Unauthenticated Login Route */}
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignIn />} />
              <Route path="/403" element={<AccessRestrictedPage />} />

              {/* Protected App Routes wrapped inside AppShell */}
              <Route
                path="/*"
                element={
                  <AppShell
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    userRole={userRole}
                    setUserRole={setUserRole}
                  >
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><NetworkCommandCenterPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/command-center" element={<ProtectedRoute><NetworkCommandCenterPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/overview" element={<ProtectedRoute><DashboardPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/ai-responses" element={<ProtectedRoute><AIResponsesPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/digital-twin" element={<ProtectedRoute><GISInfrastructureMapPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/gis-map" element={<ProtectedRoute><GISInfrastructureMapPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/station-board" element={<ProtectedRoute><StationDisplayBoardPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/tms" element={<ProtectedRoute><TMSManagerPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/smms" element={<ProtectedRoute><SMMSManagerPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/tdms" element={<ProtectedRoute><TDMSManagerPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/bdms-planner" element={<ProtectedRoute><BDMSBlockPlannerPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/coa-database" element={<ProtectedRoute><COADatabasePage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/alerts" element={<ProtectedRoute><AlertsPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><ReportsPage userRole={userRole} /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><SettingsPage userRole={userRole} setUserRole={setUserRole} /></ProtectedRoute>} />
                      <Route path="*" element={<Navigate to="/command-center" replace />} />
                    </Routes>
                  </AppShell>
                }
              />
            </Routes>
          </Router>
        </RegionProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
