import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  updateEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  collection,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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
  firebaseUser: FirebaseUser | null;
  error: string | null;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export class AuthService {
  // Fazer login
  async signIn({ email, password }: LoginCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Buscar dados do usuário no Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return {
          user: null,
          firebaseUser: null,
          error: 'Dados do usuário não encontrados'
        };
      }

      const userData = userDoc.data();
      
      // Verificar se o usuário está ativo
      if (!userData.isActive) {
        await signOut(auth);
        return {
          user: null,
          firebaseUser: null,
          error: 'Usuário inativo. Entre em contato com o administrador.'
        };
      }

      // Buscar dados da empresa
      const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
      const companyData = companyDoc.exists() ? companyDoc.data() : null;

      // Atualizar último login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp()
      });

      const authUser: AuthUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name || firebaseUser.displayName || '',
        role: userData.role || 'passenger',
        companyId: userData.companyId || '',
        companyName: companyData?.name || '',
        isActive: userData.isActive || false,
        lastLogin: new Date(),
        createdAt: userData.createdAt?.toDate() || new Date()
      };

      return {
        user: authUser,
        firebaseUser,
        error: null
      };
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou senha incorretos';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        default:
          errorMessage = error.message || 'Erro ao fazer login';
      }

      return {
        user: null,
        firebaseUser: null,
        error: errorMessage
      };
    }
  }

  // Registrar usuário
  async signUp({ email, password, name, role, companyId }: RegisterData): Promise<AuthResponse> {
    try {
      // Verificar se a empresa existe
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) {
        return {
          user: null,
          firebaseUser: null,
          error: 'Empresa não encontrada'
        };
      }

      const companyData = companyDoc.data();
      
      // Verificar se a empresa está ativa
      if (companyData.status !== 'Ativo') {
        return {
          user: null,
          firebaseUser: null,
          error: 'Empresa inativa'
        };
      }

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Atualizar perfil no Firebase Auth
      await updateProfile(firebaseUser, { displayName: name });

      // Criar documento do usuário no Firestore
      const userData = {
        name,
        email,
        role,
        companyId,
        isActive: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      const authUser: AuthUser = {
        id: firebaseUser.uid,
        email,
        name,
        role,
        companyId,
        companyName: companyData.name || '',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date()
      };

      return {
        user: authUser,
        firebaseUser,
        error: null
      };
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
        firebaseUser: null,
        error: errorMessage
      };
    }
  }

  // Fazer logout
  async signOut(): Promise<{ error: string | null }> {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error: any) {
      return {
        error: error.message || 'Erro ao fazer logout'
      };
    }
  }

  // Redefinir senha
  async resetPassword({ email }: PasswordResetData): Promise<{ error: string | null }> {
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

      return { error: errorMessage };
    }
  }

  // Atualizar senha
  async updatePassword({ newPassword }: { newPassword: string }): Promise<{ error: string | null }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { error: 'Usuário não autenticado' };
      }

      await updatePassword(user, newPassword);
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

      return { error: errorMessage };
    }
  }

  // Atualizar perfil
  async updateProfile(updates: ProfileUpdateData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return {
          user: null,
          error: 'Usuário não autenticado'
        };
      }

      // Atualizar perfil no Firebase Auth
      if (updates.name) {
        await updateProfile(firebaseUser, { displayName: updates.name });
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
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        return {
          user: null,
          error: 'Dados do usuário não encontrados'
        };
      }

      const userData = userDoc.data();
      const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
      const companyData = companyDoc.exists() ? companyDoc.data() : null;

      const authUser: AuthUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name || firebaseUser.displayName || '',
        role: userData.role || 'passenger',
        companyId: userData.companyId || '',
        companyName: companyData?.name || '',
        isActive: userData.isActive || false,
        lastLogin: userData.lastLogin?.toDate(),
        createdAt: userData.createdAt?.toDate() || new Date()
      };

      return {
        user: authUser,
        error: null
      };
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
        error: errorMessage
      };
    }
  }

  // Obter usuário atual
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
      const companyData = companyDoc.exists() ? companyDoc.data() : null;

      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name || firebaseUser.displayName || '',
        role: userData.role || 'passenger',
        companyId: userData.companyId || '',
        companyName: companyData?.name || '',
        isActive: userData.isActive || false,
        lastLogin: userData.lastLogin?.toDate(),
        createdAt: userData.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  // Verificar se usuário tem permissão
  hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false;
    
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_companies'],
      operator: ['read', 'write', 'manage_routes'],
      driver: ['read', 'update_status'],
      passenger: ['read']
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  }

  // Verificar se usuário tem role específica
  isRole(user: AuthUser | null, role: string): boolean {
    return user?.role === role;
  }

  // Listener para mudanças de autenticação
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
export default authService;