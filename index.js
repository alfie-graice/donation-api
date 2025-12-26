const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY;

// Simpan donasi sementara (RAM)
let donations = [];

/* =========================
   WEBHOOK DONASI
========================= */
app.post("/api/webhook/saweria", (req, res) => {
    const data = req.body;

    const donation = {
        id: Date.now().toString(),
        donor: data.donor || "Anonymous",
        amount: Number(data.amount || 0),
        message: data.message || "",
        platform: "saweria",
        matchedUsername: data.username || null,
        ts: Date.now()
    };

    donations.push(donation);
    res.json({ ok: true });
});

/* =========================
   ROBLOX FETCH DONASI
========================= */
app.get("/api/donations/:secret", (req, res) => {
    if (req.params.secret !== SECRET_KEY) {
        return res.status(403).json({ ok: false });
    }

    const since = Number(req.query.since || 0);
    const result = donations.filter(d => d.ts > since);

    res.json({ ok: true, donations: result.slice(0, 20) });
});

/* =========================
   REGISTER PLAYER
========================= */
app.post("/api/register/:secret", (req, res) => {
    if (req.params.secret !== SECRET_KEY) {
        return res.status(403).json({ ok: false });
    }

    res.json({ ok: true, code: "REGISTERED" });
});

/* ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("API running on port", PORT);
});
