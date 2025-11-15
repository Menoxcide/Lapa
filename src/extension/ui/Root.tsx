import React from 'react';
import { DashboardProvider } from './state/index.ts';
import Dashboard from './Dashboard.tsx';

const Root: React.FC = () => {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
};

export default Root;