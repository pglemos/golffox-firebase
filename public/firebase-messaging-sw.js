// Service Worker para Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuração do Firebase (deve ser a mesma do app)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obter instância do messaging
const messaging = firebase.messaging();

// Lidar com mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em background:', payload);

  const notificationTitle = payload.notification?.title || 'GolfFox';
  const notificationOptions = {
    body: payload.notification?.body || 'Nova notificação',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'Ver Detalhes',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/dismiss-action.png'
      }
    ],
    requireInteraction: payload.data?.severity === 'critical',
    silent: false,
    vibrate: payload.data?.severity === 'critical' ? [200, 100, 200] : [100],
    tag: payload.data?.type || 'general',
  };

  // Mostrar notificação
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lidar com cliques na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Clique na notificação:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Abrir página específica baseada nos dados da notificação
    const clickAction = event.notification.data?.clickAction || '/';
    event.waitUntil(
      clients.openWindow(clickAction)
    );
  } else if (event.action === 'dismiss') {
    // Apenas fechar a notificação
    return;
  } else {
    // Clique na notificação (não em uma ação)
    const clickAction = event.notification.data?.clickAction || '/';
    event.waitUntil(
      clients.openWindow(clickAction)
    );
  }
});

// Lidar com fechamento da notificação
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
  
  // Opcional: enviar analytics sobre notificações fechadas
  if (event.notification.data?.trackClose) {
    // Implementar tracking se necessário
  }
});

// Configurações adicionais do service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});