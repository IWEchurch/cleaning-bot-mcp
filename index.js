import express from "express";
import crypto from "crypto";
import axios from "axios";

const app = express();
app.use(express.json({ verify: rawBodySaver }));

// Middleware to keep raw body for HMAC validation
function rawBodySaver(req, res, buf) {
  req.rawBody = buf.toString();
}

// 🔐 HMAC validation helper
function validateHmac(signature, body) {
  const secret = process.env.ELEVEN_SECRET;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return signature === expected;
}

// Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-elevenlabs-signature"];
  const rawBody = req.rawBody;

  // Validate HMAC
  if (!validateHmac(signature, rawBody)) {
    console.error("❌ Invalid HMAC signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  console.log("📞 Valid webhook received:", req.body);

  const { data } = req.body;
  const lead = {
    name: data?.caller_name || "Unknown",
    phone: data?.caller_number || "Unknown",
    email: data?.caller_email || "Unknown",
    address: data?.address || "Unknown",
    cleaningType: data?.cleaningType || "Unknown",
    preferredDate: data?.preferredDate || "Unknown"
  };

  // Always log the lead
  console.log("📝 Logging lead:", lead);

  try {
    // ✅ Send to HubSpot
    await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      { properties: {
          firstname: lead.name,
          phone: lead.phone,
          email: lead.email,
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

    console.log("✅ Lead synced to HubSpot");
    res.json({ status: "ok", message: "Lead logged & sent to HubSpot" });
  } catch (err) {
    console.error("❌ HubSpot error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to sync to HubSpot" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
