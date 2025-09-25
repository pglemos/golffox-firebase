import { BusStatus } from '../components/BusIcon3D';

export interface DriverLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  lastMovementTime?: Date;
}

export interface DriverStatusInfo {
  status: BusStatus;
  stoppedDuration?: number; // em minutos
  isMoving: boolean;
}

/**
 * Determina o status do motorista baseado na localização e tempo
 */
export function getDriverStatus(
  currentLocation: DriverLocation,
  previousLocation?: DriverLocation
): DriverStatusInfo {
  const now = new Date();
  const currentTime = currentLocation.timestamp || now;
  
  // Se temos informação de velocidade, use ela
  if (currentLocation.speed !== undefined) {
    const isMoving = currentLocation.speed > 0.5; // 0.5 km/h como threshold
    
    if (isMoving) {
      return {
        status: 'moving',
        isMoving: true,
        stoppedDuration: 0
      };
    }
  }
  
  // Se não temos velocidade, compare posições
  let isMoving = false;
  if (previousLocation) {
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      previousLocation.latitude,
      previousLocation.longitude
    );
    
    // Se moveu mais de 10 metros, considera em movimento
    isMoving = distance > 0.01; // aproximadamente 10 metros
  }
  
  if (isMoving) {
    return {
      status: 'moving',
      isMoving: true,
      stoppedDuration: 0
    };
  }
  
  // Calcular tempo parado
  const lastMovementTime = currentLocation.lastMovementTime || currentTime;
  const stoppedDurationMs = now.getTime() - lastMovementTime.getTime();
  const stoppedDurationMinutes = stoppedDurationMs / (1000 * 60);
  
  // Determinar status baseado no tempo parado
  let status: BusStatus;
  if (stoppedDurationMinutes > 0) {
    status = 'stopped'; // Amarelo - parado
  } else {
    status = 'moving'; // Verde - em movimento
  }
  
  return {
    status,
    isMoving: false,
    stoppedDuration: stoppedDurationMinutes
  };
}

/**
 * Calcula a distância entre duas coordenadas em graus
 * (aproximação simples para distâncias pequenas)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Atualiza o histórico de localizações do motorista
 */
export function updateDriverLocationHistory(
  driverId: string,
  newLocation: DriverLocation,
  locationHistory: Map<string, DriverLocation[]>
): DriverLocation[] {
  const history = locationHistory.get(driverId) || [];
  const updatedHistory = [...history, newLocation];
  
  // Manter apenas as últimas 10 localizações
  if (updatedHistory.length > 10) {
    updatedHistory.shift();
  }
  
  locationHistory.set(driverId, updatedHistory);
  return updatedHistory;
}

/**
 * Obtém a cor do status para uso em outros componentes
 */
export function getStatusColor(status: BusStatus): string {
  switch (status) {
    case 'moving':
      return '#22C55E'; // Verde
    case 'stopped':
      return '#F59E0B'; // Amarelo
    case 'problem':
      return '#EF4444'; // Vermelho
    case 'garage':
      return '#3B82F6'; // Azul
    default:
      return '#6B7280'; // Cinza
  }
}

/**
 * Obtém a descrição do status em português
 */
export function getStatusDescription(status: BusStatus): string {
  switch (status) {
    case 'moving':
      return 'Em Movimento';
    case 'stopped':
      return 'Parado';
    case 'problem':
      return 'Com Problema';
    case 'garage':
      return 'Garagem';
    default:
      return 'Status desconhecido';
  }
}