const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ CORS (obligatoire)
app.use(cors());

// ✅ JSON
app.use(express.json());

// 🧠 mémoire des conversations
const conversations = {};

// 📄 servir fichiers statiques (si besoin)
app.use(express.static(path.join(__dirname, "public")));

// 🤖 route IA (simple et stable)
app.post("/ai", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message || !userId) {
            return res.status(400).json({ reply: "❌ Données manquantes" });
        }

        if (!conversations[userId]) {
            conversations[userId] = [];
        }

        // sauvegarde message user
        conversations[userId].push({
            role: "user",
            content: message
        });

        // 👉 réponse simulée (évite crash)
        let reply = "🤖 Réponse de RizoIA (mode test)";

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
    res.send("🚀 Serveur RizoIA OK");
});

// 🚀 lancement
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});