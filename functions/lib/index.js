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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyReport = exports.cleanupOldData = exports.api = exports.onVehicleLocationUpdate = exports.onCriticalAlert = exports.onUserDeleted = exports.onUserCreated = exports.getCheckinHistory = exports.validateCheckin = exports.processCheckin = exports.cleanupOldNotifications = exports.getNotifications = exports.markNotificationsRead = exports.updateFCMToken = exports.sendNotification = exports.getAlerts = exports.updateAlertStatus = exports.createAlert = exports.getRoutePassengers = exports.updateRouteStatus = exports.createRoute = exports.getVehicleHistory = exports.updateVehicleLocation = exports.createVehicle = exports.getDriverPerformance = exports.updateDriverStatus = exports.createDriver = exports.getCompanyUsers = exports.updateCompany = exports.createCompany = exports.updateUserProfile = exports.getUserProfile = exports.deleteUser = exports.updateUserRole = exports.createUser = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
// Inicializar Firebase Admin
admin.initializeApp();
// Configurar CORS
const corsHandler = (0, cors_1.default)({ origin: true });
// Importar módulos de funções
const auth_1 = require("./auth");
const users_1 = require("./users");
const companies_1 = require("./companies");
const drivers_1 = require("./drivers");
const vehicles_1 = require("./vehicles");
const routes_1 = require("./routes");
const alerts_1 = require("./alerts");
const notifications_1 = require("./notifications");
const checkin_1 = require("./checkin");
// Configuração regional
const region = 'us-central1';
// Funções de autenticação
exports.createUser = functions.https.onCall(auth_1.authFunctions.createUser);
exports.updateUserRole = functions.https.onCall(auth_1.authFunctions.updateUserRole);
exports.deleteUser = functions.https.onCall(auth_1.authFunctions.deleteUser);
// Funções de usuários
exports.getUserProfile = functions.https.onCall(users_1.userFunctions.getUserProfile);
exports.updateUserProfile = functions.https.onCall(users_1.userFunctions.updateUserProfile);
// Funções de empresas
exports.createCompany = functions.https.onCall(companies_1.companyFunctions.createCompany);
exports.updateCompany = functions.https.onCall(companies_1.companyFunctions.updateCompany);
exports.getCompanyUsers = functions.https.onCall(companies_1.companyFunctions.getCompanyUsers);
// Funções de motoristas
exports.createDriver = functions.https.onCall(drivers_1.driverFunctions.createDriver);
exports.updateDriverStatus = functions.https.onCall(drivers_1.driverFunctions.updateDriverStatus);
exports.getDriverPerformance = functions.https.onCall(drivers_1.driverFunctions.getDriverPerformance);
// Funções de veículos
exports.createVehicle = functions.https.onCall(vehicles_1.vehicleFunctions.createVehicle);
exports.updateVehicleLocation = functions.https.onCall(vehicles_1.vehicleFunctions.updateVehicleLocation);
exports.getVehicleHistory = functions.https.onCall(vehicles_1.vehicleFunctions.getVehicleHistory);
// Funções de rotas
exports.createRoute = functions.https.onCall(routes_1.routeFunctions.createRoute);
exports.updateRouteStatus = functions.https.onCall(routes_1.routeFunctions.updateRouteStatus);
exports.getRoutePassengers = functions.https.onCall(routes_1.routeFunctions.getRoutePassengers);
// Funções de alertas
exports.createAlert = functions.https.onCall(alerts_1.alertFunctions.createAlert);
exports.updateAlertStatus = functions.https.onCall(alerts_1.alertFunctions.updateAlertStatus);
exports.getAlerts = functions.https.onCall(alerts_1.alertFunctions.getAlerts);
// Funções de notificações
exports.sendNotification = functions.https.onCall(notifications_1.notificationFunctions.sendNotification);
exports.updateFCMToken = functions.https.onCall(notifications_1.notificationFunctions.updateFCMToken);
exports.markNotificationsRead = functions.https.onCall(notifications_1.notificationFunctions.markNotificationsRead);
exports.getNotifications = functions.https.onCall(notifications_1.notificationFunctions.getNotifications);
exports.cleanupOldNotifications = functions.https.onCall(notifications_1.notificationFunctions.cleanupOldNotifications);
// Funções de check-in
exports.processCheckin = functions.https.onCall(checkin_1.checkinFunctions.processCheckin);
exports.validateCheckin = functions.https.onCall(checkin_1.checkinFunctions.validateCheckin);
exports.getCheckinHistory = functions.https.onCall(checkin_1.checkinFunctions.getCheckinHistory);
// ===== TRIGGERS AUTOMÁTICOS =====
// Trigger quando usuário é criado
exports.onUserCreated = functions
    .region(region)
    .auth
    .user()
    .onCreate(async (user) => {
    console.log('Usuário criado:', user.uid);
    // Criar documento do usuário no Firestore
    const userDoc = {
        email: user.email,
        name: user.displayName || '',
        role: 'driver', // role padrão
        is_active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .set(userDoc);
});
// Trigger quando usuário é deletado
exports.onUserDeleted = functions
    .region(region)
    .auth
    .user()
    .onDelete(async (user) => {
    console.log('Usuário deletado:', user.uid);
    // Deletar documento do usuário no Firestore
    await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .delete();
});
// Trigger para alertas críticos
exports.onCriticalAlert = functions
    .region(region)
    .firestore
    .document('companies/{companyId}/alerts/{alertId}')
    .onCreate(async (snap, context) => {
    const alert = snap.data();
    if (alert.severity === 'critical') {
        // Enviar notificação imediata
        const { companyId } = context.params;
        // Buscar usuários da empresa para notificar
        const usersSnapshot = await admin.firestore()
            .collection(`companies/${companyId}/users`)
            .where('role', 'in', ['admin', 'manager'])
            .where('is_active', '==', true)
            .get();
        const notifications = usersSnapshot.docs.map(doc => ({
            topic: `company_${companyId}_alerts`,
            notification: {
                title: '🚨 Alerta Crítico',
                body: alert.message,
            },
            data: {
                type: 'critical_alert',
                alertId: snap.id,
                companyId,
                severity: alert.severity,
            },
        }));
        // Enviar notificações
        for (const notification of notifications) {
            try {
                await admin.messaging().send(notification);
            }
            catch (error) {
                console.error('Erro ao enviar notificação:', error);
            }
        }
    }
});
// Trigger para atualização de localização de veículo
exports.onVehicleLocationUpdate = functions
    .region(region)
    .firestore
    .document('companies/{companyId}/vehicles/{vehicleId}/locations/{locationId}')
    .onCreate(async (snap, context) => {
    const location = snap.data();
    const { companyId, vehicleId } = context.params;
    // Atualizar última localização conhecida do veículo
    await admin.firestore()
        .collection(`companies/${companyId}/vehicles`)
        .doc(vehicleId)
        .update({
        last_location: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp,
        },
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
});
// ===== FUNÇÕES HTTP EXPRESS =====
// API REST para integração externa
const app = (0, express_1.default)();
app.use(corsHandler);
// Middleware de autenticação
app.use(async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (token) {
            const decodedToken = await admin.auth().verifyIdToken(token);
            req.user = decodedToken;
        }
        next();
    }
    catch (error) {
        next();
    }
});
// Rotas da API
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/companies/:companyId/vehicles', async (req, res) => {
    try {
        const { companyId } = req.params;
        // Verificar permissão
        const user = req.user;
        if (!user || user.company_id !== companyId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const snapshot = await admin.firestore()
            .collection(`companies/${companyId}/vehicles`)
            .get();
        const vehicles = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return res.json(vehicles);
    }
    catch (error) {
        console.error('Erro ao buscar veículos:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
exports.api = functions
    .region(region)
    .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
})
    .https
    .onRequest(app);
// ===== FUNÇÕES AGENDADAS =====
// Limpeza de dados antigos (executa diariamente às 2h)
exports.cleanupOldData = functions
    .region(region)
    .pubsub
    .schedule('0 2 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
    console.log('Iniciando limpeza de dados antigos...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Limpar localizações antigas de veículos
    const companiesSnapshot = await admin.firestore()
        .collection('companies')
        .get();
    for (const companyDoc of companiesSnapshot.docs) {
        const vehiclesSnapshot = await admin.firestore()
            .collection(`companies/${companyDoc.id}/vehicles`)
            .get();
        for (const vehicleDoc of vehiclesSnapshot.docs) {
            const oldLocationsSnapshot = await admin.firestore()
                .collection(`companies/${companyDoc.id}/vehicles/${vehicleDoc.id}/locations`)
                .where('created_at', '<', thirtyDaysAgo)
                .get();
            const batch = admin.firestore().batch();
            oldLocationsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            if (oldLocationsSnapshot.docs.length > 0) {
                await batch.commit();
                console.log(`Removidas ${oldLocationsSnapshot.docs.length} localizações antigas do veículo ${vehicleDoc.id}`);
            }
        }
    }
    console.log('Limpeza de dados concluída');
});
// Relatório diário de performance (executa diariamente às 6h)
exports.generateDailyReport = functions
    .region(region)
    .pubsub
    .schedule('0 6 * * *')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
    console.log('Gerando relatório diário de performance...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Processar cada empresa
    const companiesSnapshot = await admin.firestore()
        .collection('companies')
        .get();
    for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        // Buscar rotas do dia anterior
        const routesSnapshot = await admin.firestore()
            .collection(`companies/${companyId}/routes`)
            .where('start_time', '>=', yesterday)
            .where('start_time', '<', today)
            .get();
        // Calcular métricas
        const totalRoutes = routesSnapshot.docs.length;
        const completedRoutes = routesSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
        // Salvar relatório
        await admin.firestore()
            .collection(`companies/${companyId}/reports`)
            .add({
            type: 'daily_performance',
            date: yesterday,
            metrics: {
                total_routes: totalRoutes,
                completed_routes: completedRoutes,
                completion_rate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
            },
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    console.log('Relatório diário gerado para todas as empresas');
});
//# sourceMappingURL=index.js.map