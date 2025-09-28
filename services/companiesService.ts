import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos específicos para empresas
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'Ativo' | 'Inativo';
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyInsert extends Omit<Company, 'id' | 'createdAt' | 'updatedAt'> {}

export interface CompanyUpdate extends Partial<Omit<Company, 'id' | 'createdAt'>> {}

export interface CompanyWithStats extends Company {
  totalDrivers?: number;
  totalVehicles?: number;
  totalPassengers?: number;
  totalRoutes?: number;
  activeRoutes?: number;
}

export interface CompanyFilters {
  name?: string;
  cnpj?: string;
  status?: 'Ativo' | 'Inativo';
  city?: string;
}

export class CompaniesService extends BaseCrudService<Company> {
  constructor() {
    super('companies');
  }

  /**
   * Busca empresas com estatísticas
   */
  async findAllWithStats(): Promise<CrudListResponse<CompanyWithStats>> {
    try {
      // Buscar todas as empresas
      const companiesResult = await this.list();
      
      if (companiesResult.error) {
        return companiesResult as CrudListResponse<CompanyWithStats>;
      }

      const companiesWithStats: CompanyWithStats[] = [];

      // Para cada empresa, buscar estatísticas
      for (const company of companiesResult.data) {
        const stats = await this.getCompanyStats(company.id);
        
        companiesWithStats.push({
          ...company,
          ...stats
        });
      }

      return {
        data: companiesWithStats,
        error: null,
        count: companiesWithStats.length,
        totalCount: companiesWithStats.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar empresas com estatísticas:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar empresas com estatísticas'
      };
    }
  }

  /**
   * Busca estatísticas de uma empresa específica
   */
  async getCompanyStats(companyId: string): Promise<{
    totalDrivers: number;
    totalVehicles: number;
    totalPassengers: number;
    totalRoutes: number;
    activeRoutes: number;
  }> {
    try {
      const [driversSnap, vehiclesSnap, passengersSnap, routesSnap, activeRoutesSnap] = await Promise.all([
        // Contar motoristas
        getDocs(query(collection(db, 'drivers'), where('companyId', '==', companyId))),
        // Contar veículos
        getDocs(query(collection(db, 'vehicles'), where('companyId', '==', companyId))),
        // Contar passageiros
        getDocs(query(collection(db, 'passengers'), where('companyId', '==', companyId))),
        // Contar rotas
        getDocs(query(collection(db, 'routes'), where('companyId', '==', companyId))),
        // Contar rotas ativas
        getDocs(query(
          collection(db, 'routes'), 
          where('companyId', '==', companyId),
          where('status', '==', 'active')
        ))
      ]);

      return {
        totalDrivers: driversSnap.size,
        totalVehicles: vehiclesSnap.size,
        totalPassengers: passengersSnap.size,
        totalRoutes: routesSnap.size,
        activeRoutes: activeRoutesSnap.size
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas da empresa:', error);
      return {
        totalDrivers: 0,
        totalVehicles: 0,
        totalPassengers: 0,
        totalRoutes: 0,
        activeRoutes: 0
      };
    }
  }

  /**
   * Busca empresa por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<CrudResponse<Company>> {
    try {
      const result = await this.findWhere('cnpj', '==', cnpj);
      
      if (result.error) {
        return {
          data: null,
          error: result.error
        };
      }

      if (result.data.length === 0) {
        return {
          data: null,
          error: 'Empresa não encontrada'
        };
      }

      return {
        data: result.data[0],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar empresa por CNPJ:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar empresa'
      };
    }
  }

  /**
   * Busca empresas ativas
   */
  async findActiveCompanies(): Promise<CrudListResponse<Company>> {
    try {
      return await this.findWhere('status', '==', 'Ativo');
    } catch (error: any) {
      console.error('Erro ao buscar empresas ativas:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar empresas ativas'
      };
    }
  }

  /**
   * Busca empresas por cidade
   */
  async findByCity(city: string): Promise<CrudListResponse<Company>> {
    try {
      return await this.findWhere('city', '==', city);
    } catch (error: any) {
      console.error('Erro ao buscar empresas por cidade:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar empresas por cidade'
      };
    }
  }

  /**
   * Ativa ou desativa uma empresa
   */
  async toggleStatus(companyId: string, status: 'Ativo' | 'Inativo'): Promise<CrudResponse<Company>> {
    try {
      return await this.update(companyId, { status });
    } catch (error: any) {
      console.error('Erro ao alterar status da empresa:', error);
      return {
        data: null,
        error: error.message || 'Erro ao alterar status da empresa'
      };
    }
  }

  /**
   * Valida CNPJ
   */
  validateCnpj(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let weight = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCnpj[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(cleanCnpj[12]) !== digit) return false;
    
    // Segundo dígito verificador
    sum = 0;
    weight = 2;
    
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCnpj[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(cleanCnpj[13]) === digit;
  }

  /**
   * Formata CNPJ
   */
  formatCnpj(cnpj: string): string {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) return cnpj;
    
    return cleanCnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  /**
   * Busca empresas com filtros avançados
   */
  async findWithFilters(filters: CompanyFilters): Promise<CrudListResponse<Company>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      // (Firebase não suporta múltiplos where com campos diferentes facilmente)
      const allCompanies = await this.list();
      
      if (allCompanies.error) {
        return allCompanies;
      }

      const filteredData = allCompanies.data.filter(company => {
        if (filters.name && !company.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        if (filters.cnpj && company.cnpj !== filters.cnpj) {
          return false;
        }
        if (filters.status && company.status !== filters.status) {
          return false;
        }
        if (filters.city && !company.city.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
        return true;
      });

      return {
        data: filteredData,
        error: null,
        count: filteredData.length,
        totalCount: filteredData.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar empresas com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar empresas'
      };
    }
  }

  /**
   * Atualiza informações de contato da empresa
   */
  async updateContactInfo(
    companyId: string, 
    contactInfo: { email?: string; phone?: string; address?: string }
  ): Promise<CrudResponse<Company>> {
    try {
      return await this.update(companyId, contactInfo);
    } catch (error: any) {
      console.error('Erro ao atualizar informações de contato:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar informações de contato'
      };
    }
  }

  /**
   * Verifica se CNPJ já está em uso por outra empresa
   */
  async isCnpjInUse(cnpj: string, excludeCompanyId?: string): Promise<boolean> {
    try {
      const result = await this.findByCnpj(cnpj);
      
      if (result.error || !result.data) {
        return false;
      }

      // Se excluir uma empresa específica (para updates)
      if (excludeCompanyId && result.data.id === excludeCompanyId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false;
    }
  }
}

export const companiesService = new CompaniesService();
export default companiesService;