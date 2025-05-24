"use client"

import { useState } from "react"
import "./App.css"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import AlertsView from "./alerts-view"
import SessionSimulator from "./components/SessionSimulator"
import PerformanceAnalyzer from "./components/PerformanceAnalyzer"

const sidebarItems = [
  { id: "overall", label: "Overall Performance" },
  { id: "frontend", label: "FrontEnd Metrics" },
  { id: "api", label: "API Calls" },
  { id: "db", label: "DB Latency" },
  { id: "alerts", label: "Automatic Alerts" },
  { id: "sessions", label: "Session Analysis" },
]

const coreWebVitals = [
  { key: "fcp", label: "First Contentful Paint (FCP)", desc: "Time until the first text or image is rendered." },
  { key: "lcp", label: "Largest Contentful Paint (LCP)", desc: "Time taken to render the largest visible element." },
  { key: "tti", label: "Time to Interactive (TTI)", desc: "Time when the page becomes fully interactive." },
  { key: "cls", label: "Cumulative Layout Shift (CLS)", desc: "Measures visual stability (e.g., content jumping)." },
  { key: "tbt", label: "Total Blocking Time (TBT)", desc: "Time the main thread is blocked and unresponsive." },
  { key: "si", label: "Speed Index", desc: "Average time to display visible content." },
]

// Helper for badge color
function getBadgeColor(metric) {
  if (metric.badge === "accessibility") return "#1976d2" // blue
  if (metric.value === "Good") return "#28a745" // green
  if (metric.value === "Needs Improvement") return "#ff9800" // orange
  if (metric.value === "Poor") return "#dc3545" // red
  if (metric.value === "Unknown" || metric.value === "-") return "#888" // gray
  return "#1976d2"
}

// Helper for status label
function getStatusLabel(score) {
  if (score === null || score === undefined || score === 0) {
    // For debugging
    console.log("Received null/undefined/0 score")
    return "Unknown"
  }
  if (score >= 0.9) return "Good"
  if (score >= 0.5) return "Needs Improvement"
  return "Poor"
}

const uxInteractionMetrics = (rawResponse) => {
  // For debugging
  if (rawResponse) {
    console.log("UX Metrics raw values:", {
      responsiveness: rawResponse.responsiveness,
      touchTargetSize: rawResponse.touchTargetSize,
      accessibility: rawResponse.accessibility,
      mobileFriendliness: rawResponse.mobileFriendliness,
    })
  }

  return [
    {
      key: "responsiveness",
      label: "Responsiveness",
      desc: "How quickly UI responds to user input.",
      value: rawResponse?.responsiveness ? getStatusLabel(rawResponse.responsiveness) : "Unknown",
    },
    {
      key: "touchTargetSize",
      label: "Touch target size",
      desc: "Are buttons/links usable on mobile devices?",
      value: rawResponse?.touchTargetSize ? getStatusLabel(rawResponse.touchTargetSize) : "Unknown",
    },
    {
      key: "a11y",
      label: "Accessibility (a11y)",
      desc: "Are color contrasts, focus states, and keyboard navigation accessible?",
      value:
        rawResponse?.accessibility !== undefined && rawResponse?.accessibility !== null
          ? Math.round(rawResponse.accessibility * 100) + "/100"
          : "Unknown",
      badge: "accessibility",
    },
    {
      key: "mobileFriendliness",
      label: "Mobile-Friendliness",
      desc: "Viewport configuration and mobile layout behavior.",
      value: rawResponse?.mobileFriendliness ? getStatusLabel(rawResponse.mobileFriendliness) : "Unknown",
    },
  ]
}

function Tooltip({ text, children }) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltiptext">{text}</span>
    </span>
  )
}

function CoreWebVitalsTable({ metrics }) {
  return (
    <table className="modern-table" style={{ marginBottom: 0, background: "#fff" }}>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {coreWebVitals.map((m) => (
          <tr key={m.key}>
            <td>
              <Tooltip text={m.desc}>
                <span style={{ textDecoration: "underline dotted", cursor: "help" }}>{m.label}</span>
              </Tooltip>
            </td>
            <td>{metrics && metrics[m.key] !== undefined && metrics[m.key] !== null ? metrics[m.key] : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Helper to get color based on score
const getColor = (score) => {
  if (score >= 90) return "#28a745" // green
  if (score >= 50) return "#ff9800" // orange
  return "#dc3545" // red
}

// Reusable ScoreCircle component
function ScoreCircle({ score, label }) {
  const value = Math.round(score)
  const data = [
    { name: "Score", value },
    { name: "Remainder", value: 100 - value },
  ]
  const COLORS = [getColor(value), "#f5f5f5"]
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 120 }}>
      <div style={{ width: 80, height: 80, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={30}
              outerRadius={40}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 80,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 20, color: getColor(value) }}>{value}</span>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 15, color: "#222", fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function App() {
  const [url, setUrl] = useState("")
  const [maxPages, setMaxPages] = useState(10)
  const [activePage, setActivePage] = useState("overall")
  const [status, setStatus] = useState("Idle")
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)
  const [analyzeMode, setAnalyzeMode] = useState("page") // "page" or "website"
  const [webpageCache, setWebpageCache] = useState(null);
  const [websiteCache, setWebsiteCache] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Helper to trigger analysis when mode changes and url is present
  const handleScopeChange = async (e) => {
    const newMode = e.target.value
    setAnalyzeMode(newMode)

    // Check cache
    if (newMode === "page" && webpageCache && webpageCache.url === url) {
      setRawResponse(webpageCache.rawResponse);
      setReportData(webpageCache.reportData);
      setStatus("Analysis complete!");
      setError(null);
      return;
    }
    if (newMode === "website" && websiteCache && websiteCache.url === url && websiteCache.maxPages === maxPages) {
      setRawResponse(websiteCache.rawResponse);
      setReportData(websiteCache.reportData);
      setStatus("Analysis complete!");
      setError(null);
      return;
    }

    // Otherwise, trigger new analysis if URL is present
    if (url) {
      setStatus("Analyzing...")
      setError(null)
      setReportData(null)
      setRawResponse(null)
      try {
        const scenario = activePage === "overall" ? "overall" : activePage
        const data = await analyzeFrontend(url, scenario, newMode)
        setStatus("Analysis complete!")
        setReportData(data)
        // Store in cache
        if (newMode === "page") {
          setWebpageCache({ url, rawResponse, reportData: data })
        } else {
          setWebsiteCache({ url, maxPages, rawResponse, reportData: data })
        }
      } catch (e) {
        setStatus("Idle")
        setError(e.message)
      }
    }
  }

  const analyzeFrontend = async (url, scenario, modeOverride) => {
    const mode = modeOverride || analyzeMode
    if (mode === "website") {
      const response = await fetch("http://localhost:5000/api/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, maxPages }),
      })
      if (!response.ok) {
        throw new Error("Analysis failed. Please check the backend or the URL.")
      }
      const data = await response.json()
      setRawResponse(data)
      return {
        overall: `Analyzed ${data.apiResults.pagesAnalyzed} pages and found ${data.apiResults.totalApiCalls} API calls`,
        api: "See API tab for detailed API analysis across the website",
        db: "DB metrics are available in backend and DB tabs.",
        alerts: "Alert metrics are available in alert tab.",
        frontend: data.frontendMetrics
          ? `Performance: ${data.frontendMetrics.performance}\nAccessibility: ${data.frontendMetrics.accessibility}\nBest Practices: ${data.frontendMetrics.bestPractices}\nSEO: ${data.frontendMetrics.seo}`
          : "Frontend metrics are only available for single page analysis.",
      }
    } else {
      // Original single page analysis
      const response = await fetch("http://localhost:5000/api/analyze-frontend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, scenario }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed. Please check the backend or the URL.")
      }

      const data = await response.json()

      // Store the raw response for debugging
      setRawResponse(data)

      console.log("Backend response:", data)
      console.log("API data available:", data.api ? "Yes" : "No")
      console.log("Alerts available:", data.alerts ? "Yes" : "No")

      // Format API table if available
      if (data.api && data.api.includes("API Endpoint\tMethod\tStatus")) {
        // Extract just the table part from the API data
        const apiTableText = data.api.split("\n\n")[1]
        // Replace the table text with a placeholder that we'll swap out in the render
        const apiDataWithoutTable = data.api.replace(apiTableText, "[[API_TABLE_PLACEHOLDER]]")
        data.api = apiDataWithoutTable
      }

      // Use the formatted data from the backend
      return {
        overall:
          data.overall ||
          `Performance Score: ${(data.performance * 100).toFixed(0)}\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
        api: data.api || "API metrics are available in backend and API tabs.",
        db: data.db || "DB metrics are available in backend and DB tabs.",
        alerts: data.alertsFormatted || "Alert metrics are available in alert tab.",
        frontend:
          data.frontend ||
          `After button click:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}\n\n` +
            `After search:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
      }
    }
  }

  const handleAnalyze = async () => {
    setStatus("Analyzing...")
    setError(null)
    setReportData(null)
    setRawResponse(null)

    try {
      const scenario = activePage === "overall" ? "overall" : activePage
      const data = await analyzeFrontend(url, scenario)
      setStatus("Analysis complete!")
      setReportData(data)
      // Store in cache
      if (analyzeMode === "page") {
        setWebpageCache({ url, rawResponse, reportData: data })
      } else {
        setWebsiteCache({ url, maxPages, rawResponse, reportData: data })
      }
    } catch (e) {
      setStatus("Idle")
      setError(e.message)
    }
  }

  // Helper to render API Results as a table
  function ApiResultsTable({ apiResults }) {
    if (
      !apiResults ||
      !apiResults.apiCalls ||
      !Array.isArray(apiResults.apiCalls) ||
      apiResults.apiCalls.length === 0
    ) {
      return <div>No API results available</div>
    }

    // Map/compute avg and max response times if not present
    return (
      <div
        className="api-table-scroll"
        style={{
          maxHeight: 400,
          overflowY: "auto",
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(25, 118, 210, 0.07)",
          background: "#fff",
        }}
      >
        <table className="modern-table">
          <caption>
            {analyzeMode === "website"
              ? `API Response Times (Across ${apiResults.pagesAnalyzed} Pages)`
              : "API Response Times"}
          </caption>
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Avg Response Time</th>
              <th>Max Taken</th>
              {analyzeMode === "website" && <th>Call Count</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {apiResults.apiCalls.map((row, idx) => {
              // Compute status icon: green for <400, yellow for 400-499, red for 500+
              let statusIcon = <span className="status-icon ok">✔️</span>
              if (row.status >= 500) statusIcon = <span className="status-icon error">❌</span>
              else if (row.status >= 400) statusIcon = <span className="status-icon warn">⚠️</span>

              // Ensure we have valid values for avg and max
              const avg =
                row.avgResponseTime !== undefined && row.avgResponseTime !== null
                  ? row.avgResponseTime
                  : row.timeTaken !== undefined && row.timeTaken !== null
                    ? row.timeTaken
                    : 0

              const max =
                row.maxTaken !== undefined && row.maxTaken !== null
                  ? row.maxTaken
                  : row.timeTaken !== undefined && row.timeTaken !== null
                    ? row.timeTaken
                    : 0

              return (
                <tr key={idx}>
                  <td>{row.endpoint || row.url || "-"}</td>
                  <td>{row.method || "-"}</td>
                  <td>{avg + " ms"}</td>
                  <td>{max + " ms"}</td>
                  {analyzeMode === "website" && <td>{row.callCount || 1}</td>}
                  <td>{statusIcon}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Render the report content with special handling for API table
  const renderReportContent = () => {
    if (error) {
      return <span className="error-message">{error}</span>
    }

    if (status === "Idle") {
      return "Please enter a URL and click Analyze to start."
    }

    if (status === "Analyzing...") {
      return "Analyzing the website performance..."
    }

    if (status === "Analysis complete!" && reportData) {
      if (activePage === "api" && rawResponse) {
        if (analyzeMode === "website" && rawResponse.apiResults) {
          return <ApiResultsTable apiResults={rawResponse.apiResults} />
        } else if (rawResponse.apiResults) {
          return <ApiResultsTable apiResults={rawResponse.apiResults} />
        }
      }

      if (activePage === "alerts" && rawResponse && rawResponse.alerts) {
        return <AlertsView alerts={rawResponse.alerts} />
      }

      // Only show reportData for non-frontend tabs
      if (activePage !== "frontend" || analyzeMode === "website") {
        return <pre className="report-data">{reportData[activePage]}</pre>
      }
    }

    return null
  }

  // Add handler for analyzing the whole website
  const handleAnalyzeWholeWebsite = async () => {
    if (!url) {
      setError("Please enter a URL to analyze the whole website.");
      return;
    }
    setAnalyzeMode("website");
    setStatus("Analyzing...");
    setError(null);
    setReportData(null);
    setRawResponse(null);
    try {
      const scenario = activePage === "overall" ? "overall" : activePage;
      const data = await analyzeFrontend(url, scenario, "website");
      setStatus("Analysis complete!");
      setReportData(data);
      setWebsiteCache({ url, maxPages, rawResponse, reportData: data });
    } catch (e) {
      setStatus("Idle");
      setError(e.message);
    }
  };

  // Add handler for session completion
  const handleSessionComplete = (session) => {
    setCurrentSession(session);
    setSessionHistory(prev => [...prev, session]);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Performance Reports</h2>
        {analyzeMode === "page" && sidebarItems.map(({ id, label }) => (
          <div
            key={id}
            onClick={() => setActivePage(id)}
            className={`sidebar-item ${activePage === id ? "active" : ""}`}
          >
            {label}
          </div>
        ))}
      </aside>

      <main className="main-content">
        <h1>Responsive Tracer</h1>
        {/* Only show URL input and analyze button in Overall tab and not in API tab */}
        {activePage === "overall" && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, width: '100%' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              width: '100%',
              maxWidth: 600,
              margin: '0 auto',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(25, 118, 210, 0.07)',
              padding: 24,
            }}>
              <input
                type="text"
                placeholder="Enter website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="url-input"
                style={{
                  flex: 1,
                  fontSize: 18,
                  padding: '16px 18px',
                  borderRadius: 8,
                  border: '1.5px solid #1976d2',
                  marginRight: 0,
                  background: '#f8fbff',
                  boxShadow: '0 1px 4px rgba(25, 118, 210, 0.04)',
                }}
              />
              <button
                onClick={handleAnalyze}
                className="analyze-button"
                style={{
                  fontSize: 18,
                  padding: '16px 32px',
                  borderRadius: 8,
                  background: '#1976d2',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                  border: 'none',
                  cursor: !url || status === "Analyzing..." ? 'not-allowed' : 'pointer',
                  opacity: !url || status === "Analyzing..." ? 0.7 : 1,
                  transition: 'background 0.2s',
                }}
                disabled={!url || status === "Analyzing..."}
              >
                {status === "Analyzing..." ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        )}

        {/* In API tab, show Analyze Whole Website button in top right corner */}
        {activePage === "api" && (
          <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button
              className="analyze-button"
              style={{ fontSize: 16, padding: '12px 28px', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)', border: 'none', cursor: !url || status === "Analyzing..." ? 'not-allowed' : 'pointer', opacity: !url || status === "Analyzing..." ? 0.7 : 1, transition: 'background 0.2s' }}
              onClick={handleAnalyzeWholeWebsite}
              disabled={!url || status === "Analyzing..."}
            >
              {status === "Analyzing..." ? "Analyzing..." : "Analyze Whole Website"}
            </button>
          </div>
        )}

        {activePage === "overall" && analyzeMode !== "website" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              padding: 40,
              maxWidth: 700,
              width: "100%",
              margin: "40px auto 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Four Score Circles Row */}
            <div style={{ display: "flex", justifyContent: "center", gap: 60, marginBottom: 32, marginTop: 16 }}>
              <ScoreCircle
                score={
                  rawResponse && typeof rawResponse.performance === "number"
                    ? Math.round(rawResponse.performance * 100)
                    : 0
                }
                label="Performance"
              />
              <ScoreCircle
                score={
                  rawResponse && typeof rawResponse.accessibility === "number"
                    ? Math.round(rawResponse.accessibility * 100)
                    : 0
                }
                label="Accessibility"
              />
              <ScoreCircle
                score={
                  rawResponse && typeof rawResponse.bestPractices === "number"
                    ? Math.round(rawResponse.bestPractices * 100)
                    : 0
                }
                label="Best Practices"
              />
              <ScoreCircle
                score={rawResponse && typeof rawResponse.seo === "number" ? Math.round(rawResponse.seo * 100) : 0}
                label="SEO"
              />
            </div>
            <h2 style={{ margin: "0 0 24px 0", fontWeight: 700, fontSize: 28, textAlign: "center" }}>
              Overall Performance
            </h2>
            <div style={{ width: "100%", marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Core Web Vitals</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>First Contentful Paint (FCP): {rawResponse?.fcp ?? "-"}</li>
                <li>Largest Contentful Paint (LCP): {rawResponse?.lcp ?? "-"}</li>
                <li>Cumulative Layout Shift (CLS): {rawResponse?.cls ?? "-"}</li>
              </ul>
            </div>
            <div style={{ width: "100%", borderTop: "1px solid #eee", marginBottom: 24, paddingTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Other Important Metrics</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>Time to Interactive (TTI): {rawResponse?.tti ?? "-"}</li>
                <li>Total Blocking Time (TBT): {rawResponse?.tbt ?? "-"}</li>
                <li>Speed Index: {rawResponse?.si ?? "-"}</li>
              </ul>
            </div>
            <div style={{ width: "100%", borderTop: "1px solid #eee", paddingTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>API Performance Summary</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>
                  Total API Calls:{" "}
                  {rawResponse?.apiResults?.apiCalls
                    ? rawResponse.apiResults.apiCalls.length
                    : rawResponse?.apiResults
                      ? 0
                      : "-"}
                </li>
                <li>
                  Average Response Time:{" "}
                  {rawResponse?.apiResults?.analysis?.averageResponseTime !== undefined
                    ? rawResponse.apiResults.analysis.averageResponseTime + " ms"
                    : rawResponse?.apiResults
                      ? "0 ms"
                      : "-"}
                </li>
                <li>
                  Slow APIs:{" "}
                  {rawResponse?.apiResults?.analysis?.slowestApis
                    ? rawResponse.apiResults.analysis.slowestApis.length
                    : rawResponse?.apiResults
                      ? 0
                      : "-"}
                </li>
                <li>
                  Error-Prone APIs:{" "}
                  {rawResponse?.apiResults?.analysis?.errorProneApis
                    ? rawResponse.apiResults.analysis.errorProneApis.length
                    : rawResponse?.apiResults
                      ? 0
                      : "-"}
                </li>
              </ul>
            </div>
            {rawResponse?.alerts && rawResponse.alerts.length > 0 && (
              <div style={{ width: "100%", borderTop: "1px solid #eee", paddingTop: 24, marginTop: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#dc3545", marginRight: 8 }}>⚠️</span> Performance Alerts
                </div>
                <div style={{ background: "#fff8e1", padding: "12px 16px", borderRadius: 8, fontSize: 15 }}>
                  <strong>{rawResponse.alerts.length} issues detected</strong> -
                  {rawResponse.alerts.filter((a) => a.type === "critical").length} critical,
                  {rawResponse.alerts.filter((a) => a.type === "warning").length} warnings
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => setActivePage("alerts")}
                      style={{
                        background: "#1976d2",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activePage === "frontend" && analyzeMode !== "website" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              padding: 40,
              maxWidth: 900,
              overflowY: "auto",
              margin: "32px auto 0 auto",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 700, color: "#1976d2", letterSpacing: 0.5 }}>
              FrontEnd Metrics
            </h2>
            <CoreWebVitalsTable metrics={rawResponse || {}} />
            {/* UX & Interaction Metrics Section */}
            <div style={{ marginTop: 32 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 20,
                  marginBottom: 12,
                  color: "#1976d2",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span role="img" aria-label="brain" style={{ fontSize: 24, marginRight: 8 }}>
                  🧠
                </span>{" "}
                UX & Interaction Metrics
              </div>
              <table
                className="modern-table"
                style={{
                  background: "#f8fbff",
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(25, 118, 210, 0.07)",
                }}
              >
                <thead style={{ background: "#e3f0fa" }}>
                  <tr>
                    <th style={{ background: "#e3f0fa", color: "#1976d2", fontWeight: 700, fontSize: 16 }}>Metric</th>
                    <th style={{ background: "#e3f0fa", color: "#1976d2", fontWeight: 700, fontSize: 16 }}>
                      Description
                    </th>
                    <th style={{ background: "#e3f0fa", color: "#1976d2", fontWeight: 700, fontSize: 16 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uxInteractionMetrics(rawResponse).map((m, idx) => (
                    <tr key={m.key} style={{ background: idx % 2 === 0 ? "#f8fbff" : "#eaf4fd" }}>
                      <td style={{ fontWeight: 600 }}>{m.label}</td>
                      <td>{m.desc}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            minWidth: 60,
                            padding: "4px 14px",
                            borderRadius: 16,
                            background: getBadgeColor(m),
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 15,
                            textAlign: "center",
                            letterSpacing: 0.5,
                          }}
                        >
                          {m.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activePage === "api" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              padding: 40,
              maxWidth: 900,
              maxHeight: 600,
              overflowY: "auto",
              margin: "32px auto 0 auto",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 700, color: "#1976d2", letterSpacing: 0.5 }}>
              API Calls {analyzeMode === "website" ? "(Entire Website)" : "(Single Page)"}
            </h2>
            {rawResponse && (analyzeMode === "website" ? rawResponse.apiResults : rawResponse.apiResults) ? (
              <div className="api-table-scroll">
                <table className="modern-table">
                  <caption>
                    {analyzeMode === "website"
                      ? `API Response Times (Across ${rawResponse.apiResults.pagesAnalyzed || 0} Pages)`
                      : "API Response Times"}
                  </caption>
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Avg Response Time</th>
                      <th>Max Taken</th>
                      {analyzeMode === "website" && <th>Call Count</th>}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analyzeMode === "website"
                      ? rawResponse.apiResults.apiCalls
                      : rawResponse.apiResults.apiCalls
                    ).map((row, idx) => {
                      let statusIcon = <span className="status-icon ok">✔️</span>
                      if (row.status >= 500) statusIcon = <span className="status-icon error">❌</span>
                      else if (row.status >= 400) statusIcon = <span className="status-icon warn">⚠️</span>
                      const avg = row.avgResponseTime !== undefined ? row.avgResponseTime : row.timeTaken
                      const max = row.maxTaken !== undefined ? row.maxTaken : row.timeTaken
                      return (
                        <tr key={idx}>
                          <td>{row.endpoint || row.url || "-"}</td>
                          <td>{row.method || "-"}</td>
                          <td>{avg !== undefined ? avg + " ms" : "-"}</td>
                          <td>{max !== undefined ? max + " ms" : "-"}</td>
                          {analyzeMode === "website" && <td>{row.callCount || 1}</td>}
                          <td>{statusIcon}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>No API results available</div>
            )}
          </div>
        ) : activePage === "alerts" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              padding: 40,
              maxWidth: 900,
              maxHeight: 600,
              overflowY: "auto",
              margin: "32px auto 0 auto",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 700, color: "#1976d2", letterSpacing: 0.5 }}>
              Automatic Alerts
            </h2>
            {status === "Analysis complete!" && rawResponse && rawResponse.alerts ? (
              <AlertsView alerts={rawResponse.alerts} />
            ) : (
              <div className="alerts-empty">
                <div className="alerts-empty-icon">⏳</div>
                <h3>No Alerts Available</h3>
                <p>Enter a URL and click Analyze to generate performance alerts.</p>
              </div>
            )}
          </div>
        ) : activePage === "sessions" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              padding: 40,
              maxWidth: 900,
              margin: "32px auto 0 auto",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 700, color: "#1976d2", letterSpacing: 0.5 }}>
              Session Analysis & Performance Monitoring
            </h2>
            
            <SessionSimulator onSessionComplete={handleSessionComplete} />
            
            {currentSession && (
              <PerformanceAnalyzer
                sessionData={currentSession}
                apiMetrics={rawResponse?.apiResults?.apiCalls}
                frontendMetrics={rawResponse}
              />
            )}
          </div>
        ) : (
          <section className="report-section">
            <h2>{sidebarItems.find((item) => item.id === activePage)?.label}</h2>
            <div className="report-content">{renderReportContent()}</div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
