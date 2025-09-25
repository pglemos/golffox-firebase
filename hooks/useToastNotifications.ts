import { useState, useCallback, useEffect } from 'react';
import type { Alert } from '../types';
import { AlertType } from '../types';
import type { ToastNotification } from '../components/NotificationToast';
import { useNotifications } from './useNotifications';

export interface ToastOptions {
    autoHide?: boolean;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function useToastNotifications(options: ToastOptions = {}) {
    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const { alerts } = useNotifications();

    // Configurações padrão
    const defaultOptions = {
        autoHide: true,
        duration: 5000,
        position: 'top-right' as const,
        ...options
    };

    // Adiciona um toast
    const addToast = useCallback((alert: Alert, toastOptions?: Partial<ToastOptions>) => {
        const toast: ToastNotification = {
            ...alert,
            isVisible: true,
            autoHide: toastOptions?.autoHide ?? defaultOptions.autoHide,
            duration: toastOptions?.duration ?? defaultOptions.duration
        };

        setToasts(prev => [toast, ...prev]);
        return toast.id;
    }, [defaultOptions]);

    // Remove um toast
    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Remove todos os toasts
    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Adiciona toast para alertas críticos automaticamente
    useEffect(() => {
        const criticalAlerts = alerts.filter(alert => alert.type === AlertType.Critical);
        
        criticalAlerts.forEach(alert => {
            // Verifica se já existe um toast para este alerta
            const existingToast = toasts.find(toast => toast.id === alert.id);
            if (!existingToast) {
                addToast(alert, {
                    autoHide: false, // Alertas críticos não se escondem automaticamente
                    duration: 0
                });
            }
        });
    }, [alerts, toasts, addToast]);

    // Funções de conveniência para diferentes tipos de toast
    const showSuccess = useCallback((title: string, message: string, options?: Partial<ToastOptions>) => {
        const alert: Alert = {
            id: `success_${Date.now()}`,
            type: AlertType.Info,
            title,
            message,
            timestamp: new Date().toISOString()
        };
        return addToast(alert, { ...options, duration: options?.duration ?? 3000 });
    }, [addToast]);

    const showError = useCallback((title: string, message: string, options?: Partial<ToastOptions>) => {
        const alert: Alert = {
            id: `error_${Date.now()}`,
            type: AlertType.Critical,
            title,
            message,
            timestamp: new Date().toISOString()
        };
        return addToast(alert, { ...options, autoHide: false });
    }, [addToast]);

    const showWarning = useCallback((title: string, message: string, options?: Partial<ToastOptions>) => {
        const alert: Alert = {
            id: `warning_${Date.now()}`,
            type: AlertType.Warning,
            title,
            message,
            timestamp: new Date().toISOString()
        };
        return addToast(alert, options);
    }, [addToast]);

    const showInfo = useCallback((title: string, message: string, options?: Partial<ToastOptions>) => {
        const alert: Alert = {
            id: `info_${Date.now()}`,
            type: AlertType.Info,
            title,
            message,
            timestamp: new Date().toISOString()
        };
        return addToast(alert, options);
    }, [addToast]);

    // Função para mostrar notificação de rota otimizada
    const showRouteOptimized = useCallback((routeName: string, timeSaved: number) => {
        return showSuccess(
            'Rota Otimizada',
            `${routeName} foi otimizada com sucesso! Tempo economizado: ${timeSaved} minutos.`,
            { duration: 4000 }
        );
    }, [showSuccess]);

    // Função para mostrar notificação de passageiro coletado
    const showPassengerPickedUp = useCallback((passengerName: string, routeName: string) => {
        return showInfo(
            'Passageiro Coletado',
            `${passengerName} foi coletado com sucesso na ${routeName}.`,
            { duration: 3000 }
        );
    }, [showInfo]);

    // Função para mostrar notificação de atraso
    const showDelayAlert = useCallback((routeName: string, delay: number) => {
        return showWarning(
            'Atraso Detectado',
            `${routeName} está com atraso de ${delay} minutos.`,
            { duration: 6000 }
        );
    }, [showWarning]);

    // Função para mostrar notificação de emergência
    const showEmergencyAlert = useCallback((vehiclePlate: string, location: string) => {
        return showError(
            'EMERGÊNCIA',
            `Emergência reportada pelo veículo ${vehiclePlate} em ${location}.`,
            { autoHide: false }
        );
    }, [showError]);

    // Função para mostrar notificação de manutenção
    const showMaintenanceAlert = useCallback((vehiclePlate: string, daysUntil: number) => {
        const severity = daysUntil <= 1 ? 'error' : 'warning';
        const title = daysUntil <= 1 ? 'Manutenção Urgente' : 'Manutenção Próxima';
        const message = daysUntil <= 1 
            ? `Veículo ${vehiclePlate} precisa de manutenção HOJE!`
            : `Veículo ${vehiclePlate} precisa de manutenção em ${daysUntil} dias.`;

        if (severity === 'error') {
            return showError(title, message);
        } else {
            return showWarning(title, message);
        }
    }, [showError, showWarning]);

    // Estatísticas dos toasts
    const toastStats = {
        total: toasts.length,
        visible: toasts.filter(t => t.isVisible).length,
        critical: toasts.filter(t => t.type === AlertType.Critical).length,
        warning: toasts.filter(t => t.type === AlertType.Warning).length,
        info: toasts.filter(t => t.type === AlertType.Info).length
    };

    return {
        // Estado
        toasts: toasts.filter(t => t.isVisible),
        toastStats,

        // Ações básicas
        addToast,
        removeToast,
        clearToasts,

        // Ações por tipo
        showSuccess,
        showError,
        showWarning,
        showInfo,

        // Ações específicas do domínio
        showRouteOptimized,
        showPassengerPickedUp,
        showDelayAlert,
        showEmergencyAlert,
        showMaintenanceAlert,

        // Configurações
        position: defaultOptions.position
    };
}