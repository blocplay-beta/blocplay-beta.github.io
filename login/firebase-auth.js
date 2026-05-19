// Please read COPYRIGHT.md
import { getAuth, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth();

/* 🔥 MENU (si tu l'utilises sur toutes les pages) */
function renderMenu(user) {
    const dropdown = document.getElementById("dropdown");

    if (!dropdown) return;

    if (user) {
        dropdown.innerHTML = `
            <a href="/profile">Profil</a>
            <a href="/settings">Paramètres</a>
            <a href="#" id="logout">Se déconnecter</a>
        `;
    } else {
        dropdown.innerHTML = `
            <a href="/login">Se connecter</a>
            <a href="/signup">Créer un compte</a>
        `;
    }
}

/* 🔥 AUTH GLOBAL */
onAuthStateChanged(auth, (user) => {

    renderMenu(user);

    if (user) {

        console.log("Utilisateur connecté :", user.uid);

        // 🔥 ENVOI VERS L'APP PYTHON (BlocPlay desktop)
        if (window.qtBridge) {
            window.qtBridge.send_uid_to_python(user.uid);
        }

    } else {
        console.log("Utilisateur déconnecté");
    }
});

/* 🔥 LOGOUT GLOBAL */
document.addEventListener("click", async (e) => {
    if (e.target.id === "logout") {
        const { signOut } = await import(
            "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
        );
        await signOut(auth);
    }
});