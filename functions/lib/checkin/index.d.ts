import { CallableContext } from 'firebase-functions/v1/https';
interface CheckinData {
    routeId: string;
    passengerId: string;
    location: {
        latitude: number;
        longitude: number;
    };
    timestamp: Date;
    type: 'pickup' | 'dropoff';
    companyId: string;
}
interface ValidateCheckinData {
    routeId: string;
    passengerId: string;
    companyId: string;
}
interface GetCheckinHistoryData {
    routeId?: string;
    passengerId?: string;
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
export declare const checkinFunctions: {
    processCheckin: (data: CheckinData, context: CallableContext) => Promise<{
        success: boolean;
        message: string | undefined;
        code: string;
        checkinId?: undefined;
        timestamp?: undefined;
    } | {
        success: boolean;
        checkinId: string;
        message: string;
        timestamp: string;
        code?: undefined;
    }>;
    validateCheckin: (data: ValidateCheckinData, context: CallableContext) => Promise<{
        valid: boolean;
        message: string;
        code: string;
        passenger?: undefined;
        checkins?: undefined;
        next_action?: undefined;
    } | {
        valid: boolean;
        passenger: {
            id: string;
            name: any;
            status: any;
            pickup_location: any;
            dropoff_location: any;
        };
        checkins: {
            pickup: boolean;
            dropoff: boolean;
        };
        next_action: string;
        message?: undefined;
        code?: undefined;
    }>;
    getCheckinHistory: (data: GetCheckinHistoryData, context: CallableContext) => Promise<{
        success: boolean;
        checkins: any[];
        total: number;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map