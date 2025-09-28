import { CallableContext } from 'firebase-functions/v1/https';
import { UserRole } from '../types';
interface CreateUserData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    companyId: string;
}
interface UpdateUserRoleData {
    userId: string;
    role: UserRole;
    companyId: string;
}
interface DeleteUserData {
    userId: string;
    companyId: string;
}
export declare const authFunctions: {
    createUser: (data: CreateUserData, context: CallableContext) => Promise<{
        success: boolean;
        userId: string;
        message: string;
    }>;
    updateUserRole: (data: UpdateUserRoleData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
    deleteUser: (data: DeleteUserData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map