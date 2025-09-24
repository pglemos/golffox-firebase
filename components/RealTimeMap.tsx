import React, { useState, useEffect, useRef } from 'react';
import { MOCK_VEHICLES, MOCK_ROUTES } from '../constants';
import type { Vehicle, Route, Passenger } from '../types';
import { VehicleStatus } from '../types';
import { TruckIcon, XMarkIcon, ClockIcon, UsersIcon } from './icons/Icons';
import MapApiKeyWarning from './MapApiKeyWarning';

// Add declaration for Google Maps API objects on the window to resolve TypeScript errors.
declare global {
  interface Window {
    google: any;
    markerClusterer: any;
    googleMapsApiLoaded: boolean | 'error';
    markerClustererApiLoaded: boolean;
    gm_authFailure?: () => void;
  }
}

// Helper to get color values
const statusColors = {
  [VehicleStatus.Moving]: '#FF5F00',
  [VehicleStatus.Stopped]: '#F1C40F',
  [VehicleStatus.Problem]: '#E74C3C',
};

const RealTimeMap: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [tripStatus, setTripStatus] = useState({
      speed: 0,
      passengersOnboard: 0,
      tripDuration: 0,
      eta: 0,
      route: null as Route | null
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animatedVehicleMarkerRef = useRef<any>(null);

  const [mapStatus, setMapStatus] = useState<{ status: 'loading' | 'loaded' | 'error', message?: React.ReactNode }>({ status: 'loading' });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMapStatus(prevStatus => {
        if (prevStatus.status !== 'loading') {
          clearInterval(intervalId);
          return prevStatus;
        }

        if (window.googleMapsApiLoaded === 'error') {
          clearInterval(intervalId);
          return { status: 'error', message: 'A autenticação da API do Google Maps falhou. Verifique se a chave de API é válida e não possui restrições.' };
        }

        if (window.googleMapsApiLoaded && window.markerClustererApiLoaded) {
          clearInterval(intervalId);
          if (window.google?.maps?.DirectionsService) {
            return { status: 'loaded' };
          } else {
            return {
              status: 'error',
              message: (
                <>
                  <strong>Ação Necessária: Habilitar "Directions API"</strong>
                  <p className="mt-2 text-sm">O cálculo de rotas falhou porque a sua chave de API do Google Maps não tem permissão para usar a <strong>"Directions API"</strong>.</p>
                  <p className="mt-3 font-semibold text-sm">Solução: Vá ao seu painel do Google Cloud, encontre a chave de API que você está usando e ative a "Directions API" para ela.</p>
                </>
              )
            };
          }
        }
        return prevStatus;
      });
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      setMapStatus(prevStatus => {
        if (prevStatus.status === 'loading') {
          return { status: 'error', message: 'A API do Google Maps não carregou. Verifique sua conexão e a configuração do script.' };
        }
        return prevStatus;
      });
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  const clearSimulation = () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
      if (animatedVehicleMarkerRef.current) animatedVehicleMarkerRef.current.setMap(null);
      simulationIntervalRef.current = null;
      animatedVehicleMarkerRef.current = null;
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (mapStatus.status !== 'loaded') return;
    
    setSelectedVehicle(vehicle);
    clearSimulation();
    
    const route = MOCK_ROUTES.find(r => r.id === vehicle.routeId);
    if (!mapInstanceRef.current || !route) {
        return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#004A8D',
        strokeOpacity: 0.8,
        strokeWeight: 6,
      },
    });
    directionsRenderer.setMap(mapInstanceRef.current);
    directionsRendererRef.current = directionsRenderer;

    const waypoints = route.passengers.list.slice(0, -1).map(p => ({
      location: p.position,
      stopover: true,
    }));
    
    const request = {
      origin: vehicle.position,
      destination: route.passengers.list[route.passengers.list.length - 1].position,
      waypoints: waypoints,
      travelMode: 'DRIVING',
    };

    directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        startSimulation(result, route);
      } else {
        console.error(`Directions request failed due to ${status}`);
        setMapStatus({ status: 'error', message: `O cálculo da rota falhou: ${status}. Verifique as permissões da Directions API.`})
      }
    });
  };

  const startSimulation = (directionsResult: any, route: Route) => {
    const overviewPath = directionsResult.routes[0].overview_path;
    let step = 0;
    let tripStartTime = Date.now();
    const totalDuration = directionsResult.routes[0].legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0);

    const pin = document.createElement('div');
    pin.className = 'w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300';
    pin.style.backgroundColor = '#FF5F00';
    pin.style.border = '2px solid white';
    pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-17.25 4.5h15M6.375 12h11.25" /></svg>`;
      
    animatedVehicleMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        position: overviewPath[0],
        map: mapInstanceRef.current,
        content: pin,
        zIndex: 1000,
    });
    
    simulationIntervalRef.current = setInterval(() => {
        step++;
        if (step >= overviewPath.length) {
            if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            return;
        }

        animatedVehicleMarkerRef.current.position = overviewPath[step];
        const passengersOnboard = route.passengers.list.filter(p => {
             const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
                overviewPath[step], p.position
             );
             return dist < 2000; // approximation
        }).length;

        const tripDuration = Math.floor((Date.now() - tripStartTime) / 1000);
        const elapsedRatio = step / overviewPath.length;
        const eta = Math.ceil((totalDuration * (1 - elapsedRatio)) / 60);

        setTripStatus({
            speed: Math.floor(Math.random() * (60 - 40 + 1) + 40),
            passengersOnboard,
            tripDuration,
            eta,
            route: route
        });

    }, 1000);
  }

  const handleDeselectVehicle = () => {
    setSelectedVehicle(null);
    clearSimulation();
  }

  useEffect(() => {
    if (mapStatus.status !== 'loaded' || !mapRef.current) return;

    const { Map } = window.google.maps;
    const { AdvancedMarkerElement } = window.google.maps.marker;
    const { MarkerClusterer } = window.markerClusterer;

    const map = new Map(mapRef.current as HTMLElement, {
      center: { lat: -23.5505, lng: -46.6333 },
      zoom: 12,
      mapId: 'GOLFFOX_REALTIME_MAP',
      disableDefaultUI: true,
    });
    mapInstanceRef.current = map;

    markersRef.current = MOCK_VEHICLES.map((vehicle: Vehicle) => {
      const pin = document.createElement('div');
      pin.className = 'w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300';
      pin.style.backgroundColor = statusColors[vehicle.status];
      pin.style.border = '2px solid white';
      pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h9.75a3.375 3.375 0 013.375 3.375v1.875m-17.25 4.5h15M6.375 12h11.25" /></svg>`;
      
      const marker = new AdvancedMarkerElement({
        position: vehicle.position,
        map,
        title: vehicle.plate,
        content: pin,
      });

      marker.addListener('click', () => handleVehicleSelect(vehicle));
      return marker;
    });

    new MarkerClusterer({ markers: markersRef.current, map });
  }, [mapStatus.status]);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-golffox-gray-dark mb-6">Mapa em Tempo Real</h2>
      <div className="bg-golffox-white rounded-lg shadow-md p-4">
        <div className="relative w-full h-[60vh] bg-gray-200 rounded-lg overflow-hidden">
          {mapStatus.status === 'error' && <MapApiKeyWarning message={mapStatus.message} />}
          {mapStatus.status === 'loading' && <div className="w-full h-full flex items-center justify-center bg-gray-200"><p className="text-golffox-gray-medium">Carregando Mapa...</p></div>}
          <div ref={mapRef} className={`w-full h-full ${mapStatus.status !== 'loaded' ? 'invisible' : ''}`} />

          {selectedVehicle && (
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl w-80 animate-fade-in-down z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <TruckIcon className="h-6 w-6 mr-2 text-golffox-gray-dark" />
                  <h4 className="font-bold text-lg text-golffox-gray-dark">{selectedVehicle.plate}</h4>
                </div>
                <button onClick={handleDeselectVehicle} className="text-golffox-gray-medium hover:text-golffox-gray-dark p-1 rounded-full hover:bg-golffox-gray-light">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-golffox-gray-medium w-24 inline-block">Motorista:</span> <span className="text-golffox-gray-dark font-medium">{selectedVehicle.driver}</span></p>
                <p><span className="font-semibold text-golffox-gray-medium w-24 inline-block">Rota Atual:</span> <span className="text-golffox-gray-dark font-medium">{tripStatus.route?.name}</span></p>
              </div>
               <hr className="my-3"/>
                <h5 className="font-bold text-md text-golffox-gray-dark mb-2">Status da Viagem</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="font-semibold text-golffox-gray-medium">Velocidade</p><p className="font-bold text-golffox-gray-dark">{tripStatus.speed} km/h</p></div>
                    <div><p className="font-semibold text-golffox-gray-medium">Passageiros</p><p className="font-bold text-golffox-gray-dark">{tripStatus.passengersOnboard} / {tripStatus.route?.passengers.total}</p></div>
                    <div className="flex items-center space-x-2"><ClockIcon className="h-5 w-5 text-golffox-gray-medium"/><p className="font-bold text-golffox-gray-dark">{formatDuration(tripStatus.tripDuration)}</p></div>
                    <div className="flex items-center space-x-2"><UsersIcon className="h-5 w-5 text-golffox-gray-medium"/><p className="font-bold text-golffox-gray-dark">ETA {tripStatus.eta} min</p></div>
                </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl z-0">
            <h4 className="font-bold mb-2 text-golffox-gray-dark">Legenda</h4>
            <ul className="text-sm">
              <li className="flex items-center mb-1"><span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: statusColors[VehicleStatus.Moving] }}></span>Em Movimento</li>
              <li className="flex items-center mb-1"><span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: statusColors[VehicleStatus.Stopped] }}></span>Parado</li>
              <li className="flex items-center"><span className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: statusColors[VehicleStatus.Problem] }}></span>Com Problema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMap;