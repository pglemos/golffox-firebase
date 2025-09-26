import React from 'react';
import type { View } from '../types';
import { VIEWS, GOLFFOX_LOGO_BASE64 } from '../constants';
import { DashboardIcon, MapIcon, RouteIcon, AlertIcon, ReportIcon, TruckIcon, UserCircleIcon, LifebuoyIcon, BuildingOfficeIcon, AdjustmentsHorizontalIcon, ClockIcon, CurrencyDollarIcon } from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: View;
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

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside className="w-64 bg-golffox-blue-dark text-white p-6 flex flex-col shadow-lg h-full">
      <div className="flex items-center mb-10">
        <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-12" />
      </div>
      <nav>
        <ul>
          <NavItem
            icon={<DashboardIcon className="h-6 w-6" variant="premium" />}
            label={VIEWS.DASHBOARD}
            isActive={currentView === VIEWS.DASHBOARD}
            onClick={() => setCurrentView(VIEWS.DASHBOARD)}
          />
          <NavItem
            icon={<MapIcon className="h-6 w-6" variant="float" />}
            label={VIEWS.MAP}
            isActive={currentView === VIEWS.MAP}
            onClick={() => setCurrentView(VIEWS.MAP)}
          />
          <NavItem
            icon={<RouteIcon className="h-6 w-6" variant="hover" />}
            label={VIEWS.ROUTES}
            isActive={currentView === VIEWS.ROUTES}
            onClick={() => setCurrentView(VIEWS.ROUTES)}
          />
          <NavItem
            icon={<TruckIcon className="h-6 w-6" variant="scale" />}
            label={VIEWS.VEHICLES}
            isActive={currentView === VIEWS.VEHICLES}
            onClick={() => setCurrentView(VIEWS.VEHICLES)}
          />
           <NavItem
            icon={<UserCircleIcon className="h-6 w-6" variant="hover" />}
            label={VIEWS.DRIVERS}
            isActive={currentView === VIEWS.DRIVERS}
            onClick={() => setCurrentView(VIEWS.DRIVERS)}
          />
          <NavItem
            icon={<BuildingOfficeIcon className="h-6 w-6" variant="scale" />}
            label={VIEWS.COMPANIES}
            isActive={currentView === VIEWS.COMPANIES}
            onClick={() => setCurrentView(VIEWS.COMPANIES)}
          />
          {/* FIX: Changed Users to Permissions. */}
          <NavItem
            icon={<AdjustmentsHorizontalIcon className="h-6 w-6" variant="rotate" />}
            label={VIEWS.PERMISSIONS}
            isActive={currentView === VIEWS.PERMISSIONS}
            onClick={() => setCurrentView(VIEWS.PERMISSIONS)}
          />
           <NavItem
            icon={<LifebuoyIcon className="h-6 w-6" variant="bounce" />}
            label={VIEWS.RESCUE}
            isActive={currentView === VIEWS.RESCUE}
            onClick={() => setCurrentView(VIEWS.RESCUE)}
          />
          <NavItem
            icon={<AlertIcon className="h-6 w-6" variant="pulse" />}
            label={VIEWS.ALERTS}
            isActive={currentView === VIEWS.ALERTS}
            onClick={() => setCurrentView(VIEWS.ALERTS)}
          />
          <NavItem
            icon={<ReportIcon className="h-6 w-6" variant="scale" />}
            label={VIEWS.REPORTS}
            isActive={currentView === VIEWS.REPORTS}
            onClick={() => setCurrentView(VIEWS.REPORTS)}
          />
          <NavItem
            icon={<ClockIcon className="h-6 w-6" variant="rotate" />}
            label={VIEWS.ROUTE_HISTORY}
            isActive={currentView === VIEWS.ROUTE_HISTORY}
            onClick={() => setCurrentView(VIEWS.ROUTE_HISTORY)}
          />
          <NavItem
            icon={<CurrencyDollarIcon className="h-6 w-6" variant="glow" />}
            label={VIEWS.COST_CONTROL}
            isActive={currentView === VIEWS.COST_CONTROL}
            onClick={() => setCurrentView(VIEWS.COST_CONTROL)}
          />
        </ul>
      </nav>
      <div className="mt-auto text-center text-golffox-gray-light/50 text-sm">
        <p>&copy; {new Date().getFullYear()} Golffox</p>
        <p>Painel de Gestão v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;