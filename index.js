import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live" });
});

// ElevenLabs webhook → Logs + HubSpot
app.post("/elevenlabs", async (req, res) => {
  console.log("📞 Got request from ElevenLabs:", req.body);

  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // Always log as backup
  console.log("📝 Logging lead:", { name, phone, email, address, cleaningType, preferredDate });

  try {
    // Push to HubSpot
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

    res.json({ status: "ok", message: "Lead logged & sent to HubSpot" });
  } catch (error) {
    console.error("❌ HubSpot error:", error.response?.data || error.message);
    res.status(500).json({ status: "error", message: "Failed to send lead to HubSpot" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ MCP server running on port ${PORT}`);
});

