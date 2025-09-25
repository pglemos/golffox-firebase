import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X, CheckCircle } from 'lucide-react';
import type { Alert } from '../types';
import { AlertType } from '../types';

export interface ToastNotification extends Alert {
    isVisible: boolean;
    autoHide?: boolean;
    duration?: number;
}

interface NotificationToastProps {
    notification: ToastNotification;
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onDismiss,
    position = 'top-right'
}) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (notification.autoHide !== false) {
            const duration = notification.duration || 5000;
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300); // Tempo da animação de saída
    };

    const getIcon = () => {
        switch (notification.type) {
            case AlertType.Critical:
                return <AlertTriangle className="w-5 h-5" />;
            case AlertType.Warning:
                return <AlertTriangle className="w-5 h-5" />;
            case AlertType.Info:
                return <Info className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = () => {
        const baseStyles = "shadow-lg border rounded-lg p-4 max-w-sm w-full";
        
        switch (notification.type) {
            case AlertType.Critical:
                return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
            case AlertType.Warning:
                return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
            case AlertType.Info:
                return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
            default:
                return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
        }
    };

    const getPositionStyles = () => {
        switch (position) {
            case 'top-right':
                return 'top-4 right-4';
            case 'top-left':
                return 'top-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            default:
                return 'top-4 right-4';
        }
    };

    const getAnimationStyles = () => {
        if (isExiting) {
            return 'animate-slide-out-right opacity-0 transform translate-x-full';
        }
        return 'animate-slide-in-right';
    };

    if (!notification.isVisible) return null;

    return (
        <div
            className={`fixed z-50 ${getPositionStyles()} ${getAnimationStyles()}`}
            style={{ animationDuration: '300ms' }}
        >
            <div className={getStyles()}>
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <p className="mt-1 text-xs opacity-90 line-clamp-2">
                            {notification.message}
                        </p>
                        <p className="mt-2 text-xs opacity-75">
                            {new Date(notification.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                        title="Fechar notificação"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Container para múltiplas notificações
interface NotificationContainerProps {
    notifications: ToastNotification[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxNotifications?: number;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    onDismiss,
    position = 'top-right',
    maxNotifications = 5
}) => {
    // Limita o número de notificações visíveis
    const visibleNotifications = notifications
        .filter(n => n.isVisible)
        .slice(0, maxNotifications);

    const getContainerStyles = () => {
        switch (position) {
            case 'top-right':
                return 'top-4 right-4 flex flex-col space-y-2';
            case 'top-left':
                return 'top-4 left-4 flex flex-col space-y-2';
            case 'bottom-right':
                return 'bottom-4 right-4 flex flex-col-reverse space-y-reverse space-y-2';
            case 'bottom-left':
                return 'bottom-4 left-4 flex flex-col-reverse space-y-reverse space-y-2';
            default:
                return 'top-4 right-4 flex flex-col space-y-2';
        }
    };

    if (visibleNotifications.length === 0) return null;

    return (
        <div className={`fixed z-50 ${getContainerStyles()}`}>
            {visibleNotifications.map((notification, index) => (
                <div
                    key={notification.id}
                    style={{
                        animationDelay: `${index * 100}ms`
                    }}
                >
                    <NotificationToast
                        notification={notification}
                        onDismiss={onDismiss}
                        position={position}
                    />
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;