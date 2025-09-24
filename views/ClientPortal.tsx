import React, { useState } from 'react';
import ClientDashboard from '../components/client/ClientDashboard';
import ClientSidebar from '../components/client/ClientSidebar';
import EmployeesManagement from '../components/client/EmployeesManagement';
import ClientLoginScreen from '../components/client/ClientLoginScreen';
import type { ClientView, Employee, Company, PermissionProfile } from '../types';

interface ClientPortalProps {
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    companies: Company[];
    permissionProfiles: PermissionProfile[];
}

const ClientPortal: React.FC<ClientPortalProps> = ({ employees, setEmployees, companies, permissionProfiles }) => {
    const [loggedInOperator, setLoggedInOperator] = useState<Employee | null>(null);
    const [currentView, setCurrentView] = useState<ClientView>('Dashboard');
    
    // Company is now determined by the logged in operator
    const operatorCompany = companies.find(c => c.id === loggedInOperator?.companyId);

    const handleLogin = (operator: Employee) => {
        setLoggedInOperator(operator);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'Dashboard':
                return <ClientDashboard />;
            case 'Funcionários':
                return <EmployeesManagement 
                    employees={employees.filter(e => e.companyId === operatorCompany?.id)} 
                    setEmployees={setEmployees} 
                    companyId={operatorCompany?.id}
                    permissionProfiles={permissionProfiles}
                />;
            default:
                return <ClientDashboard />;
        }
    };

    if (!loggedInOperator) {
        return (
             <div className="h-full w-full flex bg-golffox-gray-light/80">
                <ClientLoginScreen 
                    onLogin={handleLogin} 
                    employees={employees} 
                    permissionProfiles={permissionProfiles} 
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full flex bg-golffox-gray-light/80">
            <ClientSidebar currentView={currentView} setCurrentView={setCurrentView} companyName={operatorCompany?.name}/>
            <main className="flex-1 h-full flex flex-col">
                 <div className="flex-1 p-8 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ClientPortal;