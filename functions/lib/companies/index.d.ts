import { CallableContext } from 'firebase-functions/v1/https';
import { CompanyStatus } from '../types';
interface CreateCompanyData {
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
    };
    subscription_plan?: string;
}
interface UpdateCompanyData {
    companyId: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
    };
    status?: CompanyStatus;
}
interface GetCompanyUsersData {
    companyId: string;
    role?: string;
    limit?: number;
    offset?: number;
}
export declare const companyFunctions: {
    createCompany: (data: CreateCompanyData, context: CallableContext) => Promise<{
        success: boolean;
        companyId: string;
        message: string;
    }>;
    updateCompany: (data: UpdateCompanyData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
    getCompanyUsers: (data: GetCompanyUsersData, context: CallableContext) => Promise<{
        success: boolean;
        users: ({
            created_at: any;
            updated_at: any;
            last_login: any;
            id: string;
        } | {
            driver: {
                license_expires_at: any;
            };
            created_at: any;
            updated_at: any;
            last_login: any;
            id: string;
        })[];
        total: number;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map