import { CallableContext } from 'firebase-functions/v1/https';
interface GetUserProfileData {
    userId?: string;
    companyId: string;
}
interface UpdateUserProfileData {
    userId?: string;
    companyId: string;
    name?: string;
    phone?: string;
    avatar_url?: string;
    department?: string;
}
export declare const userFunctions: {
    getUserProfile: (data: GetUserProfileData, context: CallableContext) => Promise<{
        success: boolean;
        user: {
            created_at: any;
            updated_at: any;
            last_login: any;
            id: string;
        };
        driver: {
            license_expires_at: any;
            created_at: any;
            updated_at: any;
        } | null;
    }>;
    updateUserProfile: (data: UpdateUserProfileData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map