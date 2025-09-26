import React from 'react';
import type { ClientView } from '../../types';
import { GOLFFOX_LOGO_BASE64 } from '../../constants';
import { DashboardIcon, UserGroupIcon } from '../icons/Icons';

interface ClientSidebarProps {
  currentView: ClientView;
  setCurrentView: (view: ClientView) => void;
  companyName?: string;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: ClientView;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <li
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-golffox-orange-primary/20 text-golffox-white'
          : 'text-golffox-gray-light/80 hover:bg-golffox-orange-primary/10 hover:text-golffox-white'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </li>
  );
};

const ClientSidebar: React.FC<ClientSidebarProps> = ({ currentView, setCurrentView, companyName }) => {
  return (
    <aside className="w-64 bg-golffox-blue-dark text-white p-6 flex flex-col shadow-lg h-full">
      <div className="flex items-center mb-4">
        <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-10" />
      </div>
       <div className="mb-10">
            <h1 className="text-xl font-bold text-white">Portal do Operador</h1>
            <p className="text-sm text-white/70">Contrato: {companyName || 'N/A'}</p>
        </div>
      <nav>
        <ul>
          <NavItem
            icon={<DashboardIcon className="h-6 w-6" variant="premium" />}
            label="Dashboard"
            isActive={currentView === 'Dashboard'}
            onClick={() => setCurrentView('Dashboard')}
          />
          <NavItem
            icon={<UserGroupIcon className="h-6 w-6" variant="float" />}
            label="Funcionários"
            isActive={currentView === 'Funcionários'}
            onClick={() => setCurrentView('Funcionários')}
          />
        </ul>
      </nav>
      <div className="mt-auto text-center text-golffox-gray-light/50 text-sm">
        <p>Powered by Golffox</p>
      </div>
    </aside>
  );
};

export default ClientSidebar;