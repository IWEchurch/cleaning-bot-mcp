import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json({ type: "*/*" })); // allow raw JSON

// 🔑 Grab ElevenLabs secret from environment
const ELEVEN_SECRET = process.env.ELEVEN_SECRET || "your-secret-from-elevenlabs";

// 🌐 Root test
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live 🚀" });
});

// 📡 ElevenLabs webhook with HMAC verification
app.post("/webhook", (req, res) => {
  const signature = req.headers["x-elevenlabs-signature"];
  const payload = JSON.stringify(req.body);

  // Generate expected signature
  const expectedSignature = crypto
    .createHmac("sha256", ELEVEN_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("❌ Invalid signature. Ignoring webhook.");
    return res.status(401).json({ status: "error", message: "Invalid signature" });
  }

  // ✅ Valid webhook
  console.log("📞 Valid ElevenLabs webhook:", req.body);

  res.json({ status: "ok", message: "Webhook received" });
});

// 🚀 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 MCP server running on port ${PORT}`);
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
