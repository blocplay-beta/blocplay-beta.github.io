const express = require("express");
const path = require("path");

const app = express();

// 🔧 middleware
app.use(express.json());

// 📁 servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// 📄 route principale (évite "Cannot GET /")
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🤖 route IA
app.post("/ai", async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ reply: "Message manquant" });
        }

        // 🔐 IA simple (à remplacer par HuggingFace après)
        let reply = "Je n’ai pas encore appris ça 😅";

        // 🧠 petit exemple de logique
        if (message.toLowerCase().includes("salut")) {
            reply = "Salut 👋 ! Comment je peux t’aider ?";
        }

        if (message.toLowerCase().includes("blocplay")) {
            reply = "BlocPlay est ta plateforme de jeux 🚀";
        }

        return res.json({
            reply: reply,
            userId: userId || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Erreur serveur" });
    }
});

// ⚙️ port Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("🚀 Serveur lancé sur le port", PORT);
});