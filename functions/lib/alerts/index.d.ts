import { CallableContext } from 'firebase-functions/v1/https';
import { AlertType, AlertSeverity, AlertStatus } from '../types';
interface CreateAlertData {
    companyId: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    entityType?: 'vehicle' | 'driver' | 'route' | 'passenger';
    entityId?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    metadata?: Record<string, any>;
}
interface UpdateAlertStatusData {
    alertId: string;
    companyId: string;
    status: AlertStatus;
    resolution?: string;
    resolvedBy?: string;
}
interface GetAlertsData {
    companyId: string;
    status?: AlertStatus[];
    severity?: AlertSeverity[];
    type?: AlertType[];
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
export declare const alertFunctions: {
    createAlert: (data: CreateAlertData, context: CallableContext) => Promise<{
        success: boolean;
        alertId: string;
        message: string;
    }>;
    updateAlertStatus: (data: UpdateAlertStatusData, context: CallableContext) => Promise<{
        success: boolean;
        previousStatus: any;
        newStatus: AlertStatus;
        message: string;
    }>;
    getAlerts: (data: GetAlertsData, context: CallableContext) => Promise<{
        success: boolean;
        alerts: any;
        pagination: {
            total: number;
            limit: number;
            offset: number;
            has_more: boolean;
        };
        statistics: {
            total: number;
            active: number;
            acknowledged: number;
            resolved: number;
            dismissed: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map