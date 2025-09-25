/// <reference types="google.maps" />

declare global {
  interface Window {
    google: typeof google;
    googleMapsApiLoaded: boolean | 'loading' | 'error';
    markerClustererApiLoaded: boolean;
  }
}

export {};