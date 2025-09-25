import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ManagementPanel from './views/ManagementPanel';
import DriverApp from './views/DriverApp';
import PassengerApp from './views/PassengerApp';
import ClientPortal from './views/ClientPortal';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './components/AdminPanel';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import type { Route as RouteType, Company, Employee, PermissionProfile } from './types';
import { MOCK_ROUTES, MOCK_COMPANIES, MOCK_EMPLOYEES, MOCK_PERMISSION_PROFILES } from './constants';

const App: React.FC = () => {
  // Centralized state for the entire application
  const [routes, setRoutes] = useState<RouteType[]>(MOCK_ROUTES);
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>(MOCK_PERMISSION_PROFILES);

  return (
    <GoogleMapsLoader>
      <Router>
        <div className="h-screen w-screen">
          <Routes>
            {/* Redirecionamento automático para área administrativa */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            
            {/* Rotas diretas para cada módulo */}
            <Route 
              path="/painel" 
              element={
                <ManagementPanel 
                  routes={routes} 
                  setRoutes={setRoutes}
                  companies={companies} 
                  setCompanies={setCompanies}
                  employees={employees} 
                  setEmployees={setEmployees}
                  permissionProfiles={permissionProfiles}
                  setPermissionProfiles={setPermissionProfiles}
                />
              } 
            />
            
            <Route path="/motorista" element={<DriverApp />} />
            
            <Route 
              path="/passageiro" 
              element={<PassengerApp employees={employees} />} 
            />
            
            <Route 
              path="/operador" 
              element={
                <ClientPortal 
                  employees={employees} 
                  setEmployees={setEmployees}
                  companies={companies}
                  permissionProfiles={permissionProfiles}
                />
              } 
            />
            
            {/* Área administrativa protegida */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </GoogleMapsLoader>
  );
};

export default App;