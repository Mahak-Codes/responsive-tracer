<<<<<<< HEAD
"use client"

import { useState } from "react"
import "./App.css"
import { formatApiTableToHtml } from "./api-formatter"
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const sidebarItems = [
  { id: "overall", label: "Overall Performance" },
  { id: "frontend", label: "FrontEnd Metrics" },
  { id: "api", label: "API Calls" },
  { id: "db", label: "DB Latency" },
]

const coreWebVitals = [
  { key: 'fcp', label: 'First Contentful Paint (FCP)', desc: 'Time until the first text or image is rendered.' },
  { key: 'lcp', label: 'Largest Contentful Paint (LCP)', desc: 'Time taken to render the largest visible element.' },
  { key: 'fid', label: 'First Input Delay (FID)', desc: 'Time between user interaction and browser response.' },
  { key: 'tti', label: 'Time to Interactive (TTI)', desc: 'Time when the page becomes fully interactive.' },
  { key: 'cls', label: 'Cumulative Layout Shift (CLS)', desc: 'Measures visual stability (e.g., content jumping).' },
  { key: 'dcl', label: 'DOM Content Loaded (DCL)', desc: 'When HTML is fully parsed.' },
  { key: 'tbt', label: 'Total Blocking Time (TBT)', desc: 'Time the main thread is blocked and unresponsive.' },
  { key: 'speedIndex', label: 'Speed Index', desc: 'Average time to display visible content.' },
];

function Tooltip({ text, children }) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltiptext">{text}</span>
    </span>
  );
}

function CoreWebVitalsTable({ metrics }) {
  return (
    <table className="modern-table" style={{ marginBottom: 0, background: '#fff' }}>
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
            <td>
              {metrics && metrics[m.key] !== undefined && metrics[m.key] !== null ? metrics[m.key] : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PerformanceScorePie({ score }) {
  const value = Math.max(0, Math.min(100, score));
  const data = [
    { name: 'Score', value },
    { name: 'Remainder', value: 100 - value },
  ];
  const COLORS = ['#3498db', '#eaeaea'];
  return (
    <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={45}
            outerRadius={60}
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
      <div style={{ position: 'absolute', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, pointerEvents: 'none' }}>
        <span style={{ fontWeight: 700, fontSize: 24 }}>{value}</span>
        <span style={{ fontSize: 14, color: '#888', marginLeft: 2 }}>/100</span>
      </div>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState("")
  const [activePage, setActivePage] = useState("overall")
  const [status, setStatus] = useState("Idle")
  const [reportData, setReportData] = useState(null)
  const [formattedApiTable, setFormattedApiTable] = useState("")
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)
=======
import React, { useState } from "react";
import "./App.css";

const sidebarItems = [
  { id: "overall", label: "Overall Performance" },
  { id: "frontend", label: "FrontEnd Metrics" }, 
  { id: "api", label: "API Calls" },
  { id: "db", label: "DB Latency" },
];

function App() {
  const [url, setUrl] = useState("");
  const [activePage, setActivePage] = useState("overall");
  const [status, setStatus] = useState("Idle");
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
>>>>>>> c16b17ae12bc7f753f5b62ad4cae7737d7ad0184

  const analyzeFrontend = async (url, scenario) => {
    const response = await fetch("http://localhost:5000/api/analyze-frontend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, scenario }),
<<<<<<< HEAD
    })

    if (!response.ok) {
      throw new Error("Analysis failed. Please check the backend or the URL.")
    }

    const data = await response.json()

    // Store the raw response for debugging
    setRawResponse(data)

    console.log("Backend response:", data)
    console.log("API data available:", data.api ? "Yes" : "No")

    // Format API table if available
    if (data.api && data.api.includes("API Endpoint\tMethod\tStatus")) {
      // Extract just the table part from the API data
      const apiTableText = data.api.split("\n\n")[1]
      const formattedTable = formatApiTableToHtml(apiTableText)
      setFormattedApiTable(formattedTable)

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
    setFormattedApiTable("")

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

  // Helper to render API Results as a table
  function ApiResultsTable({ apiResults }) {
    if (!apiResults || !apiResults.apiCalls || !Array.isArray(apiResults.apiCalls) || apiResults.apiCalls.length === 0) {
      return <div>No API results available</div>;
    }
    // Map/compute avg and max response times if not present
    return (
      <table className="modern-table">
        <caption>API Response Times</caption>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Avg Response Time</th>
            <th>Max Taken</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {apiResults.apiCalls.map((row, idx) => {
            // Compute status icon: green for <400, yellow for 400-499, red for 500+
            let statusIcon = <span className="status-icon ok">✔️</span>;
            if (row.status >= 500) statusIcon = <span className="status-icon error">❌</span>;
            else if (row.status >= 400) statusIcon = <span className="status-icon warn">⚠️</span>;
            // Use avg/max if present, else fallback to timeTaken
            const avg = row.avgResponseTime !== undefined ? row.avgResponseTime : row.timeTaken;
            const max = row.maxTaken !== undefined ? row.maxTaken : row.timeTaken;
            return (
              <tr key={idx}>
                <td>{row.endpoint || row.url || '-'}</td>
                <td>{row.method || '-'}</td>
                <td>{avg !== undefined ? avg + ' ms' : '-'}</td>
                <td>{max !== undefined ? max + ' ms' : '-'}</td>
                <td>{statusIcon}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
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
      if (activePage === "api" && rawResponse && rawResponse.apiResults) {
        return <ApiResultsTable apiResults={rawResponse.apiResults} />
      }
      // Only show reportData for non-frontend tabs
      if (activePage !== "frontend") {
        return <pre className="report-data">{reportData[activePage]}</pre>
      }
    }

    return null
  }
=======
    });

    if (!response.ok) {
      throw new Error("Analysis failed. Please check the backend or the URL.");
    }

    const data = await response.json();

    return {
      overall: `Performance Score: ${(data.performance * 100).toFixed(0)}\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
      api: "API metrics are available in backend and API tabs.",
      db: "DB metrics are available in backend and DB tabs.",
      frontend:
        `After button click:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}\n\n` +
        `After search:\nFCP: ${data.fcp}\nLCP: ${data.lcp}\nCLS: ${data.cls}\nTTI: ${data.tti}`,
    };
  };

  const handleAnalyze = async () => {
    setStatus("Analyzing...");
    setError(null);
    setReportData(null);

    try {
      const scenario = activePage === "overall" ? "overall" : activePage;
      const data = await analyzeFrontend(url, scenario);
      setStatus("Analysis complete!");
      setReportData(data);
    } catch (e) {
      setStatus("Idle");
      setError(e.message);
    }
  };
>>>>>>> c16b17ae12bc7f753f5b62ad4cae7737d7ad0184

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
<<<<<<< HEAD
          <button onClick={handleAnalyze} className="analyze-button" disabled={!url || status === "Analyzing..."}>
=======
          <button
            onClick={handleAnalyze}
            className="analyze-button"
            disabled={!url || status === "Analyzing..."}
          >
>>>>>>> c16b17ae12bc7f753f5b62ad4cae7737d7ad0184
            {status === "Analyzing..." ? "Analyzing..." : "Analyze"}
          </button>
        </div>

<<<<<<< HEAD
        {activePage === "overall" ? (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, maxWidth: 700, width: '100%', margin: '40px auto 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 140, height: 140, marginBottom: 16, position: 'relative' }}>
              <PerformanceScorePie score={rawResponse && typeof rawResponse.performance === 'number' ? Math.round(rawResponse.performance * 100) : 0} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 }}>Performance Score</div>
            <h2 style={{ margin: '0 0 24px 0', fontWeight: 700, fontSize: 28, textAlign: 'center' }}>Overall Performance</h2>
            <div style={{ width: '100%', marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Core Web Vitals</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>First Contentful Paint (FCP): {rawResponse?.fcp ?? '-'}</li>
                <li>Largest Contentful Paint (LCP): {rawResponse?.lcp ?? '-'}</li>
                <li>Cumulative Layout Shift (CLS): {rawResponse?.cls ?? '-'}</li>
              </ul>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid #eee', marginBottom: 24, paddingTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Other Important Metrics</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>Time to Interactive (TTI): {rawResponse?.tti ?? '-'}</li>
                <li>Total Blocking Time (TBT): {rawResponse?.tbt ?? '-'}</li>
                <li>Speed Index: {rawResponse?.speedIndex ?? '-'}</li>
              </ul>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>API Performance Summary</div>
              <ul style={{ margin: 0, paddingLeft: 22, fontSize: 16 }}>
                <li>Total API Calls: {rawResponse?.apiResults?.apiCalls?.length ?? '-'}</li>
                <li>Average Response Time: {rawResponse?.apiResults?.averageResponseTime ?? '-'}</li>
                <li>Slow APIs: {rawResponse?.apiResults?.slowApis?.length ?? '0'}</li>
                <li>Error-Prone APIs: {rawResponse?.apiResults?.errorApis?.length ?? '0'}</li>
              </ul>
            </div>
          </div>
        ) : activePage === "frontend" ? (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32, maxWidth: 900, margin: '32px auto 0 auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 700 }}>FrontEnd Metrics</h2>
            <CoreWebVitalsTable metrics={rawResponse || {}} />
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
=======
        <section className="report-section">
          <h2>{sidebarItems.find((item) => item.id === activePage)?.label}</h2>
          <div className="report-content">
            {error && <span className="error-message">{error}</span>}
            {!error && status === "Idle" && "Please enter a URL and click Analyze to start."}
            {!error && status === "Analyzing..." && "Analyzing the website performance..."}
            {!error && status === "Analysis complete!" && reportData && reportData[activePage]}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
>>>>>>> c16b17ae12bc7f753f5b62ad4cae7737d7ad0184
