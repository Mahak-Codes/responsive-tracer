const express = require("express")
const cors = require("cors")
const { URL } = require("url")
const dns = require("dns")
const { promisify } = require("util")
const dnsLookup = promisify(dns.lookup)
const { analyzeSite } = require("./lighthouse-service")
const { analyzeWebsiteAlternative } = require("./website-analyzer-alternative")

// Add error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error)
  process.exit(1)
})

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Routes
app.post("/api/analyze-frontend", async (req, res) => {
  try {
    const { url, scenario } = req.body

    if (!url) {
      console.log("Error: URL is required")
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

// New endpoint for website analysis using alternative approach
app.post("/api/analyze-website", async (req, res) => {
  try {
    const { url, maxPages } = req.body

    if (!url) {
      console.log("Error: URL is required")
      return res.status(400).json({ error: "URL is required" })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch (urlError) {
      return res.status(400).json({ error: "Invalid URL format" })
    }

    // Validate maxPages
    const pages = Math.min(Math.max(Number.parseInt(maxPages) || 10, 1), 20)

    console.log(`Starting website analysis for ${url} with max ${pages} pages`)

    const results = await analyzeWebsiteAlternative(url, pages)

    console.log("Website analysis complete:", {
      pagesAnalyzed: results.apiResults?.pagesAnalyzed || 0,
      totalApiCalls: results.apiResults?.totalApiCalls || 0,
      alertsGenerated: results.alerts?.length || 0,
    })

    return res.json(results)
  } catch (error) {
    console.error("Error analyzing website:", error)
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
})

// Start server
try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Health check available at http://localhost:${PORT}/health`)
    console.log(`Frontend analysis: POST /api/analyze-frontend`)
    console.log(`Website analysis: POST /api/analyze-website`)
  })
} catch (error) {
  console.error("Failed to start server:", error)
  process.exit(1)
}
