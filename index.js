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

// ✅ Normalize cleaning type
function normalizeCleaningType(text) {
  if (!text) return "Residential";
  text = text.toLowerCase();

  if (text.includes("resi")) return "Residential";
  if (text.includes("com")) return "Commercial";
  if (text.includes("pre")) return "Pre-Listing";

  return "Residential";
}

// ✅ Extract fields from transcript
function extractFromTranscript(transcript) {
  let email = "unknown@example.com";
  let address = "Unknown";

  if (!Array.isArray(transcript)) return { email, address };

  for (const entry of transcript) {
    const msg = entry.message?.toLowerCase() || "";

    // Email pattern
    const emailMatch = msg.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
    if (emailMatch) email = emailMatch[0];

    // Address heuristic
    if (msg.includes("street") || msg.includes("st") || msg.includes("ave")) {
      address = entry.message;
    }
  }

  return { email, address };
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

  // --- Extract details ---
  const transcript = payload?.data?.transcript || [];
  const { email, address } = extractFromTranscript(transcript);

  const lead = {
    name: payload?.data?.analysis?.call_summary_title || "Unknown Caller",
    phone:
      payload?.data?.conversation_initiation_client_data?.dynamic_variables
        ?.system__caller_id || "Unknown",
    email,
    address,
    cleaningType: normalizeCleaningType(
      payload?.data?.analysis?.transcript_summary || ""
    ),
    preferredDate: new Date().toISOString().split("T")[0],
  };

  console.log("📝 Lead extracted:", lead);

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
