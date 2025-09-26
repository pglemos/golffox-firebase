import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ROUTES, MOCK_COMPANIES } from '../../constants';
import type { Passenger } from '../../types';
import { MapPinIcon, UsersIcon, ClockIcon, TruckIcon } from '../icons/Icons';
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
    const calculateOptimizedRoute = async () => {
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
    };

    const initializeBasicMap = () => {
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
    };

    useEffect(() => {
        if (mapStatus === 'loaded') {
            calculateOptimizedRoute();
        }
    }, [mapStatus]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header responsivo com informações da rota */}
            <header className="bg-gradient-to-r from-golffox-blue-dark to-blue-800 text-white p-3 sm:p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                        <h1 className="text-lg sm:text-xl font-bold truncate">{route.name}</h1>
                        <div className="flex items-center mt-1 space-x-2 sm:space-x-4 text-xs sm:text-sm">
                            <div className="flex items-center">
                                <TruckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 opacity-80" variant="scale" />
                                <span className="opacity-90">{route.vehicle}</span>
                            </div>
                            <div className="flex items-center">
                                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 opacity-80" variant="rotate" />
                                <span className="opacity-90">06:00 - 18:00</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:justify-end">
                        <div className="bg-gradient-to-r from-white/20 to-white/10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20 backdrop-blur-sm">
                            <div className="text-xs opacity-80 font-medium">Passageiros</div>
                            <div className="text-base sm:text-lg font-bold">
                                <span className="text-golffox-orange-light">{route.passengers.onboard}</span>
                                <span className="text-xs sm:text-sm opacity-80"> / {route.passengers.total}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mapa principal - agora ocupa mais espaço */}
            <div className="relative flex-1 bg-gray-300 min-h-0">
                {mapStatus === 'error' && <MapApiKeyWarning />}
                {mapStatus === 'loading' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golffox-orange-primary mx-auto mb-2"></div>
                            <p className="text-golffox-gray-medium">Carregando Rota...</p>
                        </div>
                    </div>
                )}
                <div ref={mapRef} className={`w-full h-full ${mapStatus !== 'loaded' ? 'invisible' : ''}`} />
                
                {/* Overlay responsivo com informações da rota */}
                {mapStatus === 'loaded' && (
                    <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border border-white/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <div>
                                        <p className="text-sm sm:text-base font-semibold text-gray-800">Rota Otimizada</p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {optimizedRoute?.orderedPassengers[0]?.name || 'Calculando...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-base sm:text-lg font-bold text-golffox-orange-primary">
                                        {optimizedRoute ? `${optimizedRoute.totalDistance.toFixed(1)} km` : '12 km'}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {optimizedRoute ? `${Math.round(optimizedRoute.totalDuration)} min` : 'restantes'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Painel inferior responsivo com lista de passageiros */}
            <div className="bg-white border-t border-gray-200 max-h-48 sm:max-h-64 flex flex-col">
                {/* Mensagem de erro */}
                {routeError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Erro na otimização da rota
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{routeError}</p>
                                    <p className="mt-1">Exibindo rota básica com estimativas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" variant="float" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-800">Passageiros</h2>
                        </div>
                        <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${
                            routeError 
                                ? 'bg-red-100 text-red-800' 
                                : routeCalculating 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                        }`}>
                            {routeError ? 'Erro' : routeCalculating ? 'Calculando' : 'Otimizada'}
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {(optimizedRoute?.orderedPassengers || route.passengers.list).map((passenger: Passenger, index) => {
                        const isOnboard = index < route.passengers.onboard;
                        const estimatedTime = optimizedRoute?.pickupTimes[passenger.id];
                        
                        return (
                            <div key={passenger.id} className="bg-gradient-to-r from-gray-50 to-white hover:shadow-md p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center transition-all duration-200 hover:border-orange-200 border border-gray-100">
                                <div className="bg-orange-100 text-orange-600 text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                                    {index + 1}
                                </div>
                                <div className="relative mr-3 sm:mr-4">
                                    <img 
                                        src={passenger.photoUrl} 
                                        alt={passenger.name} 
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white shadow-sm object-cover" 
                                    />
                                    <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${
                                        isOnboard ? 'bg-green-500' : 'bg-gray-300'
                                    }`}></div>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-gray-800 mb-1 text-sm sm:text-base truncate">{passenger.name}</p>
                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" variant="rotate" />
                                        <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                                            {estimatedTime ? estimatedTime : passenger.pickupTime}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{passenger.address}</p>
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                    <span className="text-xs text-gray-500">
                                        {isOnboard ? 'A bordo' : 'Aguardando'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Botão de navegação responsivo fixo */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
                <button 
                    onClick={onStartNavigation}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5" variant="premium" />
                    <span className="text-sm sm:text-base">Iniciar Navegação</span>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                </button>
            </div>
        </div>
    );
};

export default DriverRouteView;