const express = require("express")
const cors = require("cors")
const { analyzeSite } = require("./lighthouse-service") // Make sure this is the correct file

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.post("/api/analyze-frontend", async (req, res) => {
  try {
    const { url, scenario } = req.body

    if (!url) {
      return res.status(400).json({ error: "URL is required" })
    }

    console.log(`Analyzing ${url} for scenario: ${scenario || "overall"}`)

    const results = await analyzeSite(url, scenario)

    // Log what we're sending back
    console.log("API Results included:", results.apiResults ? "Yes" : "No")
    console.log("API View content length:", results.api ? results.api.length : 0)

    return res.json(results)
  } catch (error) {
    console.error("Error analyzing site:", error)
    return res.status(500).json({
      error: "Failed to analyze the website",
      message: error.message,
    })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
