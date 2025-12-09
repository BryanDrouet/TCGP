window.generateData = async () => {
    console.clear();
    console.log("🚀 Lancement du générateur sans emojis...");
    alert("Ouvre la console (F12) pour copier les résultats !");

    const allCards = [];
    const TOTAL = 151; 

    for (let i = 1; i <= TOTAL; i++) {
        try {
            const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            const pData = await pRes.json();
            const sRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
            const sData = await sRes.json();

            // Type (Capitalized pour le mapping SVG)
            let typeRaw = pData.types[0].type.name; 
            const typeCap = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1);

            // Simulation Attaques
            const attacks = [];
            attacks.push({ name: "Charge", cost: 1, damage: 10 });
            if(pData.moves.length > 5) {
                const randomMove = pData.moves[Math.floor(Math.random() * 10)].move.name;
                attacks.push({ name: randomMove, cost: 3, damage: Math.floor(pData.stats[1].base_stat / 1.5) });
            }

            // Rareté
            let rarity = "common";
            if (sData.is_legendary || sData.is_mythical) rarity = "secret";
            else if (pData.base_experience > 200) rarity = "ultra_rare";
            else if (sData.evolves_from_species) rarity = "rare";
            else if (pData.base_experience > 100) rarity = "uncommon";
            
            // Override Starters
            if([1,4,7,25].includes(i)) rarity = "uncommon";
            if([3,6,9].includes(i)) rarity = "ultra_rare";

            allCards.push({
                id: i,
                name: sData.names.find(n => n.language.name === 'fr').name,
                hp: pData.stats[0].base_stat * 2,
                types: [typeCap], // Important pour les icones
                image: pData.sprites.other["official-artwork"].front_default,
                attacks: attacks,
                weakness: "Standard",
                rarity_tag: rarity
            });

            console.log(`✅ ${i}/${TOTAL} OK`);

        } catch (e) { console.error(e); }
    }

    const show = (tag, file) => {
        const filtered = allCards.filter(c => c.rarity_tag === tag);
        console.log(`\n⬇️ COPIE CECI DANS ${file} ⬇️`);
        console.log(JSON.stringify(filtered, null, 2));
    };

    show('common', 'data/common.json');
    show('uncommon', 'data/uncommon.json');
    show('rare', 'data/rare.json');
    show('ultra_rare', 'data/ultra_rare.json');
    show('secret', 'data/secret.json');
};
