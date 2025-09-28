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
exports.userFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
// Verificar permissão do usuário
async function verifyUserPermission(context, companyId, targetUserId) {
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
    const userRole = userData === null || userData === void 0 ? void 0 : userData.role;
    // Admin e manager podem acessar qualquer usuário
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
        return true;
    }
    // Usuário comum só pode acessar próprio perfil
    return !targetUserId || targetUserId === context.auth.uid;
}
exports.userFunctions = {
    // Buscar perfil do usuário
    getUserProfile: async (data, context) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            const targetUserId = data.userId || context.auth.uid;
            // Verificar permissão
            const hasPermission = await verifyUserPermission(context, data.companyId, targetUserId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Buscar dados do usuário
            const userDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(targetUserId)
                .get();
            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado');
            }
            const userData = userDoc.data();
            // Buscar dados adicionais se for motorista
            let driverData = null;
            if ((userData === null || userData === void 0 ? void 0 : userData.role) === 'driver') {
                const driverSnapshot = await admin.firestore()
                    .collection(`companies/${data.companyId}/drivers`)
                    .where('user_id', '==', targetUserId)
                    .get();
                if (!driverSnapshot.empty) {
                    driverData = driverSnapshot.docs[0].data();
                }
            }
            return {
                success: true,
                user: Object.assign(Object.assign({ id: userDoc.id }, userData), { created_at: (_b = (_a = userData === null || userData === void 0 ? void 0 : userData.created_at) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toISOString(), updated_at: (_d = (_c = userData === null || userData === void 0 ? void 0 : userData.updated_at) === null || _c === void 0 ? void 0 : _c.toDate()) === null || _d === void 0 ? void 0 : _d.toISOString(), last_login: (_f = (_e = userData === null || userData === void 0 ? void 0 : userData.last_login) === null || _e === void 0 ? void 0 : _e.toDate()) === null || _f === void 0 ? void 0 : _f.toISOString() }),
                driver: driverData ? Object.assign(Object.assign({}, driverData), { license_expires_at: (_h = (_g = driverData.license_expires_at) === null || _g === void 0 ? void 0 : _g.toDate()) === null || _h === void 0 ? void 0 : _h.toISOString(), created_at: (_k = (_j = driverData.created_at) === null || _j === void 0 ? void 0 : _j.toDate()) === null || _k === void 0 ? void 0 : _k.toISOString(), updated_at: (_m = (_l = driverData.updated_at) === null || _l === void 0 ? void 0 : _l.toDate()) === null || _m === void 0 ? void 0 : _m.toISOString() }) : null,
            };
        }
        catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            throw new Error(`Erro ao buscar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Atualizar perfil do usuário
    updateUserProfile: async (data, context) => {
        var _a;
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            const targetUserId = data.userId || context.auth.uid;
            // Verificar permissão
            const hasPermission = await verifyUserPermission(context, data.companyId, targetUserId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Verificar se usuário existe
            const userDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(targetUserId)
                .get();
            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado');
            }
            // Preparar dados para atualização
            const updateData = {
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (data.name) {
                updateData.name = data.name;
                // Atualizar também no Firebase Auth se for o próprio usuário
                if (targetUserId === context.auth.uid) {
                    await admin.auth().updateUser(targetUserId, {
                        displayName: data.name,
                    });
                }
            }
            if (data.phone !== undefined || data.avatar_url !== undefined || data.department !== undefined) {
                const currentProfile = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.profile) || {};
                updateData.profile = Object.assign({}, currentProfile);
                if (data.phone !== undefined) {
                    updateData.profile.phone = data.phone;
                }
                if (data.avatar_url !== undefined) {
                    updateData.profile.avatar_url = data.avatar_url;
                }
                if (data.department !== undefined) {
                    updateData.profile.department = data.department;
                }
            }
            // Atualizar documento
            await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(targetUserId)
                .update(updateData);
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'user_profile_updated',
                performed_by: context.auth.uid,
                target_user: targetUserId,
                details: {
                    updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: 'Perfil atualizado com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao atualizar perfil do usuário:', error);
            throw new Error(`Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
};
//# sourceMappingURL=index.js.map