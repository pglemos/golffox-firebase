import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Validação de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL é obrigatório')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatório')
}

// Configurações de segurança para o cliente
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  global: {
    headers: {
      'X-Client-Info': 'golffox-management-panel',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}

// Cliente público para uso no frontend com configurações de segurança
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)

// Cliente com privilégios de service_role para operações administrativas (apenas server-side)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'golffox-admin-client',
        },
      },
    })
  : null

// Função para verificar se estamos no servidor
export const isServer = typeof window === 'undefined'

// Função para obter o cliente apropriado baseado no contexto
export const getSupabaseClient = (useAdmin = false): SupabaseClient<Database> => {
  if (useAdmin && isServer && supabaseAdmin) {
    return supabaseAdmin as SupabaseClient<Database>
  }
  return supabase as SupabaseClient<Database>
}

// Tipos para o banco de dados
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'operator' | 'driver' | 'passenger'
          company_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'operator' | 'driver' | 'passenger'
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'operator' | 'driver' | 'passenger'
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          cnpj: string
          contact: string
          status: 'Ativo' | 'Inativo'
          address_text: string
          address_lat: number
          address_lng: number
          contracted_passengers: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cnpj: string
          contact: string
          status?: 'Ativo' | 'Inativo'
          address_text: string
          address_lat: number
          address_lng: number
          contracted_passengers: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string
          contact?: string
          status?: 'Ativo' | 'Inativo'
          address_text?: string
          address_lat?: number
          address_lng?: number
          contracted_passengers?: number
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          cpf: string
          rg: string
          birth_date: string
          phone: string
          email: string
          address: string
          cep: string
          cnh: string
          cnh_validity: string
          cnh_category: 'D' | 'E'
          has_ear: boolean
          transport_course_file?: string
          transport_course_validity?: string
          last_toxicological_exam: string
          photo_url: string
          cnh_file?: string
          residence_proof_file?: string
          course_file?: string
          toxicological_exam_file?: string
          id_photo_file?: string
          contract_type: 'CLT' | 'terceirizado' | 'autônomo'
          credentialing_date: string
          status: 'Ativo' | 'Em análise' | 'Inativo'
          linked_company: string
          assigned_routes: string[]
          availability: string
          last_update: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cpf: string
          rg: string
          birth_date: string
          phone: string
          email: string
          address: string
          cep: string
          cnh: string
          cnh_validity: string
          cnh_category: 'D' | 'E'
          has_ear: boolean
          transport_course_file?: string
          transport_course_validity?: string
          last_toxicological_exam: string
          photo_url: string
          cnh_file?: string
          residence_proof_file?: string
          course_file?: string
          toxicological_exam_file?: string
          id_photo_file?: string
          contract_type: 'CLT' | 'terceirizado' | 'autônomo'
          credentialing_date: string
          status?: 'Ativo' | 'Em análise' | 'Inativo'
          linked_company: string
          assigned_routes?: string[]
          availability: string
          last_update: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cpf?: string
          rg?: string
          birth_date?: string
          phone?: string
          email?: string
          address?: string
          cep?: string
          cnh?: string
          cnh_validity?: string
          cnh_category?: 'D' | 'E'
          has_ear?: boolean
          transport_course_file?: string
          transport_course_validity?: string
          last_toxicological_exam?: string
          photo_url?: string
          cnh_file?: string
          residence_proof_file?: string
          course_file?: string
          toxicological_exam_file?: string
          id_photo_file?: string
          contract_type?: 'CLT' | 'terceirizado' | 'autônomo'
          credentialing_date?: string
          status?: 'Ativo' | 'Em análise' | 'Inativo'
          linked_company?: string
          assigned_routes?: string[]
          availability?: string
          last_update?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate: string
          model: string
          driver_id?: string
          status: 'Em Movimento' | 'Parado' | 'Com Problema' | 'Garagem'
          position_lat: number
          position_lng: number
          route_id?: string
          last_maintenance: string
          next_maintenance: string
          is_registered: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plate: string
          model: string
          driver_id?: string
          status?: 'Em Movimento' | 'Parado' | 'Com Problema' | 'Garagem'
          position_lat: number
          position_lng: number
          route_id?: string
          last_maintenance: string
          next_maintenance: string
          is_registered?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plate?: string
          model?: string
          driver_id?: string
          status?: 'Em Movimento' | 'Parado' | 'Com Problema' | 'Garagem'
          position_lat?: number
          position_lng?: number
          route_id?: string
          last_maintenance?: string
          next_maintenance?: string
          is_registered?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      passengers: {
        Row: {
          id: string
          name: string
          cpf: string
          email: string
          address: string
          position_lat: number
          position_lng: number
          pickup_time: string
          photo_url: string
          company_id: string
          permission_profile_id: string
          status: 'Ativo' | 'Inativo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cpf: string
          email: string
          address: string
          position_lat: number
          position_lng: number
          pickup_time: string
          photo_url: string
          company_id: string
          permission_profile_id: string
          status?: 'Ativo' | 'Inativo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cpf?: string
          email?: string
          address?: string
          position_lat?: number
          position_lng?: number
          pickup_time?: string
          photo_url?: string
          company_id?: string
          permission_profile_id?: string
          status?: 'Ativo' | 'Inativo'
          created_at?: string
          updated_at?: string
        }
      }
      routes: {
        Row: {
          id: string
          name: string
          driver_id?: string
          vehicle_id?: string
          status: 'No Horário' | 'Atrasado' | 'Com Problema'
          scheduled_start: string
          actual_start?: string
          punctuality: number
          start_location?: string
          destination?: string
          origin?: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          driver_id?: string
          vehicle_id?: string
          status?: 'No Horário' | 'Atrasado' | 'Com Problema'
          scheduled_start: string
          actual_start?: string
          punctuality?: number
          start_location?: string
          destination?: string
          origin?: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          driver_id?: string
          vehicle_id?: string
          status?: 'No Horário' | 'Atrasado' | 'Com Problema'
          scheduled_start?: string
          actual_start?: string
          punctuality?: number
          start_location?: string
          destination?: string
          origin?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      route_passengers: {
        Row: {
          id: string
          route_id: string
          passenger_id: string
          pickup_order: number
          is_onboard: boolean
          pickup_time?: string
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          passenger_id: string
          pickup_order: number
          is_onboard?: boolean
          pickup_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          passenger_id?: string
          pickup_order?: number
          is_onboard?: boolean
          pickup_time?: string
          created_at?: string
        }
      }
      permission_profiles: {
        Row: {
          id: string
          name: string
          description: string
          access: string[]
          is_admin_feature: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          access: string[]
          is_admin_feature?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          access?: string[]
          is_admin_feature?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          type: 'Crítico' | 'Atenção' | 'Informativo'
          title: string
          message: string
          timestamp: string
          user_id?: string
          route_id?: string
          vehicle_id?: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: 'Crítico' | 'Atenção' | 'Informativo'
          title: string
          message: string
          timestamp: string
          user_id?: string
          route_id?: string
          vehicle_id?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'Crítico' | 'Atenção' | 'Informativo'
          title?: string
          message?: string
          timestamp?: string
          user_id?: string
          route_id?: string
          vehicle_id?: string
          is_read?: boolean
          created_at?: string
        }
      }
      route_history: {
        Row: {
          id: string
          route_id: string
          route_name: string
          driver_id: string
          driver_name: string
          vehicle_id: string
          vehicle_plate: string
          execution_date: string
          start_time: string
          end_time?: string
          total_time?: number
          total_distance?: number
          passengers_boarded: number
          passengers_not_boarded: number
          total_passengers: number
          fuel_consumption?: number
          operational_cost?: number
          punctuality: number
          route_optimization?: number
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          route_name: string
          driver_id: string
          driver_name: string
          vehicle_id: string
          vehicle_plate: string
          execution_date: string
          start_time: string
          end_time?: string
          total_time?: number
          total_distance?: number
          passengers_boarded: number
          passengers_not_boarded: number
          total_passengers: number
          fuel_consumption?: number
          operational_cost?: number
          punctuality?: number
          route_optimization?: number
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          route_name?: string
          driver_id?: string
          driver_name?: string
          vehicle_id?: string
          vehicle_plate?: string
          execution_date?: string
          start_time?: string
          end_time?: string
          total_time?: number
          total_distance?: number
          passengers_boarded?: number
          passengers_not_boarded?: number
          total_passengers?: number
          fuel_consumption?: number
          operational_cost?: number
          punctuality?: number
          route_optimization?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}