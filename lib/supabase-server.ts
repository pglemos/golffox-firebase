import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Configuração específica para uso no servidor (APIs)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL é obrigatório')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatório')
}

// Cliente para uso exclusivo no servidor com service_role key
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'X-Client-Info': 'golffox-server-api',
    },
  },
})

// Função helper para criar cliente com headers corretos para requisições específicas
export function createSupabaseServerClient(apiKey?: string) {
  const key = apiKey || supabaseServiceKey
  
  return createClient<Database>(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'X-Client-Info': 'golffox-server-api',
      },
    },
  })
}