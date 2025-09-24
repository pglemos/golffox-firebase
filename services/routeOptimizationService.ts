import type { Passenger, Company } from '../types';

export interface OptimizedRoute {
    waypoints: google.maps.LatLng[];
    orderedPassengers: Passenger[];
    totalDistance: number;
    totalDuration: number;
    polylinePath: google.maps.LatLng[];
    pickupTimes?: { passenger: Passenger; estimatedPickupTime: Date }[];
}

export interface RouteOptimizationOptions {
    startLocation: google.maps.LatLng;
    passengers: Passenger[];
    destination: google.maps.LatLng;
    optimizeOrder?: boolean;
}

export class RouteOptimizationService {
    private directionsService: google.maps.DirectionsService | null = null;

    constructor() {
        this.initializeService();
    }

    private async initializeService(): Promise<void> {
        // Aguarda o carregamento da API do Google Maps
        await this.waitForGoogleMapsAPI();
        
        if (window.google?.maps?.DirectionsService) {
            this.directionsService = new google.maps.DirectionsService();
        }
    }

    private waitForGoogleMapsAPI(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Se já estiver carregada
            if (window.googleMapsApiLoaded === true && window.google?.maps?.DirectionsService) {
                resolve();
                return;
            }

            // Se houve erro no carregamento
            if (window.googleMapsApiLoaded === 'error') {
                reject(new Error('Google Maps API falhou ao carregar. Verifique se a chave da API está configurada corretamente e se as APIs necessárias estão habilitadas (Maps JavaScript API, Directions API, Geometry API).'));
                return;
            }

            // Aguarda o carregamento
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (window.googleMapsApiLoaded === true && window.google?.maps?.DirectionsService) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (window.googleMapsApiLoaded === 'error' || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Timeout ou erro ao carregar Google Maps API. Verifique se a chave da API está configurada corretamente e se as APIs necessárias estão habilitadas (Maps JavaScript API, Directions API, Geometry API).'));
                }
            }, 100);
        });
    }

    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(value: number): number {
        return value * Math.PI / 180;
    }

    /**
     * Algoritmo de otimização usando Nearest Neighbor com melhorias
     */
    private optimizePassengerOrder(
        startLocation: google.maps.LatLng,
        passengers: Passenger[],
        destination: google.maps.LatLng
    ): Passenger[] {
        if (passengers.length <= 1) return passengers;

        const unvisited = [...passengers];
        const optimizedOrder: Passenger[] = [];
        let currentLocation = startLocation;

        // Algoritmo Nearest Neighbor
        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistance(
                currentLocation.lat(),
                currentLocation.lng(),
                unvisited[0].position.lat,
                unvisited[0].position.lng
            );

            // Encontra o passageiro mais próximo
            for (let i = 1; i < unvisited.length; i++) {
                const distance = this.calculateDistance(
                    currentLocation.lat(),
                    currentLocation.lng(),
                    unvisited[i].position.lat,
                    unvisited[i].position.lng
                );

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            // Adiciona o passageiro mais próximo à rota otimizada
            const nearestPassenger = unvisited.splice(nearestIndex, 1)[0];
            optimizedOrder.push(nearestPassenger);
            currentLocation = new google.maps.LatLng(
                nearestPassenger.position.lat,
                nearestPassenger.position.lng
            );
        }

        return optimizedOrder;
    }

    /**
     * Calcula a rota otimizada usando Google Directions API
     */
    async calculateOptimizedRoute(options: RouteOptimizationOptions): Promise<OptimizedRoute> {
        // Aguarda a inicialização do serviço se necessário
        if (!this.directionsService) {
            await this.initializeService();
        }

        if (!this.directionsService) {
            throw new Error('Google Maps API não está carregada');
        }

        const { startLocation, passengers, destination, optimizeOrder = true } = options;

        // Validação dos parâmetros de entrada
        if (!startLocation || !destination) {
            throw new Error('Coordenadas de início ou destino não fornecidas');
        }

        // Validação específica para objetos LatLng
        try {
            const startLat = typeof startLocation.lat === 'function' ? startLocation.lat() : startLocation.lat;
            const startLng = typeof startLocation.lng === 'function' ? startLocation.lng() : startLocation.lng;
            const destLat = typeof destination.lat === 'function' ? destination.lat() : destination.lat;
            const destLng = typeof destination.lng === 'function' ? destination.lng() : destination.lng;
            
            if (typeof startLat !== 'number' || typeof startLng !== 'number' ||
                typeof destLat !== 'number' || typeof destLng !== 'number' ||
                isNaN(startLat) || isNaN(startLng) || isNaN(destLat) || isNaN(destLng)) {
                throw new Error('Coordenadas de início ou destino são inválidas');
            }
        } catch (error) {
            throw new Error(`Erro ao validar coordenadas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }

        if (!passengers || passengers.length === 0) {
            throw new Error('Lista de passageiros não fornecida ou vazia');
        }

        // Valida coordenadas de todos os passageiros
        for (const passenger of passengers) {
            if (!passenger.position || 
                typeof passenger.position.lat !== 'number' || 
                typeof passenger.position.lng !== 'number') {
                throw new Error(`Coordenadas inválidas para o passageiro ${passenger.name || 'desconhecido'}`);
            }
        }

        // Otimiza a ordem dos passageiros se solicitado
        const orderedPassengers = optimizeOrder 
            ? this.optimizePassengerOrder(startLocation, passengers, destination)
            : passengers;

        // Prepara os waypoints para a API do Google
        const waypoints = orderedPassengers.map(passenger => {
            try {
                // Validação adicional antes de criar LatLng
                if (!passenger.position || 
                    typeof passenger.position.lat !== 'number' || 
                    typeof passenger.position.lng !== 'number' ||
                    isNaN(passenger.position.lat) || 
                    isNaN(passenger.position.lng)) {
                    throw new Error(`Coordenadas inválidas para passageiro ${passenger.name}`);
                }
                
                return {
                    location: new google.maps.LatLng(passenger.position.lat, passenger.position.lng),
                    stopover: true
                };
            } catch (error) {
                console.error(`Erro ao criar waypoint para passageiro ${passenger.name}:`, error);
                throw error;
            }
        });

        return new Promise((resolve, reject) => {
            const request: google.maps.DirectionsRequest = {
                origin: startLocation,
                destination: destination,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false, // Usamos nossa própria otimização
                avoidHighways: false,
                avoidTolls: false
            };

            this.directionsService!.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    const route = result.routes[0];
                    const leg = route.legs;
                    
                    // Calcula distância e duração total
                    let totalDistance = 0;
                    let totalDuration = 0;
                    
                    leg.forEach(segment => {
                        if (segment.distance) totalDistance += segment.distance.value;
                        if (segment.duration) totalDuration += segment.duration.value;
                    });

                    // Extrai o caminho da polyline com validação
                    const polylinePath: google.maps.LatLng[] = [];
                    if (route.overview_path && Array.isArray(route.overview_path)) {
                        route.overview_path.forEach(point => {
                            try {
                                // Valida se o ponto tem coordenadas válidas
                                const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
                                const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
                                
                                if (typeof lat === 'number' && typeof lng === 'number' && 
                                    !isNaN(lat) && !isNaN(lng)) {
                                    polylinePath.push(point);
                                }
                            } catch (error) {
                                console.warn('Erro ao processar ponto do polyline:', error);
                            }
                        });
                    }

                    // Cria os waypoints ordenados com validação
                    const optimizedWaypoints = [startLocation];
                    orderedPassengers.forEach(passenger => {
                        try {
                            if (passenger.position && 
                                typeof passenger.position.lat === 'number' && 
                                typeof passenger.position.lng === 'number' &&
                                !isNaN(passenger.position.lat) && 
                                !isNaN(passenger.position.lng)) {
                                optimizedWaypoints.push(new google.maps.LatLng(
                                    passenger.position.lat,
                                    passenger.position.lng
                                ));
                            }
                        } catch (error) {
                            console.warn(`Erro ao criar waypoint para passageiro ${passenger.name}:`, error);
                        }
                    });
                    optimizedWaypoints.push(destination);

                    // Calcula horários estimados de pickup
                    const pickupTimes = this.calculatePickupTimes(
                        new Date(),
                        orderedPassengers,
                        leg
                    );

                    resolve({
                        waypoints: optimizedWaypoints,
                        orderedPassengers,
                        totalDistance: totalDistance / 1000, // Converte para km
                        totalDuration: totalDuration / 60, // Converte para minutos
                        polylinePath,
                        pickupTimes
                    });
                } else {
                    reject(new Error(`Falha ao calcular rota: ${status}`));
                }
            });
        });
    }

    /**
     * Encontra a melhor rota possível, com fallback para rota não otimizada
     */
    async findBestRoute(options: RouteOptimizationOptions): Promise<OptimizedRoute> {
        try {
            // Aguarda a inicialização do serviço se necessário
            if (!this.directionsService) {
                await this.initializeService();
            }

            // Tenta calcular rota otimizada
            return await this.calculateOptimizedRoute(options);
        } catch (error) {
            console.warn('Erro ao calcular rota otimizada:', error);
            
            // Fallback: rota sem otimização
            try {
                return await this.calculateOptimizedRoute({
                    ...options,
                    optimizeOrder: false
                });
            } catch (fallbackError) {
                console.error('Erro ao calcular rota de fallback:', fallbackError);
                
                // Se ainda assim falhar, retorna uma rota básica com dados estimados
                return this.createFallbackRoute(options);
            }
        }
    }

    /**
     * Cria uma rota de fallback com dados estimados quando a API falha
     */
    private createFallbackRoute(options: RouteOptimizationOptions): OptimizedRoute {
        const { startLocation, passengers, destination } = options;
        
        // Validação e conversão de coordenadas para formato simples
        if (!startLocation || !destination) {
            throw new Error('Coordenadas de início ou destino não fornecidas');
        }
        
        const startCoords = {
            lat: typeof startLocation.lat === 'function' ? startLocation.lat() : startLocation.lat,
            lng: typeof startLocation.lng === 'function' ? startLocation.lng() : startLocation.lng
        };
        
        const destCoords = {
            lat: typeof destination.lat === 'function' ? destination.lat() : destination.lat,
            lng: typeof destination.lng === 'function' ? destination.lng() : destination.lng
        };
        
        // Validação das coordenadas convertidas
        if (typeof startCoords.lat !== 'number' || typeof startCoords.lng !== 'number' ||
            typeof destCoords.lat !== 'number' || typeof destCoords.lng !== 'number') {
            throw new Error('Coordenadas inválidas fornecidas');
        }
        
        // Validação dos passageiros e suas coordenadas
        if (!passengers || passengers.length === 0) {
            throw new Error('Lista de passageiros não fornecida ou vazia');
        }
        
        // Valida coordenadas de todos os passageiros
        for (const passenger of passengers) {
            if (!passenger.position || 
                typeof passenger.position.lat !== 'number' || 
                typeof passenger.position.lng !== 'number') {
                throw new Error(`Coordenadas inválidas para o passageiro ${passenger.name || 'desconhecido'}`);
            }
        }
        
        // Calcula distâncias estimadas usando Haversine
        let totalDistance = 0;
        let currentCoords = startCoords;
        
        for (const passenger of passengers) {
            totalDistance += this.calculateDistance(
                currentCoords.lat,
                currentCoords.lng,
                passenger.position.lat,
                passenger.position.lng
            );
            currentCoords = passenger.position;
        }
        
        // Adiciona distância até o destino
        totalDistance += this.calculateDistance(
            currentCoords.lat,
            currentCoords.lng,
            destCoords.lat,
            destCoords.lng
        );
        
        // Estima duração (assumindo velocidade média de 30 km/h no trânsito urbano)
        const totalDuration = (totalDistance / 30) * 60; // em minutos
        
        // Calcula horários estimados simplificados para fallback
        const pickupTimes: { passenger: Passenger; estimatedPickupTime: Date }[] = [];
        const startTime = new Date();
        let currentTime = new Date(startTime);
        
        passengers.forEach((passenger, index) => {
            // Adiciona tempo estimado baseado na distância
            const timeToPassenger = (index + 1) * (totalDuration / passengers.length);
            currentTime = new Date(startTime.getTime() + timeToPassenger * 60 * 1000);
            
            pickupTimes.push({
                passenger,
                estimatedPickupTime: new Date(currentTime)
            });
        });
        
        return {
            orderedPassengers: passengers,
            totalDistance,
            totalDuration,
            polylinePath: [], // Sem polyline para rota de fallback
            pickupTimes
        };
    }

    /**
     * Estima o tempo de embarque baseado no número de passageiros
     */
    estimateBoardingTime(passengerCount: number): number {
        // Estima 30 segundos por passageiro + 1 minuto base
        return 1 + (passengerCount * 0.5);
    }

    /**
     * Calcula o horário estimado de chegada para cada passageiro
     */
    calculatePickupTimes(
        startTime: Date,
        orderedPassengers: Passenger[],
        routeSegments: google.maps.DirectionsLeg[]
    ): { passenger: Passenger; estimatedPickupTime: Date }[] {
        const pickupTimes: { passenger: Passenger; estimatedPickupTime: Date }[] = [];
        let currentTime = new Date(startTime);

        orderedPassengers.forEach((passenger, index) => {
            if (index < routeSegments.length) {
                const segment = routeSegments[index];
                if (segment.duration) {
                    currentTime = new Date(currentTime.getTime() + segment.duration.value * 1000);
                }
            }

            pickupTimes.push({
                passenger,
                estimatedPickupTime: new Date(currentTime)
            });

            // Adiciona tempo de embarque
            const boardingTime = this.estimateBoardingTime(1);
            currentTime = new Date(currentTime.getTime() + boardingTime * 60 * 1000);
        });

        return pickupTimes;
    }
}

export const routeOptimizationService = new RouteOptimizationService();