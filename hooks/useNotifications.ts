import { useState, useEffect, useCallback } from 'react';
import type { Alert, Route, Vehicle } from '../types';
import { AlertType } from '../types';
import { notificationService, type NotificationSubscriber } from '../services/notificationService';

export interface UseNotificationsOptions {
    autoCheck?: boolean;
    checkInterval?: number;
    filters?: {
        types?: AlertType[];
        priority?: string[];
    };
}

export interface NotificationActions {
    addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => Alert;
    dismissAlert: (alertId: string) => void;
    checkRoutes: (routes: Route[]) => Alert[];
    checkVehicles: (vehicles: Vehicle[]) => Alert[];
    generateRouteIssueAlert: (routeId: string, issue: string, severity?: AlertType) => Alert;
    generatePassengerNotFoundAlert: (passengerName: string, routeName: string) => Alert;
    generateEmergencyAlert: (vehiclePlate: string, location: string, description: string) => Alert;
    clearOldAlerts: () => void;
}

export interface NotificationStats {
    total: number;
    critical: number;
    warning: number;
    info: number;
    last24h: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [stats, setStats] = useState<NotificationStats>({
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        last24h: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Atualiza alertas do serviço
    const updateAlerts = useCallback(() => {
        const currentAlerts = notificationService.getAlerts();
        const currentStats = notificationService.getAlertStats();
        
        setAlerts(currentAlerts);
        setStats(currentStats);
        setIsLoading(false);
    }, []);

    // Configura subscriber para receber novos alertas
    useEffect(() => {
        const subscriberId = `hook_${Date.now()}_${Math.random()}`;
        
        const subscriber: NotificationSubscriber = {
            id: subscriberId,
            callback: (alert: Alert) => {
                updateAlerts();
                
                // Notificação do navegador para alertas críticos
                if (alert.type === AlertType.Critical && 'Notification' in window) {
                    if (Notification.permission === 'granted') {
                        new Notification(alert.title, {
                            body: alert.message,
                            icon: '/favicon.ico',
                            tag: alert.id
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification(alert.title, {
                                    body: alert.message,
                                    icon: '/favicon.ico',
                                    tag: alert.id
                                });
                            }
                        });
                    }
                }
            },
            filters: options.filters
        };

        notificationService.subscribe(subscriber);
        
        // Carrega alertas iniciais
        updateAlerts();

        return () => {
            notificationService.unsubscribe(subscriberId);
        };
    }, [updateAlerts, options.filters]);

    // Auto-verificação periódica
    useEffect(() => {
        if (!options.autoCheck) return;

        const interval = setInterval(() => {
            notificationService.cleanupOldAlerts();
            updateAlerts();
        }, options.checkInterval || 60000); // Default: 1 minuto

        return () => clearInterval(interval);
    }, [options.autoCheck, options.checkInterval, updateAlerts]);

    // Ações disponíveis
    const actions: NotificationActions = {
        addAlert: (alert) => {
            const newAlert = notificationService.addAlert(alert);
            updateAlerts();
            return newAlert;
        },

        dismissAlert: (alertId) => {
            notificationService.dismissAlert(alertId);
            updateAlerts();
        },

        checkRoutes: (routes) => {
            const newAlerts = notificationService.checkRoutes(routes);
            updateAlerts();
            return newAlerts;
        },

        checkVehicles: (vehicles) => {
            const newAlerts = notificationService.checkVehicles(vehicles);
            updateAlerts();
            return newAlerts;
        },

        generateRouteIssueAlert: (routeId, issue, severity) => {
            const alert = notificationService.generateRouteIssueAlert(routeId, issue, severity);
            updateAlerts();
            return alert;
        },

        generatePassengerNotFoundAlert: (passengerName, routeName) => {
            const alert = notificationService.generatePassengerNotFoundAlert(passengerName, routeName);
            updateAlerts();
            return alert;
        },

        generateEmergencyAlert: (vehiclePlate, location, description) => {
            const alert = notificationService.generateEmergencyAlert(vehiclePlate, location, description);
            updateAlerts();
            return alert;
        },

        clearOldAlerts: () => {
            notificationService.cleanupOldAlerts();
            updateAlerts();
        }
    };

    // Filtros por tipo
    const alertsByType = {
        critical: alerts.filter(alert => alert.type === AlertType.Critical),
        warning: alerts.filter(alert => alert.type === AlertType.Warning),
        info: alerts.filter(alert => alert.type === AlertType.Info)
    };

    // Alertas recentes (últimas 24 horas)
    const recentAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return alertTime > oneDayAgo;
    });

    // Verifica se há alertas críticos não lidos
    const hasCriticalAlerts = alertsByType.critical.length > 0;
    const hasUnreadAlerts = alerts.length > 0;

    return {
        // Dados
        alerts,
        alertsByType,
        recentAlerts,
        stats,
        
        // Estados
        isLoading,
        hasCriticalAlerts,
        hasUnreadAlerts,
        
        // Ações
        ...actions,
        
        // Utilitários
        refresh: updateAlerts
    };
}

// Hook especializado para alertas críticos
export function useCriticalAlerts() {
    const { alertsByType, ...rest } = useNotifications({
        filters: { types: [AlertType.Critical] },
        autoCheck: true,
        checkInterval: 30000 // Verifica a cada 30 segundos
    });

    return {
        criticalAlerts: alertsByType.critical,
        hasCriticalAlerts: alertsByType.critical.length > 0,
        ...rest
    };
}

// Hook para estatísticas de alertas
export function useAlertStats() {
    const { stats, refresh } = useNotifications({ autoCheck: true });
    
    return {
        stats,
        refresh
    };
}