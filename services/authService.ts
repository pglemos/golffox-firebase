import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Tipos baseados no schema do Supabase
export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type UserRole = 'admin' | 'operator' | 'driver' | 'passenger';
export type CompanyStatus = 'Ativo' | 'Inativo';

// Interfaces para autenticação
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: Session | null;
  error: string | null;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  password: string;
  newPassword: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    // Configura listener para mudanças de autenticação
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.notifyAuthListeners(null);
      }
    });

    // Carrega usuário atual se já estiver logado
    this.initializeAuth();
  }

  /**
   * Inicializa autenticação verificando sessão existente
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserProfile(session.user);
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
    }
  }

  /**
   * Carrega perfil completo do usuário do banco de dados
   */
  private async loadUserProfile(user: User): Promise<void> {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            status
          ),
          permission_profiles (
            id,
            name,
            access
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (userProfile) {
        this.currentUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role as UserRole,
          companyId: userProfile.company_id,
          companyName: userProfile.companies?.name || 'Empresa não encontrada',
          isActive: true, // Assumindo que usuários carregados estão ativos
          lastLogin: undefined, // Campo não existe na tabela
          createdAt: new Date(userProfile.created_at)
        };

        // Atualiza último login
        await this.updateLastLogin();
        
        this.notifyAuthListeners(this.currentUser);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      this.currentUser = null;
      this.notifyAuthListeners(null);
    }
  }

  /**
   * Atualiza timestamp do último login
   */
  private async updateLastLogin(): Promise<void> {
    if (!this.currentUser) return;

    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', this.currentUser.id);
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  /**
   * Notifica listeners sobre mudanças de autenticação
   */
  private notifyAuthListeners(user: AuthUser | null): void {
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Erro ao notificar listener de autenticação:', error);
      }
    });
  }

  /**
   * Adiciona listener para mudanças de autenticação
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authListeners.push(callback);
    
    // Retorna função para remover o listener
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  /**
   * Realiza login do usuário
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: this.translateAuthError(error.message)
        };
      }

      if (data.user) {
        await this.loadUserProfile(data.user);
      }

      return {
        user: this.currentUser,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        user: null,
        session: null,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Registra novo usuário
   */
  async signUp(registerData: RegisterData): Promise<AuthResponse> {
    try {
      // Usa o cliente admin para criar usuário (server-side)
      if (!supabaseAdmin) {
        return {
          user: null,
          session: null,
          error: 'Configuração de admin não disponível'
        };
      }

      // Primeiro, cria o usuário no Supabase Auth usando admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: registerData.email,
        password: registerData.password,
        email_confirm: true // Confirma email automaticamente
      });

      if (authError) {
        return {
          user: null,
          session: null,
          error: this.translateAuthError(authError.message)
        };
      }

      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: 'Falha ao criar usuário'
        };
      }

      // Depois, cria o perfil do usuário na tabela users usando admin client
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: registerData.email,
          name: registerData.name,
          role: registerData.role,
          company_id: registerData.companyId
        });

      if (profileError) {
        // Se falhar ao criar perfil, remove o usuário do Auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        
        return {
          user: null,
          session: null,
          error: 'Erro ao criar perfil do usuário'
        };
      }

      // Carrega o perfil completo
      if (authData.user) {
        await this.loadUserProfile(authData.user);
      }

      return {
        user: this.currentUser,
        session: null,
        error: null
      };
    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        user: null,
        session: null,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Realiza logout do usuário
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: this.translateAuthError(error.message) };
      }

      this.currentUser = null;
      this.notifyAuthListeners(null);

      return { error: null };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { error: 'Erro interno do servidor' };
    }
  }

  /**
   * Solicita reset de senha
   */
  async resetPassword(data: PasswordResetData): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { error: this.translateAuthError(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return { error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza senha do usuário
   */
  async updatePassword(data: PasswordUpdateData): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        return { error: this.translateAuthError(error.message) };
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return { error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'role'>>): Promise<{ error: string | null }> {
    if (!this.currentUser) {
      return { error: 'Usuário não autenticado' };
    }

    try {
      const updateData: Partial<UserUpdate> = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.role) updateData.role = updates.role;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', this.currentUser.id);

      if (error) throw error;

      // Recarrega o perfil do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.loadUserProfile(user);
      }

      return { error: null };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { error: 'Erro ao atualizar perfil' };
    }
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   * Simplificado para retornar true para usuários autenticados
   */
  async hasPermission(permission: string): Promise<boolean> {
    return this.currentUser !== null;
  }

  /**
   * Verifica se o usuário tem um dos papéis especificados
   */
  hasRole(roles: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.currentUser.role);
  }

  /**
   * Obtém usuário atual
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Obtém sessão atual
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  /**
   * Traduz erros de autenticação para português
   */
  private translateAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Credenciais de login inválidas',
      'Email not confirmed': 'Email não confirmado',
      'User not found': 'Usuário não encontrado',
      'Invalid email': 'Email inválido',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
      'User already registered': 'Usuário já cadastrado',
      'Email already registered': 'Email já cadastrado',
      'Signup is disabled': 'Cadastro desabilitado',
      'Email rate limit exceeded': 'Limite de emails excedido',
      'Invalid refresh token': 'Token de atualização inválido',
      'Token has expired': 'Token expirado'
    };

    return errorMap[error] || error;
  }

  /**
   * Obtém todos os usuários da empresa (apenas para admins e operadores)
   */
  async getCompanyUsers(): Promise<AuthUser[]> {
    if (!this.currentUser || !this.hasRole(['admin', 'operator'])) {
      throw new Error('Acesso negado');
    }

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            status
          ),
          permission_profiles (
            id,
            name,
            access
          )
        `)
        .eq('company_id', this.currentUser.companyId);

      if (error) throw error;

      return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        companyId: user.company_id,
        companyName: user.companies?.name || 'Empresa não encontrada',
        profileId: user.profile_id || undefined,
        isActive: user.is_active,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined,
        createdAt: new Date(user.created_at)
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error);
      throw error;
    }
  }

  /**
   * Ativa/desativa usuário (apenas para admins)
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ error: string | null }> {
    if (!this.currentUser || !this.hasRole('admin')) {
      return { error: 'Acesso negado' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      return { error: 'Erro ao alterar status do usuário' };
    }
  }
}

// Instância singleton
export const authService = AuthService.getInstance();