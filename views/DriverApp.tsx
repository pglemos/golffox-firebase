import React, { useState, useEffect } from 'react';
import LoginScreen from '../components/driver/LoginScreen';
import Checklist from '../components/driver/Checklist';
import DriverRouteView from '../components/driver/DriverRouteView';
import NavigationScreen from '../components/driver/NavigationScreen';

const DriverApp: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checklistComplete, setChecklistComplete] = useState(false);
    const [routeStarted, setRouteStarted] = useState(false);

    // Garantir estado consistente ao carregar a página
    useEffect(() => {
        // Limpar estados anteriores para garantir consistência
        const resetAppState = () => {
            setIsLoggedIn(false);
            setChecklistComplete(false);
            setRouteStarted(false);
            // Limpar dados de sessão relacionados ao estado da aplicação
            sessionStorage.removeItem('driverAppState');
        };

        // Reset apenas se necessário (primeira carga ou navegação direta)
        if (!sessionStorage.getItem('driverAppInitialized')) {
            resetAppState();
            sessionStorage.setItem('driverAppInitialized', 'true');
        }
    }, []);

    useEffect(() => {
        const getDriverLocation = async () => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser.');
                return;
            }

            try {
                // Check if geolocation permission is granted
                if ('permissions' in navigator) {
                    const permission = await navigator.permissions.query({ name: 'geolocation' });
                    if (permission.state === 'denied') {
                        console.warn('Geolocation permission denied. Driver location tracking disabled.');
                        return;
                    }
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Driver location obtained:', position.coords.latitude, position.coords.longitude);
                        // Store location for future use
                        sessionStorage.setItem('driverLocation', JSON.stringify({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            timestamp: Date.now()
                        }));
                    },
                    (error) => {
                        let errorMessage = 'Unknown geolocation error';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage = 'Location access denied by user. Please enable location services.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage = 'Location information unavailable. Please check your GPS settings.';
                                break;
                            case error.TIMEOUT:
                                errorMessage = 'Location request timed out. Please try again.';
                                break;
                        }
                        console.warn('Driver location error:', errorMessage);
                        // Don't show error to user unless critical
                    },
                    {
                        enableHighAccuracy: false, // Use less battery
                        timeout: 15000, // Increased timeout
                        maximumAge: 300000 // Accept 5-minute old location
                    }
                );
            } catch (error) {
                console.warn('Error checking geolocation permissions:', error);
            }
        };

        getDriverLocation();
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleChecklistComplete = () => {
        setChecklistComplete(true);
    }

    const handleEndRoute = () => {
        setRouteStarted(false);
        setChecklistComplete(false); // Go back to checklist for next route
    }

    const renderContent = () => {
        if (!isLoggedIn) {
            return <LoginScreen onLogin={handleLogin} />;
        }
        if (!checklistComplete) {
            return <Checklist onComplete={handleChecklistComplete} />;
        }
        if (!routeStarted) {
            return <DriverRouteView onStartNavigation={() => setRouteStarted(true)} />;
        }
        return <NavigationScreen onEndRoute={handleEndRoute} />;
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            {/* Container principal com design responsivo */}
            <div className="w-full h-screen flex items-center justify-center p-2 sm:p-4 lg:p-6">
                {/* Mobile-first container */}
                <div className="w-full max-w-sm mx-auto h-full bg-white rounded-none sm:rounded-2xl lg:rounded-3xl shadow-none sm:shadow-2xl sm:max-h-[800px] lg:max-h-[900px] flex flex-col relative overflow-hidden">
                    {/* Status bar para mobile */}
                    <div className="h-safe-top bg-primary-600 sm:hidden"></div>
                    
                    {/* Conteúdo principal */}
                    <div className="flex-1 flex flex-col">
                        {renderContent()}
                    </div>
                    
                    {/* Bottom safe area para mobile */}
                    <div className="h-safe-bottom bg-white sm:hidden"></div>
                </div>
            </div>
            
            {/* Tablet e Desktop: Informações adicionais na lateral */}
            <div className="hidden lg:block fixed top-4 right-4 bg-white rounded-xl shadow-lg p-4 max-w-xs">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Status do Sistema</h3>
                <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                        <span>Conexão:</span>
                        <span className="text-green-600 font-medium">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>GPS:</span>
                        <span className="text-green-600 font-medium">Ativo</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Versão:</span>
                        <span className="text-gray-500">v2.1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverApp;