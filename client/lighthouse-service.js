const lighthouse = require("lighthouse").default;
const chromeLauncher = require("chrome-launcher")
const { formatMetricsForDisplay } = require("./metrics-formatter")
const { analyzeApiCalls } = require("./api-analyzer")
const { generatePerformanceAlerts, formatAlertsForDisplay } = require("./performance-alerts")

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
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      port: chrome.port,
      emulatedFormFactor: "mobile",
    }

    const runnerResult = await lighthouse(url, options)
    
    const audits = runnerResult.lhr.audits
    console.log("Lighthouse audits keys:", Object.keys(audits))
    console.log("Responsiveness audit:", audits["responsiveness"])
    console.log("Tap targets audit:", audits["tap-targets"])

    const metrics = {
      performance: runnerResult.lhr.categories.performance.score,
      accessibility: runnerResult.lhr.categories.accessibility?.score ?? null,
      bestPractices: runnerResult.lhr.categories["best-practices"]?.score ?? null,
      seo: runnerResult.lhr.categories.seo?.score ?? null,
      fcp: formatMetric(audits["first-contentful-paint"]),
      lcp: formatMetric(audits["largest-contentful-paint"]),
      cls: formatMetric(audits["cumulative-layout-shift"]),
      tbt: formatMetric(audits["total-blocking-time"]),
      tti: formatMetric(audits["interactive"]),
      si: formatMetric(audits["speed-index"]),
      // Fix responsiveness and touch target metrics
      responsiveness: audits["max-potential-fid"]
        ? audits["max-potential-fid"].score
        : audits["total-blocking-time"]
          ? audits["total-blocking-time"].score
          : 0,
      touchTargetSize: audits["tap-targets"] ? audits["tap-targets"].score : 0,
      mobileFriendliness: audits["viewport"] ? audits["viewport"].score : 0,
      details: {
        fcpRaw: audits["first-contentful-paint"].numericValue,
        lcpRaw: audits["largest-contentful-paint"].numericValue,
        clsRaw: audits["cumulative-layout-shift"].numericValue,
        tbtRaw: audits["total-blocking-time"].numericValue,
        ttiRaw: audits["interactive"].numericValue,
        siRaw: audits["speed-index"].numericValue,
      },
    }

    console.log("Responsiveness metric:", metrics.responsiveness)
    console.log("Touch target size metric:", metrics.touchTargetSize)
    console.log("Mobile friendliness metric:", metrics.mobileFriendliness)

    // Optional API analysis
    let apiResults = null
    if (scenario === "api" || scenario === "overall") {
      console.log("Analyzing API calls...")
      apiResults = await analyzeApiCalls(url)
      console.log("API analysis complete:", apiResults ? "Success" : "Failed")
    }

    // Generate performance alerts
    const alerts = generatePerformanceAlerts(metrics, apiResults)
    const formattedAlerts = formatAlertsForDisplay(alerts)
    console.log(`Generated ${alerts.length} performance alerts`)

    // Add debug logging
    console.log("Formatting metrics with apiResults:", apiResults ? "Present" : "Not present")

    const formattedMetrics = formatMetricsForDisplay(metrics, apiResults)

    return {
      ...metrics,
      ...formattedMetrics,
      apiResults,
      alerts,
      alertsFormatted: formattedAlerts,
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
