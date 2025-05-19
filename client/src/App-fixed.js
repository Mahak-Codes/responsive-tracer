"use client"

import { useState } from "react"
import "./App.css"

const sidebarItems = [
  { id: "overall", label: "Overall Performance" },
  { id: "frontend", label: "FrontEnd Metrics" },
  { id: "api", label: "API Calls" },
  { id: "db", label: "DB Latency" },
]

function App() {
  const [url, setUrl] = useState("")
  const [activePage, setActivePage] = useState("overall")
  const [status, setStatus] = useState("Idle")
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)

  const analyzeFrontend = async (url, scenario) => {
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

    // Use the formatted data from the backend
    return {
      overall:
        data.overall ||
        `Performance Score: ${(data.performance * 100).toFixed(0)}\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
      api: data.api || "API metrics are available in backend and API tabs.",
      db: data.db || "DB metrics are available in backend and DB tabs.",
      frontend:
        data.frontend ||
        `After button click:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}\n\n` +
          `After search:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
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
    } catch (e) {
      setStatus("Idle")
      setError(e.message)
    }
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Performance Reports</h2>
        {sidebarItems.map(({ id, label }) => (
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
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="url-input"
          />
          <button onClick={handleAnalyze} className="analyze-button" disabled={!url || status === "Analyzing..."}>
            {status === "Analyzing..." ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        <section className="report-section">
          <h2>{sidebarItems.find((item) => item.id === activePage)?.label}</h2>
          <div className="report-content">
            {error && <span className="error-message">{error}</span>}
            {!error && status === "Idle" && "Please enter a URL and click Analyze to start."}
            {!error && status === "Analyzing..." && "Analyzing the website performance..."}
            {!error && status === "Analysis complete!" && reportData && (
              <pre className="report-data">{reportData[activePage]}</pre>
            )}
          </div>
        </section>

        {/* Debug section - can be removed in production */}
        {rawResponse && process.env.NODE_ENV === "development" && (
          <details className="debug-section">
            <summary>Debug Information</summary>
            <div>
              <h3>Raw Response Properties</h3>
              <ul>
                {Object.keys(rawResponse).map((key) => (
                  <li key={key}>
                    {key}: {typeof rawResponse[key]}
                  </li>
                ))}
              </ul>

              <h3>API Results</h3>
              <pre>
                {rawResponse.apiResults
                  ? `API Calls: ${rawResponse.apiResults.apiCalls?.length || 0}
Analysis: ${JSON.stringify(rawResponse.apiResults.analysis, null, 2)}`
                  : "No API results available"}
              </pre>
            </div>
          </details>
        )}
      </main>
    </div>
  )
}

export default App
