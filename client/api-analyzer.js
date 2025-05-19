const lighthouse = require("lighthouse").default // Remove .default
const chromeLauncher = require("chrome-launcher")

/**
 * Analyzes API calls made by a website
 * @param {string} url - The URL to analyze
 * @returns {Object} - API call metrics and analysis
 */
async function analyzeApiCalls(url) {
  let chrome = null

  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
    })

    // Configure Lighthouse to capture network requests
    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance"],
      port: chrome.port,
      // Enable network recording
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    }

    // Run Lighthouse
    const runnerResult = await lighthouse(url, options)

    // Extract network requests from the Lighthouse audit
    const networkRequests = runnerResult.lhr.audits["network-requests"].details.items

    console.log(`Found ${networkRequests.length} network requests`)

    // Filter for API calls (typically XHR or Fetch requests)
    const apiCalls = networkRequests.filter((request) => {
      // Filter for XHR, Fetch, and API-like requests
      return (
        request.resourceType === "XHR" ||
        request.resourceType === "Fetch" ||
        request.url.includes("/api/") ||
        request.url.includes("/graphql") ||
        request.url.includes("/rest/") ||
        request.url.includes("/v1/") ||
        request.url.includes("/v2/")
      )
    })

    console.log(`Filtered to ${apiCalls.length} API calls`)

    // Process and format API calls
    const formattedApiCalls = apiCalls.map((call) => {
      try {
        // Extract path from URL
        const urlObj = new URL(call.url)
        const path = urlObj.pathname

        return {
          endpoint: path,
          method: call.method || "GET",
          status: call.statusCode || "Unknown",
          timeTaken: Math.round(call.endTime - call.startTime),
          payloadSize: formatBytes(call.transferSize || 0),
          errors: call.statusCode >= 400 ? `Error ${call.statusCode}` : "-",
          rawData: call,
        }
      } catch (error) {
        console.error("Error processing API call:", error)
        return {
          endpoint: "Error parsing URL",
          method: call.method || "GET",
          status: call.statusCode || "Unknown",
          timeTaken: 0,
          payloadSize: "0B",
          errors: "Error parsing call data",
          rawData: call,
        }
      }
    })

    // Sort by time taken (descending)
    formattedApiCalls.sort((a, b) => b.timeTaken - a.timeTaken)

    // Analyze API calls
    const analysis = analyzeApiCallsData(formattedApiCalls)

    return {
      apiCalls: formattedApiCalls,
      analysis: analysis,
    }
  } catch (error) {
    console.error("API call analysis failed:", error)
    throw error
  } finally {
    // Always kill Chrome
    if (chrome) {
      await chrome.kill()
    }
  }
}

/**
 * Analyzes API call data to identify issues and patterns
 * @param {Array} apiCalls - Formatted API call data
 * @returns {Object} - Analysis results
 */
function analyzeApiCallsData(apiCalls) {
  // Identify slow APIs (taking more than 500ms)
  const slowApis = apiCalls
    .filter((call) => call.timeTaken > 500)
    .map((call) => ({
      endpoint: call.endpoint,
      method: call.method,
      timeTaken: call.timeTaken,
    }))

  // Identify high payload APIs (more than 1MB)
  const highPayloadApis = apiCalls
    .filter((call) => {
      const size = call.rawData.transferSize || 0
      return size > 1024 * 1024 // 1MB
    })
    .map((call) => ({
      endpoint: call.endpoint,
      method: call.method,
      payloadSize: call.payloadSize,
    }))

  // Identify error-prone APIs (4xx/5xx status codes)
  const errorProneApis = apiCalls
    .filter((call) => call.status >= 400)
    .map((call) => ({
      endpoint: call.endpoint,
      method: call.method,
      status: call.status,
      error: call.errors,
    }))

  return {
    slowestApis: slowApis,
    highPayloadApis: highPayloadApis,
    errorProneApis: errorProneApis,
    totalApiCalls: apiCalls.length,
    averageResponseTime: Math.round(apiCalls.reduce((sum, call) => sum + call.timeTaken, 0) / (apiCalls.length || 1)),
  }
}

/**
 * Formats bytes into human-readable format
 * @param {number} bytes - The number of bytes
 * @returns {string} - Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0B"

  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + sizes[i]
}

module.exports = {
  analyzeApiCalls,
}
