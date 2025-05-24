const playwright = require('playwright');
const lighthouse = require('lighthouse');
const { URL } = require('url');

/**
 * Simulate user actions for a given page.
 * Customize this function for your site!
 * @param {import('playwright').Page} page
 * @param {string} url
 */
async function userActionsForPage(page, url) {
  // Example: Add your own selectors and actions here
  if (url.includes('/login')) {
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  } else if (url.includes('/search')) {
    await page.fill('input[type="search"]', 'example');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  } else {
    // Generic actions for all pages
    // Example: Click the first button if it exists
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      await buttons[0].click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Discover pages to analyze (reuse logic from website-analyzer-alternative.js)
 * @param {string} baseUrl
 * @param {number} maxPages
 * @returns {Promise<string[]>}
 */
async function discoverPages(baseUrl, maxPages = 10) {
  const commonPaths = [
    '', '/about', '/contact', '/services', '/products', '/blog', '/news',
    '/pricing', '/features', '/support', '/help', '/home', '/index', '/main', '/welcome', '/start'
  ];
  const pages = [];
  for (const path of commonPaths) {
    if (pages.length >= maxPages) break;
    const url = new URL(path, baseUrl).toString();
    if (!pages.includes(url)) pages.push(url);
  }
  return pages.slice(0, maxPages);
}

/**
 * Analyze a single page with Playwright and Lighthouse after simulating user actions.
 * @param {string} url
 * @returns {Promise<object>} Lighthouse LHR report
 */
async function analyzePageWithActions(url) {
  const browser = await playwright.chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });
  await userActionsForPage(page, url);

  // Run Lighthouse
  const result = await lighthouse(url, {
    port: 9222,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    disableStorageReset: true,
  });

  await browser.close();
  return result.lhr;
}

/**
 * Main function: Analyze all discovered pages with simulated actions.
 * @param {string} baseUrl
 * @param {number} maxPages
 */
async function analyzeEntireSite(baseUrl, maxPages = 10) {
  const pages = await discoverPages(baseUrl, maxPages);
  const results = [];

  for (const url of pages) {
    console.log(`Analyzing: ${url}`);
    try {
      const lhr = await analyzePageWithActions(url);
      results.push({
        url,
        performance: lhr.categories.performance.score,
        accessibility: lhr.categories.accessibility.score,
        bestPractices: lhr.categories['best-practices'].score,
        seo: lhr.categories.seo.score,
        audits: lhr.audits,
      });
    } catch (err) {
      console.error(`Failed to analyze ${url}:`, err.message);
    }
  }

  // Aggregate or output results as needed
  console.log('Analysis complete!');
  results.forEach(r => {
    console.log(`${r.url}\n  Performance: ${r.performance}\n  Accessibility: ${r.accessibility}\n  Best Practices: ${r.bestPractices}\n  SEO: ${r.seo}\n`);
  });

  // Optionally, return or save results
  return results;
}

// Example usage:
if (require.main === module) {
  const baseUrl = 'https://your-website.com'; // Change to your site
  analyzeEntireSite(baseUrl, 10);
}

module.exports = { analyzeEntireSite, analyzePageWithActions, userActionsForPage, discoverPages };