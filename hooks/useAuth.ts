import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { authService, type AuthUser, type UserRole } from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signUp: (email: string, password: string, userData: {
    name: string;
    role: UserRole;
    companyId: string;
  }) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: {
    name?: string;
    email?: string;
  }) => Promise<{ user: AuthUser | null; error: AuthError | null }>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        const currentSession = await authService.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    try {
      const result = await authService.signIn({ email, password });
      if (result.user) {
        setUser(result.user);
        return { user: result.user, error: null };
      }
      return { 
        user: null, 
        error: {
          message: result.error || 'Erro ao fazer login',
          name: 'SignInError',
          status: 400
        } as AuthError
      };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'Erro ao fazer login',
          name: 'SignInError',
          status: 400
        } as AuthError
      };
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    role: UserRole;
    companyId: string;
  }): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    try {
      const result = await authService.signUp({
        email,
        password,
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId
      });
      
      if (result.user) {
        setUser(result.user);
        return { user: result.user, error: null };
      }
      return { 
        user: null, 
        error: {
          message: result.error || 'Erro ao criar conta',
          name: 'SignUpError',
          status: 400
        } as AuthError
      };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'Erro ao criar conta',
          name: 'SignUpError',
          status: 400
        } as AuthError
      };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Erro ao fazer logout',
          name: 'SignOutError',
          status: 400
        } as AuthError
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      await authService.resetPassword({ email });
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Erro ao redefinir senha',
          name: 'ResetPasswordError',
          status: 400
        } as AuthError
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    try {
      await authService.updatePassword({ password: '', newPassword });
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Erro ao atualizar senha',
          name: 'UpdatePasswordError',
          status: 400
        } as AuthError
      };
    }
  };

  const updateProfile = async (updates: { name?: string; email?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    try {
      await authService.updateProfile(updates);
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
      return { user: updatedUser, error: null };
    } catch (error: any) {
      return {
        user: null,
        error: {
          message: error.message || 'Erro ao atualizar perfil',
          name: 'UpdateProfileError',
          status: 400
        } as AuthError
      };
    }
  };

  const refreshSession = async () => {
    try {
      const newSession = await authService.getSession();
      setSession(newSession);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_companies'],
      operator: ['read', 'write', 'manage_routes'],
      driver: ['read', 'update_status'],
      passenger: ['read']
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const isRole = (role: string): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    hasPermission,
    isRole
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export function useRequireAuth(): AuthUser {
  const { user, loading } = useAuth();
  
  if (loading) {
    throw new Error('Authentication is loading');
  }
  
  if (!user) {
    throw new Error('Usuario nao autenticado');
  }
  
  return user;
}

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRole(role: string): boolean {
  const { isRole } = useAuth();
  return isRole(role);
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback 
}: { 
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return React.createElement('div', null, 'Carregando...');
  }

  if (!user) {
    return fallback || React.createElement('div', null, 'Usuario nao autenticado');
  }

  if (requiredRole && user.role !== requiredRole) {
    return fallback || React.createElement('div', null, 'Permissao insuficiente');
  }

  if (requiredPermission && !usePermission(requiredPermission)) {
    return fallback || React.createElement('div', null, 'Permissao insuficiente');
  }

  return React.createElement(React.Fragment, null, children);
}

export type { AuthUser };