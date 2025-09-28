import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { UserRole } from '../types'

interface CreateUserData {
  email: string
  password: string
  name: string
  role: UserRole
  companyId: string
}

interface UpdateUserRoleData {
  userId: string
  role: UserRole
  companyId: string
}

interface DeleteUserData {
  userId: string
  companyId: string
}

// Verificar se usuário tem permissão de admin
async function verifyAdminPermission(context: CallableContext, companyId: string): Promise<boolean> {
  if (!context.auth) {
    throw new Error('Usuário não autenticado')
  }

  const userDoc = await admin.firestore()
    .collection(`companies/${companyId}/users`)
    .doc(context.auth.uid)
    .get()

  if (!userDoc.exists) {
    throw new Error('Usuário não encontrado')
  }

  const userData = userDoc.data()
  return userData?.role === 'admin' || userData?.role === 'super_admin'
}

export const authFunctions = {
  // Criar novo usuário
  createUser: async (data: CreateUserData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão de admin
      const hasPermission = await verifyAdminPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados
      if (!data.email || !data.password || !data.name || !data.role || !data.companyId) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se empresa existe
      const companyDoc = await admin.firestore()
        .collection('companies')
        .doc(data.companyId)
        .get()

      if (!companyDoc.exists) {
        throw new Error('Empresa não encontrada')
      }

      // Criar usuário no Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      })

      // Definir claims customizados
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: data.role,
        companyId: data.companyId,
      })

      // Criar documento do usuário no Firestore
      const userDoc = {
        email: data.email,
        name: data.name,
        role: data.role,
        company_id: data.companyId,
        is_active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(userRecord.uid)
        .set(userDoc)

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
        })

      return {
        success: true,
        userId: userRecord.uid,
        message: 'Usuário criado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(`Erro ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar role do usuário
  updateUserRole: async (data: UpdateUserRoleData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão de admin
      const hasPermission = await verifyAdminPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados
      if (!data.userId || !data.role || !data.companyId) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se usuário existe
      const userDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .get()

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado')
      }

      // Atualizar claims customizados
      await admin.auth().setCustomUserClaims(data.userId, {
        role: data.role,
        companyId: data.companyId,
      })

      // Atualizar documento no Firestore
      await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .update({
          role: data.role,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'user_role_updated',
          performed_by: context.auth.uid,
          target_user: data.userId,
          details: {
            new_role: data.role,
            old_role: userDoc.data()?.role,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        message: 'Role do usuário atualizada com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error)
      throw new Error(`Erro ao atualizar role: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Deletar usuário
  deleteUser: async (data: DeleteUserData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão de admin
      const hasPermission = await verifyAdminPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados
      if (!data.userId || !data.companyId) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se usuário existe
      const userDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .get()

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado')
      }

      const userData = userDoc.data()

      // Não permitir deletar super_admin
      if (userData?.role === 'super_admin') {
        throw new Error('Não é possível deletar super administrador')
      }

      // Não permitir que usuário delete a si mesmo
      if (data.userId === context.auth.uid) {
        throw new Error('Não é possível deletar sua própria conta')
      }

      // Deletar usuário do Firebase Auth
      await admin.auth().deleteUser(data.userId)

      // Marcar como inativo no Firestore (soft delete)
      await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .update({
          is_active: false,
          deleted_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'user_deleted',
          performed_by: context.auth.uid,
          target_user: data.userId,
          details: {
            email: userData?.email,
            name: userData?.name,
            role: userData?.role,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        message: 'Usuário deletado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      throw new Error(`Erro ao deletar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}