import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'
import type { Database } from '../lib/supabase'

// Tipos genéricos para operações CRUD
export interface CrudResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface CrudListResponse<T> {
  data: T[]
  error: string | null
  count?: number
  totalCount?: number
}

export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterOptions {
  [key: string]: any
}

export interface SortOptions {
  column: string
  ascending?: boolean
}

// Classe base para operações CRUD
export abstract class BaseCrudService<
  TRow,
  TInsert,
  TUpdate,
  TTable extends keyof Database['public']['Tables']
> {
  protected client: SupabaseClient
  protected tableName: TTable
  protected useAdmin: boolean

  constructor(tableName: TTable, useAdmin = false) {
    this.tableName = tableName
    this.useAdmin = useAdmin
    this.client = getSupabaseClient(useAdmin)
  }

  /**
   * Busca um registro por ID
   */
  async findById(id: string): Promise<CrudResponse<TRow>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: data as TRow, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao buscar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Lista todos os registros com paginação e filtros
   */
  async findAll(
    options: {
      pagination?: PaginationOptions
      filters?: FilterOptions
      sort?: SortOptions
      select?: string
    } = {}
  ): Promise<CrudListResponse<TRow>> {
    try {
      let query = this.client.from(this.tableName).select(options.select || '*', { count: 'exact' })

      // Aplicar filtros
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else if (typeof value === 'string' && value.includes('%')) {
              query = query.ilike(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      // Aplicar ordenação
      if (options.sort) {
        query = query.order(options.sort.column, { ascending: options.sort.ascending ?? true })
      }

      // Aplicar paginação
      if (options.pagination) {
        const { page = 1, limit = 50, offset } = options.pagination
        const startIndex = offset ?? (page - 1) * limit
        const endIndex = startIndex + limit - 1
        query = query.range(startIndex, endIndex)
      }

      const { data, error, count } = await query

      if (error) {
        return { data: [], error: this.translateError(error.message), count: 0 }
      }

      return { 
        data: (data as TRow[]) || [], 
        error: null, 
        count: data?.length || 0,
        totalCount: count || 0
      }
    } catch (error) {
      return { 
        data: [], 
        error: `Erro ao listar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Cria um novo registro
   */
  async create(data: TInsert): Promise<CrudResponse<TRow>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: result as TRow, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao criar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Cria múltiplos registros
   */
  async createMany(data: TInsert[]): Promise<CrudListResponse<TRow>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .insert(data)
        .select()

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: (result as TRow[]) || [], error: null, count: result?.length || 0 }
    } catch (error) {
      return { 
        data: [], 
        error: `Erro ao criar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Atualiza um registro por ID
   */
  async update(id: string, data: TUpdate): Promise<CrudResponse<TRow>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: result as TRow, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao atualizar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Atualiza múltiplos registros com filtros
   */
  async updateMany(filters: FilterOptions, data: TUpdate): Promise<CrudListResponse<TRow>> {
    try {
      let query = this.client.from(this.tableName).update(data)

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data: result, error } = await query.select()

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: (result as TRow[]) || [], error: null, count: result?.length || 0 }
    } catch (error) {
      return { 
        data: [], 
        error: `Erro ao atualizar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Remove um registro por ID
   */
  async delete(id: string): Promise<CrudResponse<TRow>> {
    try {
      const { data: result, error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: result as TRow, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao remover registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Remove múltiplos registros com filtros
   */
  async deleteMany(filters: FilterOptions): Promise<CrudListResponse<TRow>> {
    try {
      let query = this.client.from(this.tableName).delete()

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data: result, error } = await query.select()

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: (result as TRow[]) || [], error: null, count: result?.length || 0 }
    } catch (error) {
      return { 
        data: [], 
        error: `Erro ao remover registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Conta registros com filtros
   */
  async count(filters: FilterOptions = {}): Promise<CrudResponse<number>> {
    try {
      let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true })

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      const { count, error } = await query

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: count || 0, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao contar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Verifica se um registro existe
   */
  async exists(id: string): Promise<CrudResponse<boolean>> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id)

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data: (count || 0) > 0, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro ao verificar existência: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }

  /**
   * Traduz erros do Supabase para mensagens amigáveis
   */
  protected translateError(error: string): string {
    const errorMap: { [key: string]: string } = {
      'duplicate key value violates unique constraint': 'Registro já existe',
      'foreign key constraint': 'Referência inválida',
      'check constraint': 'Dados inválidos',
      'not null constraint': 'Campo obrigatório não preenchido',
      'permission denied': 'Permissão negada',
      'row level security': 'Acesso negado pelas políticas de segurança',
      'infinite recursion detected': 'Erro de configuração de segurança',
    }

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(key)) {
        return message
      }
    }

    return `Erro no banco de dados: ${error}`
  }

  /**
   * Executa uma transação
   */
  async transaction<T>(
    callback: (client: SupabaseClient) => Promise<T>
  ): Promise<CrudResponse<T>> {
    try {
      const result = await callback(this.client)
      return { data: result, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: `Erro na transação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }
    }
  }
}