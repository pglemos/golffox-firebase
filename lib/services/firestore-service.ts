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
  onSnapshot,
  Timestamp,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  Unsubscribe,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { QueryOptions, PaginatedResponse, FirestoreDocument } from '../types/firestore'

export class FirestoreService<T extends FirestoreDocument> {
  private collectionRef: CollectionReference

  constructor(private collectionPath: string) {
    this.collectionRef = collection(db, collectionPath)
  }

  // Criar documento
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const now = serverTimestamp()
      const docData = {
        ...data,
        created_at: now,
        updated_at: now,
      }
      
      const docRef = await addDoc(this.collectionRef, docData)
      return docRef.id
    } catch (error) {
      console.error('❌ Erro ao criar documento:', error)
      throw new Error('Falha ao criar documento')
    }
  }

  // Obter documento por ID
  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(this.collectionRef, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T
      }
      
      return null
    } catch (error) {
      console.error('❌ Erro ao obter documento:', error)
      throw new Error('Falha ao obter documento')
    }
  }

  // Obter todos os documentos com opções de consulta
  async getAll(options?: QueryOptions): Promise<T[]> {
    try {
      const constraints = this.buildQueryConstraints(options)
      const q = query(this.collectionRef, ...constraints)
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T))
    } catch (error) {
      console.error('❌ Erro ao obter documentos:', error)
      throw new Error('Falha ao obter documentos')
    }
  }

  // Obter documentos com paginação
  async getPaginated(options?: QueryOptions): Promise<PaginatedResponse<T>> {
    try {
      const constraints = this.buildQueryConstraints(options)
      const q = query(this.collectionRef, ...constraints)
      const querySnapshot = await getDocs(q)
      
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T))
      
      const hasMore = docs.length === (options?.limit || 10)
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
      
      return {
        data: docs,
        hasMore,
        lastDoc: lastDoc?.data(),
      }
    } catch (error) {
      console.error('❌ Erro ao obter documentos paginados:', error)
      throw new Error('Falha ao obter documentos paginados')
    }
  }

  // Atualizar documento
  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      const updateData = {
        ...data,
        updated_at: serverTimestamp(),
      }
      
      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('❌ Erro ao atualizar documento:', error)
      throw new Error('Falha ao atualizar documento')
    }
  }

  // Deletar documento
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('❌ Erro ao deletar documento:', error)
      throw new Error('Falha ao deletar documento')
    }
  }

  // Listener em tempo real para um documento
  onDocumentChange(id: string, callback: (doc: T | null) => void): Unsubscribe {
    const docRef = doc(this.collectionRef, id)
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as T)
      } else {
        callback(null)
      }
    }, (error) => {
      console.error('❌ Erro no listener do documento:', error)
      callback(null)
    })
  }

  // Listener em tempo real para coleção
  onCollectionChange(
    callback: (docs: T[]) => void,
    options?: QueryOptions
  ): Unsubscribe {
    const constraints = this.buildQueryConstraints(options)
    const q = query(this.collectionRef, ...constraints)
    
    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T))
      
      callback(docs)
    }, (error) => {
      console.error('❌ Erro no listener da coleção:', error)
      callback([])
    })
  }

  // Operação em lote
  async batchOperation(operations: Array<{
    type: 'create' | 'update' | 'delete'
    id?: string
    data?: any
  }>): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            const createRef = doc(this.collectionRef)
            const createData = {
              ...operation.data,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
            }
            batch.set(createRef, createData)
            break
            
          case 'update':
            if (!operation.id) throw new Error('ID é obrigatório para update')
            const updateRef = doc(this.collectionRef, operation.id)
            const updateData = {
              ...operation.data,
              updated_at: serverTimestamp(),
            }
            batch.update(updateRef, updateData)
            break
            
          case 'delete':
            if (!operation.id) throw new Error('ID é obrigatório para delete')
            const deleteRef = doc(this.collectionRef, operation.id)
            batch.delete(deleteRef)
            break
        }
      }
      
      await batch.commit()
    } catch (error) {
      console.error('❌ Erro na operação em lote:', error)
      throw new Error('Falha na operação em lote')
    }
  }

  // Transação
  async transaction<R>(
    updateFunction: (transaction: any) => Promise<R>
  ): Promise<R> {
    try {
      return await runTransaction(db, updateFunction)
    } catch (error) {
      console.error('❌ Erro na transação:', error)
      throw new Error('Falha na transação')
    }
  }

  // Construir constraints de consulta
  private buildQueryConstraints(options?: QueryOptions): QueryConstraint[] {
    const constraints: QueryConstraint[] = []
    
    if (options?.where) {
      for (const condition of options.where) {
        constraints.push(where(condition.field, condition.operator, condition.value))
      }
    }
    
    if (options?.orderBy) {
      constraints.push(orderBy(options.orderBy, options.orderDirection || 'asc'))
    }
    
    if (options?.startAfter) {
      constraints.push(startAfter(options.startAfter))
    }
    
    if (options?.limit) {
      constraints.push(limit(options.limit))
    }
    
    return constraints
  }

  // Obter referência da coleção
  getCollectionRef(): CollectionReference {
    return this.collectionRef
  }

  // Obter referência de documento
  getDocRef(id: string): DocumentReference {
    return doc(this.collectionRef, id)
  }
}

// Função helper para criar instâncias de serviço
export const createFirestoreService = <T extends FirestoreDocument>(
  collectionPath: string
): FirestoreService<T> => {
  return new FirestoreService<T>(collectionPath)
}

// Função helper para paths de subcoleções
export const getSubcollectionPath = (
  parentCollection: string,
  parentId: string,
  subcollection: string
): string => {
  return `${parentCollection}/${parentId}/${subcollection}`
}

// Função helper para validar company access
export const validateCompanyAccess = (userCompanyId: string, resourceCompanyId: string): boolean => {
  return userCompanyId === resourceCompanyId
}

// Função helper para converter Timestamp para Date
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

// Função helper para converter Date para Timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date)
}