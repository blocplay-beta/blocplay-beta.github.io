const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// ✅ CORS
app.use(cors());

// ✅ JSON
app.use(express.json());

// 🧠 mémoire
const conversations = {};

// 🔒 filtre simple
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

        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // 🔒 sécurité
        if (!isSafe(message)) {
            return res.json({ reply: "🚫 Contenu interdit" });
        }

        // 💾 stock message user
        conversations[userId].push({
            role: "user",
            content: message
        });

        let reply = "⚠️ IA indisponible";

        try {
            const HF_TOKEN = process.env.HF_TOKEN;

            const response = await axios.post(
                "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
                {
                    inputs: `<s>[INST] ${message} [/INST]`
                },
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`
                    }
                }
            );

            // ✅ réponse IA
            if (response.data?.[0]?.generated_text) {
                reply = response.data[0].generated_text;
            } else {
                reply = "🤖 Réponse vide";
            }

        } catch (err) {
            console.log("Erreur IA:", err.message);

            if (err.response?.status === 503) {
                reply = "⏳ IA en cours de démarrage, réessaie dans quelques secondes";
            } else if (err.response?.status === 401) {
                reply = "❌ Token invalide";
            } else {
                reply = "⚠️ IA indisponible";
            }
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

// 👁️ une conversation
app.get("/conversation/:id", (req, res) => {
    const id = req.params.id;

    if (!conversations[id]) {
        return res.json([]);
    }

    res.json(conversations[id]);
});

// 🧪 test serveur
app.get("/", (req, res) => {
    res.send("🚀 RizoIA serveur OK");
});

// 🚀 lancement
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});