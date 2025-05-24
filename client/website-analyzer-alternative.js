const lighthouse = require("lighthouse").default
const chromeLauncher = require("chrome-launcher")
const { generatePerformanceAlerts, formatAlertsForDisplay } = require("./performance-alerts")

/**
 * Alternative website analyzer using direct Lighthouse calls
 * @param {string} url - The website URL to analyze
 * @param {number} maxPages - Maximum number of pages to analyze
 * @returns {Object} - Aggregated performance metrics and analysis
 */
async function analyzeWebsiteAlternative(url, maxPages = 5) {
  let chrome = null

  try {
    console.log(`Starting alternative website analysis for ${url} with max ${maxPages} pages`)

    // Launch Chrome once for all analyses
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    })

    const options = {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      port: chrome.port,
      emulatedFormFactor: "mobile",
    }

    // Discover pages to analyze
    const pagesToAnalyze = await discoverPages(url, maxPages)
    console.log(`Discovered ${pagesToAnalyze.length} pages to analyze:`, pagesToAnalyze)

    const reports = []
    const routes = []

    // Analyze each page
    for (let i = 0; i < pagesToAnalyze.length; i++) {
      const pageUrl = pagesToAnalyze[i]
      try {
        console.log(`Analyzing page ${i + 1}/${pagesToAnalyze.length}: ${pageUrl}`)

        const runnerResult = await lighthouse(pageUrl, options)

        if (runnerResult && runnerResult.lhr) {
          reports.push(runnerResult)
          routes.push({ path: new URL(pageUrl).pathname, url: pageUrl })
          console.log(`✓ Successfully analyzed: ${pageUrl}`)
        } else {
          console.log(`✗ Failed to analyze: ${pageUrl}`)
        }
      } catch (error) {
        console.error(`Error analyzing ${pageUrl}:`, error.message)
        // Continue with other pages
      }
    }

    console.log(`Analysis complete. Analyzed ${reports.length} out of ${pagesToAnalyze.length} pages`)

    if (reports.length === 0) {
      throw new Error("No pages were successfully analyzed")
    }

    // Process and aggregate the results
    const aggregatedResults = processWebsiteResults(reports, routes)

    // After analyzing all pages:
    const totalPages = reports.length;
    const avgPerformance = reports.reduce((sum, r) => sum + (r.lhr?.categories.performance?.score || 0), 0) / totalPages;
    const avgAccessibility = reports.reduce((sum, r) => sum + (r.lhr?.categories.accessibility?.score || 0), 0) / totalPages;
    const avgBestPractices = reports.reduce((sum, r) => sum + (r.lhr?.categories['best-practices']?.score || 0), 0) / totalPages;
    const avgSEO = reports.reduce((sum, r) => sum + (r.lhr?.categories.seo?.score || 0), 0) / totalPages;

    const frontendMetrics = {
      performance: Math.round(avgPerformance * 100),
      accessibility: Math.round(avgAccessibility * 100),
      bestPractices: Math.round(avgBestPractices * 100),
      seo: Math.round(avgSEO * 100),
    };

    // Attach frontendMetrics to the result
    return {
      ...aggregatedResults,
      frontendMetrics,
    };
  } catch (error) {
    console.error("Website analysis failed:", error)
    throw error
  } finally {
    if (chrome) {
      await chrome.kill()
    }
  }
}

/**
 * Discover pages to analyze from the website
 * @param {string} baseUrl - The base URL of the website
 * @param {number} maxPages - Maximum number of pages to discover
 * @returns {Array} - Array of URLs to analyze
 */
async function discoverPages(baseUrl, maxPages) {
  const pages = [baseUrl] // Always include the main page

  try {
    const { URL } = require("url")
    const baseUrlObj = new URL(baseUrl)

    // Add common pages that might exist
    const commonPaths = [
      "/about",
      "/contact",
      "/help",
      "/login"
    ]

    for (const path of commonPaths) {
      if (pages.length >= maxPages) break

      const testUrl = new URL(path, baseUrl).toString()
      if (!pages.includes(testUrl)) {
        pages.push(testUrl)
      }
    }

    // If we still need more pages, try some variations
    if (pages.length < maxPages) {
      const variations = ["/home", "/index", "/main", "/welcome"]

      for (const path of variations) {
        if (pages.length >= maxPages) break

        const testUrl = new URL(path, baseUrl).toString()
        if (!pages.includes(testUrl)) {
          pages.push(testUrl)
        }
      }
    }
  } catch (error) {
    console.error("Error discovering pages:", error)
  }

  return pages.slice(0, maxPages)
}

/**
 * Process website analysis results
 * @param {Array} reports - Lighthouse reports
 * @param {Array} routes - Route information
 * @returns {Object} - Aggregated metrics and analysis
 */
function processWebsiteResults(reports, routes) {
  const validReports = reports.filter((report) => report && report.lhr)

  if (validReports.length === 0) {
    throw new Error("No valid reports generated")
  }

  console.log(`Processing ${validReports.length} valid reports`)


  // Generate alerts
  const alerts = generatePerformanceAlerts(aggregatedMetrics, {
    apiCalls: allApiCalls,
    analysis: apiAnalysis,
  })

  console.log(`Generated results: ${reportCount} pages, ${allApiCalls.length} total API calls`)

  return {
   
    apiResults: {
      pagesAnalyzed: reportCount,
      totalApiCalls: allApiCalls.length,
      apiCalls: allApiCalls,
      analysis: apiAnalysis,
    },
    alerts,
    alertsFormatted: formatAlertsForDisplay(alerts),
    pageDetails,
  
    api: `API Analysis across ${reportCount} pages:\n\nTotal API Calls: ${allApiCalls.length}\nAverage Response Time: ${apiAnalysis.averageResponseTime}ms\nSlow APIs (>500ms): ${apiAnalysis.slowestApis.length}\nError-prone APIs: ${apiAnalysis.errorProneApis.length}`,
   
  }
}

/**
 * Calculate average of an array of numbers
 * @param {Array} arr - Array of numbers
 * @returns {number} - Average value
 */

module.exports = {
  analyzeWebsiteAlternative,
}
