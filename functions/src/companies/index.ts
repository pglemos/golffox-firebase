import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { Company, CompanyStatus } from '../types'

interface CreateCompanyData {
  name: string
  cnpj: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  subscription_plan?: string
}

interface UpdateCompanyData {
  companyId: string
  name?: string
  email?: string
  phone?: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
  status?: CompanyStatus
}

interface GetCompanyUsersData {
  companyId: string
  role?: string
  limit?: number
  offset?: number
}

// Verificar se usuário é super admin
async function verifySuperAdminPermission(context: CallableContext): Promise<boolean> {
  if (!context.auth) {
    return false
  }

  // Verificar claims customizados
  const userRecord = await admin.auth().getUser(context.auth.uid)
  return userRecord.customClaims?.role === 'super_admin'
}

// Verificar permissão de admin da empresa
async function verifyCompanyAdminPermission(context: CallableContext, companyId: string): Promise<boolean> {
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
  return userData?.role === 'admin' || userData?.role === 'super_admin'
}

export const companyFunctions = {
  // Criar nova empresa (apenas super admin)
  createCompany: async (data: CreateCompanyData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão de super admin
      const isSuperAdmin = await verifySuperAdminPermission(context)
      if (!isSuperAdmin) {
        throw new Error('Apenas super administradores podem criar empresas')
      }

      // Validar dados obrigatórios
      if (!data.name || !data.cnpj || !data.email || !data.phone || !data.address) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se CNPJ já existe
      const existingCompanySnapshot = await admin.firestore()
        .collection('companies')
        .where('cnpj', '==', data.cnpj)
        .get()

      if (!existingCompanySnapshot.empty) {
        throw new Error('CNPJ já cadastrado')
      }

      // Criar empresa
      const companyId = admin.firestore().collection('companies').doc().id
      const subscriptionPlan = data.subscription_plan || 'basic'
      
      // Definir limites baseados no plano
      const planLimits = {
        basic: { max_users: 10, max_vehicles: 5, max_routes: 50 },
        premium: { max_users: 50, max_vehicles: 20, max_routes: 200 },
        enterprise: { max_users: 200, max_vehicles: 100, max_routes: 1000 },
      }

      const limits = (planLimits as any)[subscriptionPlan] || planLimits.basic

      const companyData: Omit<Company, 'id'> = {
        name: data.name,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: 'active',
        subscription: {
          plan: subscriptionPlan,
          expires_at: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
          ),
          is_active: true,
        },
        settings: {
          max_users: limits.max_users,
          max_vehicles: limits.max_vehicles,
          max_routes: limits.max_routes,
          features: ['basic_tracking', 'route_management', 'user_management'],
        },
        created_at: admin.firestore.FieldValue.serverTimestamp() as any,
        updated_at: admin.firestore.FieldValue.serverTimestamp() as any,
      }

      await admin.firestore()
        .collection('companies')
        .doc(companyId)
        .set(companyData)

      // Criar perfis de permissão padrão para a empresa
      const defaultProfiles = [
        {
          name: 'Administrador',
          description: 'Acesso total ao sistema',
          permissions: ['*'],
          is_system: true,
          company_id: companyId,
        },
        {
          name: 'Gerente',
          description: 'Gerenciamento de rotas e motoristas',
          permissions: ['routes.*', 'drivers.*', 'vehicles.*', 'passengers.*'],
          is_system: true,
          company_id: companyId,
        },
        {
          name: 'Motorista',
          description: 'Acesso básico para motoristas',
          permissions: ['routes.read', 'checkin.*', 'profile.*'],
          is_system: true,
          company_id: companyId,
        },
      ]

      for (const profile of defaultProfiles) {
        await admin.firestore()
          .collection(`companies/${companyId}/permission_profiles`)
          .add({
            ...profile,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
      }

      // Log da ação
      await admin.firestore()
        .collection('audit_logs')
        .add({
          action: 'company_created',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'company',
            id: companyId,
          },
          details: {
            name: data.name,
            cnpj: data.cnpj,
            subscription_plan: subscriptionPlan,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        companyId,
        message: 'Empresa criada com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      throw new Error(`Erro ao criar empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar empresa
  updateCompany: async (data: UpdateCompanyData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão (super admin ou admin da empresa)
      const isSuperAdmin = await verifySuperAdminPermission(context)
      const isCompanyAdmin = await verifyCompanyAdminPermission(context, data.companyId)
      
      if (!isSuperAdmin && !isCompanyAdmin) {
        throw new Error('Permissão insuficiente')
      }

      // Verificar se empresa existe
      const companyDoc = await admin.firestore()
        .collection('companies')
        .doc(data.companyId)
        .get()

      if (!companyDoc.exists) {
        throw new Error('Empresa não encontrada')
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      if (data.name) updateData.name = data.name
      if (data.email) updateData.email = data.email
      if (data.phone) updateData.phone = data.phone
      if (data.address) updateData.address = data.address
      
      // Apenas super admin pode alterar status
      if (data.status && isSuperAdmin) {
        updateData.status = data.status
      }

      // Atualizar documento
      await admin.firestore()
        .collection('companies')
        .doc(data.companyId)
        .update(updateData)

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'company_updated',
          performed_by: context.auth.uid,
          details: {
            updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        message: 'Empresa atualizada com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      throw new Error(`Erro ao atualizar empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar usuários da empresa
  getCompanyUsers: async (data: GetCompanyUsersData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyCompanyAdminPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Construir query
      let query = admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .where('is_active', '==', true)

      if (data.role) {
        query = query.where('role', '==', data.role)
      }

      query = query.orderBy('created_at', 'desc')

      if (data.limit) {
        query = query.limit(data.limit)
      }

      if (data.offset) {
        // Para implementar offset, precisaríamos usar cursor-based pagination
        // Por simplicidade, vamos usar limit apenas
      }

      const snapshot = await query.get()

      const users = snapshot.docs.map(doc => {
        const userData = doc.data()
        return {
          id: doc.id,
          ...userData,
          created_at: userData.created_at?.toDate()?.toISOString(),
          updated_at: userData.updated_at?.toDate()?.toISOString(),
          last_login: userData.last_login?.toDate()?.toISOString(),
        }
      })

      // Buscar dados adicionais para motoristas
      const usersWithDriverData = await Promise.all(
        users.map(async (user) => {
          if ((user as any).role === 'driver') {
            const driverSnapshot = await admin.firestore()
              .collection(`companies/${data.companyId}/drivers`)
              .where('user_id', '==', user.id)
              .get()

            if (!driverSnapshot.empty) {
              const driverData = driverSnapshot.docs[0].data()
              return {
                ...user,
                driver: {
                  ...driverData,
                  license_expires_at: driverData.license_expires_at?.toDate()?.toISOString(),
                },
              }
            }
          }
          return user
        })
      )

      return {
        success: true,
        users: usersWithDriverData,
        total: users.length,
      }
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error)
      throw new Error(`Erro ao buscar usuários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}