import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccessRestrictedPage } from '../../pages/AccessRestrictedPage';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, hasPermission } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(location.pathname)) {
    return <AccessRestrictedPage />;
  }

  return children;
};
