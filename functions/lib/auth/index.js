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
exports.authFunctions = void 0;
const admin = __importStar(require("firebase-admin"));
// Verificar se usuário tem permissão de admin
async function verifyAdminPermission(context, companyId) {
    if (!context.auth) {
        throw new Error('Usuário não autenticado');
    }
    const userDoc = await admin.firestore()
        .collection(`companies/${companyId}/users`)
        .doc(context.auth.uid)
        .get();
    if (!userDoc.exists) {
        throw new Error('Usuário não encontrado');
    }
    const userData = userDoc.data();
    return (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || (userData === null || userData === void 0 ? void 0 : userData.role) === 'super_admin';
}
exports.authFunctions = {
    // Criar novo usuário
    createUser: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar permissão de admin
            const hasPermission = await verifyAdminPermission(context, data.companyId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Validar dados
            if (!data.email || !data.password || !data.name || !data.role || !data.companyId) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            // Verificar se empresa existe
            const companyDoc = await admin.firestore()
                .collection('companies')
                .doc(data.companyId)
                .get();
            if (!companyDoc.exists) {
                throw new Error('Empresa não encontrada');
            }
            // Criar usuário no Firebase Auth
            const userRecord = await admin.auth().createUser({
                email: data.email,
                password: data.password,
                displayName: data.name,
            });
            // Definir claims customizados
            await admin.auth().setCustomUserClaims(userRecord.uid, {
                role: data.role,
                companyId: data.companyId,
            });
            // Criar documento do usuário no Firestore
            const userDoc = {
                email: data.email,
                name: data.name,
                role: data.role,
                company_id: data.companyId,
                is_active: true,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            };
            await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(userRecord.uid)
                .set(userDoc);
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'user_created',
                performed_by: context.auth.uid,
                target_user: userRecord.uid,
                details: {
                    email: data.email,
                    name: data.name,
                    role: data.role,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                userId: userRecord.uid,
                message: 'Usuário criado com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao criar usuário:', error);
            throw new Error(`Erro ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Atualizar role do usuário
    updateUserRole: async (data, context) => {
        var _a;
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar permissão de admin
            const hasPermission = await verifyAdminPermission(context, data.companyId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Validar dados
            if (!data.userId || !data.role || !data.companyId) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            // Verificar se usuário existe
            const userDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(data.userId)
                .get();
            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado');
            }
            // Atualizar claims customizados
            await admin.auth().setCustomUserClaims(data.userId, {
                role: data.role,
                companyId: data.companyId,
            });
            // Atualizar documento no Firestore
            await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(data.userId)
                .update({
                role: data.role,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'user_role_updated',
                performed_by: context.auth.uid,
                target_user: data.userId,
                details: {
                    new_role: data.role,
                    old_role: (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: 'Role do usuário atualizada com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao atualizar role do usuário:', error);
            throw new Error(`Erro ao atualizar role: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
    // Deletar usuário
    deleteUser: async (data, context) => {
        try {
            // Verificar autenticação
            if (!context.auth) {
                throw new Error('Usuário não autenticado');
            }
            // Verificar permissão de admin
            const hasPermission = await verifyAdminPermission(context, data.companyId);
            if (!hasPermission) {
                throw new Error('Permissão insuficiente');
            }
            // Validar dados
            if (!data.userId || !data.companyId) {
                throw new Error('Dados obrigatórios não fornecidos');
            }
            // Verificar se usuário existe
            const userDoc = await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(data.userId)
                .get();
            if (!userDoc.exists) {
                throw new Error('Usuário não encontrado');
            }
            const userData = userDoc.data();
            // Não permitir deletar super_admin
            if ((userData === null || userData === void 0 ? void 0 : userData.role) === 'super_admin') {
                throw new Error('Não é possível deletar super administrador');
            }
            // Não permitir que usuário delete a si mesmo
            if (data.userId === context.auth.uid) {
                throw new Error('Não é possível deletar sua própria conta');
            }
            // Deletar usuário do Firebase Auth
            await admin.auth().deleteUser(data.userId);
            // Marcar como inativo no Firestore (soft delete)
            await admin.firestore()
                .collection(`companies/${data.companyId}/users`)
                .doc(data.userId)
                .update({
                is_active: false,
                deleted_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Log da ação
            await admin.firestore()
                .collection(`companies/${data.companyId}/audit_logs`)
                .add({
                action: 'user_deleted',
                performed_by: context.auth.uid,
                target_user: data.userId,
                details: {
                    email: userData === null || userData === void 0 ? void 0 : userData.email,
                    name: userData === null || userData === void 0 ? void 0 : userData.name,
                    role: userData === null || userData === void 0 ? void 0 : userData.role,
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: 'Usuário deletado com sucesso',
            };
        }
        catch (error) {
            console.error('Erro ao deletar usuário:', error);
            throw new Error(`Erro ao deletar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    },
};
//# sourceMappingURL=index.js.map