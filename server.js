const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// =====================
// 🔐 CONFIG
// =====================
const HF_API_KEY = process.env.HF_API_KEY;

// Modèle IA (multilingue conversation)
const MODEL_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

// =====================
// 🛡️ FILTRE DE SÉCURITÉ
// =====================
const forbiddenWords = [
    "hack",
    "pirate",
    "cheat",
    "exploit",
    "password",
    "token",
    "api key"
];

function isSafe(text) {
    return !forbiddenWords.some(word =>
        text.toLowerCase().includes(word)
    );
}

// =====================
// 🧠 MÉMOIRE UTILISATEUR
// =====================
let memory = {};

// Sauvegarde mémoire
app.post("/memory", (req, res) => {
    const { userId, data } = req.body;

    if (!userId || !data) {
        return res.json({ error: "Données manquantes" });
    }

    if (!memory[userId]) {
        memory[userId] = {};
    }

    // On stocke tout
    memory[userId] = {
        ...memory[userId],
        ...data
    };

    res.json({ ok: true, memory: memory[userId] });
});

// Récupérer mémoire
app.get("/memory/:userId", (req, res) => {
    const userId = req.params.userId;

    res.json({
        memory: memory[userId] || {}
    });
});

// =====================
// 🤖 ROUTE IA
// =====================
app.post("/ai", async (req, res) => {
    const { message, userId } = req.body;

    if (!message) {
        return res.json({ reply: "❌ Message vide" });
    }

    // 🔒 filtre
    if (!isSafe(message)) {
        return res.json({
            reply: "🚫 Ce contenu est interdit."
        });
    }

    try {
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: message
            })
        });

        const data = await response.json();

        let reply = "🤖 Je ne sais pas répondre.";

        if (Array.isArray(data) && data[0]?.generated_text) {
            reply = data[0].generated_text;
        }

        // 💾 sauvegarde automatique dans mémoire
        if (userId) {
            if (!memory[userId]) memory[userId] = {};

            if (!memory[userId].history) {
                memory[userId].history = [];
            }

            memory[userId].history.push({
                user: message,
                ai: reply,
                time: Date.now()
            });
        }

        res.json({ reply });

    } catch (error) {
        console.error(error);
        res.json({ reply: "❌ Erreur serveur IA" });
    }
});

// =====================
// 🔎 RECHERCHE SIMPLE (SAFE)
// =====================
app.get("/search", (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.json({ error: "Aucune requête" });
    }

    if (!isSafe(query)) {
        return res.json({
            error: "🚫 Recherche bloquée"
        });
    }

    // ⚠️ Tu peux brancher une vraie API plus tard
    res.json({
        result: `🔍 Résultat simulé pour : ${query}`
    });
});

// =====================
// ❤️ ROUTE TEST
// =====================
app.get("/", (req, res) => {
    res.send("🚀 RizoIA est en ligne !");
});

// =====================
// 🚀 DÉMARRAGE SERVEUR
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Serveur lancé sur le port " + PORT);
});