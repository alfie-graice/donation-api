const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ==========================
// ENVIRONMENT VARIABLES
// ==========================
const SECRET_KEY = process.env.SECRET_KEY || "DONASI123"; // secret key untuk endpoint
const PORT = process.env.PORT || 3000;

// ==========================
// FIXED ROBLOX API URL
// ==========================
const ROBLOX_API = "https://donation-api-production-edf2.up.railway.app/api/register"; 

// ==========================
// STORAGE SEMENTARA
// ==========================
let donations = [];           // daftar donasi masuk
let sentToRoblox = new Set(); // donasi yang sudah dikirim ke Roblox

// ==========================
// WEBHOOK SAWERIA
// ==========================
app.post("/api/webhook/saweria", async (req, res) => {
  const data = req.body;
  console.log("Webhook masuk:", data);

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

  // --- Kirim otomatis ke Roblox ---
  try {
    if (!sentToRoblox.has(donation.id)) {
      const response = await axios.post(`${ROBLOX_API}/${SECRET_KEY}`, {
        donor: donation.donor,
        amount: donation.amount,
        message: donation.message
      });

      console.log("Kirim ke Roblox:", response.data);
      sentToRoblox.add(donation.id);
    }
  } catch (err) {
    console.error("Gagal kirim ke Roblox:", err.message);
  }

  res.json({ ok: true, received: donation });
});

// ==========================
// FETCH DONASI UNTUK CLIENT / ROBLOX
// ==========================
app.get("/api/donations/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "Invalid secret key" });
  }

  const since = Number(req.query.since || 0);
  const result = donations.filter(d => d.ts > since);

  res.json({ ok: true, donations: result.slice(0, 20) });
});

// ==========================
// REGISTER PLAYER (endpoint Roblox)
// ==========================
app.post("/api/register/:secret", (req, res) => {
  if (req.params.secret !== SECRET_KEY) {
    return res.status(403).json({ ok: false, error: "Invalid secret key" });
  }

  const { donor, amount, message } = req.body || {};
  console.log("Register player di Roblox:", { donor, amount, message });

  // Di sini bisa diteruskan ke game Roblox via HTTPService / datastore
  res.json({ ok: true, code: "REGISTERED" });
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
