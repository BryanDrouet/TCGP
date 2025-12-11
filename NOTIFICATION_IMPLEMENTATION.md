# Implémentation des Notifications Mobiles

## Résumé
Cette implémentation corrige le problème des notifications mobiles qui ne fonctionnaient pas. Le système utilise maintenant les Service Worker notifications pour une meilleure compatibilité mobile.

## Changements Effectués

### 1. Service Worker Registration Tracking (script.js)
- Ajout de la variable `swRegistration` pour suivre l'enregistrement du Service Worker
- Permet d'utiliser `swRegistration.showNotification()` au lieu de `new Notification()`
- Meilleure compatibilité avec les navigateurs mobiles et les PWA

### 2. Fonction `requestNotification()` Améliorée (script.js)
**Avant:**
```javascript
window.requestNotification = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    updateBellIcon();
    if (permission === "granted") {
        new Notification("Poké-TCG", { body: "Notifications activées !", icon: "icons/fire.svg" });
    }
};
```

**Après:**
- Utilise Service Worker notifications pour mobile
- Sauvegarde la préférence dans Firebase
- Affiche des messages d'aide en cas d'échec
- Gestion d'erreur robuste
- Support de la vibration sur mobile
- Affiche un popup de confirmation

### 3. Fonction `sendPacksReadyNotification()` (script.js)
Nouvelle fonction qui envoie une notification quand les packs sont prêts:
- **Titre:** "Poké-TCG - Packs disponibles ! 🎉"
- **Message:** "Intéressant ! Vos packs sont maintenant disponibles. Revenez vite pour les ouvrir !"
- **Vibration:** [200, 100, 200] ms (mobile)
- **Icône:** favicon.ico
- **Tag:** "packs-ready" (évite les doublons)

### 4. Déclenchement des Notifications
Dans la fonction `startTimer()`, la notification est envoyée quand le timer atteint 0:
```javascript
if (remaining <= 0) {
    clearInterval(cooldownInterval);
    try {
        sendPacksReadyNotification();
    } catch (error) {
        Logger.error('Erreur lors de l\'envoi de la notification de packs prêts', error);
    }
    // Re-vérifier les packs disponibles
    if (uid) checkCooldown(uid);
    else enableBoosterButton(true);
    return;
}
```

### 5. Service Worker Event Handlers (sw.js)

#### Gestion des clics sur notifications
```javascript
self.addEventListener('notificationclick', event => {
  event.notification.close();
  // Ouvre ou focus l'application
  clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      // Si une fenêtre est déjà ouverte, la focus
      // Sinon, ouvrir une nouvelle fenêtre
    });
});
```

#### Gestion des notifications push (pour future intégration FCM)
```javascript
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Poké-TCG';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: data.icon || 'favicon.ico',
    badge: 'favicon.ico',
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(title, options);
});
```

### 6. Mise à jour du Cache
Version du cache passée de `poke-tcg-v3` à `poke-tcg-v4` pour forcer la mise à jour du Service Worker.

## Constantes Ajoutées
```javascript
const NOTIFICATION_PACKS_READY_TITLE = "Poké-TCG - Packs disponibles ! 🎉";
const NOTIFICATION_PACKS_READY_BODY = "Intéressant ! Vos packs sont maintenant disponibles. Revenez vite pour les ouvrir !";
const NOTIFICATION_PACKS_READY_BODY_SHORT = "Intéressant ! Vos packs sont maintenant disponibles.";
```

## Comment Utiliser

### Pour l'Utilisateur
1. Cliquer sur l'icône 🔔 dans la barre de navigation
2. Accepter les notifications quand le navigateur le demande
3. Un ✓ vert apparaît sur la cloche quand les notifications sont activées
4. Recevoir des notifications quand les packs sont prêts

### Pour le Développeur
```javascript
// Envoyer une notification
if (swRegistration && Notification.permission === "granted") {
    swRegistration.showNotification("Titre", {
        body: "Message",
        icon: "favicon.ico",
        badge: "favicon.ico",
        tag: "unique-tag",
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { url: window.location.href }
    });
}
```

## Compatibilité

### Desktop
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Safari 16+ (macOS Ventura+)

### Mobile
- ✅ Chrome pour Android 42+
- ✅ Firefox pour Android 44+
- ✅ Safari pour iOS 16.4+ (avec limitations)
- ✅ PWA installées sur Android/iOS

### Notes Importantes
- **HTTPS requis** en production (ou localhost pour dev)
- Les notifications en arrière-plan nécessitent le Service Worker
- Sur iOS, meilleur support quand l'app est installée comme PWA
- Les notifications ne fonctionnent pas dans les iframes

## Gestion d'Erreur

### Cas Gérés
1. **Navigateur ne supporte pas les notifications:** Message informatif à l'utilisateur
2. **Permission refusée:** Message expliquant comment activer dans les paramètres
3. **Service Worker non disponible:** Fallback vers notifications basiques
4. **Erreur Firebase:** Logged mais n'empêche pas la notification
5. **Erreur d'envoi de notification:** Logged sans crash de l'application

### Logging
Tous les événements sont loggés avec `Logger`:
- `Logger.info()` - Succès
- `Logger.warn()` - Avertissements
- `Logger.error()` - Erreurs

## Tests

### Test Manuel
1. Ouvrir l'application sur mobile
2. Activer les notifications
3. Attendre que le cooldown se termine (3 minutes actuellement)
4. Vérifier qu'une notification apparaît
5. Cliquer sur la notification - doit ouvrir l'app

### Points de Vérification
- [ ] La cloche change d'apparence quand les notifications sont activées
- [ ] Une notification test apparaît lors de l'activation
- [ ] Une notification apparaît quand les packs sont prêts
- [ ] Le message contient "Intéressant !"
- [ ] Cliquer sur la notification ouvre/focus l'application
- [ ] La vibration fonctionne sur mobile
- [ ] Pas de doublons de notifications

## Sécurité
- ✅ CodeQL scan: 0 alertes
- ✅ Aucune donnée sensible dans les notifications
- ✅ HTTPS requis en production
- ✅ Gestion d'erreur pour éviter les crashs
- ✅ Validation de permission avant envoi

## Améliorations Futures Possibles
1. **Firebase Cloud Messaging (FCM):** Pour notifications push serveur
2. **Personnalisation:** Permettre aux utilisateurs de choisir quand recevoir des notifications
3. **Actions:** Ajouter des boutons d'action dans les notifications
4. **Sons personnalisés:** Pour iOS/Android
5. **Badge counter:** Nombre de packs disponibles dans l'icône de l'app
6. **Rich notifications:** Images, progrès, etc.

## Support
En cas de problème avec les notifications:
1. Vérifier que HTTPS est activé (ou localhost)
2. Vérifier les permissions dans les paramètres du navigateur
3. Vider le cache et recharger
4. Vérifier les logs dans la console (F12)
5. Réinstaller la PWA si installée

## Références
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker Notifications](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
