import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_VEHICLES, MOCK_ROUTES } from '../constants';
import type { Vehicle, Route, Passenger } from '../types';
import { VehicleStatus } from '../types';
import { TruckIcon, XMarkIcon, ClockIcon, UsersIcon } from './icons/Icons';
import MapApiKeyWarning from './MapApiKeyWarning';
import BusIcon3D, { BusStatus } from './BusIcon3D';
import { getDriverStatus, getStatusColor, getStatusDescription, DriverLocation } from '../utils/driverStatus';
import { createBusMapIcon, vehicleStatusToBusStatus } from '../utils/mapIcons';

// Tipagens globais agora estão em src/types/global.d.ts

// Helper to get color values
const statusColors = {
  [VehicleStatus.Moving]: '#FF5F00',
  [VehicleStatus.Stopped]: '#F1C40F',
  [VehicleStatus.Problem]: '#E74C3C',
};

// Configuração de debug - desabilitar em produção
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
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

  // Declarar refs primeiro
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animatedVehicleMarkerRef = useRef<any>(null);
  const routeRenderersRef = useRef<any[]>([]);
  const busStopMarkersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);

  // Declarar mapStatus antes de usar
  const [mapStatus, setMapStatus] = useState<{ status: 'loading' | 'loaded' | 'error', message?: React.ReactNode }>({ status: 'loading' });

  // Função para criar info window com rastreamento adequado
  const createTrackedInfoWindow = useCallback((options?: google.maps.InfoWindowOptions) => {
    const infoWindow = new google.maps.InfoWindow(options);
    infoWindowsRef.current.push(infoWindow);
    debugLog('📍 Info window criada e rastreada');
    return infoWindow;
  }, []);

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
                  <strong>Ação Necessária: Habilitar &quot;Directions API&quot;</strong>
                  <p className="mt-2 text-sm">O cálculo de rotas falhou porque a sua chave de API do Google Maps não tem permissão para usar a <strong>&quot;Directions API&quot;</strong>.</p>
                  <p className="mt-3 font-semibold text-sm">Solução: Vá ao seu painel do Google Cloud, encontre a chave de API que você está usando e ative a &quot;Directions API&quot; para ela.</p>
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
      // Limpar intervalo de simulação
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      
      // Limpar rota renderizada
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      
      // Limpar marcador animado
      if (animatedVehicleMarkerRef.current) {
        animatedVehicleMarkerRef.current.setMap(null);
        animatedVehicleMarkerRef.current = null;
      }
      
      // Restaurar visibilidade do marcador original se houver veículo selecionado
      if (selectedVehicle) {
        const originalMarker = markersRef.current.find(marker => marker.getTitle() === selectedVehicle.plate);
        if (originalMarker) {
          originalMarker.setVisible(true);
        }
      }
      
      // Resetar status da viagem
      setTripStatus({
        speed: 0,
        passengersOnboard: 0,
        tripDuration: 0,
        eta: 0,
        route: null
      });
  };



  const displayGarageBuses = () => {
    if (!mapInstanceRef.current) return;

    // Posição da garagem (centro aproximado da cidade)
    const garagePosition = { lat: -23.5505, lng: -46.6333 };

    // Encontrar ônibus não atribuídos a rotas
    const garageBuses = MOCK_VEHICLES.filter(vehicle => !vehicle.routeId || !vehicle.isRegistered);

    garageBuses.forEach((bus, index) => {
      // Posicionar ônibus em volta da garagem
      const angle = (index * 360) / garageBuses.length;
      const radius = 0.002; // Aproximadamente 200 metros
      const offsetLat = radius * Math.cos(angle * Math.PI / 180);
      const offsetLng = radius * Math.sin(angle * Math.PI / 180);

      const busPosition = {
        lat: garagePosition.lat + offsetLat,
        lng: garagePosition.lng + offsetLng,
      };

      // Usar a função createBusMapIcon para garantir consistência visual
      const garageIcon = createBusMapIcon('garage', 32);

      const garageMarker = new window.google.maps.Marker({
        position: busPosition,
        map: mapInstanceRef.current,
        title: `Ônibus na Garagem: ${bus.plate}`,
        icon: garageIcon,
        zIndex: 400,
      });

      // Info window para ônibus na garagem
      const infoWindow = createTrackedInfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">Ônibus na Garagem</h4>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Placa:</strong> ${bus.plate}</p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Modelo:</strong> ${bus.model}</p>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Status:</strong> ${bus.isRegistered ? 'Disponível' : 'Não Registrado'}</p>
            <p style="margin: 0; color: #666; font-size: 12px;"><strong>Situação:</strong> ${bus.routeId ? 'Aguardando Rota' : 'Sem Rota Atribuída'}</p>
          </div>
        `,
      });

      garageMarker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, garageMarker);
      });

      markersRef.current.push(garageMarker);
    });
  };

  const cleanupResources = useCallback(() => {
    debugLog('🧹 Iniciando limpeza de recursos');
    
    // Limpar pontos de parada
    busStopMarkersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (error) {
        debugLog('⚠️ Erro ao remover marker de parada:', error);
      }
    });
    busStopMarkersRef.current = [];
    
    // Fechar todas as info windows rastreadas
    infoWindowsRef.current.forEach((infoWindow, index) => {
      try {
        infoWindow.close();
        infoWindow.setMap(null);
      } catch (error) {
        debugLog(`⚠️ Erro ao fechar info window ${index}:`, error);
      }
    });
    infoWindowsRef.current = [];
    
    // Limpeza DOM segura - apenas ocultar elementos problemáticos
    try {
      const infoWindowElements = document.querySelectorAll('.gm-style-iw, .gm-style-iw-c, .gm-style-iw-d');
      infoWindowElements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.display = 'none';
        }
      });
    } catch (error) {
      debugLog('⚠️ Erro na limpeza DOM:', error);
    }
    
    // Limpar simulação
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    // Limpar rota renderizada
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    
    // Limpar marcador animado
    if (animatedVehicleMarkerRef.current) {
      animatedVehicleMarkerRef.current.setMap(null);
      animatedVehicleMarkerRef.current = null;
    }
    
    // Restaurar visibilidade de TODOS os marcadores originais
    markersRef.current.forEach(marker => {
      try {
        marker.setVisible(true);
      } catch (error) {
        debugLog('⚠️ Erro ao restaurar visibilidade do marker:', error);
      }
    });
    
    // Resetar status da viagem
    setTripStatus({
      speed: 0,
      passengersOnboard: 0,
      tripDuration: 0,
      eta: 0,
      route: null
    });
    
    debugLog('✅ Limpeza de recursos concluída');
  }, []);

  const handleVehicleSelect = useCallback((vehicle: Vehicle) => {
    debugLog('🚌 Selecionando veículo:', vehicle.plate);
    
    if (mapStatus.status !== 'loaded') return;
    
    // Limpar recursos anteriores
    cleanupResources();
    
    // Usar setTimeout para garantir que a limpeza seja processada
    setTimeout(() => {
      setSelectedVehicle(vehicle);
      
      // Ocultar o marcador original para evitar duplicação
      const originalMarker = markersRef.current.find(marker => marker.getTitle() === vehicle.plate);
      if (originalMarker) {
        originalMarker.setVisible(false);
      }
      
      const route = MOCK_ROUTES.find(r => r.id === vehicle.routeId);
      if (!mapInstanceRef.current || !route) {
          return;
      }

      // Criar pontos de parada apenas para a rota selecionada
      route.passengers.list.forEach((passenger, passengerIndex) => {
        const busStopIcon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#004A8D" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${passengerIndex + 1}</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12),
        };

        const busStopMarker = new window.google.maps.Marker({
          position: passenger.position,
          map: mapInstanceRef.current,
          title: `${route.name} - Parada ${passengerIndex + 1}: ${passenger.name}`,
          icon: busStopIcon,
          zIndex: 500,
        });

        // Adicionar info window para pontos de parada
        const infoWindow = createTrackedInfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">${route.name}</h4>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Passageiro:</strong> ${passenger.name}</p>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;"><strong>Horário:</strong> ${passenger.pickupTime}</p>
              <p style="margin: 0; color: #666; font-size: 12px;"><strong>Endereço:</strong> ${passenger.address}</p>
            </div>
          `,
        });

        busStopMarker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, busStopMarker);
        });

        busStopMarkersRef.current.push(busStopMarker);
      });

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
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          startSimulation(result, route, vehicle);
        } else {
          console.error(`Directions request failed due to ${status}`);
          setMapStatus({ status: 'error', message: `O cálculo da rota falhou: ${status}. Verifique as permissões da Directions API.`})
        }
      });
    }, 100);
  }, [selectedVehicle, mapStatus.status, cleanupResources, createTrackedInfoWindow]);

  const startSimulation = (directionsResult: any, route: Route, vehicle: Vehicle) => {
    const overviewPath = directionsResult.routes[0].overview_path;
    let step = 0;
    let tripStartTime = Date.now();
    const totalDuration = directionsResult.routes[0].legs.reduce((acc: number, leg: any) => acc + leg.duration.value, 0);

    // Usar o status do veículo convertido para busStatus
    const busStatus = vehicleStatusToBusStatus(vehicle.status);
    const animatedBusIcon = createBusMapIcon(busStatus, 36);
    
    animatedVehicleMarkerRef.current = new window.google.maps.Marker({
        position: overviewPath[0],
        map: mapInstanceRef.current,
        zIndex: 1000,
        icon: animatedBusIcon
    });
    
    simulationIntervalRef.current = setInterval(() => {
        step++;
        if (step >= overviewPath.length) {
            if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
            return;
        }

        // CORREÇÃO: Usar setPosition em vez de atribuição direta
        if (animatedVehicleMarkerRef.current) {
          animatedVehicleMarkerRef.current.setPosition(overviewPath[step]);
        }
        
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
    cleanupResources();
    setSelectedVehicle(null);
  }

  useEffect(() => {
    if (mapStatus.status !== 'loaded' || !mapRef.current) return;

    const { Map, Marker } = window.google.maps;

    const map = new Map(mapRef.current as HTMLElement, {
      center: { lat: -23.5505, lng: -46.6333 },
      zoom: 12,
      disableDefaultUI: true,
    });
    mapInstanceRef.current = map;

    // Filtrar apenas veículos cadastrados para evitar duplicações
    const registeredVehicles = MOCK_VEHICLES.filter(vehicle => vehicle.isRegistered === true);
    
    markersRef.current = registeredVehicles.map((vehicle: Vehicle) => {
      const busStatus = vehicleStatusToBusStatus(vehicle.status, vehicle.id, vehicle.position, vehicle.routeId);
      const busIcon = createBusMapIcon(busStatus, 32);
      
      const marker = new Marker({
        position: vehicle.position,
        map,
        title: vehicle.plate,
        icon: busIcon
      });

      marker.addListener('click', () => handleVehicleSelect(vehicle));
      return marker;
    });

    // Exibir ônibus na garagem
        displayGarageBuses();
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
              <li className="flex items-center mb-1">
                <BusIcon3D status="moving" size={20} className="mr-2" />
                <span>Em Movimento</span>
              </li>
              <li className="flex items-center mb-1">
                <BusIcon3D status="stopped" size={20} className="mr-2" />
                <span>Parado</span>
              </li>
              <li className="flex items-center mb-1">
                <BusIcon3D status="problem" size={20} className="mr-2" />
                <span>Com Problema</span>
              </li>
              <li className="flex items-center mb-1">
                <BusIcon3D status="garage" size={20} className="mr-2" />
                <span>Garagem</span>
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-2 border-2 border-blue-500 bg-white"></div>
                <span>Pontos de parada (clique no ônibus)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMap;