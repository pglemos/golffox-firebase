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

        const busIcon = {
            path: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-17.25 4.5h15M6.375 12h11.25',
            fillColor: '#FF5F00',
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 1,
            anchor: new window.google.maps.Point(12, 12),
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
