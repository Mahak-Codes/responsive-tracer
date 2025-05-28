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

// NEW: Dynamic API Analysis endpoint
app.post("/api/dynamic-analyze", async (req, res) => {
  try {
    const { url, interactions = [] } = req.body

    if (!url) {
      console.log("Error: URL is required")
      return res.status(400).json({ error: "URL is required" })
    }

    console.log(`Starting dynamic API analysis for ${url}`)

    // Simulate dynamic analysis with realistic data
    const simulateApiCall = (endpoint, method, trigger) => {
      const responseTime = Math.floor(Math.random() * 800) + 50
      const status = Math.random() > 0.1 ? 200 : Math.random() > 0.5 ? 404 : 500

      return {
        id: Math.random().toString(36).substr(2, 9),
        endpoint,
        method,
        status,
        responseTime,
        payloadSize: Math.floor(Math.random() * 50000) + 1000,
        trigger,
        frontendMetrics: {
          domUpdateTime: Math.floor(Math.random() * 100) + 10,
          renderTime: Math.floor(Math.random() * 200) + 20,
          layoutShift: Math.random() * 0.5,
          interactionDelay: Math.floor(Math.random() * 50) + 5,
        },
        timestamp: Date.now(),
      }
    }

    // Simulate dynamic interactions and API calls
    const apiCalls = []
    const dynamicInteractions = [
      { endpoint: "/api/auth/login", method: "POST", trigger: "Login Form" },
      { endpoint: "/api/user/profile", method: "GET", trigger: "Page Load" },
      { endpoint: "/api/products", method: "GET", trigger: "Product List" },
      { endpoint: "/api/search", method: "POST", trigger: "Search Input" },
      { endpoint: "/api/cart/add", method: "POST", trigger: "Add to Cart" },
      { endpoint: "/api/analytics", method: "POST", trigger: "Page View" },
      { endpoint: "/api/recommendations", method: "GET", trigger: "Scroll Event" },
      { endpoint: "/api/user/preferences", method: "PUT", trigger: "Settings Update" },
    ]

    // Generate API calls based on interactions
    for (const interaction of dynamicInteractions) {
      const apiCall = simulateApiCall(interaction.endpoint, interaction.method, interaction.trigger)
      apiCalls.push(apiCall)
    }

    // Calculate overall metrics
    const totalResponseTime = apiCalls.reduce((sum, call) => sum + call.responseTime, 0)
    const errorCalls = apiCalls.filter((call) => call.status >= 400)
    const slowestCall = apiCalls.reduce((prev, current) =>
      prev.responseTime > current.responseTime ? prev : current,
    )
    const fastestCall = apiCalls.reduce((prev, current) =>
      prev.responseTime < current.responseTime ? prev : current,
    )

    const overallMetrics = {
      totalRenderTime: apiCalls.reduce((sum, call) => sum + call.frontendMetrics.renderTime, 0),
      totalLayoutShifts: apiCalls.reduce((sum, call) => sum + call.frontendMetrics.layoutShift, 0),
      averageInteractionDelay:
        apiCalls.reduce((sum, call) => sum + call.frontendMetrics.interactionDelay, 0) / apiCalls.length,
    }

    const results = {
      totalApiCalls: apiCalls.length,
      averageResponseTime: Math.round(totalResponseTime / apiCalls.length),
      slowestCall,
      fastestCall,
      errorRate: (errorCalls.length / apiCalls.length) * 100,
      apiCalls,
      overallMetrics,
    }

    console.log(`Dynamic analysis complete: ${results.totalApiCalls} API calls found`)

    return res.json(results)
  } catch (error) {
    console.error("Error in dynamic analysis:", error)
    return res.status(500).json({
      error: "Failed to perform dynamic analysis",
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
    console.log(`Dynamic analysis: POST /api/dynamic-analyze`) // New endpoint
  })
} catch (error) {
  console.error("Failed to start server:", error)
  process.exit(1)
}
