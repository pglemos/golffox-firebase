import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import RealTimeMap from '../components/RealTimeMap';
import RoutesTable from '../components/RoutesTable';
import Alerts from '../components/Alerts';
import Reports from '../components/Reports';
import VehiclesManagement from '../components/VehiclesManagement';
import DriversManagement from '../components/DriversManagement';
import RescueDispatch from '../components/RescueDispatch';
import CompaniesManagement from '../components/CompaniesManagement';
import PermissionsManagement from '../components/PermissionsManagement';
import type { View, Route, Company, Employee, PermissionProfile } from '../types';
import { VIEWS } from '../constants';

// Props interface to receive state from the parent App component
interface ManagementPanelProps {
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    companies: Company[];
    setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    permissionProfiles: PermissionProfile[];
    setPermissionProfiles: React.Dispatch<React.SetStateAction<PermissionProfile[]>>;
}

const ManagementPanel: React.FC<ManagementPanelProps> = ({ routes, setRoutes, companies, setCompanies, employees, setEmployees, permissionProfiles, setPermissionProfiles }) => {
  const [currentView, setCurrentView] = useState<View>(VIEWS.DASHBOARD);
  
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return <Dashboard />;
      case VIEWS.MAP:
        return <RealTimeMap />;
      case VIEWS.ROUTES:
        return <RoutesTable routes={routes} setRoutes={setRoutes} />;
      case VIEWS.VEHICLES:
        return <VehiclesManagement />;
      case VIEWS.DRIVERS:
        return <DriversManagement />;
      case VIEWS.COMPANIES:
        return <CompaniesManagement companies={companies} setCompanies={setCompanies} employees={employees} setEmployees={setEmployees} permissionProfiles={permissionProfiles} />;
      case VIEWS.PERMISSIONS:
        return <PermissionsManagement permissionProfiles={permissionProfiles} setPermissionProfiles={setPermissionProfiles} />;
      case VIEWS.RESCUE:
        return <RescueDispatch />;
      case VIEWS.ALERTS:
        return <Alerts />;
      case VIEWS.REPORTS:
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-full bg-golffox-white">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto bg-golffox-gray-light">
        {renderContent()}
      </main>
    </div>
  );
};

export default ManagementPanel;