import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json({ type: "*/*" })); // allow all JSON

// 🔑 Secret from Render (must match ElevenLabs)
const ELEVEN_SECRET = process.env.ELEVEN_SECRET || "not-set";

// 🌐 Root route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live 🚀" });
});

// 📡 Webhook with full debug logging
app.post("/webhook", (req, res) => {
  const signature = req.headers["x-elevenlabs-signature"];
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", ELEVEN_SECRET)
    .update(payload)
    .digest("hex");

  console.log("🔑 Debug HMAC check:");
  console.log("   Provided signature:", signature);
  console.log("   Expected signature:", expectedSignature);
  console.log("   ELEVEN_SECRET (first 6):", ELEVEN_SECRET.substring(0, 6));
  console.log("📡 Raw payload:", JSON.stringify(req.body, null, 2));

  if (!signature) {
    console.warn("⚠️ No signature header found. Allowing for manual test.");
    return res.json({ status: "ok", message: "Webhook received (no signature)" });
  }

  if (signature !== expectedSignature) {
    console.error("❌ Invalid signature. Ignoring webhook.");
    return res.status(401).json({ status: "error", message: "Invalid signature" });
  }

  console.log("✅ Valid webhook received!");
  res.json({ status: "ok", message: "Webhook verified & received" });
});

// 🚀 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 MCP server running on port ${PORT}`);
});
