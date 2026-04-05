const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// 🌐 Middleware
app.use(cors());
app.use(express.json());

// 🧠 Mémoire des conversations
const conversations = {};

// 🔒 Filtre simple
function isSafe(message) {
    const bannedWords = ["hack", "pirate", "mdp", "password"];
    return !bannedWords.some(word => message.toLowerCase().includes(word));
}

// 🤖 Route IA
app.post("/ai", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(400).json({ reply: "❌ Données manquantes" });
        }

        // init mémoire
        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // 🔒 sécurité
        if (!isSafe(message)) {
            return res.json({ reply: "🚫 Contenu interdit" });
        }

        // 💾 stock user
        conversations[userId].push({
            role: "user",
            content: message
        });

        let reply = "⚠️ IA indisponible";

        const HF_TOKEN = process.env.HF_TOKEN;

        if (!HF_TOKEN) {
            console.log("❌ Token manquant");
            return res.json({ reply: "❌ Token IA manquant" });
        }

        console.log("🔑 Token OK");

        try {
            const response = await axios.post(
                "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
                {
                    inputs: message
                },
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`
                    }
                }
            );

            console.log("📡 Réponse HF :", response.data);

            if (response.data?.[0]?.generated_text) {
                reply = response.data[0].generated_text;
            } else if (response.data?.generated_text) {
                reply = response.data.generated_text;
            } else {
                reply = "🤖 Réponse vide";
            }

        } catch (err) {
            console.error("❌ ERREUR HF :", err.response?.data || err.message);

            if (err.response?.status === 503) {
                reply = "⏳ IA en chargement";
            } else if (err.response?.status === 401) {
                reply = "❌ Token invalide";
            } else if (err.response?.status === 404) {
                reply = "❌ Modèle introuvable";
            } else {
                reply = "⚠️ IA indisponible";
            }
        }

        // 💾 stock IA
        conversations[userId].push({
            role: "ai",
            content: reply
        });

        res.json({ reply });

    } catch (err) {
        console.error("❌ ERREUR SERVEUR :", err);
        res.status(500).json({ reply: "Erreur serveur ❌" });
    }
});

// 📄 récupérer conversations
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

// 🧪 test
app.get("/", (req, res) => {
    res.send("🚀 RizoIA serveur OK");
});

// 🚀 lancement
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});