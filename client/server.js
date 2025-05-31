const express = require("express");
const cors = require("cors");
const { URL } = require("url");
const { analyzeSite } = require("./lighthouse-service");
const { WebsiteCrawler } = require("./website-crawler");
const { ApiPerformanceCorrelator } = require("./api-performance-correlator");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced complete website analysis endpoint
app.post("/api/analyze-complete-website", async (req, res) => {
    try {
        const { url, options = {} } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }
        
        // Validate URL format
        try {
            new URL(url);
        } catch (urlError) {
            return res.status(400).json({ error: "Invalid URL format" });
        }
        
        console.log(`Starting complete website analysis for ${url}`);
        
        // Set analysis options
        const analysisOptions = {
            maxPages: Math.min(options.maxPages || 15, 50),
            maxDepth: Math.min(options.maxDepth || 3, 5)
        };
        
        // Phase 1: Crawl website and discover API calls
        console.log('Phase 1: Crawling website and discovering API calls...');
        const crawler = new WebsiteCrawler(analysisOptions);
        const crawlResults = await crawler.crawlWebsite(url);
        
        // Phase 2: Correlate API calls with frontend metrics
        console.log('Phase 2: Analyzing API impact on frontend metrics...');
        const correlator = new ApiPerformanceCorrelator();
        const enhancedApiCalls = await correlator.analyzeApiImpact(crawlResults.apiCalls, url);
        
        // Phase 3: Run Lighthouse analysis on key pages
        console.log('Phase 3: Running Lighthouse analysis...');
        const lighthouseResults = [];
        const keyPages = Array.from(crawlResults.visitedUrls).slice(0, 5);
        
        for (const pageUrl of keyPages) {
            try {
                const result = await analyzeSite(pageUrl, 'overall');
                lighthouseResults.push({
                    url: pageUrl,
                    ...result
                });
            } catch (error) {
                console.error(`Lighthouse analysis failed for ${pageUrl}: ${error.message}`);
            }
        }
        
        // Phase 4: Aggregate and analyze results (FIXED: removed 'this.')
        const analysis = generateWebsiteAnalysis(crawlResults, enhancedApiCalls, lighthouseResults);
        
        // Extract scores from lighthouseResults
let performance = 0, accessibility = 0, bestPractices = 0, seo = 0;
if (lighthouseResults.length > 0) {
  // Average the scores across analyzed pages
  performance = Math.round(
    lighthouseResults.reduce((sum, r) => sum + (r.performance || 0), 0) / lighthouseResults.length * 100
  );
  accessibility = Math.round(
    lighthouseResults.reduce((sum, r) => sum + (r.accessibility || 0), 0) / lighthouseResults.length * 100
  );
  bestPractices = Math.round(
    lighthouseResults.reduce((sum, r) => sum + (r.bestPractices || 0), 0) / lighthouseResults.length * 100
  );
  seo = Math.round(
    lighthouseResults.reduce((sum, r) => sum + (r.seo || 0), 0) / lighthouseResults.length * 100
  );
}

const results = {
  performance,
  accessibility,
  bestPractices,
  seo,
  summary: {
    totalPagesAnalyzed: crawlResults.totalPages,
    totalApiCallsFound: crawlResults.totalApiCalls,
    averageApiResponseTime: calculateAverageResponseTime(enhancedApiCalls),
    pagesWithSlowApis: countPagesWithSlowApis(enhancedApiCalls),
    criticalIssuesFound: analysis.criticalIssues?.length || 0
  },
  websiteStructure: {
    visitedUrls: crawlResults.visitedUrls,
    pageData: crawlResults.pageData,
    totalPages: crawlResults.totalPages,
    maxDepthReached: crawlResults.maxDepthReached
  },
  apiAnalysis: {
    totalApiCalls: crawlResults.totalApiCalls,
    apiCalls: enhancedApiCalls,
    slowestApis: enhancedApiCalls.filter(call => call.duration > 1000),
    errorApis: enhancedApiCalls.filter(call => call.status >= 400),
    highImpactApis: enhancedApiCalls.filter(call =>
      call.frontendImpact?.renderingImpact === 'high'
    )
  },
  lighthouseResults,
  performanceInsights: analysis
};

        
        console.log(`Complete website analysis finished: ${results.summary.totalPagesAnalyzed} pages, ${results.summary.totalApiCallsFound} API calls`);
        
        return res.json({
            success: true,
            data: results,
            analysisCompleted: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("Complete website analysis failed:", error);
        return res.status(500).json({
            error: "Failed to analyze complete website",
            message: error.message
        });
    }
});

// Keep existing endpoints
app.post("/api/analyze-frontend", async (req, res) => {
    try {
        const { url, scenario } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }
        
        console.log(`Analyzing ${url} for scenario: ${scenario || "overall"}`);
        const results = await analyzeSite(url, scenario);
        
        return res.json(results);
        
    } catch (error) {
        console.error("Error analyzing site:", error);
        return res.status(500).json({
            error: "Failed to analyze the website",
            message: error.message
        });
    }
});

// Helper functions (FIXED: These are now standalone functions, not methods)
function calculateAverageResponseTime(apiCalls) {
    if (!apiCalls || apiCalls.length === 0) return 0;
    const total = apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    return Math.round(total / apiCalls.length);
}

function countPagesWithSlowApis(apiCalls) {
    if (!apiCalls || apiCalls.length === 0) return 0;
    const slowApiCalls = apiCalls.filter(call => call.duration > 1000);
    const pagesWithSlowApis = new Set(slowApiCalls.map(call => call.page));
    return pagesWithSlowApis.size;
}

function generateWebsiteAnalysis(crawlResults, apiCalls, lighthouseResults) {
    const criticalIssues = [];
    const recommendations = [];
    
    // Analyze API performance across the website
    const slowApis = apiCalls.filter(call => call.duration > 1000);
    if (slowApis.length > 0) {
        criticalIssues.push({
            type: 'api_performance',
            severity: 'high',
            message: `${slowApis.length} slow API calls detected across the website`,
            affectedApis: slowApis.map(api => api.url)
        });
        
        recommendations.push({
            type: 'api_optimization',
            priority: 'high',
            message: 'Optimize slow API endpoints or implement caching strategies'
        });
    }
    
    // Analyze frontend impact
    const highImpactApis = apiCalls.filter(call => 
        call.frontendImpact?.renderingImpact === 'high'
    );
    
    if (highImpactApis.length > 0) {
        criticalIssues.push({
            type: 'frontend_impact',
            severity: 'medium',
            message: `${highImpactApis.length} API calls significantly impact frontend performance`,
            affectedApis: highImpactApis.map(api => api.url)
        });
    }
    
    return {
        criticalIssues,
        recommendations,
        overallScore: calculateOverallScore(crawlResults, apiCalls, lighthouseResults)
    };
}

function calculateOverallScore(crawlResults, apiCalls, lighthouseResults) {
    // Simple scoring algorithm
    let score = 100;
    
    // Deduct points for slow APIs
    const slowApis = apiCalls.filter(call => call.duration > 1000);
    score -= slowApis.length * 5;
    
    // Deduct points for error APIs
    const errorApis = apiCalls.filter(call => call.status >= 400);
    score -= errorApis.length * 10;
    
    // Consider Lighthouse scores
    if (lighthouseResults.length > 0) {
        const avgPerformanceScore = lighthouseResults.reduce((sum, result) => 
            sum + (result.performance || 0), 0) / lighthouseResults.length;
        score = Math.min(score, avgPerformanceScore * 100);
    }
    
    return Math.max(0, Math.round(score));
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Complete website analysis: POST /api/analyze-complete-website`);
    console.log(`Frontend analysis: POST /api/analyze-frontend`);
});

module.exports = app;
