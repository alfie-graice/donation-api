const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Ambil SECRET_KEY dari environment variable
const SECRET_KEY = process.env.SECRET_KEY || "DONASI123";

// Simpan donasi sementara di RAM
let donations = [];

/* =========================
   WEBHOOK SAWERIA
========================= */
app.post("/api/webhook/saweria", (req, res) => {
  const data = req.body;

  console.log("Webhook masuk:", data); // debug/log

  // Format donasi
  const donation = {
    id: Date.now().toString(),
    donor: data.donor || data.name || "Anonymous",
    amount: Number(data.amount || data.amount_raw || 0),
    message: data.message || "",
    platform: "saweria",
    matchedUsername: data.username || null,
    ts: Date.now()
  };

  donations.push(donation);

  res.json({ ok: true, received: donation });
});

/* =========================
   FETCH DONASI UNTUK CLIENT / ROBLOX
========================= */
app.get("/api/donations/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "Invalid secret key" });
  }

  const since = Number(req.query.since || 0);
  const result = donations.filter(d => d.ts > since);

  res.json({ ok: true, donations: result.slice(0, 20) });
});

/* =========================
   REGISTER PLAYER (contoh)
========================= */
app.post("/api/register/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "Invalid secret key" });
  }

  res.json({ ok: true, code: "REGISTERED" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
