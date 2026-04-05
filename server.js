const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// ✅ CORS (obligatoire pour GitHub Pages)
app.use(cors());

// ✅ JSON
app.use(express.json());

// 🧠 mémoire des conversations
const conversations = {};

// 🔒 filtre simple sécurité
function isSafe(message) {
    const banned = ["hack", "pirate", "mdp", "password"];
    return !banned.some(word => message.toLowerCase().includes(word));
}

// 🤖 IA
app.post("/ai", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(400).json({ reply: "❌ Données manquantes" });
        }

        // créer conversation si elle n'existe pas
        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // 🔒 sécurité
        if (!isSafe(message)) {
            return res.json({ reply: "🚫 Contenu interdit" });
        }

        // 💾 stock message utilisateur
        conversations[userId].push({
            role: "user",
            content: message
        });

        let reply = "⚠️ IA indisponible";

        try {
            const HF_TOKEN = process.env.HF_TOKEN;

            // 🧠 envoie à HuggingFace
            const response = await axios.post(
                "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
                {
                    inputs: message
                },
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`
                    }
                }
            );

            // ✅ récupérer réponse
            if (response.data && response.data[0]) {
                reply = response.data[0].generated_text;
            }

        } catch (err) {
            console.log("Erreur HuggingFace :", err.message);
        }

        // 💾 stock réponse IA
        conversations[userId].push({
            role: "ai",
            content: reply
        });

        res.json({ reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Erreur serveur ❌" });
    }
});

// 📄 toutes les conversations
app.get("/conversations", (req, res) => {
    res.json(conversations);
});

// 👁️ récupérer une conversation
app.get("/conversation/:id", (req, res) => {
    const id = req.params.id;

    if (!conversations[id]) {
        return res.json([]);
    }

    res.json(conversations[id]);
});

// 🧪 route test
app.get("/", (req, res) => {
    res.send("🚀 RizoIA serveur OK");
});

// 🚀 lancement
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});