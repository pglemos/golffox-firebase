export const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry'] as const,
  defaultCenter: { lat: -23.5505, lng: -46.6333 }, // São Paulo
  defaultZoom: 12,
};

export const GEMINI_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'PLACEHOLDER_API_KEY',
};

export const API_URLS = {
  googleMapsApi: 'https://maps.googleapis.com/maps/api/js',
  markerClusterer: 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js',
};

export const MAP_STYLES = {
  height: '100%',
  width: '100%',
};

// Função para verificar se as APIs estão configuradas corretamente
export const checkApiConfiguration = () => {
  const issues: string[] = [];
  
  if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey.trim() === '') {
    issues.push('Google Maps API Key não configurada. Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no arquivo .env.local');
  }
  
  if (!GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'PLACEHOLDER_API_KEY') {
    issues.push('Gemini API Key não configurada. Configure NEXT_PUBLIC_GEMINI_API_KEY no arquivo .env.local');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};