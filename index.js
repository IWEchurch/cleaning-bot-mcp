import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import axios from "axios";

const app = express();

// Capture raw body for HMAC validation
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// ✅ Normalize cleaning type to match HubSpot options
function normalizeCleaningType(type) {
  if (!type) return "Residential"; // fallback
  type = type.toLowerCase();

  if (type.includes("resi")) return "Residential";
  if (type.includes("com")) return "Commercial";
  if (type.includes("pre")) return "Pre-Listing";

  return "Residential"; // default
}

// ✅ Root check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Webhook server live 🚀" });
});

// ✅ Webhook endpoint
app.post("/webhook", async (req, res) => {
  console.log("📩 Incoming ElevenLabs webhook");

  // --- Verify Signature ---
  const signature = req.headers["x-elevenlabs-signature"];
  const expected = crypto
    .createHmac("sha256", process.env.ELEVEN_SECRET)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expected) {
    console.warn("⚠️ Invalid signature");
    return res.status(401).json({ status: "error", message: "Invalid signature" });
  }

  const payload = req.body;
  console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  // --- Extract Lead ---
  const lead = {
    name: payload?.data?.analysis?.call_summary_title || "Unknown Caller",
    phone:
      payload?.data?.conversation_initiation_client_data?.dynamic_variables
        ?.system__caller_id || "Unknown",
    email: "unknown@example.com", // replace if collected in transcript
    address: "Unknown", // replace if collected in transcript
    cleaningType: normalizeCleaningType(
      payload?.data?.analysis?.transcript_summary || ""
    ),
    preferredDate: new Date().toISOString().split("T")[0],
  };

  console.log("📝 Lead:", lead);

  // --- Send to HubSpot ---
  try {
    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          email: lead.email,
          firstname: lead.name,
          phone: lead.phone,
          address: lead.address,
          cleaning_type: lead.cleaningType,
          preferred_date: lead.preferredDate,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Lead synced to HubSpot:", response.data);
    res.json({ status: "ok", message: "Lead logged & sent to HubSpot" });
  } catch (err) {
    console.error("❌ HubSpot sync failed:", err.response?.data || err.message);
    res
      .status(500)
      .json({ status: "error", message: "Failed to sync with HubSpot" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
