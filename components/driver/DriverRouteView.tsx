import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ROUTES } from '../../constants';
import type { Passenger } from '../../types';
import { MapPinIcon, UsersIcon } from '../icons/Icons';
import MapApiKeyWarning from '../MapApiKeyWarning';

interface DriverRouteViewProps {
    onStartNavigation: () => void;
}

const DriverRouteView: React.FC<DriverRouteViewProps> = ({ onStartNavigation }) => {
    const route = MOCK_ROUTES[0];
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

        const { Map, Marker, Polyline, LatLngBounds } = window.google.maps;
        const routePath = [
            { lat: -23.5505, lng: -46.6333 },
            { lat: -23.5555, lng: -46.6433 },
            { lat: -23.5605, lng: -46.6533 },
            { lat: -23.5655, lng: -46.6633 },
        ];
        const bounds = new LatLngBounds();
        routePath.forEach(point => bounds.extend(point));

        const map = new Map(mapRef.current, {
            mapId: 'DRIVER_ROUTE_VIEW_MAP',
            disableDefaultUI: true,
        });
        map.fitBounds(bounds);

        new Marker({ position: routePath[0], map, title: 'Início' });
        new Marker({ position: routePath[routePath.length - 1], map, title: 'Fim' });

        new Polyline({
            path: routePath,
            geodesic: true,
            strokeColor: '#FF5F00',
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: map,
        });

    }, [mapStatus]);

    return (
        <div className="flex flex-col h-full bg-white">
            <header className="bg-golffox-blue-dark text-white p-4 text-center shadow-md">
                <h1 className="text-xl font-bold">{route.name}</h1>
                <p className="text-sm opacity-80">Veículo: {route.vehicle}</p>
            </header>

            <div className="relative h-1/3 bg-gray-300">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && <div className="w-full h-full flex items-center justify-center bg-gray-200"><p className="text-golffox-gray-medium">Carregando Mapa...</p></div>}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
            </div>

            <div className="flex-grow overflow-y-auto p-4">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-golffox-gray-dark">Passageiros</h2>
                        <p className="text-sm text-golffox-gray-medium">Lista de embarque</p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-bold text-golffox-orange-primary">{route.passengers.onboard}</span>
                        <span className="text-golffox-gray-medium"> / {route.passengers.total}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    {route.passengers.list.map((passenger: Passenger) => (
                        <div key={passenger.id} className="bg-golffox-gray-light p-3 rounded-lg flex items-center">
                            <img src={passenger.photoUrl} alt={passenger.name} className="h-10 w-10 rounded-full mr-3" />
                            <div className="flex-grow">
                                <p className="font-semibold text-golffox-gray-dark">{passenger.name}</p>
                                <p className="text-xs text-golffox-gray-medium">Horário: {passenger.pickupTime}</p>
                            </div>
                            <div className="h-8 w-8 bg-golffox-orange-primary/20 rounded-full flex items-center justify-center">
                                <UsersIcon className="h-5 w-5 text-golffox-orange-primary" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             <footer className="p-4 border-t border-golffox-gray-light bg-white">
                <button 
                    onClick={onStartNavigation}
                    className="w-full bg-golffox-orange-primary text-white font-bold py-4 rounded-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-300"
                >
                    Iniciar Navegação
                </button>
            </footer>
        </div>
    );
};

export default DriverRouteView;