# Mapeamento Schema SQL → Firestore

## Estrutura de Collections Firestore

### 1. companies
```typescript
interface Company {
  id: string; // auto-generated
  name: string;
  cnpj: string;
  status: 'active' | 'inactive' | 'suspended';
  address?: string;
  phone?: string;
  email?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 2. users (subcollection de companies)
```typescript
// Path: companies/{companyId}/users/{userId}
interface User {
  id: string; // Firebase Auth UID
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'driver';
  name: string;
  phone?: string;
  company_id: string; // referência para company
  permission_profile_id: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 3. drivers (subcollection de companies)
```typescript
// Path: companies/{companyId}/drivers/{driverId}
interface Driver {
  id: string; // auto-generated
  user_id: string; // referência para user
  company_id: string;
  cnh_number: string;
  cnh_category: 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE';
  cnh_expiry: Timestamp;
  status: 'active' | 'inactive' | 'suspended' | 'vacation';
  contract_type: 'clt' | 'pj' | 'freelancer';
  hire_date?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 4. vehicles (subcollection de companies)
```typescript
// Path: companies/{companyId}/vehicles/{vehicleId}
interface Vehicle {
  id: string; // auto-generated
  company_id: string;
  plate: string;
  model: string;
  year: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  current_driver_id?: string; // referência para driver
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 5. passengers (subcollection de companies)
```typescript
// Path: companies/{companyId}/passengers/{passengerId}
interface Passenger {
  id: string; // auto-generated
  company_id: string;
  name: string;
  phone?: string;
  address: string;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 6. routes (subcollection de companies)
```typescript
// Path: companies/{companyId}/routes/{routeId}
interface Route {
  id: string; // auto-generated
  company_id: string;
  name: string;
  description?: string;
  vehicle_id: string; // referência para vehicle
  driver_id: string; // referência para driver
  status: 'active' | 'inactive' | 'completed';
  start_time: Timestamp;
  end_time?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 7. route_passengers (subcollection de routes)
```typescript
// Path: companies/{companyId}/routes/{routeId}/passengers/{passengerRouteId}
interface RoutePassenger {
  id: string; // auto-generated
  route_id: string;
  passenger_id: string; // referência para passenger
  pickup_address: string;
  pickup_time: Timestamp;
  dropoff_address?: string;
  dropoff_time?: Timestamp;
  status: 'pending' | 'picked_up' | 'dropped_off' | 'no_show';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 8. alerts (subcollection de companies)
```typescript
// Path: companies/{companyId}/alerts/{alertId}
interface Alert {
  id: string; // auto-generated
  company_id: string;
  route_id?: string; // referência para route
  driver_id?: string; // referência para driver
  vehicle_id?: string; // referência para vehicle
  type: 'delay' | 'breakdown' | 'accident' | 'no_show' | 'route_deviation' | 'emergency';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 9. route_history (subcollection de routes)
```typescript
// Path: companies/{companyId}/routes/{routeId}/history/{historyId}
interface RouteHistory {
  id: string; // auto-generated
  route_id: string;
  driver_id: string;
  vehicle_id: string;
  start_time: Timestamp;
  end_time?: Timestamp;
  total_distance?: number;
  total_duration?: number;
  status: 'completed' | 'cancelled' | 'interrupted';
  created_at: Timestamp;
}
```

### 10. cost_control (subcollection de companies)
```typescript
// Path: companies/{companyId}/costs/{costId}
interface CostControl {
  id: string; // auto-generated
  company_id: string;
  route_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  category: 'fuel' | 'maintenance' | 'salary' | 'insurance' | 'other';
  description: string;
  amount: number;
  date: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 11. driver_performance (subcollection de companies)
```typescript
// Path: companies/{companyId}/performance/{performanceId}
interface DriverPerformance {
  id: string; // auto-generated
  company_id: string;
  driver_id: string;
  route_id: string;
  date: Timestamp;
  punctuality_score: number; // 0-100
  safety_score: number; // 0-100
  efficiency_score: number; // 0-100
  total_routes: number;
  completed_routes: number;
  cancelled_routes: number;
  created_at: Timestamp;
}
```

### 12. vehicle_locations (subcollection de vehicles)
```typescript
// Path: companies/{companyId}/vehicles/{vehicleId}/locations/{locationId}
interface VehicleLocation {
  id: string; // auto-generated
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Timestamp;
  created_at: Timestamp;
}
```

### 13. permission_profiles (global collection)
```typescript
// Path: permission_profiles/{profileId}
interface PermissionProfile {
  id: string; // auto-generated
  name: string;
  permissions: string[]; // array de permissões
  description?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

## Principais Mudanças do SQL para Firestore

1. **Hierarquia por Company**: Todas as collections principais são subcollections de `companies` para isolamento de dados
2. **Sem Foreign Keys**: Usamos referências por ID string
3. **Timestamps**: Todos os campos de data usam `Timestamp` do Firestore
4. **Enums**: Convertidos para union types TypeScript
5. **Indexes**: Serão criados automaticamente pelo Firestore ou definidos manualmente
6. **Real-time**: Todas as collections suportam listeners em tempo real
7. **Security Rules**: Controle de acesso baseado em `companyId` e `role`

## Estrutura de Segurança

- Usuários só acessam dados da própria empresa
- Drivers só acessam suas próprias rotas e dados
- Admins têm acesso completo à empresa
- Managers têm acesso limitado baseado em permissões