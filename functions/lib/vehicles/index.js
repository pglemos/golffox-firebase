"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
// Verificar permissão
async function verifyPermission(context, companyId) {
    if (!context.auth) {
        return false;
    }
    const userDoc = await admin.firestore()
        .collection(`companies/${companyId}/users`)
        .doc(context.auth.uid)
        .get();
    if (!userDoc.exists) {
        return false;
    }
    const userData = userDoc.data();
    return ['admin', 'manager', 'super_admin'].includes(userData === null || userData === void 0 ? void 0 : userData.role);
}
exports.vehicleFunctions = {
    // Criar veículo
    createVehicle: async (data, context) => {
        var _a;
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar permissão
            const hasPermission = await verifyPermission(context, data.companyId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Validar dados obrigatórios
            if (!data.plate || !data.model || !data.brand || !data.year || !data.color || !data.capacity || !data.documents) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            // Verificar se placa já existe
            const existingVehicleSnapshot = await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .where('plate', '==', data.plate.toUpperCase())
                .get();
            if (!existingVehicleSnapshot.empty) {
                throw new Error('Placa já cadastrada');
            }
            // Verificar limites da empresa
            const companyDoc = await admin.firestore()
                .collection('companies')
                .doc(data.companyId)
                .get();
            if (!companyDoc.exists) {
                throw new Error('Empresa não encontrada');
            }
            const companyData = companyDoc.data();
            const maxVehicles = ((_a = companyData === null || companyData === void 0 ? void 0 : companyData.settings) === null || _a === void 0 ? void 0 : _a.max_vehicles) || 5;
            const vehiclesSnapshot = await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .get();
            if (vehiclesSnapshot.size >= maxVehicles) {
                throw new Error(`Limite de ${maxVehicles} veículos atingido`);
            }
            // Criar veículo
            const vehicleId = admin.firestore().collection('temp').doc().id;
            const vehicleData = {
                id: vehicleId,
                company_id: data.companyId,
                plate: data.plate.toUpperCase(),
                model: data.model,
                brand: data.brand,
                year: data.year,
                color: data.color,
                capacity: data.capacity,
                status: 'active',
                documents: {
                    registration_expires_at: admin.firestore.Timestamp.fromDate(data.documents.registrationExpiresAt),
                    insurance_expires_at: admin.firestore.Timestamp.fromDate(data.documents.insuranceExpiresAt),
                },
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            };
            await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .doc(vehicleId)
                .set(vehicleData);
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'vehicle_created',
                performed_by: context.auth.uid,
                target_entity: {
                    type: 'vehicle',
                    id: vehicleId,
                },
                details: {
                    plate: data.plate,
                    model: data.model,
                    brand: data.brand,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                vehicleId,
                message: 'Veículo criado com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao criar veículo:', error);
            throw new Error(`Erro ao criar veículo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Atualizar localização do veículo
    updateVehicleLocation: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar se usuário é motorista do veículo ou tem permissão administrativa
            const vehicleDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .doc(data.vehicleId)
                .get();
            if (!vehicleDoc.exists) {
                throw new Error('Veículo não encontrado');
            }
            const vehicleData = vehicleDoc.data();
            const isVehicleDriver = (vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.driver_id) === context.auth.uid;
            // Se não é o motorista do veículo, verificar se é motorista de algum veículo da empresa
            let isDriverInCompany = false;
            if (!isVehicleDriver) {
                const driverSnapshot = await admin.firestore()
                    .collection(`companies/${data.companyId}/drivers`)
                    .where('user_id', '==', context.auth.uid)
                    .get();
                isDriverInCompany = !driverSnapshot.empty;
            }
            const hasAdminPermission = await verifyPermission(context, data.companyId);
            if (!isVehicleDriver && !isDriverInCompany && !hasAdminPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Validar coordenadas
            if (typeof data.location.latitude !== 'number' ||
                typeof data.location.longitude !== 'number' ||
                data.location.latitude < -90 || data.location.latitude > 90 ||
                data.location.longitude < -180 || data.location.longitude > 180) {
                throw new Error('Coordenadas inválidas');
            }
            const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
            // Criar registro de localização
            const locationId = admin.firestore().collection('temp').doc().id;
            const locationData = {
                id: locationId,
                company_id: data.companyId,
                vehicle_id: data.vehicleId,
                driver_id: context.auth.uid,
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                speed: data.location.speed || 0,
                heading: data.location.heading || 0,
                accuracy: data.location.accuracy || 10,
                timestamp: admin.firestore.Timestamp.fromDate(timestamp),
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            };
            await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles/${data.vehicleId}/locations`)
                .doc(locationId)
                .set(locationData);
            // Atualizar última localização conhecida do veículo
            await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .doc(data.vehicleId)
                .update({
                last_location: {
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                    timestamp: admin.firestore.Timestamp.fromDate(timestamp),
                },
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                locationId,
                message: 'Localização atualizada com sucesso',
                timestamp: timestamp.toISOString(),
            };
        }
        catch (error) {
            console.error('Erro ao atualizar localização do veículo:', error);
            throw new Error(`Erro ao atualizar localização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Buscar histórico do veículo
    getVehicleHistory: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar permissão
            const hasPermission = await verifyPermission(context, data.companyId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Verificar se veículo existe
            const vehicleDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/vehicles`)
                .doc(data.vehicleId)
                .get();
            if (!vehicleDoc.exists) {
                throw new Error('Veículo não encontrado');
            }
            const vehicleData = vehicleDoc.data();
            // Definir período
            const endDate = data.endDate || new Date();
            const startDate = data.startDate || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
            // Buscar localizações
            let locationsQuery = admin.firestore()
                .collection(`companies/${data.companyId}/vehicles/${data.vehicleId}/locations`)
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
                .orderBy('timestamp', 'desc');
            if (data.limit) {
                locationsQuery = locationsQuery.limit(data.limit);
            }
            const locationsSnapshot = await locationsQuery.get();
            const locations = locationsSnapshot.docs.map(doc => {
                var _a, _b;
                const location = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, location), { timestamp: location.timestamp.toDate().toISOString(), created_at: (_b = (_a = location.created_at) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toISOString() });
            });
            // Buscar rotas do veículo no período
            const routesSnapshot = await admin.firestore()
                .collection(`companies/${data.companyId}/routes`)
                .where('vehicle_id', '==', data.vehicleId)
                .where('start_time', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endDate))
                .orderBy('start_time', 'desc')
                .get();
            const routes = routesSnapshot.docs.map(doc => {
                var _a, _b;
                const route = doc.data();
                return {
                    id: doc.id,
                    name: route.name,
                    status: route.status,
                    start_time: route.start_time.toDate().toISOString(),
                    end_time: (_b = (_a = route.end_time) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toISOString(),
                    total_distance: route.total_distance,
                    actual_duration: route.actual_duration,
                    passenger_count: route.passenger_count,
                };
            });
            // Calcular estatísticas
            const totalDistance = routes.reduce((sum, route) => sum + (route.total_distance || 0), 0);
            const totalDuration = routes.reduce((sum, route) => sum + (route.actual_duration || 0), 0);
            const completedRoutes = routes.filter(route => route.status === 'completed').length;
            return {
                success: true,
                vehicle: {
                    id: data.vehicleId,
                    plate: vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.plate,
                    model: vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.model,
                    brand: vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.brand,
                    status: vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.status,
                    last_location: (vehicleData === null || vehicleData === void 0 ? void 0 : vehicleData.last_location) ? Object.assign(Object.assign({}, vehicleData.last_location), { timestamp: vehicleData.last_location.timestamp.toDate().toISOString() }) : null,
                },
                period: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                },
                statistics: {
                    total_routes: routes.length,
                    completed_routes: completedRoutes,
                    total_distance: totalDistance,
                    total_duration: totalDuration,
                    average_distance_per_route: routes.length > 0 ? totalDistance / routes.length : 0,
                },
                locations,
                routes,
            };
        }
        catch (error) {
            console.error('Erro ao buscar histórico do veículo:', error);
            throw new Error(`Erro ao buscar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
};
//# sourceMappingURL=index.js.map