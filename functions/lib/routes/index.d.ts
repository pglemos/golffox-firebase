import { CallableContext } from 'firebase-functions/v1/https';
import { RouteStatus } from '../types';
interface CreateRouteData {
    companyId: string;
    name: string;
    vehicleId: string;
    driverId: string;
    startTime: Date;
    endTime: Date;
    waypoints: Array<{
        latitude: number;
        longitude: number;
        address?: string;
        order: number;
    }>;
    passengers: Array<{
        passengerId: string;
        waypointIndex: number;
        type: 'pickup' | 'dropoff';
    }>;
}
interface UpdateRouteStatusData {
    routeId: string;
    companyId: string;
    status: RouteStatus;
    actualStartTime?: Date;
    actualEndTime?: Date;
    notes?: string;
}
interface GetRoutePassengersData {
    routeId: string;
    companyId: string;
}
export declare const routeFunctions: {
    createRoute: (data: CreateRouteData, context: CallableContext) => Promise<{
        success: boolean;
        routeId: string;
        totalDistance: number;
        message: string;
    }>;
    updateRouteStatus: (data: UpdateRouteStatusData, context: CallableContext) => Promise<{
        success: boolean;
        previousStatus: any;
        newStatus: RouteStatus;
        message: string;
    }>;
    getRoutePassengers: (data: GetRoutePassengersData, context: CallableContext) => Promise<{
        success: boolean;
        route: {
            id: string;
            name: any;
            status: any;
            start_time: any;
            end_time: any;
            actual_start_time: any;
            actual_end_time: any;
            total_distance: any;
            estimated_duration: any;
            actual_duration: any;
            waypoints: any;
            vehicle: {
                id: any;
                plate: any;
                model: any;
                brand: any;
            } | null;
            driver: {
                id: any;
                name: any;
                phone: any;
            } | null;
        };
        passengers: {
            id: string;
            passenger_id: any;
            name: any;
            phone: any;
            waypoint_index: any;
            type: any;
            status: any;
            checkin_time: any;
            checkout_time: any;
            notes: any;
            created_at: any;
            updated_at: any;
        }[];
        summary: {
            total_passengers: number;
            pending: number;
            checked_in: number;
            checked_out: number;
            absent: number;
        };
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map