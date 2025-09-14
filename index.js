import express from "express";

const app = express();
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "MCP server is live" });
});

// ElevenLabs webhook
app.post("/elevenlabs", (req, res) => {
  console.log("Got request from ElevenLabs:", req.body);

  res.json({
    status: "ok",
    message: "Lead received",
    data: req.body
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
