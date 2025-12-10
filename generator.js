// Génération automatique des ID
const GEN_COUNTS = [151, 100, 135, 107, 156, 72, 88];
let GENS = [];
let currentId = 1;
GEN_COUNTS.forEach((count, index) => {
    GENS.push({ id: `gen${index + 1}`, name: `Gen ${index + 1}`, start: currentId, end: currentId + count - 1 });
    currentId += count;
});

const TYPE_TRANSLATION = { "Fire":"Fire", "Water":"Water", "Grass":"Grass", "Electric":"Electric", "Psychic":"Psychic", "Fighting":"Fighting", "Dark":"Darkness", "Steel":"Metal", "Fairy":"Fairy", "Dragon":"Dragon", "Normal":"Normal", "Ground":"Ground", "Flying":"Flying", "Bug":"Bug", "Rock":"Rock", "Ghost":"Ghost", "Poison":"Poison", "Ice":"Ice" };

const ui = {
    toast: document.getElementById('dl-toast'),
    title: document.getElementById('toast-title'),
    msg: document.getElementById('toast-msg'),
    bar: document.getElementById('toast-bar'),
    show: () => { if(ui.toast) ui.toast.style.display = 'block'; },
    hide: () => { if(ui.toast) setTimeout(() => ui.toast.style.display = 'none', 5000); },
    update: (title, message, percent) => { if(ui.title) ui.title.innerText = title; if(ui.msg) ui.msg.innerText = message; if(ui.bar) ui.bar.style.width = percent + "%"; }
};

window.downloadAllGensZip = async () => {
    const btn = document.querySelector('.btn-admin'); if(btn) btn.disabled = true;
    ui.show(); ui.update("Start", "Download Data...", 10);

    try {
        const zip = new JSZip();
        const rootFolder = zip.folder("data");
        const res = await fetch('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json');
        if (!res.ok) throw new Error("Err");
        const rawData = await res.json();

        let allSpecialCards = []; // Pour le pack de Bryan

        // 1. GENS CLASSIQUES
        for (let i = 0; i < GENS.length; i++) {
            const gen = GENS[i];
            const percent = 20 + Math.floor(((i + 1) / GENS.length) * 50);
            ui.update(gen.name, `Processing...`, percent);

            const genData = rawData.filter(p => p.id >= gen.start && p.id <= gen.end);
            const processed = genData.map(p => processPokemon(p));
            
            // On garde les cartes fortes pour le pack spécial
            processed.forEach(c => {
                if (c.rarity_tag === 'ultra_rare' || c.rarity_tag === 'secret' || c.rarity_tag === 'rare') {
                    allSpecialCards.push(c);
                }
            });

            if(processed.length > 0) saveGenFolder(rootFolder, gen.id, processed);
        }

        // 2. PACK SPÉCIAL BRYAN
        ui.update("Pack Spécial", "Compilation...", 80);
        const specialFolder = rootFolder.folder("special_bryan");
        saveJsonToZip(specialFolder, allSpecialCards, 'common', 'common.json'); // Vide
        saveJsonToZip(specialFolder, allSpecialCards, 'uncommon', 'uncommon.json'); // Vide
        // On met tout dans rare/ultra/secret pour ce pack
        saveJsonToZip(specialFolder, allSpecialCards, 'rare', 'rare.json');
        saveJsonToZip(specialFolder, allSpecialCards, 'ultra_rare', 'ultra_rare.json');
        saveJsonToZip(specialFolder, allSpecialCards, 'secret', 'secret.json');

        ui.update("Zip", "Compressing...", 90);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "tcg-data-final.zip");
        ui.update("Done", "OK", 100); ui.hide();

    } catch (e) { alert("Err: " + e.message); } finally { if(btn) btn.disabled = false; }
};

function processPokemon(p) {
    const stats = p.base;
    const hp = stats["HP"] * 2; 
    const atk = stats["Attack"];
    const def = stats["Defense"];
    const spatk = stats["Sp. Attack"];
    const spdef = stats["Sp. Defense"];
    const spd = stats["Speed"];
    const totalStats = stats["HP"] + atk + def + spatk + spdef + spd;
    
    const typeEn = p.type[0];
    
    // Noms d'attaques dynamiques basés sur le type
    const attackNames = {
        Fire: ["Flammèche", "Lance-Flammes"],
        Water: ["Pistolet à O", "Hydrocanon"],
        Grass: ["Fouet Lianes", "Tranch'Herbe"],
        Electric: ["Éclair", "Tonnerre"],
        Psychic: ["Choc Mental", "Psyko"],
        Fighting: ["Poing-Karaté", "Poing Boost"],
        Dark: ["Morsure", "Feinte"],
        Steel: ["Griffe Acier", "Tête de Fer"],
        Fairy: ["Câlinerie", "Éclat Magique"],
        Dragon: ["Dracogriffe", "Draco-Rage"],
        Ice: ["Poudreuse", "Laser Glace"],
        Ground: ["Coud'Boue", "Séisme"],
        Flying: ["Vive-Attaque", "Aéropique"],
        Bug: ["Piqûre", "Plaie-Croix"],
        Rock: ["Jet-Pierres", "Éboulement"],
        Ghost: ["Léchouille", "Ball'Ombre"],
        Poison: ["Dard-Venin", "Détritus"],
        Normal: ["Charge", "Coup d'Boule"]
    };

    const typeAttacks = attackNames[typeEn] || ["Attaque", "Frappe"];
    const attacks = [
        { name: typeAttacks[0], cost: 1, damage: 10 + Math.floor(atk / 10) },
        { name: typeAttacks[1], cost: Math.min(3, Math.floor(spatk / 40) + 2), damage: Math.floor((atk + spatk) / 2.5) + 20 }
    ];

    // Faiblesse, résistance et retraite dynamiques
    const weakness = TYPE_WEAKNESSES[typeEn] || "Normal";
    const resistance = TYPE_RESISTANCES[typeEn] || null;
    const retreatCost = Math.max(0, Math.min(3, Math.floor((totalStats - 200) / 120)));

    // Calcul de la rareté
    let rarity = "common";
    if (totalStats >= 580) rarity = "secret"; 
    else if (totalStats >= 500) rarity = "ultra_rare";
    else if (totalStats >= 400) rarity = "rare";
    else if (totalStats >= 300) rarity = "uncommon";

    // Exceptions manuelles (Starters)
    const startersBase = [1,4,7, 152,155,158, 252,255,258, 387,390,393, 495,498,501, 650,653,656, 722,725,728];
    if (startersBase.includes(p.id)) rarity = "uncommon";
    const startersMax = [3,6,9, 154,157,160, 254,257,260, 389,392,395, 497,500,503, 652,655,658, 724,727,730];
    if (startersMax.includes(p.id)) rarity = "ultra_rare";
    // Légendaires iconiques
    if ([150, 151, 249, 250, 251, 382, 383, 384].includes(p.id)) rarity = "secret";

    return {
        id: p.id,
        name: (p.name.french) ? p.name.french : p.name.english,
        hp: hp,
        types: [typeEn],
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
        attacks: attacks,
        weakness: weakness,
        resistance: resistance,
        retreatCost: retreatCost,
        rarity_tag: rarity
    };
}

function saveGenFolder(root, id, cards) {
    const f = root.folder(id);
    saveJsonToZip(f, cards, 'common', 'common.json');
    saveJsonToZip(f, cards, 'uncommon', 'uncommon.json');
    saveJsonToZip(f, cards, 'rare', 'rare.json');
    saveJsonToZip(f, cards, 'ultra_rare', 'ultra_rare.json');
    saveJsonToZip(f, cards, 'secret', 'secret.json');
}

function saveJsonToZip(folder, allCards, tag, filename) {
    const filtered = allCards.filter(c => c.rarity_tag === tag);
    folder.file(filename, JSON.stringify(filtered, null, 2));
}