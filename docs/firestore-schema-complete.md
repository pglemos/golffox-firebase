# 🗄️ Schema Completo Firestore - Golffox

## 📋 Mapeamento SQL → Firestore

### 🏢 Coleção: `companies`
```typescript
interface Company {
  id: string;                    // UUID (document ID)
  name: string;                  // VARCHAR(255)
  cnpj: string;                  // VARCHAR(18) - único
  contact: string;               // VARCHAR(255)
  status: 'Ativo' | 'Inativo';   // ENUM company_status
  addressText: string;           // TEXT
  addressLat: number;            // DECIMAL(10, 8)
  addressLng: number;            // DECIMAL(11, 8)
  contractedPassengers: number;  // INTEGER
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 👥 Coleção: `users`
```typescript
interface User {
  id: string;                    // UUID (Firebase Auth UID)
  email: string;                 // VARCHAR(255) - único
  name: string;                  // VARCHAR(255)
  role: 'admin' | 'operator' | 'driver' | 'passenger'; // ENUM user_role
  companyId?: string;            // UUID (referência)
  permissionProfileId?: string;  // UUID (referência)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🚗 Coleção: `drivers`
```typescript
interface Driver {
  id: string;                    // UUID (document ID)
  userId?: string;               // UUID (referência para users)
  name: string;                  // VARCHAR(255)
  cpf: string;                   // VARCHAR(14) - único
  rg: string;                    // VARCHAR(20)
  birthDate: string;             // DATE (ISO string)
  phone: string;                 // VARCHAR(20)
  email: string;                 // VARCHAR(255) - único
  address: string;               // TEXT
  cep: string;                   // VARCHAR(9)
  cnh: string;                   // VARCHAR(20) - único
  cnhValidity: string;           // DATE (ISO string)
  cnhCategory: 'D' | 'E';        // ENUM cnh_category
  hasEar: boolean;               // BOOLEAN
  transportCourseFile?: string;  // TEXT
  transportCourseValidity?: string; // DATE (ISO string)
  lastToxicologicalExam: string; // DATE (ISO string)
  photoUrl?: string;             // TEXT
  cnhFile?: string;              // TEXT
  residenceProofFile?: string;   // TEXT
  courseFile?: string;           // TEXT
  toxicologicalExamFile?: string; // TEXT
  idPhotoFile?: string;          // TEXT
  contractType: 'CLT' | 'terceirizado' | 'autônomo'; // ENUM contract_type
  credentialingDate: string;     // DATE (ISO string)
  status: 'Ativo' | 'Em análise' | 'Inativo'; // ENUM driver_status
  linkedCompany: string;         // VARCHAR(255)
  assignedRoutes: string[];      // TEXT[] (array de strings)
  availability?: string;         // TEXT
  lastUpdate: Timestamp;         // TIMESTAMP WITH TIME ZONE
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🚌 Coleção: `vehicles`
```typescript
interface Vehicle {
  id: string;                    // UUID (document ID)
  plate: string;                 // VARCHAR(8) - único
  model: string;                 // VARCHAR(255)
  driverId?: string;             // UUID (referência para drivers)
  status: 'Em Movimento' | 'Parado' | 'Com Problema' | 'Garagem'; // ENUM vehicle_status
  positionLat: number;           // DECIMAL(10, 8)
  positionLng: number;           // DECIMAL(11, 8)
  routeId?: string;              // UUID (referência para routes)
  lastMaintenance: string;       // DATE (ISO string)
  nextMaintenance: string;       // DATE (ISO string)
  isRegistered: boolean;         // BOOLEAN
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 👤 Coleção: `passengers`
```typescript
interface Passenger {
  id: string;                    // UUID (document ID)
  userId?: string;               // UUID (referência para users)
  name: string;                  // VARCHAR(255)
  cpf: string;                   // VARCHAR(14) - único
  email: string;                 // VARCHAR(255) - único
  address: string;               // TEXT
  positionLat: number;           // DECIMAL(10, 8)
  positionLng: number;           // DECIMAL(11, 8)
  pickupTime?: string;           // TIME (formato HH:mm)
  photoUrl?: string;             // TEXT
  companyId: string;             // UUID (referência para companies)
  permissionProfileId?: string;  // UUID (referência para permission_profiles)
  status: 'Ativo' | 'Inativo';   // ENUM company_status
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🛣️ Coleção: `routes`
```typescript
interface Route {
  id: string;                    // UUID (document ID)
  name: string;                  // VARCHAR(255)
  driverId?: string;             // UUID (referência para drivers)
  vehicleId?: string;            // UUID (referência para vehicles)
  status: 'No Horário' | 'Atrasado' | 'Com Problema'; // ENUM route_status
  scheduledStart: string;        // TIME (formato HH:mm)
  actualStart?: string;          // TIME (formato HH:mm)
  punctuality: number;           // INTEGER
  startLocation?: string;        // TEXT
  destination?: string;          // TEXT
  origin?: string;               // TEXT
  companyId: string;             // UUID (referência para companies)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🔗 Coleção: `routePassengers`
```typescript
interface RoutePassenger {
  id: string;                    // UUID (document ID)
  routeId: string;               // UUID (referência para routes)
  passengerId: string;           // UUID (referência para passengers)
  pickupOrder: number;           // INTEGER
  isOnboard: boolean;            // BOOLEAN
  pickupTime?: string;           // TIME (formato HH:mm)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🚨 Coleção: `alerts`
```typescript
interface Alert {
  id: string;                    // UUID (document ID)
  type: 'Crítico' | 'Atenção' | 'Informativo'; // ENUM alert_type
  title: string;                 // VARCHAR(255)
  message: string;               // TEXT
  timestamp: Timestamp;          // TIMESTAMP WITH TIME ZONE
  userId?: string;               // UUID (referência para users)
  routeId?: string;              // UUID (referência para routes)
  vehicleId?: string;            // UUID (referência para vehicles)
  isRead: boolean;               // BOOLEAN
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 📊 Coleção: `routeHistory`
```typescript
interface RouteHistory {
  id: string;                    // UUID (document ID)
  routeId: string;               // UUID (referência para routes)
  routeName: string;             // VARCHAR(255)
  driverId?: string;             // UUID (referência para drivers)
  driverName: string;            // VARCHAR(255)
  vehicleId?: string;            // UUID (referência para vehicles)
  vehiclePlate: string;          // VARCHAR(8)
  executionDate: string;         // DATE (ISO string)
  startTime: string;             // TIME (formato HH:mm)
  endTime?: string;              // TIME (formato HH:mm)
  totalTime?: number;            // INTEGER (em minutos)
  totalDistance?: number;        // DECIMAL(10, 2) (em km)
  passengersBoarded: number;     // INTEGER
  passengersNotBoarded: number;  // INTEGER
  totalPassengers: number;       // INTEGER
  fuelConsumption?: number;      // DECIMAL(8, 2) (em litros)
  operationalCost?: number;      // DECIMAL(10, 2) (em reais)
  punctuality: number;           // INTEGER (em minutos)
  routeOptimization?: number;    // DECIMAL(5, 2) (percentual)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 💰 Coleção: `costControl`
```typescript
interface CostControl {
  id: string;                    // UUID (document ID)
  routeId: string;               // UUID (referência para routes)
  routeName: string;             // VARCHAR(255)
  period: string;                // VARCHAR(50)
  totalKilometers: number;       // DECIMAL(10, 2)
  averageFuelConsumption: number; // DECIMAL(8, 2) (km/l)
  fuelCost: number;              // DECIMAL(8, 2) (custo por litro)
  totalFuelCost: number;         // DECIMAL(10, 2)
  driverCost: number;            // DECIMAL(10, 2) (salário + benefícios)
  vehicleMaintenanceCost: number; // DECIMAL(10, 2)
  operationalCost: number;       // DECIMAL(10, 2) (custo total operacional)
  revenuePerPassenger: number;   // DECIMAL(8, 2) (receita por passageiro)
  totalRevenue: number;          // DECIMAL(10, 2)
  profitMargin: number;          // DECIMAL(5, 2) (margem de lucro em %)
  costPerKm: number;             // DECIMAL(8, 2)
  costPerPassenger: number;      // DECIMAL(8, 2)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🏆 Coleção: `driverPerformance`
```typescript
interface DriverPerformance {
  id: string;                    // UUID (document ID)
  driverId: string;              // UUID (referência para drivers)
  driverName: string;            // VARCHAR(255)
  driverPhoto?: string;          // TEXT
  punctualityScore?: number;     // INTEGER (0-100)
  fuelEfficiencyScore?: number;  // INTEGER (0-100)
  routeComplianceScore?: number; // INTEGER (0-100)
  overallScore?: number;         // INTEGER (0-100)
  routesCompleted: number;       // INTEGER
  totalSavings: number;          // DECIMAL(10, 2)
  deviations: number;            // INTEGER
  ranking?: number;              // INTEGER
  badges: string[];              // TEXT[] (array de strings)
  level: string;                 // VARCHAR(20)
  monthlyPoints: number;         // INTEGER
  monthYear: string;             // VARCHAR(7) (formato YYYY-MM)
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 📍 Coleção: `vehicleLocations`
```typescript
interface VehicleLocation {
  id: string;                    // UUID (document ID)
  vehicleId: string;             // UUID (referência para vehicles)
  lat: number;                   // DECIMAL(10, 8)
  lng: number;                   // DECIMAL(11, 8)
  speed: number;                 // DECIMAL(5, 2) (km/h)
  heading: number;               // INTEGER (graus 0-360)
  accuracy: number;              // DECIMAL(8, 2) (metros)
  timestamp: Timestamp;          // TIMESTAMP WITH TIME ZONE
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

### 🔐 Coleção: `permissionProfiles`
```typescript
interface PermissionProfile {
  id: string;                    // UUID (document ID)
  name: string;                  // VARCHAR(100)
  description?: string;          // TEXT
  access: string[];              // TEXT[] (array de strings)
  isAdminFeature: boolean;       // BOOLEAN
  createdAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
  updatedAt: Timestamp;          // TIMESTAMP WITH TIME ZONE
}
```

## 🔍 Índices Firestore Necessários

### Índices Compostos
```javascript
// companies
{ fields: [{ fieldPath: "status", order: "ASCENDING" }] }

// users
{ fields: [{ fieldPath: "companyId", order: "ASCENDING" }, { fieldPath: "role", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "role", order: "ASCENDING" }] }

// drivers
{ fields: [{ fieldPath: "status", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "linkedCompany", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "status", order: "ASCENDING" }, { fieldPath: "linkedCompany", order: "ASCENDING" }] }

// vehicles
{ fields: [{ fieldPath: "driverId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "status", order: "ASCENDING" }] }

// passengers
{ fields: [{ fieldPath: "companyId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "companyId", order: "ASCENDING" }, { fieldPath: "status", order: "ASCENDING" }] }

// routes
{ fields: [{ fieldPath: "companyId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "driverId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "vehicleId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "companyId", order: "ASCENDING" }, { fieldPath: "status", order: "ASCENDING" }] }

// routePassengers
{ fields: [{ fieldPath: "routeId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "passengerId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "routeId", order: "ASCENDING" }, { fieldPath: "pickupOrder", order: "ASCENDING" }] }

// alerts
{ fields: [{ fieldPath: "userId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "isRead", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "userId", order: "ASCENDING" }, { fieldPath: "isRead", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "timestamp", order: "DESCENDING" }] }

// routeHistory
{ fields: [{ fieldPath: "routeId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "executionDate", order: "DESCENDING" }] }
{ fields: [{ fieldPath: "routeId", order: "ASCENDING" }, { fieldPath: "executionDate", order: "DESCENDING" }] }

// vehicleLocations
{ fields: [{ fieldPath: "vehicleId", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "timestamp", order: "DESCENDING" }] }
{ fields: [{ fieldPath: "vehicleId", order: "ASCENDING" }, { fieldPath: "timestamp", order: "DESCENDING" }] }

// driverPerformance
{ fields: [{ fieldPath: "driverId", order: "ASCENDING" }, { fieldPath: "monthYear", order: "ASCENDING" }] }
{ fields: [{ fieldPath: "monthYear", order: "ASCENDING" }, { fieldPath: "overallScore", order: "DESCENDING" }] }
```

## 🔄 Diferenças Principais SQL → Firestore

### 1. **Relacionamentos**
- **SQL**: Foreign Keys com JOINs
- **Firestore**: Referências por ID (sem JOINs nativos)

### 2. **Transações**
- **SQL**: ACID completo
- **Firestore**: Transações limitadas (500 documentos)

### 3. **Consultas**
- **SQL**: Consultas complexas com JOINs
- **Firestore**: Consultas simples, denormalização necessária

### 4. **Triggers**
- **SQL**: Triggers automáticos para `updated_at`
- **Firestore**: Cloud Functions ou atualização manual

### 5. **Validação**
- **SQL**: Constraints e CHECK
- **Firestore**: Firestore Rules + validação no cliente

### 6. **Tipos de Dados**
- **SQL**: ENUM, DECIMAL, TIME
- **Firestore**: string, number, Timestamp

## 📝 Notas de Implementação

1. **Campos únicos**: Implementar validação no código (Firestore não tem UNIQUE)
2. **Enums**: Usar union types no TypeScript
3. **Timestamps**: Usar `Timestamp` do Firestore
4. **Arrays**: Firestore suporta arrays nativamente
5. **Geolocalização**: Usar `GeoPoint` para lat/lng quando apropriado
6. **Paginação**: Usar `startAfter()` e `limit()`
7. **Busca de texto**: Implementar com Algolia ou similar
8. **Backup**: Configurar exportação automática