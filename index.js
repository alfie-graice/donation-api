const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ==========================
// ENVIRONMENT VARIABLES
// ==========================
const SECRET_KEY = process.env.SECRET_KEY || "DONASI123";
const PORT = process.env.PORT || 3000;

// ==========================
// STORAGE (RAM)
// ==========================

// daftar donasi masuk
let donations = [];

// registry player roblox online
// contoh:
// {
//   "123456789": { username: "astamaya9", lastSeen: 1700000000000 }
// }
let robloxPlayers = {};

// ==========================
// WEBHOOK SAWERIA
// ==========================
app.post("/api/webhook/saweria", (req, res) => {
  const data = req.body;
  console.log("[SAWERIA] Webhook masuk:", data);

  const donation = {
    id: Date.now().toString() + Math.floor(Math.random() * 1000),
    donor: data.donator_name || "Anonymous",
    amount: Number(data.amount || data.amount_raw || 0),
    message: data.message || "",
    platform: "saweria",
    ts: Date.now()
  };

  donations.push(donation);

  console.log("[SAWERIA] Donation saved:", donation.amount);
  res.json({ ok: true });
});

// ==========================
// FETCH DONATIONS (ROBLOX POLLING)
// ==========================
app.get("/api/donations/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "INVALID_SECRET" });
  }

  const since = Number(req.query.since || 0);
  const result = donations.filter(d => d.ts > since);

  res.json({
    ok: true,
    donations: result.slice(0, 50)
  });
});

// ==========================
// REGISTER PLAYER ROBLOX
// ==========================
app.post("/api/register/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "INVALID_SECRET" });
  }

  const { userId, username } = req.body || {};

  if (!userId || !username) {
    return res.json({ ok: false, error: "INVALID_DATA" });
  }

  robloxPlayers[userId] = {
    username,
    lastSeen: Date.now()
  };

  console.log("[ROBLOX] Registered:", userId, username);
  res.json({ ok: true });
});

// ==========================
// HEALTH CHECK (OPTIONAL)
// ==========================
app.get("/", (_, res) => {
  res.send("Donation API is running");
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`Donation API running on port ${PORT}`);
});
