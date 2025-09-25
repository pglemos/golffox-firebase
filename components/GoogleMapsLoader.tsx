import React, { useEffect } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../config';

declare global {
  interface Window {
    google: any;
    googleMapsApiLoaded: boolean | 'error' | 'loading';
    markerClustererApiLoaded: boolean;
    gm_authFailure?: () => void;
    initMap?: () => void;
  }
}

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

const GoogleMapsLoader: React.FC<GoogleMapsLoaderProps> = ({ children }) => {
  useEffect(() => {
    // Se não há chave da API, não tenta carregar
    if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey.trim() === '') {
      window.googleMapsApiLoaded = 'error';
      return;
    }

    // Verificar se já existe um script do Google Maps carregado
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript || window.googleMapsApiLoaded === true || window.google?.maps) {
      window.googleMapsApiLoaded = true;
      return;
    }

    // Se está em processo de carregamento, aguardar
    if (window.googleMapsApiLoaded === 'loading') {
      return;
    }

    // Marcar como carregando
    window.googleMapsApiLoaded = 'loading';

    // Configurar handler de erro de autenticação
    window.gm_authFailure = () => {
      console.error("Google Maps API authentication failed. Check your API key and ensure it has the correct permissions.");
      console.error("Required APIs: Maps JavaScript API, Places API, Geometry API");
      console.error("Optional APIs for full functionality: Directions API (for route calculation)");
      console.error("Make sure your domain is authorized for this API key.");
      window.googleMapsApiLoaded = 'error';
    };

    // Definir a função initMap globalmente antes de carregar o script
    if (!window.initMap) {
      window.initMap = () => {
        window.googleMapsApiLoaded = true;
        console.log('Google Maps API loaded successfully');
      };
    }

    // Carregar o script do Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${GOOGLE_MAPS_CONFIG.libraries.join(',')}&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      window.googleMapsApiLoaded = 'error';
    };

    document.head.appendChild(script);

    // Carregar MarkerClusterer apenas se não estiver carregado
    const existingMarkerScript = document.querySelector('script[src*="markerclusterer"]');
    if (!existingMarkerScript && !window.markerClustererApiLoaded) {
      const markerClustererScript = document.createElement('script');
      markerClustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
      markerClustererScript.id = 'marker-clusterer-script';
      markerClustererScript.onload = () => {
        window.markerClustererApiLoaded = true;
        console.log('MarkerClusterer loaded successfully');
      };
      markerClustererScript.onerror = () => {
        console.error('Failed to load MarkerClusterer script');
      };
      document.head.appendChild(markerClustererScript);
    }

    // Função de limpeza
    return () => {
      // Limpar handlers globais apenas se o Maps já foi carregado
      if (window.googleMapsApiLoaded === true) {
        if (window.gm_authFailure) {
          window.gm_authFailure = undefined;
        }
        if (window.initMap) {
          window.initMap = undefined;
        }
      }
    };
  }, []);

  return <>{children}</>;
};

export default GoogleMapsLoader;