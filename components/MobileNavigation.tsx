import React, { useState } from 'react';
import type { View } from '../types';
import { VIEWS, GOLFFOX_LOGO_BASE64 } from '../constants';
import { DashboardIcon, MapIcon, RouteIcon, AlertIcon, ReportIcon, TruckIcon, UserCircleIcon, LifebuoyIcon, BuildingOfficeIcon, AdjustmentsHorizontalIcon } from './icons/Icons';

interface MobileNavigationProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const MobileNavItem: React.FC<{
  icon: React.ReactNode;
  label: View;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-h-[60px] touch-manipulation no-tap-highlight ${
        isActive
          ? 'bg-golffox-orange-primary/20 text-golffox-orange-primary'
          : 'text-golffox-gray-light hover:bg-golffox-orange-primary/10 hover:text-golffox-orange-primary'
      }`}
      onClick={onClick}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
  );
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentView, setCurrentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavItemClick = (view: View) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-golffox-blue-dark text-white p-4 safe-top flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-8" />
          <span className="ml-2 font-semibold text-lg">Golffox</span>
        </div>
        <button
          onClick={toggleMenu}
          className="p-2 rounded-lg hover:bg-golffox-orange-primary/20 transition-colors touch-manipulation no-tap-highlight"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="bg-golffox-blue-dark w-80 h-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-10" />
                <span className="ml-3 font-semibold text-xl text-white">Golffox</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-golffox-orange-primary/20 transition-colors text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-2">
              {[
                { icon: <DashboardIcon className="h-6 w-6" variant="premium" />, view: VIEWS.DASHBOARD },
                { icon: <MapIcon className="h-6 w-6" variant="float" />, view: VIEWS.MAP },
                { icon: <RouteIcon className="h-6 w-6" variant="hover" />, view: VIEWS.ROUTES },
                { icon: <TruckIcon className="h-6 w-6" variant="scale" />, view: VIEWS.VEHICLES },
                { icon: <UserCircleIcon className="h-6 w-6" variant="hover" />, view: VIEWS.DRIVERS },
                { icon: <BuildingOfficeIcon className="h-6 w-6" variant="scale" />, view: VIEWS.COMPANIES },
                { icon: <AdjustmentsHorizontalIcon className="h-6 w-6" variant="rotate" />, view: VIEWS.PERMISSIONS },
                { icon: <LifebuoyIcon className="h-6 w-6" variant="bounce" />, view: VIEWS.RESCUE },
                { icon: <AlertIcon className="h-6 w-6" variant="pulse" />, view: VIEWS.ALERTS },
                { icon: <ReportIcon className="h-6 w-6" variant="scale" />, view: VIEWS.REPORTS },
              ].map(({ icon, view }) => (
                <button
                  key={view}
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                    currentView === view
                      ? 'bg-golffox-orange-primary/20 text-golffox-white'
                      : 'text-golffox-gray-light/80 hover:bg-golffox-orange-primary/10 hover:text-golffox-white'
                  }`}
                  onClick={() => handleNavItemClick(view)}
                >
                  {icon}
                  <span className="ml-4 font-medium">{view}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8 text-center text-golffox-gray-light/50 text-sm">
              <p>&copy; {new Date().getFullYear()} Golffox</p>
              <p>Painel de Gestão v1.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-golffox-gray-light shadow-lg z-40 safe-bottom">
        <div className="grid grid-cols-5 gap-1 p-2">
          <MobileNavItem
            icon={<DashboardIcon className="h-5 w-5" variant="premium" />}
            label="Dashboard"
            isActive={currentView === VIEWS.DASHBOARD}
            onClick={() => setCurrentView(VIEWS.DASHBOARD)}
          />
          <MobileNavItem
            icon={<MapIcon className="h-5 w-5" variant="float" />}
            label="Mapa"
            isActive={currentView === VIEWS.MAP}
            onClick={() => setCurrentView(VIEWS.MAP)}
          />
          <MobileNavItem
            icon={<RouteIcon className="h-5 w-5" variant="hover" />}
            label="Rotas"
            isActive={currentView === VIEWS.ROUTES}
            onClick={() => setCurrentView(VIEWS.ROUTES)}
          />
          <MobileNavItem
            icon={<TruckIcon className="h-5 w-5" variant="scale" />}
            label="Veículos"
            isActive={currentView === VIEWS.VEHICLES}
            onClick={() => setCurrentView(VIEWS.VEHICLES)}
          />
          <MobileNavItem
            icon={<AlertIcon className="h-5 w-5" variant="pulse" />}
            label="Alertas"
            isActive={currentView === VIEWS.ALERTS}
            onClick={() => setCurrentView(VIEWS.ALERTS)}
          />
        </div>
      </nav>
    </>
  );
};

export default MobileNavigation;