import express from "express";
import crypto from "crypto";

const app = express();

// Capture raw body for HMAC validation
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
  console.log("📩 Incoming ElevenLabs webhook");

  const signature = req.headers["x-elevenlabs-signature"];
  const rawBody = req.rawBody.toString("utf8");
  const secret = process.env.ELEVEN_SECRET;

  if (!secret) {
    console.error("❌ ELEVEN_SECRET not set in environment");
    return res.status(500).send("Server misconfigured");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    console.warn("⚠️ Invalid signature");
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ Verified payload:", req.body);

  // TODO: push to HubSpot here
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
