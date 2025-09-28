import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'

interface GetUserProfileData {
  userId?: string
  companyId: string
}

interface UpdateUserProfileData {
  userId?: string
  companyId: string
  name?: string
  phone?: string
  avatar_url?: string
  department?: string
}

// Verificar permissão do usuário
async function verifyUserPermission(context: CallableContext, companyId: string, targetUserId?: string): Promise<boolean> {
  if (!context.auth) {
    return false
  }

  const userDoc = await admin.firestore()
    .collection(`companies/${companyId}/users`)
    .doc(context.auth.uid)
    .get()

  if (!userDoc.exists) {
    return false
  }

  const userData = userDoc.data()
  const userRole = userData?.role

  // Admin e manager podem acessar qualquer usuário
  if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
    return true
  }

  // Usuário comum só pode acessar próprio perfil
  return !targetUserId || targetUserId === context.auth.uid
}

export const userFunctions = {
  // Buscar perfil do usuário
  getUserProfile: async (data: GetUserProfileData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      const targetUserId = data.userId || context.auth.uid

      // Verificar permissão
      const hasPermission = await verifyUserPermission(context, data.companyId, targetUserId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Buscar dados do usuário
      const userDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(targetUserId)
        .get()

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado')
      }

      const userData = userDoc.data()

      // Buscar dados adicionais se for motorista
      let driverData = null
      if (userData?.role === 'driver') {
        const driverSnapshot = await admin.firestore()
          .collection(`companies/${data.companyId}/drivers`)
          .where('user_id', '==', targetUserId)
          .get()

        if (!driverSnapshot.empty) {
          driverData = driverSnapshot.docs[0].data()
        }
      }

      return {
        success: true,
        user: {
          id: userDoc.id,
          ...userData,
          created_at: userData?.created_at?.toDate()?.toISOString(),
          updated_at: userData?.updated_at?.toDate()?.toISOString(),
          last_login: userData?.last_login?.toDate()?.toISOString(),
        },
        driver: driverData ? {
          ...driverData,
          license_expires_at: driverData.license_expires_at?.toDate()?.toISOString(),
          created_at: driverData.created_at?.toDate()?.toISOString(),
          updated_at: driverData.updated_at?.toDate()?.toISOString(),
        } : null,
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      throw new Error(`Erro ao buscar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar perfil do usuário
  updateUserProfile: async (data: UpdateUserProfileData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      const targetUserId = data.userId || context.auth.uid

      // Verificar permissão
      const hasPermission = await verifyUserPermission(context, data.companyId, targetUserId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Verificar se usuário existe
      const userDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(targetUserId)
        .get()

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado')
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      if (data.name) {
        updateData.name = data.name
        
        // Atualizar também no Firebase Auth se for o próprio usuário
        if (targetUserId === context.auth.uid) {
          await admin.auth().updateUser(targetUserId, {
            displayName: data.name,
          })
        }
      }

      if (data.phone !== undefined || data.avatar_url !== undefined || data.department !== undefined) {
        const currentProfile = userDoc.data()?.profile || {}
        updateData.profile = {
          ...currentProfile,
        }

        if (data.phone !== undefined) {
          updateData.profile.phone = data.phone
        }
        if (data.avatar_url !== undefined) {
          updateData.profile.avatar_url = data.avatar_url
        }
        if (data.department !== undefined) {
          updateData.profile.department = data.department
        }
      }

      // Atualizar documento
      await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(targetUserId)
        .update(updateData)

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
        })

      return {
        success: true,
        message: 'Perfil atualizado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error)
      throw new Error(`Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}