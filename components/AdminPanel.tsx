import React, { useState } from 'react';
import ManagementPanel from '../views/ManagementPanel';
import DriverApp from '../views/DriverApp';
import PassengerApp from '../views/PassengerApp';
import ClientPortal from '../views/ClientPortal';
import AppSelector from './AppSelector';
import type { AppView, Route, Company, Employee, PermissionProfile } from '../types';
import { APP_VIEWS, MOCK_ROUTES, MOCK_COMPANIES, MOCK_EMPLOYEES, MOCK_PERMISSION_PROFILES } from '../constants';

const AdminPanel: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(APP_VIEWS.MANAGEMENT);

  // Centralized state for the entire application
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>(MOCK_PERMISSION_PROFILES);

  const renderContent = () => {
    switch (currentView) {
      case APP_VIEWS.MANAGEMENT:
        return <ManagementPanel 
            routes={routes} 
            setRoutes={setRoutes}
            companies={companies} 
            setCompanies={setCompanies}
            employees={employees} 
            setEmployees={setEmployees}
            permissionProfiles={permissionProfiles}
            setPermissionProfiles={setPermissionProfiles}
        />;
      case APP_VIEWS.DRIVER:
        return <DriverApp />;
      case APP_VIEWS.PASSENGER:
        return <PassengerApp employees={employees} />;
      case APP_VIEWS.CLIENT:
        return <ClientPortal 
            employees={employees} 
            setEmployees={setEmployees}
            companies={companies}
            permissionProfiles={permissionProfiles}
        />;
      default:
        return <ManagementPanel 
            routes={routes} 
            setRoutes={setRoutes}
            companies={companies} 
            setCompanies={setCompanies}
            employees={employees} 
            setEmployees={setEmployees}
            permissionProfiles={permissionProfiles}
            setPermissionProfiles={setPermissionProfiles}
        />;
    }
  };

  return (
    <div className="h-full w-full bg-gray-100 font-sans text-gray-800 flex flex-col">
        <AppSelector currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 overflow-hidden">
            {renderContent()}
        </div>
    </div>
  );
};

export default AdminPanel;