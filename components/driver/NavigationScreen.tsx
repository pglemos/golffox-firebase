import React, { useState, useEffect, useRef } from 'react';
import { MOCK_DIRECTIONS } from '../../constants';
import { ArrowUpIcon, ArrowRightIcon, ArrowUturnLeftIcon, FlagCheckeredIcon } from '../icons/Icons';
import type { IconProps } from '../icons/Icons';
import MapApiKeyWarning from '../MapApiKeyWarning';

interface NavigationScreenProps {
    onEndRoute: () => void;
}

const iconMap: { [key: string]: React.FC<IconProps> } = {
    ArrowUpIcon,
    ArrowRightIcon,
    ArrowUturnLeftIcon,
    FlagCheckeredIcon,
};

// Mock coordinates for directions
const directionCoordinates = [
    { lat: -23.5505, lng: -46.6333 },
    { lat: -23.5555, lng: -46.6333 },
    { lat: -23.5555, lng: -46.6433 },
    { lat: -23.5505, lng: -46.6433 },
    { lat: -23.5505, lng: -46.6533 },
    { lat: -23.5605, lng: -46.6533 },
    { lat: -23.5605, lng: -46.6633 },
];


const NavigationScreen: React.FC<NavigationScreenProps> = ({ onEndRoute }) => {
    const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null); // To hold map instance
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    
    const currentDirection = MOCK_DIRECTIONS[currentDirectionIndex];
    const IconComponent = iconMap[currentDirection.icon] || FlagCheckeredIcon;

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

    // Initialize Map
    useEffect(() => {
        if (mapStatus !== 'loaded' || !mapRef.current) return;

        const { Map } = window.google.maps;
        const map = new Map(mapRef.current, {
            center: directionCoordinates[0],
            zoom: 16,
            mapId: 'DRIVER_NAVIGATION_MAP',
            disableDefaultUI: true,
        });
        mapInstanceRef.current = map;

    }, [mapStatus]);

    // Update map on direction change
    useEffect(() => {
        if (mapStatus !== 'loaded' || !mapInstanceRef.current) return;
        
        const map = mapInstanceRef.current;
        const currentPos = directionCoordinates[currentDirectionIndex];
        const nextPos = directionCoordinates[currentDirectionIndex + 1];

        map.panTo(currentPos);
        
        // Clear previous overlays if any
        // In a real app, manage overlays more carefully
        
        if(nextPos) {
            new window.google.maps.Polyline({
                path: [currentPos, nextPos],
                strokeColor: "#FF5F00",
                strokeOpacity: 1.0,
                strokeWeight: 8,
                map: map,
            });
        }

        new window.google.maps.Marker({
            position: currentPos,
            map: map,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#002D56",
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: 'white'
            }
        });

    }, [currentDirectionIndex, mapStatus]);


    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDirectionIndex(prevIndex => {
                if (prevIndex < MOCK_DIRECTIONS.length - 1) {
                    return prevIndex + 1;
                }
                clearInterval(interval);
                return prevIndex;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full bg-golffox-blue-dark text-white">
            <div className="bg-golffox-blue-light p-6 shadow-lg z-10 animate-fade-in-down">
                <div className="flex items-center">
                    <div className="mr-4"><IconComponent className="h-16 w-16" /></div>
                    <div>
                        <h1 className="text-3xl font-bold">{currentDirection.instruction}</h1>
                        <p className="text-2xl text-white/80">{currentDirection.distance}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow relative bg-gray-400">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && <div className="w-full h-full flex items-center justify-center bg-gray-200"><p className="text-golffox-gray-medium">Carregando Mapa...</p></div>}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
            </div>

            <footer className="bg-golffox-blue-dark/80 backdrop-blur-sm p-4 border-t border-white/10 z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-center"><p className="text-sm opacity-70">Velocidade</p><p className="text-2xl font-bold">58 <span className="text-lg opacity-70">km/h</span></p></div>
                    <div className="text-center"><p className="text-sm opacity-70">Chegada (ETA)</p><p className="text-2xl font-bold">06:45</p></div>
                    <div className="text-center"><p className="text-sm opacity-70">Restante</p><p className="text-2xl font-bold">12 <span className="text-lg opacity-70">km</span></p></div>
                </div>
                <button
                    onClick={onEndRoute}
                    className="w-full bg-golffox-red text-white font-bold py-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Finalizar Rota
                </button>
            </footer>
        </div>
    );
};

export default NavigationScreen;