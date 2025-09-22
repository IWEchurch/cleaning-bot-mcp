import express from "express";
import crypto from "crypto";
import axios from "axios";

const app = express();
app.use(express.json({ verify: (req, res, buf) => (req.rawBody = buf) }));

// Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  console.log("📩 Incoming ElevenLabs webhook");

  const signature = req.headers["x-elevenlabs-signature"];
  const rawBody = req.rawBody;
  const secret = process.env.ELEVEN_SECRET;

  if (!signature || !secret) {
    console.warn("⚠️ No signature or secret found, skipping validation.");
  } else {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expected) {
      console.error("❌ Invalid signature. Ignoring webhook.");
      return res.status(401).json({ status: "error", message: "Invalid signature" });
    }
  }

  const payload = req.body;
  console.log("📡 Payload:", JSON.stringify(payload, null, 2));

  // Try to extract user info from ElevenLabs transcript
  const lead = {
    name: payload?.data?.analysis?.transcript_summary || "Unknown Caller",
    phone: payload?.data?.conversation_initiation_client_data?.dynamic_variables?.system__caller_id || "Unknown",
    email: "unknown@example.com", // ElevenLabs doesn’t always provide this
    address: "Unknown",
    cleaningType: "residental",
    preferredDate: new Date().toISOString().split("T")[0]
  };

  console.log("📝 Logging lead:", lead);

  // Send to HubSpot
  try {
    const hubspotRes = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          email: lead.email,
          firstname: lead.name,
          phone: lead.phone,
          address: lead.address,
          cleaning_type: lead.cleaningType,
          preferred_date: lead.preferredDate
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Lead synced to HubSpot:", hubspotRes.data);
    res.json({ status: "ok", message: "Lead pushed to HubSpot", data: hubspotRes.data });
  } catch (err) {
    console.error("❌ HubSpot sync failed:", err.response?.data || err.message);
    res.status(500).json({ status: "error", message: "HubSpot sync failed" });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
