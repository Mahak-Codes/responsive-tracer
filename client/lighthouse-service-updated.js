const  lighthouse  = require("lighthouse");

const chromeLauncher = require("chrome-launcher")
const { formatMetricsForDisplay } = require("./metrics-formatter")

/**
 * Runs Lighthouse analysis on a given URL
 * @param {string} url - The URL to analyze
 * @returns {Object} - Formatted performance metrics
 */
async function analyzeSite(url) {
  let chrome = null

  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
    })

    // Run Lighthouse
    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance"],
      port: chrome.port,
    }

    const runnerResult = await lighthouse(url, options)
    const audits = runnerResult.lhr.audits

    // Extract metrics
    const metrics = {
      // Overall performance score (0-1)
      performance: runnerResult.lhr.categories.performance.score,

      // Core Web Vitals and other metrics
      fcp: formatMetric(audits["first-contentful-paint"]),
      lcp: formatMetric(audits["largest-contentful-paint"]),
      cls: formatMetric(audits["cumulative-layout-shift"]),
      tbt: formatMetric(audits["total-blocking-time"]),
      tti: formatMetric(audits["interactive"]),
      si: formatMetric(audits["speed-index"]),

      // Additional metrics
      fid: "N/A (Requires real user interaction)",
      dcl: "N/A (Not directly provided by Lighthouse)",

      // Detailed metrics for debugging
      details: {
        fcpRaw: audits["first-contentful-paint"].numericValue,
        lcpRaw: audits["largest-contentful-paint"].numericValue,
        clsRaw: audits["cumulative-layout-shift"].numericValue,
        tbtRaw: audits["total-blocking-time"].numericValue,
        ttiRaw: audits["interactive"].numericValue,
        siRaw: audits["speed-index"].numericValue,
      },
    }

    // Format metrics for different views
    const formattedMetrics = formatMetricsForDisplay(metrics)

    // Return both raw metrics and formatted views
    return {
      ...metrics,
      ...formattedMetrics,
    }
  } catch (error) {
    console.error("Lighthouse analysis failed:", error)
    throw error
  } finally {
    // Always kill Chrome
    if (chrome) {
      await chrome.kill()
    }
  }
}

/**
 * Formats a Lighthouse metric for display
 * @param {Object} audit - Lighthouse audit object
 * @returns {string} - Formatted metric with value and unit
 */
function formatMetric(audit) {
  if (!audit) return "N/A"

  const { displayValue, title, description } = audit
  return displayValue || "N/A"
}

module.exports = {
  analyzeSite,
}
