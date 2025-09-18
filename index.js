import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ✅ Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live 🚀" });
});

// ElevenLabs GET endpoint (for MCP tool discovery)
app.get("/elevenlabs", (req, res) => {
  res.json({
    status: "ok",
    message: "MCP server is live and ready"
  });
});


// ✅ ElevenLabs → MCP → HubSpot
app.post("/elevenlabs", async (req, res) => {
  console.log("📞 New request from ElevenLabs:", req.body);

  // Extract fields
  const { name, phone, email, address, cleaningType, preferredDate } = req.body;

  // Respond immediately so ElevenLabs doesn’t timeout
  res.json({
    status: "ok",
    message: "Lead received, syncing to HubSpot...",
    data: req.body
  });

  // Backup log
  console.log("📝 Logging lead:", {
    name,
    phone,
    email,
    address,
    cleaningType,
    preferredDate
  });

  try {
    // Send to HubSpot Contacts
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
  } catch (error) {
    console.error("❌ HubSpot sync failed:", error.response?.data || error.message);
  }
});

// ✅ Render sets port automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MCP server running on port ${PORT}`);
});
