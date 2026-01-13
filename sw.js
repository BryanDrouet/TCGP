// Service Worker désactivé temporairement pour éviter les problèmes de cache
// Pour réactiver: décommenter le code et mettre à jour CACHE_NAME
const CACHE_NAME = 'poke-tcg-v6-disabled';
const urlsToCache = [];

// Fonction de logging pour le Service Worker
function swLog(level, message, data = null) {
  // Seules les erreurs et warnings sont loggées pour éviter le spam console
  if (level === 'debug' || level === 'info') return;
  const timestamp = new Date().toISOString();
  const logMessage = `[SW-${level.toUpperCase()}] ${timestamp}: ${message}`;
  if (level === 'error') console.error(logMessage, data || '');
  else if (level === 'warn') console.warn(logMessage, data || '');
}

// Installation du Service Worker
self.addEventListener('install', event => {
  swLog('info', 'Installation du Service Worker (mode désactivé)');
  // Cache désactivé - skipWaiting immédiat
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  swLog('info', 'Activation du Service Worker - Nettoyage de TOUS les caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Supprimer TOUS les caches pour éviter les problèmes
      return Promise.all(
        cacheNames.map(cacheName => {
          swLog('info', 'Suppression cache: ' + cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      // Prendre le contrôle immédiatement des pages ouvertes
      return self.clients.claim();
    })
  );
});

// Stratégie de cache: DÉSACTIVÉ - Network only
self.addEventListener('fetch', event => {
  // Service Worker en mode passthrough - pas de cache du tout
  // Toutes les requêtes passent directement au réseau
  return;
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  swLog('info', 'Notification cliquée: ' + event.notification.tag);
  
  event.notification.close();
  
  // Ouvrir ou focus l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Si une fenêtre est déjà ouverte, la focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || self.registration.scope;
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gestion des notifications push (pour Firebase Cloud Messaging)
self.addEventListener('push', event => {
  swLog('info', 'Push notification reçue');
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    swLog('warn', 'Erreur lors du parsing de la notification push', e);
  }
  
  const title = data.title || 'Poké-TCG';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: data.icon || 'favicon.ico',
    badge: 'favicon.ico',
    tag: data.tag || 'default',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
