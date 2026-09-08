import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { DEMO_ACCOUNTS } from '../mock/demoAccounts';

// Official CRIS / Indian Railways Role Profiles (Stored internally for authentication validation)
export { DEMO_ACCOUNTS };

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Restore the backend-issued session and profile on page reload.
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('pragati_rail_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return null;
  });

  const [lastLoginTime, setLastLoginTime] = useState(new Date().toLocaleTimeString());

  // Fetch / Sync profile directly from backend /auth/me on mount
  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const { data } = await apiClient.get('/auth/me');
      if (data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('pragati_rail_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn('[AuthContext] Could not fetch current user from backend:', err?.message || err);
    }
    return null;
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (userId, password, captchaId, captcha) => {
    try {
      const { data } = await apiClient.post('/auth/signin', { userId, password, captchaId, captcha });
      setCurrentUser(data.user);
      setLastLoginTime(new Date().toLocaleTimeString());
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('pragati_rail_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Unable to sign in' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('pragati_rail_user');
  };

  const hasPermission = (routePath) => {
    if (!currentUser) return false;
    const targetRoute = routePath === '/' ? currentUser.defaultRoute : routePath;
    return currentUser.allowedRoutes.includes(targetRoute);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      lastLoginTime,
      login,
      logout,
      refreshUser,
      hasPermission,
      DEMO_ACCOUNTS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
