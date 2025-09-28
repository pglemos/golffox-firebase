import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Configuração do FCM
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Chave VAPID para notificações web push
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// Solicitar permissão para notificações
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('FCM não está disponível no servidor');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      
      console.log('Token FCM obtido:', token);
      return token;
    } else {
      console.log('Permissão para notificações negada');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
}

// Configurar listener para mensagens em primeiro plano
export function setupForegroundMessageListener(
  onMessageReceived: (payload: NotificationPayload) => void
) {
  if (!messaging) {
    console.warn('FCM não está disponível no servidor');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Mensagem recebida em primeiro plano:', payload);
    
    const notification: NotificationPayload = {
      title: payload.notification?.title || 'Nova notificação',
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icons/icon-192x192.png',
      data: payload.data,
    };

    onMessageReceived(notification);
  });
}

// Mostrar notificação local
export function showLocalNotification(notification: NotificationPayload) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
    });
  }
}

// Tipos de notificação para problemas de check-in
export enum CheckinNotificationType {
  DRIVER_LATE = 'driver_late',
  DRIVER_NO_SHOW = 'driver_no_show',
  VEHICLE_ISSUE = 'vehicle_issue',
  ROUTE_DELAY = 'route_delay',
  PASSENGER_MISSING = 'passenger_missing',
  EMERGENCY = 'emergency',
}

// Interface para dados de notificação de check-in
export interface CheckinNotificationData {
  type: CheckinNotificationType;
  routeId: string;
  driverId?: string;
  vehicleId?: string;
  passengerId?: string;
  companyId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Configurar notificações específicas para problemas de check-in
export function createCheckinNotification(data: CheckinNotificationData): NotificationPayload {
  const icons = {
    [CheckinNotificationType.DRIVER_LATE]: '/icons/driver-late.png',
    [CheckinNotificationType.DRIVER_NO_SHOW]: '/icons/driver-no-show.png',
    [CheckinNotificationType.VEHICLE_ISSUE]: '/icons/vehicle-issue.png',
    [CheckinNotificationType.ROUTE_DELAY]: '/icons/route-delay.png',
    [CheckinNotificationType.PASSENGER_MISSING]: '/icons/passenger-missing.png',
    [CheckinNotificationType.EMERGENCY]: '/icons/emergency.png',
  };

  const titles = {
    [CheckinNotificationType.DRIVER_LATE]: 'Motorista Atrasado',
    [CheckinNotificationType.DRIVER_NO_SHOW]: 'Motorista Ausente',
    [CheckinNotificationType.VEHICLE_ISSUE]: 'Problema no Veículo',
    [CheckinNotificationType.ROUTE_DELAY]: 'Atraso na Rota',
    [CheckinNotificationType.PASSENGER_MISSING]: 'Passageiro Ausente',
    [CheckinNotificationType.EMERGENCY]: 'Emergência',
  };

  return {
    title: titles[data.type],
    body: data.message,
    icon: icons[data.type],
    data: {
      type: data.type,
      routeId: data.routeId,
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      passengerId: data.passengerId,
      companyId: data.companyId,
      timestamp: data.timestamp,
      severity: data.severity,
      clickAction: `/routes/${data.routeId}`,
    },
  };
}