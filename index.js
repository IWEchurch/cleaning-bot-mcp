import express from "express";
import crypto from "crypto";

const app = express();

// Middleware to capture raw body for HMAC validation
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-elevenlabs-signature"];
  const secret = process.env.ELEVEN_SECRET; // <-- add this in Render environment variables

  console.log("📩 Incoming ElevenLabs webhook");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  if (!signature) {
    console.warn("⚠️ No signature header found.");
    return res.status(401).json({ error: "Missing signature" });
  }

  // Compute HMAC
  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (expected !== signature) {
    console.error("❌ Invalid signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  console.log("✅ Signature verified");
  res.json({ status: "ok", message: "Webhook received", data: req.body });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
