const express = require("express");
const app = express();

app.use(express.json());

// =====================
// 🧠 MÉMOIRE EN LOCAL
// =====================
let memory = {};

// =====================
// 🚫 FILTRAGE SÉCURITÉ
// =====================
const forbiddenKeywords = [
    "hack",
    "pirater",
    "roblox exploit",
    "minecraft site",
    "youtube",
    "wikipedia",
    "président",
    "données personnelles",
    "password",
    "mot de passe"
];

function isSafe(text) {
    text = text.toLowerCase();
    return !forbiddenKeywords.some(word => text.includes(word));
}

// =====================
// 🧠 MÉMOIRE
// =====================
app.post("/memory", (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.json({ error: "Données manquantes" });
    }

    if (!memory[userId]) {
        memory[userId] = [];
    }

    memory[userId].push(message); // mot pour mot

    res.json({ success: true });
});

app.get("/memory/:userId", (req, res) => {
    const userId = req.params.userId;
    res.json({ messages: memory[userId] || [] });
});

// =====================
// 🌐 RECHERCHE
// =====================
app.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.json({ error: "Aucune recherche" });
    }

    if (!isSafe(query)) {
        return res.json({
            error: "🚫 Recherche bloquée pour raisons de sécurité."
        });
    }

    // 👉 simulation de recherche
    res.json({
        result: "🔍 Résultat simulé pour : " + query
    });
});

// =====================
// 🤖 IA SIMPLE
// =====================
app.post("/chat", async (req, res) => {
    const { userId, message } = req.body;

    if (!message) {
        return res.json({ reply: "Message vide." });
    }

    // 🚫 sécurité
    if (!isSafe(message)) {
        return res.json({
            reply: "🚫 Je ne peux pas répondre à ça."
        });
    }

    // 🧠 sauvegarde mémoire (mot pour mot)
    if (!memory[userId]) {
        memory[userId] = [];
    }

    memory[userId].push(message);

    // 🧠 logique IA simple
    let reply = "🤖 Je réfléchis...";

    // prénom
    if (message.toLowerCase().includes("mon prénom est")) {
        const name = message.split("mon prénom est")[1].trim();

        memory[userId].push({ type: "name", value: name });

        reply = "😊 Enchanté " + name;
    }

    // demander prénom
    else if (message.toLowerCase().includes("quel est mon prénom")) {
        const nameObj = memory[userId].find(m => m.type === "name");

        reply = nameObj
            ? "👤 Ton prénom est " + nameObj.value
            : "Je ne connais pas encore ton prénom.";
    }

    // recherche
    else if (message.toLowerCase().startsWith("cherche")) {
        const query = message.replace("cherche", "").trim();

        if (!isSafe(query)) {
            reply = "🚫 Recherche bloquée.";
        } else {
            reply = "🔍 Recherche pour : " + query;
        }
    }

    // réponse générique
    else {
        reply = "🤖 Je suis RizoIA, je suis encore en apprentissage.";
    }

    res.json({ reply });
});

// =====================
// 🌍 SERVEUR
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Serveur lancé sur le port " + PORT);
});