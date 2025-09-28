import React, { useState, useEffect, useRef } from 'react';
import { MOCK_DIRECTIONS } from '../../config/constants';
import { 
    ArrowUpIcon, 
    ArrowRightIcon, 
    ArrowUturnLeftIcon, 
    FlagIcon,
    ClockIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import MapApiKeyWarning from '../MapApiKeyWarning';

interface NavigationScreenProps {
    onEndRoute: () => void;
}

const iconMap: { [key: string]: React.FC<{ className?: string }> } = {
    ArrowUpIcon,
    ArrowRightIcon,
    ArrowUturnLeftIcon,
    FlagCheckeredIcon: FlagIcon,
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
    const IconComponent = iconMap[currentDirection.icon] || FlagIcon;

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
        <div className="flex flex-col h-full bg-gradient-to-br from-primary-50 to-primary-100">
            {/* Header com instrução de navegação */}
            <Card className="m-4 mb-2 bg-primary-600 text-white border-0 shadow-lg">
                <div className="flex items-center p-4">
                    <div className="mr-4 p-3 bg-white/20 rounded-full">
                        <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold truncate">{currentDirection.instruction}</h1>
                        <p className="text-lg text-white/90">{currentDirection.distance}</p>
                    </div>
                </div>
            </Card>

            {/* Mapa */}
            <div className="flex-grow relative mx-4 mb-2 rounded-xl overflow-hidden shadow-lg">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-gray-600 text-sm">Carregando Mapa...</p>
                        </div>
                    </div>
                )}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
            </div>

            {/* Informações de navegação */}
            <Card className="mx-4 mb-4 bg-white shadow-lg">
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                                <MapPinIcon className="h-4 w-4 text-primary-600 mr-1" />
                                <p className="text-xs text-gray-600">Velocidade</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                58 <span className="text-sm text-gray-500">km/h</span>
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                                <ClockIcon className="h-4 w-4 text-primary-600 mr-1" />
                                <p className="text-xs text-gray-600">Chegada (ETA)</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">06:45</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                                <FlagIcon className="h-4 w-4 text-primary-600 mr-1" />
                                <p className="text-xs text-gray-600">Restante</p>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                12 <span className="text-sm text-gray-500">km</span>
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onEndRoute}
                        variant="danger"
                        size="lg"
                        className="w-full"
                    >
                        Finalizar Rota
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default NavigationScreen;