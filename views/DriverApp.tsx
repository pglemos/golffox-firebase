import React, { useState, useEffect } from 'react';
import LoginScreen from '../components/driver/LoginScreen';
import Checklist from '../components/driver/Checklist';
import DriverRouteView from '../components/driver/DriverRouteView';
import NavigationScreen from '../components/driver/NavigationScreen';

const DriverApp: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [checklistComplete, setChecklistComplete] = useState(false);
    const [routeStarted, setRouteStarted] = useState(false);

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
        <div className="min-h-screen w-full flex items-center justify-center bg-golffox-gray-light p-2 sm:p-4">
            <div className="w-full max-w-sm min-h-screen sm:min-h-[600px] sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {renderContent()}
            </div>
        </div>
    );
};

export default DriverApp;