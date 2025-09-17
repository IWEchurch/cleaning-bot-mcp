import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live" });
});

app.post("/elevenlabs", (req, res) => {
  console.log("📞 Debug log:", req.body);
  res.json({
    status: "ok",
    message: "Test route working",
    received: req.body || "No body"
  });
});


  // OPTIONAL: forward to HubSpot (enable once endpoint is working)
  /*
  try {
    await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          firstname: req.body.name || "Unknown",
          phone: req.body.phone || "",
          email: req.body.email || ""
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("✅ Sent lead to HubSpot");
  } catch (error) {
    console.error("❌ HubSpot error:", error.response?.data || error.message);
  }
  */
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ MCP server running on port ${PORT}`);
});
