const puppeteer = require("puppeteer");

/**
 * Correlates API calls with frontend performance metrics
 */
class ApiPerformanceCorrelator {
    constructor() {
        this.performanceData = [];
    }

    async analyzeApiImpact(apiCalls, pageUrl) {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
            headless: 'new'
        });

        try {
            const page = await browser.newPage();
            await page.goto(pageUrl, { waitUntil: 'networkidle0' });

            const enhancedApiCalls = [];

            for (const apiCall of apiCalls) {
                try {
                    // Measure performance before API call simulation
                    const beforeMetrics = await this.capturePerformanceMetrics(page);
                    
                    // Simulate the API call impact
                    await this.simulateApiCall(page, apiCall);
                    
                    // Measure performance after API call
                    await page.waitForTimeout(500);
                    const afterMetrics = await this.capturePerformanceMetrics(page);
                    
                    // Calculate impact metrics
                    const impactMetrics = this.calculateMetricsImpact(beforeMetrics, afterMetrics);
                    
                    enhancedApiCalls.push({
                        ...apiCall,
                        frontendImpact: {
                            ...impactMetrics,
                            domUpdateTime: afterMetrics.domUpdateTime - beforeMetrics.domUpdateTime,
                            renderTime: afterMetrics.renderTime - beforeMetrics.renderTime,
                            layoutShiftDelta: afterMetrics.cls - beforeMetrics.cls,
                            memoryDelta: afterMetrics.memory?.usedJSHeapSize - beforeMetrics.memory?.usedJSHeapSize || 0
                        }
                    });
                    
                } catch (error) {
                    console.error(`Error measuring impact for API call ${apiCall.url}: ${error.message}`);
                    enhancedApiCalls.push({
                        ...apiCall,
                        frontendImpact: { error: error.message }
                    });
                }
            }

            return enhancedApiCalls;

        } finally {
            await browser.close();
        }
    }

    async capturePerformanceMetrics(page) {
        return await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            // Calculate Core Web Vitals approximations
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
            
            // Layout shift calculation
            const layoutShifts = performance.getEntriesByType('layout-shift');
            const cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0);
            
            // Memory usage (if available)
            const memory = performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null;
            
            return {
                timestamp: Date.now(),
                fcp,
                cls,
                domUpdateTime: navigation?.domContentLoadedEventEnd || 0,
                renderTime: navigation?.loadEventEnd || 0,
                memory,
                resourceCount: performance.getEntriesByType('resource').length
            };
        });
    }

    async simulateApiCall(page, apiCall) {
        // Simulate the frontend impact of an API call
        await page.evaluate((call) => {
            // Simulate DOM manipulation that would occur after an API call
            const loadingElement = document.createElement('div');
            loadingElement.textContent = `Loading data from ${call.url}...`;
            document.body.appendChild(loadingElement);
            
            // Simulate async operation
            setTimeout(() => {
                loadingElement.remove();
                
                // Simulate adding content
                const resultElement = document.createElement('div');
                resultElement.innerHTML = `<p>Data loaded from API: ${call.url}</p>`;
                document.body.appendChild(resultElement);
            }, call.duration || 100);
        }, apiCall);
        
        await page.waitForTimeout(apiCall.duration || 100);
    }

    calculateMetricsImpact(beforeMetrics, afterMetrics) {
        return {
            fcpDelta: afterMetrics.fcp - beforeMetrics.fcp,
            clsDelta: afterMetrics.cls - beforeMetrics.cls,
            resourceCountDelta: afterMetrics.resourceCount - beforeMetrics.resourceCount,
            renderingImpact: this.calculateRenderingImpact(beforeMetrics, afterMetrics)
        };
    }

    calculateRenderingImpact(beforeMetrics, afterMetrics) {
        const renderTimeDelta = afterMetrics.renderTime - beforeMetrics.renderTime;
        
        if (renderTimeDelta > 100) return 'high';
        if (renderTimeDelta > 50) return 'medium';
        return 'low';
    }
}

module.exports = { ApiPerformanceCorrelator };
