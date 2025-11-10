import React from 'react';
import { DashboardProvider } from './state';
import Dashboard from './Dashboard';
const Root = () => {
    return (<DashboardProvider>
      <Dashboard />
    </DashboardProvider>);
};
export default Root;
//# sourceMappingURL=Root.js.map