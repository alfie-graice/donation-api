const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// =======================
// CONFIG
// =======================
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "CHANGE_THIS_SECRET";

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
    status: "ok",
    service: "Donation API",
  });
});

// =======================
// SAWERIA WEBHOOK
// =======================
app.post("/api/donations/saweria", (req, res) => {
  try {
    const data = req.body;

    // validasi payload
    if (!data || !data.amount_raw || !data.donator_name) {
      console.warn("INVALID SAWERIA PAYLOAD:", data);
      return res.status(400).json({ ok: false });
    }

    // ambil data SAWERIA
    const donation = {
      platform: "saweria",

      // INI YANG PENTING
      donorName: data.donator_name,      // <- dari kolom "Dari"
      message: data.message || "",        // <- dari kolom Pesan

      amount: Number(data.amount_raw),
      formattedAmount: formatRupiah(Number(data.amount_raw)),

      createdAt: data.created_at || new Date().toISOString(),
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
// ENDPOINT UNTUK ROBLOX
// =======================
app.get("/api/donations/latest", (req, res) => {
  const key = req.headers["x-api-key"];

  if (key !== SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  // kirim lalu kosongkan
  const data = donations;
  donations = [];

  res.json({
    donations: data,
  });
});

// =======================
app.listen(PORT, () => {
  console.log(`Donation API running on port ${PORT}`);
});
