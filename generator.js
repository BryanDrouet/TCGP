// Configuration
const GENS = [
    { id: "gen1", name: "Gen 1 (Kanto)", start: 1, end: 151, source: "fast" },
    { id: "gen2", name: "Gen 2 (Johto)", start: 152, end: 251, source: "fast" },
    { id: "gen3", name: "Gen 3 (Hoenn)", start: 252, end: 386, source: "fast" },
    { id: "gen4", name: "Gen 4 (Sinnoh)", start: 387, end: 493, source: "fast" },
    { id: "gen5", name: "Gen 5 (Unys)", start: 494, end: 649, source: "fast" },
    { id: "gen6", name: "Gen 6 (Kalos)", start: 650, end: 721, source: "fast" },
    { id: "gen7", name: "Gen 7 (Alola)", start: 722, end: 809, source: "fast" },
    { id: "gen8", name: "Gen 8 (Galar)", start: 810, end: 905, source: "api" },
    { id: "gen9", name: "Gen 9 (Paldea)", start: 906, end: 1025, source: "api" }
];

const PROXY_URL = "https://corsproxy.io/?";
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- GESTION DU TOAST (Notification) ---
const ui = {
    toast: document.getElementById('dl-toast'),
    title: document.getElementById('toast-title'),
    msg: document.getElementById('toast-msg'),
    bar: document.getElementById('toast-bar'),
    
    show: () => ui.toast.style.display = 'block',
    hide: () => setTimeout(() => ui.toast.style.display = 'none', 5000), // Cache après 5s
    update: (title, message, percent) => {
        ui.title.innerText = title;
        ui.msg.innerText = message;
        ui.bar.style.width = percent + "%";
    }
};

window.downloadAllGensZip = async () => {
    console.clear();
    const btn = document.querySelector('.btn-admin');
    if(btn) btn.disabled = true; // On désactive juste le bouton, pas l'écran
    
    ui.show();
    ui.update("Démarrage...", "Préparation...", 0);

    try {
        const zip = new JSZip();
        const rootFolder = zip.folder("data");

        // 1. GEN 1-7 (Rapide)
        ui.update("Gen 1 à 7", "Téléchargement base GitHub...", 10);
        const fastResponse = await fetch('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json');
        if(!fastResponse.ok) throw new Error("Erreur GitHub");
        const fastData = await fastResponse.json();

        // 2. BOUCLE PRINCIPALE
        for (let i = 0; i < GENS.length; i++) {
            const gen = GENS[i];
            let processedCards = [];
            
            // Calcul pourcentage global (basé sur le numéro de la gen)
            const globalPercent = Math.floor(((i) / GENS.length) * 100);

            if (gen.source === "fast") {
                ui.update(`Traitement ${gen.name}`, "Conversion rapide...", globalPercent);
                const genData = fastData.filter(p => p.id >= gen.start && p.id <= gen.end);
                processedCards = genData.map(p => processFastPokemon(p));
            } 
            else {
                // Pour l'API lente, on passe le callback de mise à jour
                processedCards = await fetchApiGenSequential(gen.start, gen.end, gen.name, globalPercent);
            }

            // Sauvegarde dans ZIP
            if(processedCards.length > 0) {
                const genFolder = rootFolder.folder(gen.id);
                saveJsonToZip(genFolder, processedCards, 'common', 'common.json');
                saveJsonToZip(genFolder, processedCards, 'uncommon', 'uncommon.json');
                saveJsonToZip(genFolder, processedCards, 'rare', 'rare.json');
                saveJsonToZip(genFolder, processedCards, 'ultra_rare', 'ultra_rare.json');
                saveJsonToZip(genFolder, processedCards, 'secret', 'secret.json');
            }
        }

        // 3. COMPRESSION
        ui.update("Finalisation", "Création du fichier ZIP...", 100);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "tcg-full-collection.zip");
        
        ui.update("Terminé !", "Le téléchargement a démarré.", 100);
        ui.hide(); // Se cache tout seul après 5 sec

    } catch (e) {
        console.error(e);
        ui.update("Erreur", e.message, 0);
        ui.toast.style.borderLeft = "5px solid red";
    } finally {
        if(btn) btn.disabled = false;
    }
};

// --- API SEQUENCE (Avec mise à jour UI) ---
async function fetchApiGenSequential(startId, endId, genName, basePercent) {
    const cards = [];
    const total = endId - startId + 1;
    let count = 0;

    for (let i = startId; i <= endId; i++) {
        count++;
        // Calcul pourcent fluide à l'intérieur de la génération
        const currentGenProgress = (count / total) * (100 / GENS.length); 
        const totalProgress = basePercent + currentGenProgress;
        
        ui.update(`DL ${genName}`, `${count}/${total} récupérés...`, totalProgress);
        
        try {
            await wait(200); // Pause anti-ban

            const pUrl = PROXY_URL + encodeURIComponent(`https://pokeapi.co/api/v2/pokemon/${i}`);
            const pRes = await fetch(pUrl);
            if(!pRes.ok) throw new Error("Err");
            const pData = await pRes.json();

            const sUrl = PROXY_URL + encodeURIComponent(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
            const sRes = await fetch(sUrl);
            if(!sRes.ok) throw new Error("Err");
            const sData = await sRes.json();

            // Logique de création de carte...
            const nameFr = sData.names.find(n => n.language.name === 'fr')?.name || pData.name;
            const typeCap = pData.types[0].type.name.charAt(0).toUpperCase() + pData.types[0].type.name.slice(1);
            const totalStats = pData.stats.reduce((acc, s) => acc + s.base_stat, 0);

            const attacks = [{ name: "Charge", cost: 1, damage: 10 }];
            if (pData.moves.length > 0) {
                const mName = pData.moves[Math.floor(Math.random() * Math.min(10, pData.moves.length))].move.name;
                attacks.push({ name: mName, cost: 3, damage: Math.floor(pData.stats[1].base_stat / 1.5) + 20 });
            }

            let rarity = calculateRarity(i, totalStats);
            if (sData.is_legendary || sData.is_mythical) rarity = "secret";

            cards.push({
                id: i,
                name: nameFr,
                hp: pData.stats[0].base_stat * 2,
                types: [typeCap],
                image: pData.sprites.other["official-artwork"].front_default,
                attacks: attacks,
                weakness: "Standard",
                rarity_tag: rarity
            });

        } catch (e) {
            // On ignore silencieusement les erreurs individuelles
        }
    }
    return cards;
}

// --- UTILITAIRES ---
function processFastPokemon(p) {
    // ... (Garde la même logique qu'avant) ...
    const hp = p.base.HP * 2;
    const type = p.type[0]; 
    const attacks = [{ name: "Attaque Rapide", cost: 1, damage: 10 }, { name: "Coup Spécial", cost: 3, damage: Math.floor(p.base.Attack / 1.5) + 20 }];
    let rarity = calculateRarity(p.id, p.base.HP + p.base.Attack + p.base.Defense + p.base.Sp_Attack + p.base.Sp_Defense + p.base.Speed);
    return {
        id: p.id,
        name: p.name.french || p.name.english,
        hp: hp,
        types: [type],
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
        attacks: attacks,
        weakness: "Standard",
        rarity_tag: rarity
    };
}

function calculateRarity(id, totalStats) {
    let rarity = "common";
    if (totalStats > 580) rarity = "secret"; 
    else if (totalStats > 480) rarity = "ultra_rare";
    else if (totalStats > 380) rarity = "rare";
    else if (totalStats > 300) rarity = "uncommon";
    if ([1,4,7, 152,155,158, 252,255,258, 387,390,393, 495,498,501, 650,653,656, 722,725,728, 810,813,816, 906,909,912].includes(id)) rarity = "uncommon";
    if ([3,6,9, 154,157,160, 254,257,260, 389,392,395, 497,500,503, 652,655,658, 724,727,730, 812,815,818, 908,911,914].includes(id)) rarity = "ultra_rare";
    return rarity;
}

function saveJsonToZip(folder, allCards, tag, filename) {
    const filtered = allCards.filter(c => c.rarity_tag === tag);
    folder.file(filename, JSON.stringify(filtered, null, 2));
}