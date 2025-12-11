# Bug Fix: Packs bloqués à 0/3 avec timer à 00:00

## Problème
Les utilisateurs rencontraient un problème où:
- Les packs restaient bloqués à 0/3
- Le timer affichait 00:00 sans se mettre à jour
- Impossible d'ouvrir de nouveaux boosters
- Le problème persistait même après refresh, vidage du cache, etc.

## Cause Racine
Le bug était causé par plusieurs problèmes dans la fonction `checkCooldown()`:

1. **Timer négatif**: Quand `lastDrawTime` était 0 ou très ancien, le calcul `cooldownMs - diff` donnait une valeur négative, causant un timer bloqué à 00:00

2. **Mauvaise gestion de la régénération**: Quand le cooldown était passé (`diff >= cooldownMs`), le code régénérait les packs mais conservait l'ancien `lastDrawTime`, ce qui créait une incohérence

3. **Migration de données incomplète**: Les fonctions de reset admin ne réinitialisaient pas le nouveau champ `packsByGen`, créant des états incohérents entre l'ancien système (champs globaux) et le nouveau système (packs par génération)

## Solution

### 1. Correction de la logique de régénération (script.js)
```javascript
// Avant:
if (diff >= cooldownMs) {
    availablePacks = PACKS_PER_COOLDOWN;
    packsByGen[currentGen] = {
        availablePacks: PACKS_PER_COOLDOWN,
        lastDrawTime: genData.lastDrawTime  // ❌ Conserve l'ancien temps!
    };
}

// Après:
if (availablePacks === 0 && diff >= cooldownMs) {
    availablePacks = PACKS_PER_COOLDOWN;
    packsByGen[currentGen] = {
        availablePacks: PACKS_PER_COOLDOWN,
        lastDrawTime: 0  // ✓ Reset à 0 pour indiquer packs pleins
    };
}
```

### 2. Protection contre les timers négatifs (script.js)
```javascript
const timeToNextPack = cooldownMs - diff;
// S'assurer que le timer n'est jamais négatif
if (timeToNextPack > 0) {
    startTimer(timeToNextPack, uid);
} else {
    // Si le temps est déjà passé, forcer la régénération
    // (filet de sécurité au cas où la première vérification échoue)
    availablePacks = PACKS_PER_COOLDOWN;
    packsByGen[currentGen] = {
        availablePacks: PACKS_PER_COOLDOWN,
        lastDrawTime: 0
    };
    await setDoc(doc(db, "players", uid), { 
        packsByGen: packsByGen
    }, { merge: true });
    updatePacksDisplay(PACKS_PER_COOLDOWN, true);
    enableBoosterButton(true);
}
```

### 3. Mise à jour des fonctions de reset admin (admin.js)
```javascript
// Fonction resetCooldown: maintenant reset aussi packsByGen
await updateDoc(doc(db, "players", uid), { 
    lastDrawTime: 0,
    packsByGen: {}, // ✓ Reset tous les packs de toutes les générations
    adminNotification: { ... }
});

// Fonction resetPlayer: idem
await updateDoc(doc(db, "players", uid), { 
    collection: [], 
    lastDrawTime: 0, 
    packsByGen: {} // ✓ Ajouté
});
```

### 4. Initialisation correcte des nouveaux comptes (script.js)
```javascript
await setDoc(doc(db, "players", uid), {
    email: auth.currentUser.email,
    collection: [],
    packsByGen: {}, // ✓ Ajouté
    lastDrawTime: 0,
    availablePacks: PACKS_PER_COOLDOWN,
    role: 'player'
});
```

## Scénarios de Test

### Scénario 1: Nouveau compte
- **État**: `packsByGen = {}`
- **Résultat attendu**: 3 packs disponibles immédiatement
- **Vérifié**: ✓ Le code utilise les valeurs par défaut correctement

### Scénario 2: Utilisateur bloqué (0 packs, lastDrawTime = 0)
- **État**: `packsByGen.gen7 = { availablePacks: 0, lastDrawTime: 0 }`
- **Résultat attendu**: Régénération immédiate à 3 packs
- **Vérifié**: ✓ La condition `availablePacks === 0 && diff >= cooldownMs` est vraie, régénération OK

### Scénario 3: Cooldown normal en cours
- **État**: `packsByGen.gen7 = { availablePacks: 0, lastDrawTime: Date.now() - 60000 }` (1 min passée)
- **Résultat attendu**: Timer affiche 2:00 (reste 2 minutes)
- **Vérifié**: ✓ `timeToNextPack = 180000 - 60000 = 120000` (2 min), timer démarre correctement

### Scénario 4: Cooldown terminé
- **État**: `packsByGen.gen7 = { availablePacks: 0, lastDrawTime: Date.now() - 200000 }` (> 3 min)
- **Résultat attendu**: 3 packs disponibles immédiatement
- **Vérifié**: ✓ Régénération automatique

## Pour l'utilisateur affecté (toto1235722007)
L'admin peut maintenant:
1. Utiliser le bouton "Reset" dans l'interface admin
2. Cela réinitialisera correctement `packsByGen` en plus de `lastDrawTime`
3. L'utilisateur aura immédiatement 3 packs disponibles pour toutes les générations

## Prévention Future
- La logique gère maintenant tous les cas limites (lastDrawTime = 0, ancien, négatif)
- Les timers ne peuvent plus devenir négatifs
- La migration de données est complète lors des resets
- Double vérification en cas de calcul négatif (filet de sécurité)
