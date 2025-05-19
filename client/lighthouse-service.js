const lighthouse = require("lighthouse").default
const chromeLauncher = require("chrome-launcher")
const { formatMetricsForDisplay } = require("./metrics-formatter")
const { analyzeApiCalls } = require("./api-analyzer")

/**
 * Runs Lighthouse analysis on a given URL
 * @param {string} url - The URL to analyze
 * @param {string} scenario - The analysis scenario ('overall' | 'api' | 'basic')
 * @returns {Object} - Formatted performance metrics and optional API analysis
 */
async function analyzeSite(url, scenario = "overall") {
  let chrome = null

  try {
    // Launch headless Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
    })

    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance"],
      port: chrome.port,
    }

    const runnerResult = await lighthouse(url, options)
    const audits = runnerResult.lhr.audits

    const metrics = {
      performance: runnerResult.lhr.categories.performance.score,
      fcp: formatMetric(audits["first-contentful-paint"]),
      lcp: formatMetric(audits["largest-contentful-paint"]),
      cls: formatMetric(audits["cumulative-layout-shift"]),
      tbt: formatMetric(audits["total-blocking-time"]),
      tti: formatMetric(audits["interactive"]),
      si: formatMetric(audits["speed-index"]),
      fid: "N/A (Requires real user interaction)",
      dcl: "N/A (Not directly provided by Lighthouse)",

      details: {
        fcpRaw: audits["first-contentful-paint"].numericValue,
        lcpRaw: audits["largest-contentful-paint"].numericValue,
        clsRaw: audits["cumulative-layout-shift"].numericValue,
        tbtRaw: audits["total-blocking-time"].numericValue,
        ttiRaw: audits["interactive"].numericValue,
        siRaw: audits["speed-index"].numericValue,
      },
    }

    // Optional API analysis
    let apiResults = null
    if (scenario === "api" || scenario === "overall") {
      console.log("Analyzing API calls...")
      apiResults = await analyzeApiCalls(url)
      console.log("API analysis complete:", apiResults ? "Success" : "Failed")
    }

    // Add debug logging
    console.log("Formatting metrics with apiResults:", apiResults ? "Present" : "Not present")
    
    const formattedMetrics = formatMetricsForDisplay(metrics, apiResults)

    return {
      ...metrics,
      ...formattedMetrics,
      apiResults,
    }
  } catch (error) {
    console.error("Lighthouse analysis failed:", error)
    throw error
  } finally {
    if (chrome) {
      await chrome.kill()
    }
  }
}

/**
 * Formats a Lighthouse audit metric
 * @param {Object} audit - Lighthouse audit object
 * @returns {string} - Human-readable value or fallback
 */
function formatMetric(audit) {
  if (!audit) return "N/A"
  return audit.displayValue || "N/A"
}

module.exports = {
  analyzeSite,
}
