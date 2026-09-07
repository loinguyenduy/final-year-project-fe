import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CustomerLayout from '../../../../customer/features/dashboard/components/CustomerLayout';
import HandymanLayout from '../../../../handyman/features/dashboard/components/HandymanLayout';

const LifecycleWorkspaceLayout = () => {
  const role = useSelector((state) => state.identity.account?.role)?.toUpperCase();
  if (role === 'CUSTOMER') return <CustomerLayout />;
  if (role === 'HANDYMAN') return <HandymanLayout />;
  return <Navigate to="/" replace />;
};

export default LifecycleWorkspaceLayout;
