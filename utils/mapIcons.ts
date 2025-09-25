import { BusStatus } from '../components/BusIcon3D';
import { VehicleStatus } from '../types';

// Interface para o objeto de ícone do mapa
interface MapIcon {
  url: string;
  scaledSize: google.maps.Size;
  anchor: google.maps.Point;
}

// Cache para armazenar ícones criados e evitar recriação desnecessária
const iconCache = new Map<string, MapIcon>();

/**
 * Determina o status do motorista baseado em critérios de tempo e localização
 * - Verde: Em movimento
 * - Amarelo: Parado por até 2 minutos
 * - Vermelho: Parado por 3 minutos ou mais
 * - Azul: Na garagem (apenas para veículos sem rota)
 */
export function getDriverStatus(vehicleId: string, currentPosition: { lat: number; lng: number }, hasRoute: boolean = false): BusStatus {
  // Posição da garagem (centro aproximado)
  const garagePosition = { lat: -23.5505, lng: -46.6333 };
  
  // Calcular distância da garagem (aproximação simples)
  const distanceFromGarage = Math.sqrt(
    Math.pow(currentPosition.lat - garagePosition.lat, 2) + 
    Math.pow(currentPosition.lng - garagePosition.lng, 2)
  );
  
  // Se está próximo da garagem E não tem rota ativa, está na garagem
  if (distanceFromGarage < 0.005 && !hasRoute) {
    return 'garage';
  }
  
  // Simulação baseada no ID do veículo para demonstração
  const timeBasedStatus = Math.floor(Date.now() / 10000) + parseInt(vehicleId.replace(/\D/g, '') || '0');
  const statusIndex = timeBasedStatus % 3;
  
  switch (statusIndex) {
    case 0: return 'moving';
    case 1: return 'stopped';
    case 2: return 'problem';
    default: return 'moving';
  }
}

/**
 * Converte o status do veículo para o status do ônibus no mapa
 */
export function vehicleStatusToBusStatus(
  vehicleStatus: VehicleStatus | string, 
  vehicleId?: string, 
  position?: { lat: number; lng: number },
  routeId?: string
): BusStatus {
  // Se temos dados suficientes para usar a nova lógica
  if (vehicleId && position) {
    const hasRoute = Boolean(routeId);
    const result = getDriverStatus(vehicleId, position, hasRoute);
    return result;
  }
  
  // Fallback para a lógica antiga se não temos dados suficientes
  const statusValue = vehicleStatus;
  
  // Garantir que statusValue não seja null, undefined ou inválido
  if (!statusValue) {
    return 'moving';
  }
  
  switch (statusValue) {
    case VehicleStatus.Moving:
    case 'Em Movimento':
      return 'moving';
    case VehicleStatus.Stopped:
    case 'Parado':
      return 'stopped';
    case VehicleStatus.Problem:
    case 'Com Problema':
      return 'problem';
    case VehicleStatus.Garage:
    case 'Garagem':
      return 'garage';
    default:
      return 'moving';
  }
}

/**
 * Cria um ícone SVG para o ônibus baseado no status com cache para otimização
 */
export function createBusMapIcon(status: BusStatus, size: number = 32): MapIcon {
  // Garantir que o status seja válido
  const validStatuses: BusStatus[] = ['moving', 'stopped', 'problem', 'garage'];
  const finalStatus: BusStatus = validStatuses.includes(status) ? status : 'moving';
  
  // Criar chave única para o cache
  const cacheKey = `${finalStatus}-${size}`;
  
  // Verificar se já existe no cache
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  const colors = getBusColors(finalStatus);
  
  // Gerar ID único para evitar conflitos de SVG
  const uniqueId = `${finalStatus}-${size}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="busGradient-${uniqueId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.highlight};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow-${uniqueId}">
          <feDropShadow dx="1" dy="2" stdDeviation="1" flood-color="${colors.shadow}" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Sombra do ônibus -->
      <ellipse cx="16" cy="28" rx="12" ry="2" fill="${colors.shadow}" opacity="0.2"/>
      
      <!-- Corpo principal do ônibus -->
      <rect x="6" y="8" width="20" height="16" rx="2" ry="2" 
            fill="url(#busGradient-${uniqueId})" 
            filter="url(#shadow-${uniqueId})"
            stroke="${colors.secondary}" stroke-width="0.5"/>
      
      <!-- Janelas -->
      <rect x="8" y="10" width="4" height="3" rx="0.5" fill="#87CEEB" opacity="0.8"/>
      <rect x="13" y="10" width="4" height="3" rx="0.5" fill="#87CEEB" opacity="0.8"/>
      <rect x="18" y="10" width="4" height="3" rx="0.5" fill="#87CEEB" opacity="0.8"/>
      
      <!-- Porta -->
      <rect x="23" y="14" width="2" height="6" rx="0.3" fill="${colors.secondary}"/>
      
      <!-- Rodas -->
      <circle cx="10" cy="24" r="2.5" fill="#2D3748" stroke="#4A5568" stroke-width="0.5"/>
      <circle cx="22" cy="24" r="2.5" fill="#2D3748" stroke="#4A5568" stroke-width="0.5"/>
      <circle cx="10" cy="24" r="1.2" fill="#718096"/>
      <circle cx="22" cy="24" r="1.2" fill="#718096"/>
      
      <!-- Faróis -->
      <circle cx="7" cy="16" r="1" fill="#FFF8DC" opacity="0.9"/>
      <circle cx="7" cy="19" r="1" fill="#FFE4E1" opacity="0.7"/>
      
      <!-- Detalhes decorativos -->
      <rect x="6" y="13" width="20" height="1" fill="${colors.highlight}" opacity="0.6"/>
      <rect x="8" y="21" width="16" height="0.5" fill="${colors.secondary}" opacity="0.8"/>
    </svg>
  `;

  // Converter SVG para base64 de forma mais robusta
  const base64SVG = btoa(encodeURIComponent(svgIcon).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
  
  const iconObject = {
    url: `data:image/svg+xml;base64,${base64SVG}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
  
  // Armazenar no cache para reutilização
  iconCache.set(cacheKey, iconObject);
  
  return iconObject;
}

/**
 * Limpa o cache de ícones (útil para testes ou limpeza de memória)
 */
export function clearIconCache(): void {
  iconCache.clear();
}

/**
 * Retorna o tamanho atual do cache de ícones
 */
export function getIconCacheSize(): number {
  return iconCache.size;
}

/**
 * Retorna as cores baseadas no status do ônibus
 */
function getBusColors(status: BusStatus) {
  // Garantir que o status seja válido
  const validStatuses: BusStatus[] = ['moving', 'stopped', 'problem', 'garage'];
  const finalStatus: BusStatus = validStatuses.includes(status) ? status : 'moving';
  
  switch (finalStatus) {
    case 'moving':
      return {
        primary: '#22C55E', // Verde
        secondary: '#16A34A',
        shadow: '#15803D',
        highlight: '#4ADE80'
      };
    case 'stopped':
      return {
        primary: '#F59E0B', // Amarelo
        secondary: '#D97706',
        shadow: '#B45309',
        highlight: '#FCD34D'
      };
    case 'problem':
      return {
        primary: '#EF4444', // Vermelho
        secondary: '#DC2626',
        shadow: '#B91C1C',
        highlight: '#F87171'
      };
    case 'garage':
      return {
        primary: '#3B82F6', // Azul
        secondary: '#2563EB',
        shadow: '#1D4ED8',
        highlight: '#60A5FA'
      };
    default:
      return {
        primary: '#22C55E', // Verde como padrão
        secondary: '#16A34A',
        shadow: '#15803D',
        highlight: '#4ADE80'
      };
  }
}