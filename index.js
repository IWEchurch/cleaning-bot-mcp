import express from "express";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live" });
});

// Debug ElevenLabs webhook
app.post("/elevenlabs", (req, res) => {
  console.log("📞 Debug log:", req.body);
  res.json({
    status: "ok",
    message: "Test route working",
    received: req.body || "No body"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ MCP server running on port ${PORT}`);
});
