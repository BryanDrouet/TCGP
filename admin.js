import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "bryan.drouet24@gmail.com"; 

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

window.showPopup = (title, msg) => {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-msg').innerText = msg;
    document.getElementById('custom-popup-overlay').style.display = 'flex';
};
window.closePopup = () => { document.getElementById('custom-popup-overlay').style.display = 'none'; };

onAuthStateChanged(auth, (user) => {
    const loader = document.getElementById('global-loader');
    if (user && user.email === ADMIN_EMAIL) {
        loader.style.display = 'none';
        loadAllPlayers();
    } else {
        window.location.href = "index.html";
    }
});

window.loadAllPlayers = async () => {
    const list = document.getElementById('players-list');
    list.innerHTML = '<tr><td colspan="5">Chargement...</td></tr>';
    try {
        const querySnapshot = await getDocs(collection(db, "players"));
        list.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const lastDraw = data.lastDrawTime ? new Date(data.lastDrawTime).toLocaleTimeString() : "Dispo";
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${data.email}</strong></td>
                <td>${docSnap.id}</td>
                <td>${data.collection ? data.collection.length : 0}</td>
                <td>${lastDraw}</td>
                <td>
                    <button onclick="resetCooldown('${docSnap.id}', '${data.email}')" class="btn-action btn-cooldown">⏳ Reset Timer</button>
                    <button onclick="resetPlayer('${docSnap.id}', '${data.email}')" class="btn-action btn-reset">⚠️ Reset Deck</button>
                </td>`;
            list.appendChild(tr);
        });
    } catch (e) { window.showPopup("Erreur", e.message); }
};

window.resetCooldown = async (uid, email) => {
    try { await updateDoc(doc(db, "players", uid), { lastDrawTime: 0 }); window.showPopup("Succès", `Cooldown reset pour ${email}`); loadAllPlayers(); } catch (e) { window.showPopup("Erreur", e.message); }
};

window.resetPlayer = async (uid, email) => {
    if (!confirm(`Effacer tout le deck de ${email} ?`)) return;
    try { await updateDoc(doc(db, "players", uid), { collection: [], lastDrawTime: 0 }); window.showPopup("Succès", "Deck vidé."); loadAllPlayers(); } catch (e) { window.showPopup("Erreur", e.message); }
};