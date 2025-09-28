import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MOCK_ROUTES, MOCK_COMPANIES } from '../../config/constants';
import type { Passenger } from '../../config/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { 
    MapPinIcon, 
    UsersIcon, 
    ClockIcon, 
    TruckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import MapApiKeyWarning from '../MapApiKeyWarning';
import { routeOptimizationService, type OptimizedRoute } from '../../services/routeOptimizationService';

interface DriverRouteViewProps {
    onStartNavigation: () => void;
}

const DriverRouteView: React.FC<DriverRouteViewProps> = ({ onStartNavigation }) => {
    const route = MOCK_ROUTES[0];
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapStatus, setMapStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
    const [routeCalculating, setRouteCalculating] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    
    // Encontra a empresa de destino baseada no nome da rota
    const destinationCompany = MOCK_COMPANIES.find(company => 
        route.name.toLowerCase().includes(company.name.toLowerCase().split(' ')[0])
    ) || MOCK_COMPANIES[0];

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

    // Função para calcular rota otimizada
    const calculateOptimizedRoute = useCallback(async () => {
        if (mapStatus !== 'loaded' || !mapRef.current || routeCalculating) return;

        setRouteCalculating(true);
        setRouteError(null);
        console.log('Calculando rota otimizada...');

        try {
            const { Map, LatLngBounds } = window.google.maps;
            
            // Ponto de partida (localização atual do veículo)
            const startLocation = new window.google.maps.LatLng(-23.5505, -46.6333);
            
            // Destino (empresa)
            const destination = new window.google.maps.LatLng(
                destinationCompany.address.coordinates.lat,
                destinationCompany.address.coordinates.lng
            );

            // Calcula a rota otimizada
            const optimized = await routeOptimizationService.findBestRoute({
                startLocation,
                passengers: route.passengers.list,
                destination,
                optimizeOrder: true
            });

            setOptimizedRoute(optimized);

            // Inicializa o mapa
            const map = new Map(mapRef.current, {
                center: { lat: -23.5505, lng: -46.6333 },
                zoom: 13,
                gestureHandling: 'greedy',
                styles: [
                    {
                        featureType: 'poi.business',
                        stylers: [{ visibility: 'off' }]
                    },
                    {
                        featureType: 'transit.station',
                        stylers: [{ visibility: 'off' }]
                    },
                    {
                        featureType: 'road',
                        elementType: 'labels.icon',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            // Aguarda o mapa estar totalmente carregado
            map.addListener('idle', () => {
                console.log('Mapa carregado, ajustando bounds para rota otimizada...');
                
                const bounds = new LatLngBounds();
                optimized.waypoints.forEach(point => bounds.extend(point));
                
                map.fitBounds(bounds, {
                    top: 100,
                    right: 50,
                    bottom: 150,
                    left: 50
                });
            });

            // Marcador de início
            new window.google.maps.Marker({
                position: startLocation,
                map: map,
                title: 'Ponto de Partida',
                zIndex: 1000,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#10B981',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 8
                }
            });

            // Marcador de destino
            new window.google.maps.Marker({
                position: destination,
                map: map,
                title: destinationCompany.name,
                zIndex: 1000,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#EF4444',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 10
                }
            });

            // Marcadores dos passageiros na ordem otimizada
            optimized.orderedPassengers.forEach((passenger, index) => {
                new window.google.maps.Marker({
                    position: new window.google.maps.LatLng(passenger.position.lat, passenger.position.lng),
                    map: map,
                    title: `${index + 1}. ${passenger.name}`,
                    zIndex: 999,
                    label: {
                        text: (index + 1).toString(),
                        color: 'white',
                        fontWeight: 'bold'
                    },
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: '#F59E0B',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 8
                    }
                });
            });

            // Desenha a rota se houver polyline
            if (optimized.polylinePath && optimized.polylinePath.length > 0) {
                // Polyline sombra (para dar profundidade)
                new window.google.maps.Polyline({
                    path: optimized.polylinePath,
                    geodesic: true,
                    strokeColor: '#000000',
                    strokeOpacity: 0.2,
                    strokeWeight: 8,
                    map: map,
                    zIndex: 1
                });

                // Polyline principal da rota otimizada
                new window.google.maps.Polyline({
                    path: optimized.polylinePath,
                    geodesic: true,
                    strokeColor: '#F97316',
                    strokeOpacity: 0.9,
                    strokeWeight: 6,
                    map: map,
                    zIndex: 2
                });
            } else {
                // Se não há polyline, desenha linhas diretas entre os pontos
                const waypoints = [startLocation];
                optimized.orderedPassengers.forEach(passenger => {
                    waypoints.push(new window.google.maps.LatLng(passenger.position.lat, passenger.position.lng));
                });
                waypoints.push(destination);

                for (let i = 0; i < waypoints.length - 1; i++) {
                    new window.google.maps.Polyline({
                        path: [waypoints[i], waypoints[i + 1]],
                        geodesic: true,
                        strokeColor: '#F97316',
                        strokeOpacity: 0.6,
                        strokeWeight: 3,
                        map: map,
                        zIndex: 2
                    });
                }
            }

            console.log('Rota otimizada calculada com sucesso:', optimized);
        } catch (error) {
            console.error('Erro ao calcular rota otimizada:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao calcular rota';
            setRouteError(errorMessage);
            
            // Em caso de erro, ainda inicializa o mapa básico
            initializeBasicMap();
        } finally {
            setRouteCalculating(false);
        }
    }, [mapStatus, routeCalculating, destinationCompany.address.coordinates.lat, destinationCompany.address.coordinates.lng, destinationCompany.name, route.passengers.list]); // eslint-disable-line react-hooks/exhaustive-deps

    const initializeBasicMap = useCallback(() => {
        if (!mapRef.current) return;

        const { Map } = window.google.maps;
        const center = new window.google.maps.LatLng(-23.5505, -46.6333);
        
        const map = new Map(mapRef.current, {
            center: { lat: -23.5505, lng: -46.6333 },
            zoom: 13,
            gestureHandling: 'greedy',
        });

        // Adiciona marcadores básicos dos passageiros
        route.passengers.list.forEach((passenger, index) => {
            new window.google.maps.Marker({
                position: new window.google.maps.LatLng(passenger.position.lat, passenger.position.lng),
                map: map,
                title: passenger.name,
                label: {
                    text: (index + 1).toString(),
                    color: 'white',
                    fontWeight: 'bold'
                },
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#F59E0B',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 8
                }
            });
        });
    }, [route.passengers.list]);

    useEffect(() => {
        if (mapStatus === 'loaded') {
            calculateOptimizedRoute();
        }
    }, [mapStatus, calculateOptimizedRoute]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{route.name}</h1>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <TruckIcon className="h-4 w-4 mr-1" />
                                <span>{route.vehicle}</span>
                            </div>
                            <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>06:00 - 18:00</span>
                            </div>
                        </div>
                    </div>
                    <Card padding="sm" className="bg-blue-50 border-blue-200">
                        <div className="flex items-center space-x-2">
                            <UsersIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                                {route.passengers.onboard}/{route.passengers.total}
                            </span>
                        </div>
                    </Card>
                </div>
                
                {/* Status da rota */}
                {routeCalculating && (
                    <div className="flex items-center space-x-2 text-sm text-amber-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                        <span>Calculando rota otimizada...</span>
                    </div>
                )}
                
                {optimizedRoute && !routeCalculating && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Rota otimizada</span>
                        </div>
                        <div className="text-gray-600">
                            <span className="font-semibold">{optimizedRoute.totalDistance.toFixed(1)} km</span>
                            <span className="mx-2">•</span>
                            <span>{Math.round(optimizedRoute.totalDuration)} min</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Mapa */}
            <div className="relative flex-1 bg-gray-300 min-h-0">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-gray-600">Carregando Rota...</p>
                        </div>
                    </div>
                )}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
                
                {/* Overlay com próximo passageiro */}
                {mapStatus === 'loaded' && optimizedRoute && (
                    <div className="absolute top-4 left-4 right-4">
                        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Próximo passageiro</p>
                                        <p className="text-xs text-gray-600">
                                            {optimizedRoute.orderedPassengers[0]?.name || 'Calculando...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-600">
                                        {optimizedRoute.totalDistance.toFixed(1)} km
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {Math.round(optimizedRoute.totalDuration)} min
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Lista de passageiros */}
            <div className="bg-white border-t border-gray-200 max-h-64 flex flex-col">
                {/* Mensagem de erro */}
                {routeError && (
                    <div className="p-4">
                        <Card className="bg-red-50 border-red-200">
                            <div className="flex items-start space-x-3">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">
                                        Erro na otimização da rota
                                    </h3>
                                    <div className="mt-1 text-sm text-red-700">
                                        <p>{routeError}</p>
                                        <p className="mt-1">Exibindo rota básica com estimativas.</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <UsersIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Passageiros</h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            routeError 
                                ? 'bg-red-100 text-red-800' 
                                : routeCalculating 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-green-100 text-green-800'
                        }`}>
                            {routeError ? 'Erro' : routeCalculating ? 'Calculando' : 'Otimizada'}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {(optimizedRoute?.orderedPassengers || route.passengers.list).map((passenger: Passenger, index) => {
                        const isOnboard = index < route.passengers.onboard;
                        const estimatedTime = optimizedRoute?.pickupTimes[passenger.id];
                        
                        return (
                            <Card key={passenger.id} padding="sm" className="hover:shadow-md transition-all duration-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 text-blue-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="relative">
                                        <Image 
                                            src={passenger.photoUrl} 
                                            alt={passenger.name} 
                                            className="h-12 w-12 rounded-full border-2 border-white shadow-sm object-cover"
                                            width={48}
                                            height={48}
                                        />
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                            isOnboard ? 'bg-green-500' : 'bg-gray-300'
                                        }`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{passenger.name}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-600 font-medium truncate">
                                                {estimatedTime ? estimatedTime : passenger.pickupTime}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-1">{passenger.address}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            isOnboard 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {isOnboard ? 'A bordo' : 'Aguardando'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Botão de navegação */}
            <div className="p-4 bg-white border-t border-gray-200">
                <Button 
                    onClick={onStartNavigation}
                    fullWidth
                    size="lg"
                    className="font-semibold"
                >
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Iniciar Navegação
                </Button>
            </div>
        </div>
    );
};

export default DriverRouteView;