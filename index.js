import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live 🚀" });
});

// ElevenLabs GET endpoint (tool discovery for MCP)
app.get("/elevenlabs", (req, res) => {
  res.json({
    tools: [
      {
        name: "logLead",
        description: "Capture cleaning service lead details and push them to HubSpot",
        input_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
            cleaningType: { type: "string", enum: ["residental", "comercial", "pre-listing", "emergency"] },
            preferredDate: { type: "string" }
          },
          required: ["name", "phone", "email"]
        }
      }
    ]
  });
});

// ElevenLabs POST webhook → Logs + HubSpot + structured response
app.post("/elevenlabs", async (req, res) => {
  console.log("📞 New request from ElevenLabs:", req.body);

  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // Always log for backup
  console.log("📝 Logging lead:", { name, phone, email, address, cleaningType, preferredDate });

  try {
    // Push to HubSpot (create contact)
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

    // Respond back to ElevenLabs
    res.json({
      status: "ok",
      message: "Lead received and synced to HubSpot",
      variables: {
        name: name || "Unknown",
        phone: phone || "Unknown",
        email: email || "Unknown",
        address: address || "Unknown",
        cleaningType: cleaningType || "Unknown",
        preferredDate: preferredDate || "Unknown"
      }
    });
  } catch (error) {
    console.error("❌ HubSpot sync failed:", error.response?.data || error.message);

    res.status(500).json({
      status: "error",
      message: "Failed to sync lead to HubSpot",
      error: error.response?.data || error.message
    });
  }
});

// Render sets PORT automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MCP server running on port ${PORT}`);
});
