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
exports.notificationFunctions = void 0;
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
// Verificar se usuário pertence à empresa
async function verifyUserInCompany(context, companyId) {
    if (!context.auth) {
        return false;
    }
    const userDoc = await admin.firestore()
        .collection(`companies/${companyId}/users`)
        .doc(context.auth.uid)
        .get();
    return userDoc.exists;
}
exports.notificationFunctions = {
    // Enviar notificação
    sendNotification: async (data, context) => {
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
            if (!data.type || !data.title || !data.message) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            let targetUsers = [];
            // Determinar usuários alvo
            if (data.userIds && data.userIds.length > 0) {
                targetUsers = data.userIds;
            }
            else if (data.roles && data.roles.length > 0) {
                // Buscar usuários por roles
                const usersSnapshot = await admin.firestore()
                    .collection(`companies/${data.companyId}/users`)
                    .where('role', 'in', data.roles)
                    .get();
                targetUsers = usersSnapshot.docs.map(doc => doc.id);
            }
            else {
                // Enviar para todos os usuários da empresa
                const usersSnapshot = await admin.firestore()
                    .collection(`companies/${data.companyId}/users`)
                    .get();
                targetUsers = usersSnapshot.docs.map(doc => doc.id);
            }
            if (targetUsers.length === 0) {
                throw new Error('Nenhum usuário encontrado para enviar notificação');
            }
            const notifications = [];
            const pushMessages = [];
            // Criar notificações no Firestore e preparar push notifications
            for (const userId of targetUsers) {
                // Buscar dados do usuário
                const userDoc = await admin.firestore()
                    .collection(`companies/${data.companyId}/users`)
                    .doc(userId)
                    .get();
                if (!userDoc.exists) {
                    continue;
                }
                const userData = userDoc.data();
                // Criar notificação no Firestore
                const notificationId = admin.firestore().collection('temp').doc().id;
                const notificationData = {
                    id: notificationId,
                    company_id: data.companyId,
                    user_id: userId,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.data || {},
                    read: false,
                    sent_by: context.auth.uid,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                };
                notifications.push(admin.firestore()
                    .collection(`companies/${data.companyId}/notifications`)
                    .doc(notificationId)
                    .set(notificationData));
                // Preparar push notification se o usuário tiver FCM token
                if (userData && userData.fcm_token && ((_a = userData.notification_preferences) === null || _a === void 0 ? void 0 : _a.push_notifications) !== false) {
                    const message = {
                        token: userData.fcm_token,
                        notification: {
                            title: data.title,
                            body: data.message,
                        },
                        data: Object.assign({ type: data.type, company_id: data.companyId, notification_id: notificationId }, (data.data || {})),
                        android: {
                            priority: (data.priority === 'high' ? 'high' : 'normal'),
                            notification: {
                                sound: data.sound || 'default',
                                priority: (data.priority === 'high' ? 'high' : 'default'),
                                channelId: data.type,
                            },
                        },
                        apns: {
                            payload: {
                                aps: {
                                    sound: data.sound ? `${data.sound}.wav` : 'default',
                                    badge: data.badge || 1,
                                    category: data.type,
                                },
                            },
                        },
                    };
                    pushMessages.push(admin.messaging().send(message));
                }
            }
            // Executar todas as operações
            await Promise.all([...notifications, ...pushMessages]);
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'notification_sent',
                performed_by: context.auth.uid,
                target_entity: {
                    type: 'notification',
                    id: 'bulk',
                },
                details: {
                    notification_type: data.type,
                    title: data.title,
                    target_users_count: targetUsers.length,
                    target_roles: data.roles,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                sentTo: targetUsers.length,
                message: `Notificação enviada para ${targetUsers.length} usuários`,
            };
        }
        catch (error) {
            console.error('Erro ao enviar notificação:', error);
            throw new Error(`Erro ao enviar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Atualizar FCM token
    updateFCMToken: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar se usuário pertence à empresa
            const belongsToCompany = await verifyUserInCompany(context, data.companyId);
            if (!belongsToCompany) {
                throw new Error('Usuário não pertence à empresa');
            }
            // Validar token
            if (!data.token || typeof data.token !== 'string') {
                throw new Error('Token FCM inválido');
            }
            // Atualizar token do usuário
            await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(context.auth.uid)
                .update({
                fcm_token: data.token,
                fcm_token_updated_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: 'Token FCM atualizado com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao atualizar token FCM:', error);
            throw new Error(`Erro ao atualizar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Marcar notificações como lidas
    markNotificationsRead: async (data, context) => {
        var _a;
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar se usuário pertence à empresa
            const belongsToCompany = await verifyUserInCompany(context, data.companyId);
            if (!belongsToCompany) {
                throw new Error('Usuário não pertence à empresa');
            }
            // Validar dados
            if (!data.notificationIds || data.notificationIds.length === 0) {
                throw new Error('IDs de notificação não fornecidos');
            }
            // Atualizar notificações em lote
            const batch = admin.firestore().batch();
            for (const notificationId of data.notificationIds) {
                const notificationRef = admin.firestore()
                    .collection(`companies/${data.companyId}/notifications`)
                    .doc(notificationId);
                // Verificar se a notificação pertence ao usuário
                const notificationDoc = await notificationRef.get();
                if (notificationDoc.exists && ((_a = notificationDoc.data()) === null || _a === void 0 ? void 0 : _a.user_id) === context.auth.uid) {
                    batch.update(notificationRef, {
                        read: true,
                        read_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
            await batch.commit();
            return {
                success: true,
                updatedCount: data.notificationIds.length,
                message: 'Notificações marcadas como lidas',
            };
        }
        catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
            throw new Error(`Erro ao marcar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Buscar notificações do usuário
    getNotifications: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar se usuário pertence à empresa
            const belongsToCompany = await verifyUserInCompany(context, data.companyId);
            if (!belongsToCompany) {
                throw new Error('Usuário não pertence à empresa');
            }
            // Construir query
            let query = admin.firestore()
                .collection(`companies/${data.companyId}/notifications`)
                .where('user_id', '==', context.auth.uid);
            // Filtrar apenas não lidas se solicitado
            if (data.unreadOnly) {
                query = query.where('read', '==', false);
            }
            // Ordenar por data de criação (mais recentes primeiro)
            query = query.orderBy('created_at', 'desc');
            // Aplicar paginação
            if (data.offset) {
                query = query.offset(data.offset);
            }
            if (data.limit) {
                query = query.limit(data.limit);
            }
            else {
                query = query.limit(50); // Limite padrão
            }
            const notificationsSnapshot = await query.get();
            const notifications = notificationsSnapshot.docs.map(doc => {
                var _a, _b, _c, _d;
                const notification = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, notification), { created_at: (_b = (_a = notification.created_at) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toISOString(), read_at: (_d = (_c = notification.read_at) === null || _c === void 0 ? void 0 : _c.toDate()) === null || _d === void 0 ? void 0 : _d.toISOString() });
            });
            // Buscar contagem de não lidas
            const unreadSnapshot = await admin.firestore()
                .collection(`companies/${data.companyId}/notifications`)
                .where('user_id', '==', context.auth.uid)
                .where('read', '==', false)
                .get();
            return {
                success: true,
                notifications,
                pagination: {
                    limit: data.limit || 50,
                    offset: data.offset || 0,
                    has_more: notifications.length === (data.limit || 50),
                },
                unread_count: unreadSnapshot.size,
            };
        }
        catch (error) {
            console.error('Erro ao buscar notificações:', error);
            throw new Error(`Erro ao buscar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Limpar notificações antigas
    cleanupOldNotifications: async (data, context) => {
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
            const daysOld = data.daysOld || 30; // Padrão: 30 dias
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            // Buscar notificações antigas
            const oldNotificationsSnapshot = await admin.firestore()
                .collection(`companies/${data.companyId}/notifications`)
                .where('created_at', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
                .limit(500) // Processar em lotes
                .get();
            if (oldNotificationsSnapshot.empty) {
                return {
                    success: true,
                    deletedCount: 0,
                    message: 'Nenhuma notificação antiga encontrada',
                };
            }
            // Deletar em lote
            const batch = admin.firestore().batch();
            oldNotificationsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'notifications_cleanup',
                performed_by: context.auth.uid,
                target_entity: {
                    type: 'notification',
                    id: 'bulk',
                },
                details: {
                    deleted_count: oldNotificationsSnapshot.size,
                    cutoff_date: cutoffDate.toISOString(),
                    days_old: daysOld,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                deletedCount: oldNotificationsSnapshot.size,
                message: `${oldNotificationsSnapshot.size} notificações antigas removidas`,
            };
        }
        catch (error) {
            console.error('Erro ao limpar notificações antigas:', error);
            throw new Error(`Erro ao limpar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
};
//# sourceMappingURL=index.js.map