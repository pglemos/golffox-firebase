import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ROUTES } from '../../constants';
import { RouteStatus, type Employee } from '../../types';
import { TruckIcon, MapPinIcon, ClockIcon, UserCircleIcon, BellIcon } from '../icons/Icons';
import MapApiKeyWarning from '../MapApiKeyWarning';

const getStatusInfo = (status: RouteStatus) => {
    switch (status) {
        case RouteStatus.OnTime: return { text: 'No horário', color: 'text-golffox-blue-dark', bgColor: 'bg-golffox-blue-light/10' };
        case RouteStatus.Delayed: return { text: 'Atrasado', color: 'text-yellow-800', bgColor: 'bg-golffox-yellow/30' };
        case RouteStatus.Problem: return { text: 'Com Problema', color: 'text-golffox-red', bgColor: 'bg-golffox-red/10' };
        default: return { text: 'Indefinido', color: 'text-golffox-gray-medium', bgColor: 'bg-golffox-gray-light' };
    }
}

interface PassengerHomeProps {
    user: Employee;
}

const PassengerHome: React.FC<PassengerHomeProps> = ({ user }) => {
    const route = MOCK_ROUTES[0];
    const statusInfo = getStatusInfo(route.status);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMapStatus(prevStatus => {
                if (prevStatus !== 'loading') {
                    clearInterval(intervalId);
                    return prevStatus;
                }
                if (window.googleMapsApiLoaded === 'error') {
                    clearInterval(intervalId);
                    return 'error';
                }
                if (window.googleMapsApiLoaded) {
                    clearInterval(intervalId);
                    return 'loaded';
                }
                return prevStatus;
            });
        }, 100);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            setMapStatus(prevStatus => prevStatus === 'loading' ? 'error' : prevStatus);
        }, 10000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (mapStatus !== 'loaded' || !mapRef.current) return;

        const { Map, Marker, Polyline } = window.google.maps;
        const routePath = [ { lat: -23.5655, lng: -46.6633 }, { lat: -23.5505, lng: -46.6333 } ];
        const passengerStop = { lat: -23.5515, lng: -46.6353 };
        
        const map = new Map(mapRef.current, {
            center: passengerStop,
            zoom: 14,
            mapId: 'PASSENGER_HOME_MAP',
            disableDefaultUI: true,
        });

        new Polyline({ path: routePath, geodesic: true, strokeColor: '#004A8D', strokeOpacity: 0.5, strokeWeight: 4, map });
        new Marker({ position: passengerStop, map, title: 'Seu Ponto' });

        // Importar a função createBusMapIcon se não estiver importada
        const busIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="busGradient-moving" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4ADE80" />
                    <stop offset="50%" stop-color="#22C55E" />
                    <stop offset="100%" stop-color="#16A34A" />
                  </linearGradient>
                </defs>
                <ellipse cx="16" cy="28" rx="12" ry="3" fill="rgba(0,0,0,0.2)" />
                <rect x="4" y="8" width="24" height="16" rx="2" ry="2" fill="url(#busGradient-moving)" stroke="#15803D" stroke-width="0.5" />
                <rect x="4" y="8" width="4" height="16" rx="2" ry="2" fill="#16A34A" />
                <rect x="6" y="10" width="3" height="4" rx="0.5" fill="#E0F2FE" opacity="0.9" />
                <rect x="11" y="10" width="4" height="4" rx="0.5" fill="#E0F2FE" opacity="0.9" />
                <rect x="17" y="10" width="4" height="4" rx="0.5" fill="#E0F2FE" opacity="0.9" />
                <rect x="23" y="10" width="4" height="4" rx="0.5" fill="#E0F2FE" opacity="0.9" />
                <rect x="11" y="16" width="4" height="6" rx="0.5" fill="#15803D" opacity="0.8" />
                <circle cx="9" cy="25" r="2.5" fill="#2D3748" stroke="#1A202C" stroke-width="0.5" />
                <circle cx="23" cy="25" r="2.5" fill="#2D3748" stroke="#1A202C" stroke-width="0.5" />
                <circle cx="9" cy="25" r="1.5" fill="#4A5568" />
                <circle cx="23" cy="25" r="1.5" fill="#4A5568" />
                <circle cx="6" cy="12" r="1" fill="#FEF3C7" opacity="0.9" />
                <circle cx="6" cy="20" r="1" fill="#FEF3C7" opacity="0.9" />
                <rect x="5" y="9" width="22" height="1" fill="#4ADE80" opacity="0.6" rx="0.5" />
                <line x1="4" y1="16" x2="28" y2="16" stroke="#15803D" stroke-width="0.5" opacity="0.7" />
              </svg>
            `)}`,
            size: new window.google.maps.Size(32, 32),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
            origin: new window.google.maps.Point(0, 0)
        };
        const busMarker = new Marker({ position: routePath[0], map, icon: busIcon });

        // Animate bus marker
        let step = 0;
        const animationInterval = setInterval(() => {
            step += 0.01;
            if (step > 1) { step = 0; }
            const newPos = window.google.maps.geometry.spherical.interpolate(routePath[0], routePath[1], step);
            busMarker.setPosition(newPos);
        }, 100);

        return () => clearInterval(animationInterval);

    }, [mapStatus]);

    return (
        <div className="flex flex-col h-full bg-white">
            <header className="bg-golffox-orange-primary text-white p-3 sm:p-4 flex justify-between items-center shadow-md">
                <div><h1 className="text-lg sm:text-xl font-bold">Bom dia, {user.name.split(' ')[0]}!</h1><p className="text-xs sm:text-sm opacity-90">{route.name}</p></div>
                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </header>

            <div className="relative h-2/5 bg-gray-300">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && <div className="w-full h-full flex items-center justify-center bg-gray-200"><p className="text-golffox-gray-medium">Carregando Mapa...</p></div>}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
                 <div className="absolute bottom-2 left-2 bg-white/80 p-2 sm:p-3 rounded-lg shadow-lg text-center">
                    <p className="text-xs sm:text-sm text-golffox-gray-dark">Seu ônibus chega em</p>
                    <p className="text-xl sm:text-2xl font-bold text-golffox-orange-primary">5 min</p>
                 </div>
            </div>

            <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="bg-golffox-gray-light p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center mb-2"><UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-golffox-gray-dark mr-2"/><p className="text-sm sm:text-base font-semibold text-golffox-gray-dark">Motorista: {route.driver}</p></div>
                    <div className="flex items-center"><TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-golffox-gray-dark mr-2"/><p className="text-sm sm:text-base font-semibold text-golffox-gray-dark">Veículo: {route.vehicle}</p></div>
                </div>

                <div className="bg-golffox-gray-light p-3 sm:p-4 rounded-lg">
                     <h3 className="text-sm sm:text-base font-bold text-golffox-gray-dark mb-3">Detalhes da Rota</h3>
                     <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center"><ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-golffox-gray-medium mr-2 sm:mr-3" /><div className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>Status: {statusInfo.text}</div></div>
                        <div className="flex items-center"><MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-golffox-gray-medium mr-2 sm:mr-3" /><span className="text-xs sm:text-sm text-golffox-gray-medium">Próxima parada: Ponto 3</span></div>
                        <div className="flex items-center"><ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-golffox-gray-medium mr-2 sm:mr-3" /><span className="text-xs sm:text-sm text-golffox-gray-medium">Seu embarque: 06:05</span></div>
                     </div>
                </div>
            </div>
            
            <footer className="p-4 border-t border-golffox-gray-light text-center"><p className="text-xs text-golffox-gray-medium">Golffox &copy; {new Date().getFullYear()}</p></footer>
        </div>
    );
};

export default PassengerHome;
