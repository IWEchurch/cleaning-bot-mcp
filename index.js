import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live 🚀" });
});

// MCP discovery (what tools ElevenLabs can use)
app.get("/elevenlabs", (req, res) => {
  res.json({
    tools: [
      {
        name: "logLead",
        description: "Capture cleaning service lead details and push to HubSpot",
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

// ElevenLabs calls this when user gives info
app.post("/elevenlabs", async (req, res) => {
  console.log("📞 Incoming request from ElevenLabs:", req.body);

  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // Always log
  console.log("📝 Logging lead:", { name, phone, email, address, cleaningType, preferredDate });

  try {
    // Push into HubSpot as contact
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

    // Respond so ElevenLabs can keep talking to caller
    res.json({
      status: "ok",
      message: "Lead captured and synced to HubSpot",
      variables: {
        name,
        phone,
        email,
        address,
        cleaningType,
        preferredDate
      }
    });
  } catch (err) {
    console.error("❌ HubSpot sync failed:", err.response?.data || err.message);

    res.status(500).json({
      status: "error",
      message: "HubSpot sync failed",
      error: err.response?.data || err.message
    });
  }
});

// Render will assign PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 MCP server running on port ${PORT}`));
