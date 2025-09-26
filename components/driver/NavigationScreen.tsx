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

// Mock coordinates for complete route
const routeWaypoints = [
    { lat: -23.5505, lng: -46.6333 }, // Ponto de partida
    { lat: -23.5555, lng: -46.6333 }, // Ponto 1
    { lat: -23.5555, lng: -46.6433 }, // Ponto 2
    { lat: -23.5505, lng: -46.6433 }, // Ponto 3
    { lat: -23.5505, lng: -46.6533 }, // Ponto 4
    { lat: -23.5605, lng: -46.6533 }, // Ponto 5
    { lat: -23.5605, lng: -46.6633 }, // Destino final
];


const NavigationScreen: React.FC<NavigationScreenProps> = ({ onEndRoute }) => {
    const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const directionsServiceRef = useRef<any>(null);
    const directionsRendererRef = useRef<any>(null);
    const currentPositionMarkerRef = useRef<any>(null);
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [routeLoaded, setRouteLoaded] = useState(false);
    
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

    // Initialize Map and Route
    useEffect(() => {
        if (mapStatus !== 'loaded' || !mapRef.current) return;

        const { Map, DirectionsService, DirectionsRenderer } = window.google.maps;
        
        // Initialize map
        const map = new Map(mapRef.current, {
            center: routeWaypoints[0],
            zoom: 14,
            mapId: 'DRIVER_NAVIGATION_MAP',
            disableDefaultUI: true,
        });
        mapInstanceRef.current = map;

        // Initialize directions service and renderer
        const directionsService = new DirectionsService();
        const directionsRenderer = new DirectionsRenderer({
            suppressMarkers: false,
            polylineOptions: {
                strokeColor: '#FF5F00',
                strokeOpacity: 1.0,
                strokeWeight: 6,
            },
        });
        
        directionsServiceRef.current = directionsService;
        directionsRendererRef.current = directionsRenderer;
        directionsRenderer.setMap(map);

        // Calculate and display the complete route
        const origin = routeWaypoints[0];
        const destination = routeWaypoints[routeWaypoints.length - 1];
        const waypoints = routeWaypoints.slice(1, -1).map(point => ({
            location: point,
            stopover: true,
        }));

        directionsService.route(
            {
                origin: origin,
                destination: destination,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
            },
            (result: any, status: any) => {
                if (status === 'OK' && result) {
                    directionsRenderer.setDirections(result);
                    setRouteLoaded(true);
                    
                    // Create current position marker
                    const currentMarker = new window.google.maps.Marker({
                        position: origin,
                        map: map,
                        zIndex: 1000,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: "#002D56",
                            fillOpacity: 1,
                            strokeWeight: 3,
                            strokeColor: 'white'
                        },
                        title: 'Posição Atual'
                    });
                    currentPositionMarkerRef.current = currentMarker;
                } else {
                    console.error('Erro ao calcular rota:', status);
                    // Fallback para rota simples se a API falhar
                    const fallbackPath = routeWaypoints;
                    new window.google.maps.Polyline({
                        path: fallbackPath,
                        geodesic: true,
                        strokeColor: '#FF5F00',
                        strokeOpacity: 1.0,
                        strokeWeight: 6,
                        map: map,
                    });
                    setRouteLoaded(true);
                }
            }
        );

    }, [mapStatus]);

    // Update current position on direction change
    useEffect(() => {
        if (mapStatus !== 'loaded' || !mapInstanceRef.current || !routeLoaded || !currentPositionMarkerRef.current) return;
        
        const map = mapInstanceRef.current;
        const currentMarker = currentPositionMarkerRef.current;
        
        // Update current position based on direction index
        if (currentDirectionIndex < routeWaypoints.length) {
            const currentPos = routeWaypoints[currentDirectionIndex];
            
            // Animate marker to new position
            currentMarker.setPosition(currentPos);
            
            // Pan map to follow current position
            map.panTo(currentPos);
            
            // Adjust zoom based on remaining distance
            const remainingWaypoints = routeWaypoints.length - currentDirectionIndex;
            const zoomLevel = remainingWaypoints > 3 ? 14 : 16;
            map.setZoom(zoomLevel);
        }

    }, [currentDirectionIndex, mapStatus, routeLoaded]);


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
            <div className="bg-golffox-blue-light p-3 sm:p-4 md:p-6 shadow-lg z-10 animate-fade-in-down">
                <div className="flex items-center">
                    <div className="mr-2 sm:mr-3 md:mr-4">
                        <IconComponent className="h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16" variant="premium" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{currentDirection.instruction}</h1>
                        <p className="text-base sm:text-xl md:text-2xl text-white/80">{currentDirection.distance}</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow relative bg-gray-400 min-h-0">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <p className="text-golffox-gray-medium text-sm sm:text-base">Carregando Mapa...</p>
                    </div>
                )}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
            </div>

            <footer className="bg-golffox-blue-dark/80 backdrop-blur-sm p-3 sm:p-4 border-t border-white/10 z-10 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm opacity-70">Velocidade</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold">
                            58 <span className="text-sm sm:text-base md:text-lg opacity-70">km/h</span>
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs sm:text-sm opacity-70">Chegada (ETA)</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold">06:45</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs sm:text-sm opacity-70">Restante</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold">
                            12 <span className="text-sm sm:text-base md:text-lg opacity-70">km</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={onEndRoute}
                    className="w-full bg-golffox-red text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base min-h-[48px]"
                >
                    Finalizar Rota
                </button>
            </footer>
        </div>
    );
};

export default NavigationScreen;