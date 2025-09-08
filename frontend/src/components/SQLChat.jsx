import React, { useState, useRef } from "react";
import ChartView from "./ChartView";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function SQLChat() {
  const [query, setQuery] = useState("");
  const [queryMode, setQueryMode] = useState("nl");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(null);
    setError(null);
    setResult(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "File upload failed");
      }
      const data = await response.json();
      setUploadedFile({ name: file.name, message: data.message });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!query) {
      setError("Please enter a query.");
      return;
    }
    if (!uploadedFile) {
        setError("Please upload a file first.");
        return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: queryMode, query: query }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Query failed");
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "Show total sales by product",
    "List top 5 months with highest sales",
    "SELECT product, SUM(sales) as total_sales FROM data GROUP BY product ORDER BY total_sales DESC",
  ];

  return (
    <>
      <div className="hero">
        <h1>Query your data with AI</h1>
        <p className="muted">Upload a CSV, Excel, or Parquet file, then ask questions in natural language or write SQL queries directly.</p>
        <div className="controls">
          <button className="btn" onClick={() => fileInputRef.current.click()}>
            {uploadedFile ? `Loaded: ${uploadedFile.name}` : "Upload File"}
          </button>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleUpload} accept=".csv,.xlsx,.xls,.parquet" />
          <div className="chips">
            {/* --- MODIFICATION START --- */}
            <button
              className={`chip ${queryMode === 'nl' ? 'active' : ''}`}
              onClick={() => setQueryMode('nl')}
            >
              Natural Language
            </button>
            <button
              className={`chip ${queryMode === 'sql' ? 'active' : ''}`}
              onClick={() => setQueryMode('sql')}
            >
              SQL
            </button>
            {/* --- MODIFICATION END --- */}
          </div>
        </div>
      </div>

      <div className="query-area">
        <div className="left-col">
          <textarea
            id="query"
            placeholder={queryMode === 'nl' ? "e.g., Show me the total sales per month" : "e.g., SELECT * FROM data LIMIT 10"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn" onClick={handleSubmitQuery} disabled={isLoading}>
            {isLoading ? "Thinking..." : "Run Query"}
          </button>
          <div className="chips">
            {exampleQueries.map(q => <div key={q} className="chip" onClick={() => setQuery(q)}>{q}</div>)}
          </div>
        </div>
        <div className="result-card">
          {isLoading && <p>Loading results...</p>}
          {error && <p style={{ color: "#ff8a8a" }}>Error: {error}</p>}
          {result && (
            <div>
              <p className="muted">SQL Query Used:</p>
              <pre className="sql-used"><code>{result.sql}</code></pre>
              {result.rows.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>{result.columns.map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Query returned no results.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {result && result.rows.length > 0 && (
          <div className="result-card" style={{ marginTop: 18 }}>
              <ChartView data={result} />
          </div>
      )}
    </>
  );
}