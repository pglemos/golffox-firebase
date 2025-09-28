import { CallableContext } from 'firebase-functions/v1/https';
interface CreateVehicleData {
    companyId: string;
    plate: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    capacity: number;
    documents: {
        registrationExpiresAt: Date;
        insuranceExpiresAt: Date;
    };
}
interface UpdateVehicleLocationData {
    vehicleId: string;
    companyId: string;
    location: {
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
    };
    timestamp?: Date;
}
interface GetVehicleHistoryData {
    vehicleId: string;
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
export declare const vehicleFunctions: {
    createVehicle: (data: CreateVehicleData, context: CallableContext) => Promise<{
        success: boolean;
        vehicleId: string;
        message: string;
    }>;
    updateVehicleLocation: (data: UpdateVehicleLocationData, context: CallableContext) => Promise<{
        success: boolean;
        locationId: string;
        message: string;
        timestamp: string;
    }>;
    getVehicleHistory: (data: GetVehicleHistoryData, context: CallableContext) => Promise<{
        success: boolean;
        vehicle: {
            id: string;
            plate: any;
            model: any;
            brand: any;
            status: any;
            last_location: any;
        };
        period: {
            start_date: string;
            end_date: string;
        };
        statistics: {
            total_routes: number;
            completed_routes: number;
            total_distance: number;
            total_duration: number;
            average_distance_per_route: number;
        };
        locations: {
            timestamp: any;
            created_at: any;
            id: string;
        }[];
        routes: {
            id: string;
            name: any;
            status: any;
            start_time: any;
            end_time: any;
            total_distance: any;
            actual_duration: any;
            passenger_count: any;
        }[];
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map