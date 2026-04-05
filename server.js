const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("✅ RizoIA backend fonctionne !");
});

app.listen(PORT, () => {
    console.log("Serveur lancé sur le port " + PORT);
});