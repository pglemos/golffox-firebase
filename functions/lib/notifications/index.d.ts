import { CallableContext } from 'firebase-functions/v1/https';
interface SendNotificationData {
    companyId: string;
    userIds?: string[];
    roles?: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'normal' | 'high';
    sound?: string;
    badge?: number;
}
interface UpdateFCMTokenData {
    companyId: string;
    token: string;
}
interface MarkNotificationReadData {
    companyId: string;
    notificationIds: string[];
}
interface GetNotificationsData {
    companyId: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
}
export declare const notificationFunctions: {
    sendNotification: (data: SendNotificationData, context: CallableContext) => Promise<{
        success: boolean;
        sentTo: number;
        message: string;
    }>;
    updateFCMToken: (data: UpdateFCMTokenData, context: CallableContext) => Promise<{
        success: boolean;
        message: string;
    }>;
    markNotificationsRead: (data: MarkNotificationReadData, context: CallableContext) => Promise<{
        success: boolean;
        updatedCount: number;
        message: string;
    }>;
    getNotifications: (data: GetNotificationsData, context: CallableContext) => Promise<{
        success: boolean;
        notifications: {
            created_at: any;
            read_at: any;
            id: string;
        }[];
        pagination: {
            limit: number;
            offset: number;
            has_more: boolean;
        };
        unread_count: number;
    }>;
    cleanupOldNotifications: (data: {
        companyId: string;
        daysOld?: number;
    }, context: CallableContext) => Promise<{
        success: boolean;
        deletedCount: number;
        message: string;
    }>;
};
export {};
//# sourceMappingURL=index.d.ts.map