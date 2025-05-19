/**
 * Formats API table data for better display in the UI
 * @param {string} apiTableText - The tab-separated API table text
 * @returns {string} - HTML formatted table
 */
export function formatApiTableToHtml(apiTableText) {
  if (!apiTableText || apiTableText.includes("No API calls detected")) {
    return "<p>No API calls detected.</p>"
  }

  try {
    // Split the text into lines
    const lines = apiTableText.split("\n")

    // Extract header and rows
    const headerLine = lines[0]
    const dataRows = lines.slice(1)

    // Create table header
    const headers = headerLine.split("\t")
    const headerHtml = headers.map((h) => `<th>${h}</th>`).join("")

    // Create table rows
    const rowsHtml = dataRows
      .map((row) => {
        const cells = row.split("\t")
        return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
      })
      .join("")

    // Assemble the table
    return `
      <table class="api-table">
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `
  } catch (error) {
    console.error("Error formatting API table:", error)
    return `<p>Error formatting API data: ${error.message}</p><pre>${apiTableText}</pre>`
  }
}
