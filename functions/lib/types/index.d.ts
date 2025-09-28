export type UserRole = 'super_admin' | 'admin' | 'manager' | 'driver' | 'passenger';
export type CompanyStatus = 'active' | 'inactive' | 'suspended';
export type DriverStatus = 'available' | 'busy' | 'offline' | 'on_break';
export type ContractType = 'clt' | 'pj' | 'freelancer';
export type CnhCategory = 'a' | 'b' | 'c' | 'd' | 'e' | 'ab' | 'ac' | 'ad' | 'ae';
export type VehicleStatus = 'active' | 'maintenance' | 'inactive';
export type RouteStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type PassengerStatus = 'pending' | 'checked_in' | 'checked_out' | 'absent' | 'cancelled';
export type AlertType = 'info' | 'warning' | 'error' | 'critical';
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum AlertStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    ACKNOWLEDGED = "acknowledged",
    RESOLVED = "resolved",
    DISMISSED = "dismissed",
    CLOSED = "closed"
}
export interface BaseDocument {
    id: string;
    created_at: FirebaseFirestore.Timestamp;
    updated_at: FirebaseFirestore.Timestamp;
}
export interface Company extends BaseDocument {
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
    };
    status: CompanyStatus;
    subscription: {
        plan: string;
        expires_at: FirebaseFirestore.Timestamp;
        is_active: boolean;
    };
    settings: {
        max_users: number;
        max_vehicles: number;
        max_routes: number;
        features: string[];
    };
}
export interface User extends BaseDocument {
    email: string;
    name: string;
    role: UserRole;
    company_id: string;
    is_active: boolean;
    profile?: {
        phone?: string;
        avatar_url?: string;
        department?: string;
    };
    permissions?: string[];
    last_login?: FirebaseFirestore.Timestamp;
}
export interface Driver extends BaseDocument {
    user_id: string;
    company_id: string;
    license_number: string;
    license_category: CnhCategory;
    license_expires_at: FirebaseFirestore.Timestamp;
    contract_type: ContractType;
    status: DriverStatus;
    vehicle_id?: string;
    performance_score?: number;
    total_routes?: number;
    total_distance?: number;
    rating?: number;
    emergency_contact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}
export interface Vehicle extends BaseDocument {
    company_id: string;
    plate: string;
    model: string;
    brand: string;
    year: number;
    color: string;
    capacity: number;
    status: VehicleStatus;
    driver_id?: string;
    last_maintenance?: FirebaseFirestore.Timestamp;
    next_maintenance?: FirebaseFirestore.Timestamp;
    documents: {
        registration_expires_at: FirebaseFirestore.Timestamp;
        insurance_expires_at: FirebaseFirestore.Timestamp;
    };
    last_location?: {
        latitude: number;
        longitude: number;
        timestamp: FirebaseFirestore.Timestamp;
    };
}
export interface Passenger extends BaseDocument {
    company_id: string;
    name: string;
    email?: string;
    phone?: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
    emergency_contact: {
        name: string;
        phone: string;
        relationship: string;
    };
    is_active: boolean;
    notes?: string;
}
export interface Route extends BaseDocument {
    company_id: string;
    name: string;
    description?: string;
    driver_id: string;
    vehicle_id: string;
    status: RouteStatus;
    start_time: FirebaseFirestore.Timestamp;
    end_time?: FirebaseFirestore.Timestamp;
    estimated_duration: number;
    actual_duration?: number;
    total_distance?: number;
    passenger_count: number;
    waypoints: {
        latitude: number;
        longitude: number;
        address: string;
        type: 'pickup' | 'dropoff';
        passenger_id: string;
        estimated_time: FirebaseFirestore.Timestamp;
        actual_time?: FirebaseFirestore.Timestamp;
    }[];
}
export interface RoutePassenger extends BaseDocument {
    route_id: string;
    passenger_id: string;
    passenger_name: string;
    pickup_location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    dropoff_location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    pickup_time?: FirebaseFirestore.Timestamp;
    dropoff_time?: FirebaseFirestore.Timestamp;
    status: 'scheduled' | 'picked_up' | 'dropped_off' | 'no_show';
    notes?: string;
}
export interface Alert extends BaseDocument {
    company_id: string;
    type: AlertType;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: {
        type: 'system' | 'user' | 'driver' | 'vehicle';
        id: string;
    };
    related_entities?: {
        route_id?: string;
        driver_id?: string;
        vehicle_id?: string;
        passenger_id?: string;
    };
    is_resolved: boolean;
    resolved_at?: FirebaseFirestore.Timestamp;
    resolved_by?: string;
    resolution_notes?: string;
}
export interface Checkin extends BaseDocument {
    company_id: string;
    route_id: string;
    passenger_id: string;
    driver_id: string;
    type: 'pickup' | 'dropoff';
    location: {
        latitude: number;
        longitude: number;
    };
    timestamp: FirebaseFirestore.Timestamp;
    status: 'confirmed' | 'disputed' | 'cancelled';
    notes?: string;
}
export interface VehicleLocation extends BaseDocument {
    company_id: string;
    vehicle_id: string;
    driver_id?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    timestamp: FirebaseFirestore.Timestamp;
}
export interface DriverPerformance extends BaseDocument {
    company_id: string;
    driver_id: string;
    period: {
        start_date: FirebaseFirestore.Timestamp;
        end_date: FirebaseFirestore.Timestamp;
    };
    metrics: {
        total_routes: number;
        completed_routes: number;
        cancelled_routes: number;
        total_distance: number;
        total_duration: number;
        average_rating: number;
        on_time_percentage: number;
        fuel_efficiency?: number;
    };
    incidents: {
        accidents: number;
        violations: number;
        complaints: number;
    };
    score: number;
}
export interface CostControl extends BaseDocument {
    company_id: string;
    period: {
        start_date: FirebaseFirestore.Timestamp;
        end_date: FirebaseFirestore.Timestamp;
    };
    fuel_costs: number;
    maintenance_costs: number;
    driver_costs: number;
    other_costs: number;
    total_costs: number;
    revenue?: number;
    profit_margin?: number;
    cost_per_km?: number;
    cost_per_route?: number;
}
export interface PermissionProfile extends BaseDocument {
    name: string;
    description: string;
    permissions: string[];
    is_system: boolean;
    company_id?: string;
}
export interface CreateDocumentData<T> {
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>;
}
export interface UpdateDocumentData<T> {
    data: Partial<Omit<T, 'id' | 'created_at'>>;
}
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    where?: {
        field: string;
        operator: FirebaseFirestore.WhereFilterOp;
        value: any;
    }[];
}
export interface AuthContext {
    uid: string;
    email?: string;
    role?: UserRole;
    companyId?: string;
    permissions?: string[];
}
export interface NotificationData {
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
export interface FCMMessage {
    token?: string;
    topic?: string;
    condition?: string;
    notification: NotificationData;
    data?: Record<string, string>;
    android?: {
        priority: 'normal' | 'high';
        notification?: {
            sound?: string;
            color?: string;
            icon?: string;
        };
    };
    apns?: {
        payload: {
            aps: {
                sound?: string;
                badge?: number;
            };
        };
    };
}
export interface ReportData {
    type: string;
    period: {
        start_date: FirebaseFirestore.Timestamp;
        end_date: FirebaseFirestore.Timestamp;
    };
    data: Record<string, any>;
    generated_at: FirebaseFirestore.Timestamp;
    generated_by: string;
}
export interface AuditLog extends BaseDocument {
    company_id: string;
    action: string;
    performed_by: string;
    target_entity?: {
        type: string;
        id: string;
    };
    details: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    timestamp: FirebaseFirestore.Timestamp;
}
export interface SystemSettings {
    maintenance_mode: boolean;
    max_file_size: number;
    allowed_file_types: string[];
    notification_settings: {
        email_enabled: boolean;
        sms_enabled: boolean;
        push_enabled: boolean;
    };
    security_settings: {
        password_min_length: number;
        password_require_special: boolean;
        session_timeout: number;
        max_login_attempts: number;
    };
}
export interface WebhookEvent {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: FirebaseFirestore.Timestamp;
    source: string;
    processed: boolean;
    processed_at?: FirebaseFirestore.Timestamp;
    error?: string;
}
export interface ExternalIntegration {
    id: string;
    name: string;
    type: 'api' | 'webhook' | 'file';
    config: Record<string, any>;
    is_active: boolean;
    last_sync?: FirebaseFirestore.Timestamp;
    error_count: number;
    last_error?: string;
}
//# sourceMappingURL=index.d.ts.map