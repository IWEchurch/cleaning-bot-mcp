import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});
app.post("/webhook", async (req, res) => {
  const incomingSecret = req.headers["x-elevenlabs-signature"];

  if (incomingSecret !== process.env.WEBHOOK_SECRET) {
    console.warn("❌ Invalid webhook secret");
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  console.log("📞 New lead from ElevenLabs:", req.body);

  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // ... HubSpot push ...
});
// ElevenLabs webhook
app.post("/webhook", async (req, res) => {
  console.log("📞 New lead from ElevenLabs:", req.body);

  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // Backup log
  console.log("📝 Logging lead:", { name, phone, email, address, cleaningType, preferredDate });

  try {
    // Push into HubSpot
    await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          firstname: name || "Unknown",
          phone: phone || "",
          email: email || "",
          address: address || "",
          cleaning_type: cleaningType || "",
          preferred_date: preferredDate || ""
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Lead synced to HubSpot");

    // Respond to ElevenLabs
    res.json({ status: "ok", message: "Lead received & synced to HubSpot" });
  } catch (err) {
    console.error("❌ HubSpot sync failed:", err.response?.data || err.message);
    res.status(500).json({ status: "error", message: "HubSpot sync failed" });
  }
});

// Render port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
