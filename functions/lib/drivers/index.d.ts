import { CallableContext } from 'firebase-functions/v1/https';
import { DriverStatus, CnhCategory, ContractType } from '../types';
interface CreateDriverData {
    userId: string;
    companyId: string;
    licenseNumber: string;
    licenseCategory: CnhCategory;
    licenseExpiresAt: Date;
    contractType: ContractType;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}
interface UpdateDriverStatusData {
    driverId: string;
    companyId: string;
    status: DriverStatus;
    vehicleId?: string;
}
interface GetDriverPerformanceData {
    driverId: string;
    companyId: string;
    startDate?: Date;
    endDate?: Date;
}
export declare const driverFunctions: {
    createDriver: (data: CreateDriverData, context: CallableContext) => Promise<{
        success: boolean;
        driverId: string;
        message: string;
    }>;
    updateDriverStatus: (data: UpdateDriverStatusData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
    getDriverPerformance: (data: GetDriverPerformanceData, context: CallableContext) => Promise<{
        success: boolean;
        driver: {
            id: string;
            name: any;
            license_number: any;
            performance_score: any;
            total_routes: any;
            total_distance: any;
            rating: any;
        };
        period: {
            start_date: string;
            end_date: string;
        };
        metrics: {
            total_routes: number;
            completed_routes: number;
            cancelled_routes: number;
            total_distance: number;
            total_duration: number;
            average_rating: any;
            on_time_percentage: number;
            completion_rate: number;
        };
        performance_history: {
            period: {
                start_date: any;
                end_date: any;
            };
            id: string;
        }[];
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map