import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION ---
const ADMIN_EMAIL = "bryan.drouet24@gmail.com"; 
const BOOSTER_SIZE = 5; // Nombre de cartes par booster
const COOLDOWN_MINUTES = 5; 

const GAME_CONFIG = {
    dropRates: [
        { type: 'common',     chance: 55,  filename: 'common.json', label: "Commune", weight: 1 },
        { type: 'uncommon',   chance: 25,  filename: 'uncommon.json', label: "Peu Com.", weight: 2 },
        { type: 'rare',       chance: 14,  filename: 'rare.json', label: "Rare", weight: 3 },
        { type: 'ultra_rare', chance: 5,   filename: 'ultra_rare.json', label: "Ultra Rare", weight: 4 },
        { type: 'secret',     chance: 1,   filename: 'secret.json', label: "SECRÈTE", weight: 5 }
    ],
    // ... (GARDE TES ICONES ICI, JE LES AI COUPÉES POUR LA LISIBILITÉ) ...
    icons: {
        Fire: 'icons/Pokémon_Fire_Type_Icon.svg',
        Water: 'icons/Pokémon_Water_Type_Icon.svg',
        Grass: 'icons/Pokémon_Grass_Type_Icon.svg',
        Electric: 'icons/Pokémon_Electric_Type_Icon.svg',
        Psychic: 'icons/Pokémon_Psychic_Type_Icon.svg',
        Fighting: 'icons/Pokémon_Fighting_Type_Icon.svg',
        Darkness: 'icons/Pokémon_Dark_Type_Icon.svg', 
        Metal: 'icons/Pokémon_Steel_Type_Icon.svg',
        Fairy: 'icons/Pokémon_Fairy_Type_Icon.svg',
        Dragon: 'icons/Pokémon_Dragon_Type_Icon.svg',
        Ice: 'icons/Pokémon_Ice_Type_Icon.svg',
        Ground: 'icons/Pokémon_Ground_Type_Icon.svg',
        Flying: 'icons/Pokémon_Flying_Type_Icon.svg',
        Bug: 'icons/Pokémon_Bug_Type_Icon.svg',
        Rock: 'icons/Pokémon_Rock_Type_Icon.svg',
        Ghost: 'icons/Pokémon_Ghost_Type_Icon.svg',
        Poison: 'icons/Pokémon_Poison_Type_Icon.svg',
        Normal: 'icons/Pokémon_Normal_Type_Icon.svg',
        Colorless: 'icons/Pokémon_Normal_Type_Icon.svg'
    }
};

// ⚠️ COLLE TA CONFIG FIREBASE ICI ⚠️
const firebaseConfig = {
    apiKey: "AIzaSyBdtS508E3KBTZHfOTb7kl-XDc9vVn3oZI",
    authDomain: "tcgp-27e34.firebaseapp.com",
    projectId: "tcgp-27e34",
    storageBucket: "tcgp-27e34.firebasestorage.app",
    messagingSenderId: "7412987658",
    appId: "1:7412987658:web:87f0a63b9b7c95548bacf3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Variables globales pour le tri
let userCardsCache = []; 
let cooldownInterval = null;

// --- AUTHENTIFICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('game-app').style.display = 'block';
        document.getElementById('user-display').innerText = user.email.split('@')[0];
        
        // Admin Panel
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = (user.email === ADMIN_EMAIL) ? 'block' : 'none';

        loadCollection(user.uid);
        checkCooldown(user); // Vérifie le temps restant
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('game-app').style.display = 'none';
        if(cooldownInterval) clearInterval(cooldownInterval);
    }
});

// (Fonctions Auth inchangées : googleLogin, signUp, signIn, logout...)
window.googleLogin = async () => authUser(signInWithPopup(auth, provider));
window.signUp = async () => { /* ... */ };
window.signIn = async () => { /* ... */ };
window.logout = () => signOut(auth);
async function authUser(promise) { /* ... */ }


// --- COOLDOWN SYSTEM ---
async function checkCooldown(user) {
    // Si c'est l'admin, pas de cooldown
    if (user.email === ADMIN_EMAIL) {
        enableBoosterButton(true);
        return;
    }

    const docRef = doc(db, "players", user.uid);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
        const data = snap.data();
        const lastDraw = data.lastDrawTime || 0;
        const now = Date.now();
        const diff = now - lastDraw;
        const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;

        if (diff < cooldownMs) {
            startTimer(cooldownMs - diff);
        } else {
            enableBoosterButton(true);
        }
    } else {
        enableBoosterButton(true);
    }
}

function startTimer(durationMs) {
    const btn = document.getElementById('btn-draw');
    const timerDiv = document.getElementById('cooldown-timer');
    const timerVal = document.getElementById('timer-val');
    
    btn.disabled = true;
    btn.classList.add('disabled');
    timerDiv.style.display = 'block';

    let remaining = durationMs;

    if (cooldownInterval) clearInterval(cooldownInterval);

    cooldownInterval = setInterval(() => {
        remaining -= 1000;
        
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            enableBoosterButton(true);
            return;
        }

        const m = Math.floor((remaining / 1000 / 60) % 60);
        const s = Math.floor((remaining / 1000) % 60);
        timerVal.innerText = `${m}:${s < 10 ? '0'+s : s}`;
        btn.innerHTML = `<div class="booster-content">Attente... ${m}:${s < 10 ? '0'+s : s}</div>`;
    }, 1000);
}

function enableBoosterButton(enabled) {
    const btn = document.getElementById('btn-draw');
    const timerDiv = document.getElementById('cooldown-timer');
    
    if (enabled) {
        btn.disabled = false;
        btn.classList.remove('disabled');
        btn.innerHTML = '<div class="booster-content">OUVRIR UN BOOSTER</div>';
        timerDiv.style.display = 'none';
        if (cooldownInterval) clearInterval(cooldownInterval);
    }
}


// --- OUVERTURE DE BOOSTER (5 CARTES) ---
window.drawCard = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const genSelect = document.getElementById('gen-select');
    const selectedGen = genSelect.value;
    const btn = document.getElementById('btn-draw');

    btn.disabled = true;
    btn.innerHTML = "Ouverture...";

    try {
        const newCards = [];

        // On boucle 5 fois pour générer 5 cartes
        for(let i=0; i<BOOSTER_SIZE; i++) {
            // 1. Rareté
            const rand = Math.random() * 100;
            let rarityConfig = GAME_CONFIG.dropRates[0];
            let acc = 0;
            for (const r of GAME_CONFIG.dropRates) {
                acc += r.chance;
                if (rand <= acc) { rarityConfig = r; break; }
            }

            // 2. Récupération fichier
            const response = await fetch(`data/${selectedGen}/${rarityConfig.filename}`);
            if (!response.ok) {
                // Fallback si fichier vide (ex: pas de secret dans cette gen)
                const fallback = await fetch(`data/${selectedGen}/common.json`);
                var list = await fallback.json();
                rarityConfig = GAME_CONFIG.dropRates[0]; // Force commune
            } else {
                var list = await response.json();
            }

            if(!list || list.length === 0) continue; // Skip si vide

            const card = list[Math.floor(Math.random() * list.length)];
            
            // 3. Préparation Objet
            card.acquiredAt = Date.now();
            card.rarityKey = rarityConfig.type;
            card.rarityWeight = rarityConfig.weight; // Important pour le tri !
            card.generation = selectedGen;
            
            newCards.push(card);
        }

        // 4. Sauvegarde Unique (Optimisation)
        const updateData = {
            collection: arrayUnion(...newCards)
        };
        
        // Si pas admin, on met à jour le cooldown
        if (user.email !== ADMIN_EMAIL) {
            updateData.lastDrawTime = Date.now();
        }

        await updateDoc(doc(db, "players", user.uid), updateData);

        // 5. Mise à jour UI
        newCards.forEach(c => {
            userCardsCache.push(c); // Ajout au cache local
            renderCard(c, true); // Affichage
        });
        
        updateCount(newCards.length);
        
        // Relancer le cooldown si nécessaire
        if (user.email !== ADMIN_EMAIL) {
            startTimer(COOLDOWN_MINUTES * 60 * 1000);
        } else {
            btn.disabled = false;
            btn.innerHTML = '<div class="booster-content">OUVRIR UN BOOSTER</div>';
        }

    } catch (error) {
        console.error(error);
        alert("Erreur: " + error.message);
        btn.disabled = false;
    }
};


// --- GESTION COLLECTION & TRI ---

async function loadCollection(uid) {
    const snap = await getDoc(doc(db, "players", uid));
    if (snap.exists()) {
        userCardsCache = snap.data().collection || [];
        updateCount(0); // Just update text
        window.updateSort(); // Appliquer le tri par défaut
    }
}

// Fonction appelée par le <select onchange="updateSort()">
window.updateSort = () => {
    const sortType = document.getElementById('sort-select').value;
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = ''; // Clear

    // Logique de tri
    const sorted = [...userCardsCache].sort((a, b) => {
        switch(sortType) {
            case 'date-desc': // Plus récent
                return b.acquiredAt - a.acquiredAt;
            
            case 'rarity-desc': // Rareté (Poids 5 > 4 > 3...)
                // Si même rareté, on trie par nom
                if ((b.rarityWeight || 0) !== (a.rarityWeight || 0)) {
                    return (b.rarityWeight || 0) - (a.rarityWeight || 0);
                }
                return a.name.localeCompare(b.name);

            case 'hp-desc': // PV
                return (b.hp || 0) - (a.hp || 0);

            case 'gen-asc': // Génération (gen1 < gen2)
                if (a.generation !== b.generation) {
                    return a.generation.localeCompare(b.generation);
                }
                return (b.rarityWeight || 0) - (a.rarityWeight || 0);
            
            default: return 0;
        }
    });

    sorted.forEach(c => renderCard(c, false));
    document.getElementById('card-count').innerText = sorted.length;
};

function updateCount(n) {
    // Si n=0 on ne change pas la longueur réelle
    // Ici on relit juste la taille du cache
    document.getElementById('card-count').innerText = userCardsCache.length;
}

// --- RENDER CARD (Mise à jour pour les Badges) ---
function renderCard(card, animate = false) {
    const grid = document.getElementById('cards-grid');
    const div = document.createElement('div');
    
    const mainType = card.types[0];
    const cssRarity = card.rarityKey ? card.rarityKey.replace('_', '-') : 'commune';
    // Mapping pour le badge (Texte propre)
    const rarityLabels = {
        'common': 'COMMUNE', 'uncommon': 'PEU COM.', 'rare': 'RARE', 
        'ultra_rare': 'ULTRA RARE', 'secret': 'SECRET'
    };
    const rarityLabel = rarityLabels[card.rarityKey] || '';

    const typeIconUrl = GAME_CONFIG.icons[mainType] || GAME_CONFIG.icons['Normal'];
    const weakIconUrl = GAME_CONFIG.icons[card.weakness] || GAME_CONFIG.icons['Normal'];
    
    div.className = `tcg-card ${cssRarity} bg-${mainType}`;
    if (animate) div.style.animation = "popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    // Attaques
    let attacksHtml = '';
    if(card.attacks) {
        card.attacks.forEach(atk => {
            const costHtml = Array(atk.cost).fill(`<img src="${typeIconUrl}" class="type-icon small">`).join('');
            attacksHtml += `
                <div class="move-row">
                    <div class="cost-icons">${costHtml}</div>
                    <div class="move-info"><div class="move-name">${atk.name}</div></div>
                    <div class="move-dmg">${atk.damage}</div>
                </div>`;
        });
    }

    // Gestion image
    const img = document.createElement('img');
    img.src = card.image;
    img.className = 'card-img';
    img.loading = 'lazy';
    img.onerror = () => { console.log("Img error", card.name); };

    // HTML Structure avec Badge Rareté
    div.innerHTML = `
        ${rarityLabel !== 'COMMUNE' ? `<div class="rarity-badge badge-${cssRarity}">${rarityLabel}</div>` : ''}
        
        <div class="card-header">
            <span class="card-name">${card.name}</span>
            <div class="hp-group">${card.hp} PV <img src="${typeIconUrl}" class="type-icon big"></div>
        </div>
        <div class="img-frame"></div>
        <div class="card-body">${attacksHtml}</div>
        <div class="card-footer">
            <div class="stat-box">Faiblesse<br>${card.weakness !== "Standard" ? `<img src="${weakIconUrl}" class="type-icon small">` : "-"}</div>
            <div class="stat-box">Résist.<br>-</div>
            <div class="stat-box">Retraite<br>⚪</div>
        </div>
    `;
    
    div.querySelector('.img-frame').appendChild(img);
    
    // Si on trie, on ajoute à la fin, sinon (animation draw) au début
    if(animate) grid.prepend(div);
    else grid.appendChild(div);
}