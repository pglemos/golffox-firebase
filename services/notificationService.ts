import type { Alert, Route, Vehicle, Passenger } from '../types';
import { AlertType, RouteStatus, VehicleStatus } from '../types';

export interface NotificationRule {
    id: string;
    name: string;
    condition: (data: any) => boolean;
    alertType: AlertType;
    titleTemplate: string;
    messageTemplate: string;
    priority: 'high' | 'medium' | 'low';
    enabled: boolean;
}

export interface NotificationSubscriber {
    id: string;
    callback: (alert: Alert) => void;
    filters?: {
        types?: AlertType[];
        priority?: string[];
    };
}

class NotificationService {
    private alerts: Alert[] = [];
    private subscribers: NotificationSubscriber[] = [];
    private rules: NotificationRule[] = [];
    private alertIdCounter = 1;

    constructor() {
        this.initializeDefaultRules();
        this.startMonitoring();
    }

    /**
     * Inicializa regras padrão de notificação
     */
    private initializeDefaultRules(): void {
        this.rules = [
            {
                id: 'route_delay',
                name: 'Atraso de Rota',
                condition: (route: Route) => route.punctuality > 10,
                alertType: AlertType.Warning,
                titleTemplate: 'Atraso na {routeName}',
                messageTemplate: 'A rota está com atraso de {punctuality} minutos. Motorista: {driver}',
                priority: 'high',
                enabled: true
            },
            {
                id: 'route_critical_delay',
                name: 'Atraso Crítico de Rota',
                condition: (route: Route) => route.punctuality > 20,
                alertType: AlertType.Critical,
                titleTemplate: 'Atraso Crítico - {routeName}',
                messageTemplate: 'URGENTE: Rota com atraso de {punctuality} minutos. Ação imediata necessária. Motorista: {driver}',
                priority: 'high',
                enabled: true
            },
            {
                id: 'vehicle_problem',
                name: 'Problema no Veículo',
                condition: (vehicle: Vehicle) => vehicle.status === VehicleStatus.Problem,
                alertType: AlertType.Critical,
                titleTemplate: 'Problema no Veículo {plate}',
                messageTemplate: 'Veículo {plate} reportou problema. Motorista: {driver}. Verificação necessária.',
                priority: 'high',
                enabled: true
            },
            {
                id: 'maintenance_due',
                name: 'Manutenção Vencida',
                condition: (vehicle: Vehicle) => {
                    const nextMaintenance = new Date(vehicle.nextMaintenance);
                    const today = new Date();
                    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysUntilMaintenance <= 3;
                },
                alertType: AlertType.Warning,
                titleTemplate: 'Manutenção Próxima - {plate}',
                messageTemplate: 'Veículo {plate} precisa de manutenção em breve. Próxima manutenção: {nextMaintenance}',
                priority: 'medium',
                enabled: true
            },
            {
                id: 'passenger_capacity',
                name: 'Capacidade de Passageiros',
                condition: (route: Route) => {
                    const occupancyRate = (route.passengers.onboard / route.passengers.total) * 100;
                    return occupancyRate > 90;
                },
                alertType: AlertType.Info,
                titleTemplate: 'Alta Ocupação - {routeName}',
                messageTemplate: 'Rota com {onboard}/{total} passageiros ({occupancyRate}% de ocupação)',
                priority: 'low',
                enabled: true
            },
            {
                id: 'route_optimization_suggestion',
                name: 'Sugestão de Otimização',
                condition: (route: Route) => route.passengers.total > 5,
                alertType: AlertType.Info,
                titleTemplate: 'Otimização Disponível - {routeName}',
                messageTemplate: 'Rota com {total} passageiros pode ser otimizada para reduzir tempo de viagem',
                priority: 'low',
                enabled: true
            }
        ];
    }

    /**
     * Inicia o monitoramento automático
     */
    private startMonitoring(): void {
        // Simula monitoramento em tempo real
        setInterval(() => {
            this.checkForAlerts();
        }, 30000); // Verifica a cada 30 segundos
    }

    /**
     * Verifica condições e gera alertas
     */
    private checkForAlerts(): void {
        // Esta função seria chamada com dados reais em um ambiente de produção
        // Por enquanto, simula a verificação de condições
    }

    /**
     * Adiciona um novo alerta
     */
    addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Alert {
        const newAlert: Alert = {
            ...alert,
            id: `alert_${this.alertIdCounter++}`,
            timestamp: new Date().toISOString()
        };

        this.alerts.unshift(newAlert);
        this.notifySubscribers(newAlert);
        
        return newAlert;
    }

    /**
     * Gera alerta baseado em regra e dados
     */
    generateAlert(ruleId: string, data: any): Alert | null {
        const rule = this.rules.find(r => r.id === ruleId && r.enabled);
        if (!rule || !rule.condition(data)) {
            return null;
        }

        const title = this.interpolateTemplate(rule.titleTemplate, data);
        const message = this.interpolateTemplate(rule.messageTemplate, data);

        return this.addAlert({
            type: rule.alertType,
            title,
            message
        });
    }

    /**
     * Interpola template com dados
     */
    private interpolateTemplate(template: string, data: any): string {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            if (key === 'occupancyRate' && data.passengers) {
                return Math.round((data.passengers.onboard / data.passengers.total) * 100).toString();
            }
            return data[key] || match;
        });
    }

    /**
     * Verifica rotas e gera alertas automáticos
     */
    checkRoutes(routes: Route[]): Alert[] {
        const generatedAlerts: Alert[] = [];

        routes.forEach(route => {
            // Verifica atrasos
            const delayAlert = this.generateAlert('route_delay', route);
            if (delayAlert) generatedAlerts.push(delayAlert);

            const criticalDelayAlert = this.generateAlert('route_critical_delay', route);
            if (criticalDelayAlert) generatedAlerts.push(criticalDelayAlert);

            // Verifica capacidade
            const capacityAlert = this.generateAlert('passenger_capacity', route);
            if (capacityAlert) generatedAlerts.push(capacityAlert);

            // Verifica otimização
            const optimizationAlert = this.generateAlert('route_optimization_suggestion', route);
            if (optimizationAlert) generatedAlerts.push(optimizationAlert);
        });

        return generatedAlerts;
    }

    /**
     * Verifica veículos e gera alertas automáticos
     */
    checkVehicles(vehicles: Vehicle[]): Alert[] {
        const generatedAlerts: Alert[] = [];

        vehicles.forEach(vehicle => {
            // Verifica problemas
            const problemAlert = this.generateAlert('vehicle_problem', vehicle);
            if (problemAlert) generatedAlerts.push(problemAlert);

            // Verifica manutenção
            const maintenanceAlert = this.generateAlert('maintenance_due', vehicle);
            if (maintenanceAlert) generatedAlerts.push(maintenanceAlert);
        });

        return generatedAlerts;
    }

    /**
     * Subscreve para receber notificações
     */
    subscribe(subscriber: NotificationSubscriber): void {
        this.subscribers.push(subscriber);
    }

    /**
     * Remove subscrição
     */
    unsubscribe(subscriberId: string): void {
        this.subscribers = this.subscribers.filter(s => s.id !== subscriberId);
    }

    /**
     * Notifica todos os subscribers
     */
    private notifySubscribers(alert: Alert): void {
        this.subscribers.forEach(subscriber => {
            // Aplica filtros se existirem
            if (subscriber.filters) {
                if (subscriber.filters.types && !subscriber.filters.types.includes(alert.type)) {
                    return;
                }
            }
            
            try {
                subscriber.callback(alert);
            } catch (error) {
                console.error('Erro ao notificar subscriber:', error);
            }
        });
    }

    /**
     * Obtém todos os alertas
     */
    getAlerts(): Alert[] {
        return [...this.alerts];
    }

    /**
     * Obtém alertas por tipo
     */
    getAlertsByType(type: AlertType): Alert[] {
        return this.alerts.filter(alert => alert.type === type);
    }

    /**
     * Remove alerta
     */
    dismissAlert(alertId: string): void {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    }

    /**
     * Limpa alertas antigos (mais de 24 horas)
     */
    cleanupOldAlerts(): void {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => 
            new Date(alert.timestamp) > oneDayAgo
        );
    }

    /**
     * Gera alerta personalizado para problemas de rota
     */
    generateRouteIssueAlert(routeId: string, issue: string, severity: AlertType = AlertType.Warning): Alert {
        return this.addAlert({
            type: severity,
            title: `Problema na Rota ${routeId}`,
            message: issue
        });
    }

    /**
     * Gera alerta para passageiro não encontrado
     */
    generatePassengerNotFoundAlert(passengerName: string, routeName: string): Alert {
        return this.addAlert({
            type: AlertType.Warning,
            title: `Passageiro Não Encontrado`,
            message: `Passageiro ${passengerName} não foi encontrado no ponto de coleta da ${routeName}`
        });
    }

    /**
     * Gera alerta para emergência
     */
    generateEmergencyAlert(vehiclePlate: string, location: string, description: string): Alert {
        return this.addAlert({
            type: AlertType.Critical,
            title: `EMERGÊNCIA - Veículo ${vehiclePlate}`,
            message: `Emergência reportada em ${location}: ${description}`
        });
    }

    /**
     * Obtém estatísticas de alertas
     */
    getAlertStats(): {
        total: number;
        critical: number;
        warning: number;
        info: number;
        last24h: number;
    } {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recent = this.alerts.filter(alert => new Date(alert.timestamp) > oneDayAgo);

        return {
            total: this.alerts.length,
            critical: this.alerts.filter(a => a.type === AlertType.Critical).length,
            warning: this.alerts.filter(a => a.type === AlertType.Warning).length,
            info: this.alerts.filter(a => a.type === AlertType.Info).length,
            last24h: recent.length
        };
    }
}

// Instância singleton do serviço
export const notificationService = new NotificationService();