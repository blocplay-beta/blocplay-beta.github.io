const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🧠 mémoire (temporaire)
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

        if (!message) {
            return res.json({ reply: "Message vide ❌" });
        }

        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // 🔒 filtre
        if (!isSafe(message)) {
            return res.json({ reply: "🚫 Contenu interdit." });
        }

        // 💾 stocker message user
        conversations[userId].push({ role: "user", content: message });

        let reply = "Je réfléchis 🤖...";

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

            if (response.data?.[0]?.generated_text) {
                reply = response.data[0].generated_text;
            }

        } catch (e) {
            reply = "⚠️ IA indisponible";
        }

        conversations[userId].push({ role: "ai", content: reply });

        res.json({ reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Erreur serveur ❌" });
    }
});

// 📄 récupérer toutes les conversations
app.get("/conversations", (req, res) => {
    res.json(conversations);
});

// 👁️ voir une conversation
app.get("/conversation/:id", (req, res) => {
    const id = req.params.id;

    if (!conversations[id]) {
        return res.json({ error: "Conversation introuvable" });
    }

    res.json(conversations[id]);
});

// 📄 page principale
app.get("/", (req, res) => {
    res.send("Serveur RizoIA 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});