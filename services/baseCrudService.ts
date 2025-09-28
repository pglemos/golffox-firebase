import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  QueryConstraint,
  DocumentSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos genéricos para operações CRUD
export interface CrudResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface CrudListResponse<T> {
  data: T[];
  error: string | null;
  count?: number;
  totalCount?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  lastDoc?: DocumentSnapshot;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

// Classe base para operações CRUD com Firebase
export abstract class BaseCrudService<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Busca um documento por ID
   */
  async getById(id: string): Promise<CrudResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          data: null,
          error: 'Documento não encontrado'
        };
      }

      const data = {
        id: docSnap.id,
        ...docSnap.data()
      } as T;

      return {
        data,
        error: null
      };
    } catch (error: any) {
      console.error(`Erro ao buscar documento ${id}:`, error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar documento'
      };
    }
  }

  /**
   * Lista documentos com filtros, ordenação e paginação
   */
  async list(
    filters?: FilterOptions,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<CrudListResponse<T>> {
    try {
      const constraints: QueryConstraint[] = [];

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          if (value !== undefined && value !== null) {
            constraints.push(where(field, '==', value));
          }
        });
      }

      // Aplicar ordenação
      if (sort) {
        constraints.push(orderBy(sort.column, sort.ascending !== false ? 'asc' : 'desc'));
      }

      // Aplicar paginação
      if (pagination?.limit) {
        constraints.push(limit(pagination.limit));
      }

      if (pagination?.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });

      return {
        data,
        error: null,
        count: data.length,
        totalCount: data.length
      };
    } catch (error: any) {
      console.error('Erro ao listar documentos:', error);
      return {
        data: [],
        error: error.message || 'Erro ao listar documentos'
      };
    }
  }

  /**
   * Cria um novo documento
   */
  async create(data: Omit<T, 'id'>): Promise<CrudResponse<T>> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      
      // Buscar o documento criado para retornar com timestamps convertidos
      const createdDoc = await getDoc(docRef);
      
      if (!createdDoc.exists()) {
        return {
          data: null,
          error: 'Erro ao recuperar documento criado'
        };
      }

      const result = {
        id: createdDoc.id,
        ...createdDoc.data()
      } as T;

      return {
        data: result,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao criar documento:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar documento'
      };
    }
  }

  /**
   * Atualiza um documento existente
   */
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<CrudResponse<T>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      // Verificar se o documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          data: null,
          error: 'Documento não encontrado'
        };
      }

      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);

      // Buscar o documento atualizado
      const updatedDoc = await getDoc(docRef);
      
      if (!updatedDoc.exists()) {
        return {
          data: null,
          error: 'Erro ao recuperar documento atualizado'
        };
      }

      const result = {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as T;

      return {
        data: result,
        error: null
      };
    } catch (error: any) {
      console.error(`Erro ao atualizar documento ${id}:`, error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar documento'
      };
    }
  }

  /**
   * Remove um documento
   */
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      // Verificar se o documento existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          error: 'Documento não encontrado'
        };
      }

      await deleteDoc(docRef);

      return {
        error: null
      };
    } catch (error: any) {
      console.error(`Erro ao deletar documento ${id}:`, error);
      return {
        error: error.message || 'Erro ao deletar documento'
      };
    }
  }

  /**
   * Busca documentos com filtros complexos
   */
  async findWhere(
    field: string, 
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in',
    value: any,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): Promise<CrudListResponse<T>> {
    try {
      const constraints: QueryConstraint[] = [
        where(field, operator as any, value)
      ];

      // Aplicar ordenação
      if (sort) {
        constraints.push(orderBy(sort.column, sort.ascending !== false ? 'asc' : 'desc'));
      }

      // Aplicar paginação
      if (pagination?.limit) {
        constraints.push(limit(pagination.limit));
      }

      if (pagination?.lastDoc) {
        constraints.push(startAfter(pagination.lastDoc));
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });

      return {
        data,
        error: null,
        count: data.length,
        totalCount: data.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar documentos com filtro:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar documentos'
      };
    }
  }

  /**
   * Conta o número de documentos que atendem aos filtros
   */
  async count(filters?: FilterOptions): Promise<{ count: number; error: string | null }> {
    try {
      const constraints: QueryConstraint[] = [];

      // Aplicar filtros
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          if (value !== undefined && value !== null) {
            constraints.push(where(field, '==', value));
          }
        });
      }

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      return {
        count: querySnapshot.size,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao contar documentos:', error);
      return {
        count: 0,
        error: error.message || 'Erro ao contar documentos'
      };
    }
  }

  /**
   * Verifica se um documento existe
   */
  async exists(id: string): Promise<{ exists: boolean; error: string | null }> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      return {
        exists: docSnap.exists(),
        error: null
      };
    } catch (error: any) {
      console.error(`Erro ao verificar existência do documento ${id}:`, error);
      return {
        exists: false,
        error: error.message || 'Erro ao verificar documento'
      };
    }
  }

  /**
   * Converte Timestamp do Firestore para Date
   */
  protected convertTimestamp(timestamp: any): Date | undefined {
    if (!timestamp) return undefined;
    
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    
    return undefined;
  }

  /**
   * Processa dados do documento convertendo timestamps
   */
  protected processDocumentData(data: any): any {
    const processed = { ...data };
    
    // Converter campos de timestamp comuns
    if (processed.createdAt) {
      processed.createdAt = this.convertTimestamp(processed.createdAt);
    }
    
    if (processed.updatedAt) {
      processed.updatedAt = this.convertTimestamp(processed.updatedAt);
    }
    
    if (processed.lastLogin) {
      processed.lastLogin = this.convertTimestamp(processed.lastLogin);
    }
    
    return processed;
  }
}

export default BaseCrudService;