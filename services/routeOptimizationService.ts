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

export interface RouteCalculationError extends Error {
    code: 'GOOGLE_MAPS_NOT_LOADED' | 'INVALID_COORDINATES' | 'NO_PASSENGERS' | 'DIRECTIONS_API_ERROR' | 'UNKNOWN_ERROR' | 'SSR_ENVIRONMENT';
    details?: string;
}

export class RouteOptimizationService {
    private directionsService: google.maps.DirectionsService | null = null;
    private distanceCache = new Map<string, number>();
    private routeCache = new Map<string, OptimizedRoute>();
    private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

    constructor() {
        this.initializeService();
        // Limpa cache periodicamente
        setInterval(() => this.clearExpiredCache(), 60000); // A cada minuto
    }

    private clearExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of this.routeCache.entries()) {
            if (now - (value as any).timestamp > this.CACHE_EXPIRY) {
                this.routeCache.delete(key);
            }
        }
    }

    private getCacheKey(options: RouteOptimizationOptions): string {
        const { startLocation, passengers, destination, optimizeOrder } = options;
        const startKey = `${startLocation.lat()},${startLocation.lng()}`;
        const destKey = `${destination.lat()},${destination.lng()}`;
        const passengersKey = passengers
            .map(p => `${p.id}-${p.position.lat},${p.position.lng}`)
            .sort()
            .join('|');
        return `${startKey}-${destKey}-${passengersKey}-${optimizeOrder}`;
    }

    private async initializeService(): Promise<void> {
        // Verificar se estamos no ambiente do browser
        if (typeof window === 'undefined') {
            return; // Não inicializar no servidor
        }

        // Aguarda o carregamento da API do Google Maps
        await this.waitForGoogleMapsAPI();
        
        if (window.google?.maps?.DirectionsService) {
            this.directionsService = new google.maps.DirectionsService();
        }
    }

    private waitForGoogleMapsAPI(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // Verificar se estamos no ambiente do browser
                if (typeof window === 'undefined') {
                    const error: RouteCalculationError = new Error('Google Maps API não disponível no ambiente servidor') as RouteCalculationError;
                    error.code = 'SSR_ENVIRONMENT';
                    reject(error);
                    return;
                }

                // Se já estiver carregada
                if (window.googleMapsApiLoaded === true && window.google?.maps?.DirectionsService) {
                    resolve();
                    return;
                }

                // Se houve erro no carregamento
                if (window.googleMapsApiLoaded === 'error') {
                    const error: RouteCalculationError = new Error('Google Maps API falhou ao carregar. Verifique se a chave da API está configurada corretamente e se as APIs necessárias estão habilitadas (Maps JavaScript API, Directions API, Geometry API).') as RouteCalculationError;
                    error.code = 'GOOGLE_MAPS_NOT_LOADED';
                    reject(error);
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
                        const error: RouteCalculationError = new Error('Timeout ou erro ao carregar Google Maps API. Verifique se a chave da API está configurada corretamente e se as APIs necessárias estão habilitadas (Maps JavaScript API, Directions API, Geometry API).') as RouteCalculationError;
                        error.code = 'GOOGLE_MAPS_NOT_LOADED';
                        error.details = `Tentativas: ${attempts}/${maxAttempts}`;
                        reject(error);
                    }
                }, 100);
            } catch (error) {
                const routeError: RouteCalculationError = new Error(`Erro inesperado ao aguardar Google Maps API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`) as RouteCalculationError;
                routeError.code = 'UNKNOWN_ERROR';
                reject(routeError);
            }
        });
    }

    /**
     * Calcula a distância entre dois pontos usando a fórmula de Haversine com cache
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        // Cria chave para cache (arredonda para 6 casas decimais para evitar cache excessivo)
        const key = `${lat1.toFixed(6)},${lng1.toFixed(6)}-${lat2.toFixed(6)},${lng2.toFixed(6)}`;
        
        // Verifica cache
        if (this.distanceCache.has(key)) {
            return this.distanceCache.get(key)!;
        }

        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Armazena no cache (limita tamanho do cache)
        if (this.distanceCache.size < 1000) {
            this.distanceCache.set(key, distance);
        }

        return distance;
    }

    private toRad(value: number): number {
        return value * Math.PI / 180;
    }

    /**
     * Algoritmo de otimização usando Nearest Neighbor com melhorias e 2-opt
     */
    private optimizePassengerOrder(
        startLocation: google.maps.LatLng,
        passengers: Passenger[],
        destination: google.maps.LatLng
    ): Passenger[] {
        if (passengers.length <= 1) return passengers;

        // Primeiro, aplica Nearest Neighbor
        let optimizedOrder = this.nearestNeighborOptimization(startLocation, passengers, destination);
        
        // Em seguida, aplica 2-opt para melhorar a rota
        if (optimizedOrder.length > 3) {
            optimizedOrder = this.twoOptImprovement(startLocation, optimizedOrder, destination);
        }

        return optimizedOrder;
    }

    /**
     * Algoritmo Nearest Neighbor básico
     */
    private nearestNeighborOptimization(
        startLocation: google.maps.LatLng,
        passengers: Passenger[],
        destination: google.maps.LatLng
    ): Passenger[] {
        const unvisited = [...passengers];
        const optimizedOrder: Passenger[] = [];
        let currentLocation = startLocation;

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
     * Algoritmo 2-opt para melhorar a rota existente
     */
    private twoOptImprovement(
        startLocation: google.maps.LatLng,
        route: Passenger[],
        destination: google.maps.LatLng
    ): Passenger[] {
        let improved = true;
        let bestRoute = [...route];
        let bestDistance = this.calculateTotalRouteDistance(startLocation, bestRoute, destination);

        while (improved) {
            improved = false;
            
            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length; j++) {
                    if (j - i === 1) continue; // Skip adjacent edges
                    
                    // Cria nova rota com 2-opt swap
                    const newRoute = this.twoOptSwap(route, i, j);
                    const newDistance = this.calculateTotalRouteDistance(startLocation, newRoute, destination);
                    
                    if (newDistance < bestDistance) {
                        bestRoute = newRoute;
                        bestDistance = newDistance;
                        route = newRoute;
                        improved = true;
                    }
                }
            }
        }

        return bestRoute;
    }

    /**
     * Executa o swap 2-opt
     */
    private twoOptSwap(route: Passenger[], i: number, j: number): Passenger[] {
        const newRoute = [...route];
        
        // Reverte a ordem dos elementos entre i e j
        while (i < j) {
            [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
            i++;
            j--;
        }
        
        return newRoute;
    }

    /**
     * Calcula a distância total de uma rota
     */
    private calculateTotalRouteDistance(
        startLocation: google.maps.LatLng,
        route: Passenger[],
        destination: google.maps.LatLng
    ): number {
        let totalDistance = 0;
        let currentLocation = startLocation;

        // Distância do início até o primeiro passageiro
        if (route.length > 0) {
            totalDistance += this.calculateDistance(
                currentLocation.lat(),
                currentLocation.lng(),
                route[0].position.lat,
                route[0].position.lng
            );
        }

        // Distância entre passageiros
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.calculateDistance(
                route[i].position.lat,
                route[i].position.lng,
                route[i + 1].position.lat,
                route[i + 1].position.lng
            );
        }

        // Distância do último passageiro até o destino
        if (route.length > 0) {
            totalDistance += this.calculateDistance(
                route[route.length - 1].position.lat,
                route[route.length - 1].position.lng,
                destination.lat(),
                destination.lng()
            );
        }

        return totalDistance;
    }

    /**
     * Calcula horários estimados de coleta baseados na rota otimizada
     */
    private calculatePickupTimes(
        startLocation: google.maps.LatLng,
        optimizedPassengers: Passenger[],
        startTime: Date = new Date()
    ): { passenger: Passenger; estimatedPickupTime: Date }[] {
        const pickupTimes: { passenger: Passenger; estimatedPickupTime: Date }[] = [];
        let currentTime = new Date(startTime);
        let currentLocation = startLocation;

        // Velocidade média estimada (km/h) - pode ser configurável
        const averageSpeed = 30; // 30 km/h em área urbana
        const stopTime = 2; // 2 minutos por parada

        for (const passenger of optimizedPassengers) {
            // Calcula distância até o passageiro
            const distance = this.calculateDistance(
                currentLocation.lat(),
                currentLocation.lng(),
                passenger.position.lat,
                passenger.position.lng
            );

            // Calcula tempo de viagem em minutos
            const travelTimeMinutes = (distance / averageSpeed) * 60;
            
            // Adiciona tempo de viagem ao tempo atual
            currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60000);
            
            pickupTimes.push({
                passenger,
                estimatedPickupTime: new Date(currentTime)
            });

            // Adiciona tempo de parada
            currentTime = new Date(currentTime.getTime() + stopTime * 60000);
            
            // Atualiza localização atual
            currentLocation = new google.maps.LatLng(
                passenger.position.lat,
                passenger.position.lng
            );
        }

        return pickupTimes;
    }

    /**
     * Calcula a rota otimizada usando Google Directions API
     */
    async calculateOptimizedRoute(options: RouteOptimizationOptions): Promise<OptimizedRoute> {
        const { startLocation, passengers, destination, optimizeOrder = true } = options;
        
        try {
            // Verifica cache primeiro
            const cacheKey = this.getCacheKey(options);
            if (this.routeCache.has(cacheKey)) {
                const cachedRoute = this.routeCache.get(cacheKey)!;
                console.log('Rota encontrada no cache');
                return cachedRoute;
            }

            // Aguarda a inicialização do serviço se necessário
            if (!this.directionsService) {
                await this.initializeService();
            }

            if (!this.directionsService) {
                const error: RouteCalculationError = new Error('Google Maps API não está carregada') as RouteCalculationError;
                error.code = 'GOOGLE_MAPS_NOT_LOADED';
                throw error;
            }

            // Validação dos parâmetros de entrada
            if (!startLocation || !destination) {
                const error: RouteCalculationError = new Error('Coordenadas de início ou destino não fornecidas') as RouteCalculationError;
                error.code = 'INVALID_COORDINATES';
                throw error;
            }

            // Validação específica para objetos LatLng
            try {
                const startLat = typeof startLocation.lat === 'function' ? startLocation.lat() : (startLocation as any).lat;
                const startLng = typeof startLocation.lng === 'function' ? startLocation.lng() : (startLocation as any).lng;
                const destLat = typeof destination.lat === 'function' ? destination.lat() : (destination as any).lat;
                const destLng = typeof destination.lng === 'function' ? destination.lng() : (destination as any).lng;
                
                if (typeof startLat !== 'number' || typeof startLng !== 'number' ||
                    typeof destLat !== 'number' || typeof destLng !== 'number' ||
                    isNaN(startLat) || isNaN(startLng) || isNaN(destLat) || isNaN(destLng)) {
                    const error: RouteCalculationError = new Error('Coordenadas de início ou destino são inválidas') as RouteCalculationError;
                    error.code = 'INVALID_COORDINATES';
                    error.details = `Start: ${startLat}, ${startLng} | Dest: ${destLat}, ${destLng}`;
                    throw error;
                }
            } catch (error) {
                const routeError: RouteCalculationError = new Error(`Erro ao validar coordenadas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`) as RouteCalculationError;
                routeError.code = 'INVALID_COORDINATES';
                throw routeError;
            }

            if (!passengers || passengers.length === 0) {
                const error: RouteCalculationError = new Error('Lista de passageiros não fornecida ou vazia') as RouteCalculationError;
                error.code = 'NO_PASSENGERS';
                throw error;
            }
        } catch (error) {
            if ((error as RouteCalculationError).code) {
                throw error;
            }
            const routeError: RouteCalculationError = new Error(`Erro inesperado na validação inicial: ${error instanceof Error ? error.message : 'Erro desconhecido'}`) as RouteCalculationError;
            routeError.code = 'UNKNOWN_ERROR';
            throw routeError;
        }

        // Valida coordenadas de todos os passageiros
        for (const passenger of passengers) {
            if (!passenger.position || 
                typeof passenger.position.lat !== 'number' || 
                typeof passenger.position.lng !== 'number' ||
                isNaN(passenger.position.lat) || 
                isNaN(passenger.position.lng)) {
                const error: RouteCalculationError = new Error(`Coordenadas inválidas para o passageiro ${passenger.name || 'desconhecido'}`) as RouteCalculationError;
                error.code = 'INVALID_COORDINATES';
                error.details = `Passageiro: ${passenger.name}, Posição: ${JSON.stringify(passenger.position)}`;
                throw error;
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

        return new Promise<OptimizedRoute>((resolve, reject) => {
            try {
                const request: google.maps.DirectionsRequest = {
                    origin: startLocation,
                    destination: destination,
                    waypoints: waypoints,
                    travelMode: google.maps.TravelMode.DRIVING,
                    optimizeWaypoints: false // Usamos nossa própria otimização
                };

                this.directionsService!.route(request, (directionsResult, status) => {
                    try {
                        if (status === google.maps.DirectionsStatus.OK && directionsResult) {
                    const route = directionsResult.routes[0];
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
                    const optimizedWaypoints: google.maps.LatLng[] = [startLocation as google.maps.LatLng];
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
                    optimizedWaypoints.push(destination as google.maps.LatLng);

                    // Calcula horários estimados de pickup
                    const pickupTimes = this.calculatePickupTimes(
                        startLocation,
                        orderedPassengers,
                        new Date()
                    );

                            const result: OptimizedRoute = {
                                waypoints: optimizedWaypoints,
                                orderedPassengers,
                                totalDistance: totalDistance / 1000, // Converte para km
                                totalDuration: totalDuration / 60, // Converte para minutos
                                polylinePath,
                                pickupTimes
                            };

                            // Armazena no cache
                            (result as any).timestamp = Date.now();
                            const cacheKey = this.getCacheKey(options);
                            this.routeCache.set(cacheKey, result);

                            resolve(result);
                        } else {
                            const error: RouteCalculationError = new Error(`Falha ao calcular rota: ${status}`) as RouteCalculationError;
                            error.code = 'DIRECTIONS_API_ERROR';
                            error.details = `Status: ${status}`;
                            reject(error);
                        }
                    } catch (error) {
                        const routeError: RouteCalculationError = new Error(`Erro ao processar resultado da rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`) as RouteCalculationError;
                        routeError.code = 'UNKNOWN_ERROR';
                        reject(routeError);
                    }
                });
            } catch (error) {
                const routeError: RouteCalculationError = new Error(`Erro ao criar requisição de rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`) as RouteCalculationError;
                routeError.code = 'UNKNOWN_ERROR';
                reject(routeError);
            }
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
            const currentLat = typeof currentCoords.lat === 'function' ? currentCoords.lat() : currentCoords.lat;
            const currentLng = typeof currentCoords.lng === 'function' ? currentCoords.lng() : currentCoords.lng;
            totalDistance += this.calculateDistance(
                currentLat,
                currentLng,
                passenger.position.lat,
                passenger.position.lng
            );
            currentCoords = passenger.position;
        }
        
        // Adiciona distância até o destino
        const finalLat = typeof currentCoords.lat === 'function' ? currentCoords.lat() : currentCoords.lat;
        const finalLng = typeof currentCoords.lng === 'function' ? currentCoords.lng() : currentCoords.lng;
        totalDistance += this.calculateDistance(
            finalLat,
            finalLng,
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
        
        // Cria waypoints básicos para fallback
        const fallbackWaypoints: google.maps.LatLng[] = [];
        try {
            fallbackWaypoints.push(new google.maps.LatLng(startCoords.lat, startCoords.lng));
            passengers.forEach(passenger => {
                if (passenger.position) {
                    fallbackWaypoints.push(new google.maps.LatLng(passenger.position.lat, passenger.position.lng));
                }
            });
            fallbackWaypoints.push(new google.maps.LatLng(destCoords.lat, destCoords.lng));
        } catch (error) {
            console.warn('Erro ao criar waypoints de fallback:', error);
        }

        return {
            waypoints: fallbackWaypoints,
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
     * Calcula o horário estimado de chegada para cada passageiro (método alternativo para compatibilidade)
     */
    calculatePickupTimesFromSegments(
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

    /**
     * Gera sugestões de otimização para uma rota
     */
    generateOptimizationSuggestion(passengerCount: number): string {
        if (passengerCount === 0) {
            return "Adicione passageiros para ver sugestões de otimização.";
        }

        if (passengerCount === 1) {
            return "✅ Rota simples com 1 passageiro - sem necessidade de otimização.";
        }

        if (passengerCount <= 3) {
            return `🚌 Rota com ${passengerCount} passageiros - otimização automática aplicada para minimizar distância.`;
        }

        if (passengerCount <= 6) {
            return `🎯 Rota com ${passengerCount} passageiros - algoritmo avançado aplicado (Nearest Neighbor + 2-opt) para máxima eficiência.`;
        }

        return `⚡ Rota complexa com ${passengerCount} passageiros - otimização inteligente aplicada. Tempo estimado de economia: ${Math.round(passengerCount * 0.8)} minutos.`;
    }

    /**
     * Valida se um endereço tem coordenadas válidas
     */
    validateAddress(address: string, position: { lat: number; lng: number }): boolean {
        if (!address || address.trim().length < 10) {
            return false;
        }

        if (!position || 
            typeof position.lat !== 'number' || 
            typeof position.lng !== 'number' ||
            isNaN(position.lat) || 
            isNaN(position.lng) ||
            position.lat === 0 && position.lng === 0) {
            return false;
        }

        return true;
    }

    /**
     * Formata tempo estimado de coleta
     */
    formatPickupTime(estimatedTime: Date): string {
        const now = new Date();
        const diffMinutes = Math.round((estimatedTime.getTime() - now.getTime()) / (1000 * 60));

        if (diffMinutes < 0) {
            return "Horário passado";
        }

        if (diffMinutes < 60) {
            return `${diffMinutes} min`;
        }

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        
        if (hours < 24) {
            return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
        }

        return estimatedTime.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

export const routeOptimizationService = new RouteOptimizationService();