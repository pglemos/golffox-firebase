import React, { useEffect, useState } from 'react';
import PassengerHome from '../components/passenger/PassengerHome';
import PassengerLoginScreen from '../components/passenger/PassengerLoginScreen';
import type { Employee } from '../types';

interface PassengerAppProps {
    employees: Employee[];
}

const PassengerApp: React.FC<PassengerAppProps> = ({ employees }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    useEffect(() => {
        const getPassengerLocation = async () => {
            if (!isLoggedIn) return;

            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser.');
                return;
            }

            try {
                // Check if geolocation permission is granted
                if ('permissions' in navigator) {
                    const permission = await navigator.permissions.query({ name: 'geolocation' });
                    if (permission.state === 'denied') {
                        console.warn('Geolocation permission denied. Passenger location tracking disabled.');
                        return;
                    }
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Passenger location obtained:', position.coords.latitude, position.coords.longitude);
                        // Store location for future use
                        sessionStorage.setItem('passengerLocation', JSON.stringify({
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
                        console.warn('Passenger location error:', errorMessage);
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

        getPassengerLocation();
    }, [isLoggedIn]);

    const handleLoginSuccess = (user: Employee) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    const renderContent = () => {
        if (!isLoggedIn || !currentUser) {
            return <PassengerLoginScreen employees={employees} onLoginSuccess={handleLoginSuccess} />;
        }
        return <PassengerHome user={currentUser} />;
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-golffox-gray-light p-4">
            <div className="w-full max-w-sm h-full max-h-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {renderContent()}
            </div>
        </div>
    );
};

export default PassengerApp;
