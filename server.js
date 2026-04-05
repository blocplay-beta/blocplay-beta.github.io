const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🧠 mémoire en RAM
const conversations = {};

// 🔒 filtre de sécurité
function isSafe(message) {
    const banned = ["hack", "pirate", "mdp", "mot de passe", "voler"];
    return !banned.some(word => message.toLowerCase().includes(word));
}

// 🔍 recherche safe (simulée pour l'instant)
async function safeSearch(query) {
    const forbidden = ["hack", "illegal", "pirate"];

    if (forbidden.some(word => query.toLowerCase().includes(word))) {
        return "🚫 Recherche refusée (contenu interdit)";
    }

    return `🔍 Résultats pour : "${query}"`;
}

app.get("/", (req, res) => {
    res.send("Serveur RizoIA actif 🚀");
});

app.post("/ai", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.json({ reply: "Message vide ❌" });
        }

        // 🧠 créer mémoire utilisateur
        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // 🔒 filtre
        if (!isSafe(message)) {
            return res.json({ reply: "🚫 Contenu non autorisé." });
        }

        // 🔍 commande recherche
        if (message.startsWith("/search ")) {
            const query = message.replace("/search ", "");
            const result = await safeSearch(query);

            conversations[userId].push({
                role: "user",
                content: message
            });

            conversations[userId].push({
                role: "ai",
                content: result
            });

            return res.json({ reply: result });
        }

        // 🧠 stocker message utilisateur (mot pour mot)
        conversations[userId].push({
            role: "user",
            content: message
        });

        let reply = "Je réfléchis 🤖...";

        // 🤖 logique simple (fallback)
        if (message.toLowerCase().includes("salut")) {
            reply = "Salut 👋 !";
        } else if (message.toLowerCase().includes("ça va")) {
            reply = "Oui ça va bien 😄 et toi ?";
        }

        // 🤖 HuggingFace (si activé)
        try {
            const HF_TOKEN = process.env.HF_TOKEN;

            const response = await axios.post(
                "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
                { inputs: message },
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`
                    }
                }
            );

            if (response.data && response.data[0]?.generated_text) {
                reply = response.data[0].generated_text;
            }

        } catch (e) {
            console.log("HF erreur (fallback utilisé)");
        }

        // 🧠 stocker réponse IA
        conversations[userId].push({
            role: "ai",
            content: reply
        });

        res.json({
            reply,
            history: conversations[userId]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Erreur serveur ❌" });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});