import * as React from 'react';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  updateEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'operator' | 'driver' | 'passenger';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthError {
  message: string;
  name: string;
  status: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
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
  getIdToken: () => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário no Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || firebaseUser.displayName || '',
          role: userData.role || 'passenger',
          companyId: userData.companyId || '',
          status: userData.status || 'active',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(userCredential.user);
      
      if (userData) {
        return { user: userData, error: null };
      }
      
      return { 
        user: null, 
        error: {
          message: 'Dados do usuário não encontrados',
          name: 'UserDataError',
          status: 404
        } as AuthError
      };
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado';
          break;
        default:
          errorMessage = error.message || 'Erro ao fazer login';
      }
      
      return {
        user: null,
        error: {
          message: errorMessage,
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualizar perfil do Firebase
      await firebaseUpdateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      // Criar documento do usuário no Firestore
      const newUser: AuthUser = {
        id: userCredential.user.uid,
        email: email,
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return { user: newUser, error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca';
          break;
        default:
          errorMessage = error.message || 'Erro ao criar conta';
      }
      
      return {
        user: null,
        error: {
          message: errorMessage,
          name: 'SignUpError',
          status: 400
        } as AuthError
      };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      await firebaseSignOut(auth);
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
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao redefinir senha';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = error.message || 'Erro ao redefinir senha';
      }
      
      return {
        error: {
          message: errorMessage,
          name: 'ResetPasswordError',
          status: 400
        } as AuthError
      };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    try {
      if (!firebaseUser) {
        return {
          error: {
            message: 'Usuário não autenticado',
            name: 'UpdatePasswordError',
            status: 401
          } as AuthError
        };
      }
      
      await firebaseUpdatePassword(firebaseUser, newPassword);
      return { error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao atualizar senha';
      
      switch (error.code) {
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'É necessário fazer login novamente para alterar a senha';
          break;
        default:
          errorMessage = error.message || 'Erro ao atualizar senha';
      }
      
      return {
        error: {
          message: errorMessage,
          name: 'UpdatePasswordError',
          status: 400
        } as AuthError
      };
    }
  };

  const updateProfile = async (updates: { name?: string; email?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
    try {
      if (!firebaseUser) {
        return {
          user: null,
          error: {
            message: 'Usuário não autenticado',
            name: 'UpdateProfileError',
            status: 401
          } as AuthError
        };
      }

      // Atualizar perfil no Firebase Auth
      if (updates.name) {
        await firebaseUpdateProfile(firebaseUser, { displayName: updates.name });
      }

      // Atualizar email se fornecido
      if (updates.email) {
        await updateEmail(firebaseUser, updates.email);
      }

      // Atualizar documento do usuário no Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        updatedAt: serverTimestamp()
      });

      // Buscar dados atualizados
      const updatedUserData = await fetchUserData(firebaseUser);
      setUser(updatedUserData);
      
      return { user: updatedUserData, error: null };
    } catch (error: any) {
      let errorMessage = 'Erro ao atualizar perfil';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'É necessário fazer login novamente para alterar o email';
          break;
        default:
          errorMessage = error.message || 'Erro ao atualizar perfil';
      }
      
      return {
        user: null,
        error: {
          message: errorMessage,
          name: 'UpdateProfileError',
          status: 400
        } as AuthError
      };
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      if (!firebaseUser) return null;
      return await firebaseUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
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
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    getIdToken,
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
  const hasRequiredPermission = usePermission(requiredPermission || '');

  if (loading) {
    return React.createElement('div', null, 'Carregando...');
  }

  if (!user) {
    return fallback || React.createElement('div', null, 'Usuario nao autenticado');
  }

  if (requiredRole && user.role !== requiredRole) {
    return fallback || React.createElement('div', null, 'Permissao insuficiente');
  }

  if (requiredPermission && !hasRequiredPermission) {
    return fallback || React.createElement('div', null, 'Permissao insuficiente');
  }

  return React.createElement(React.Fragment, null, children);
}