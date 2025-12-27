const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// =======================
// CONFIG
// =======================
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "DONASI123";

// simpan donasi sementara (RAM)
let donations = [];

// =======================
// UTILS
// =======================
function formatRupiah(amount) {
  return "Rp " + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Donation API",
  });
});

// =======================
// SAWERIA WEBHOOK
// =======================
// SET DI SAWERIA KE:
// https://donation-api-production-edf2.up.railway.app/api/donations/saweria
app.post("/api/donations/saweria", (req, res) => {
  try {
    const data = req.body;

    // validasi minimal payload saweria
    if (!data || !data.amount_raw || !data.donator_name) {
      console.warn("INVALID SAWERIA PAYLOAD:", data);
      return res.status(400).json({ ok: false });
    }

    const donation = {
      id: Date.now().toString(), // unique id
      platform: "saweria",

      donor: data.donator_name,      // kolom "Dari" (username Roblox)
      message: data.message || "",   // kolom "Pesan"

      amount: Number(data.amount_raw),
      formattedAmount: formatRupiah(Number(data.amount_raw)),

      ts: Date.now(),
    };

    donations.push(donation);

    console.log("SAWERIA DONATION:", donation);

    res.json({ ok: true });
  } catch (err) {
    console.error("SAWERIA ERROR:", err);
    res.status(500).json({ ok: false });
  }
});

// =======================
// ROBLOX POLLING ENDPOINT
// =======================
// Roblox WAJIB GET ke:
// /api/donations/latest
// Header:
// x-api-key: DONASI123
app.get("/api/donations/latest", (req, res) => {
  const key = req.headers["x-api-key"];

  if (key !== SECRET_KEY) {
    return res.status(403).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  // kirim lalu kosongkan (biar tidak dobel notif)
  const result = donations;
  donations = [];

  res.json({
    ok: true,
    donations: result,
  });
});

// =======================
app.listen(PORT, () => {
  console.log(`Donation API running on port ${PORT}`);
});
