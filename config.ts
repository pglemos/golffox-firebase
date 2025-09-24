// Configurações da aplicação
export const config = {
  // Google Maps API Key - substitua pela sua chave válida
  googleMaps: {
    apiKey: 'AIzaSyC_SuBA3nwPYmhUC7OtiTYYl4iU8K674h8', // Esta é uma chave de exemplo - substitua pela sua
    libraries: ['marker', 'directions', 'geometry'] as const,
  },
  
  // Gemini AI API Key - carregada do arquivo .env.local
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'PLACEHOLDER_API_KEY',
  },
  
  // URLs e endpoints
  urls: {
    googleMapsApi: 'https://maps.googleapis.com/maps/api/js',
    markerClusterer: 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js',
  },
  
  // Configurações do mapa
  map: {
    defaultCenter: { lat: -23.5505, lng: -46.6333 }, // São Paulo
    defaultZoom: 12,
    styles: {
      height: '100%',
      width: '100%',
    },
  },
};

// Função para verificar se as APIs estão configuradas corretamente
export const checkApiConfiguration = () => {
  const issues: string[] = [];
  
  if (!config.googleMaps.apiKey || config.googleMaps.apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    issues.push('Google Maps API Key não configurada');
  }
  
  if (!config.gemini.apiKey || config.gemini.apiKey === 'PLACEHOLDER_API_KEY') {
    issues.push('Gemini API Key não configurada');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
};

export default config;