import React from 'react';
import { DashboardProvider } from './state';
import Dashboard from './Dashboard';

const Root: React.FC = () => {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
};

export default Root;