import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import SQLChat from "./components/SQLChat";

// Placeholder component for other pages
const Placeholder = ({ title }) => (
  <div style={{ color: "white", padding: "2rem" }}>
    <h1 style={{ fontSize: "2rem", borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
      {title}
    </h1>
    <p style={{ marginTop: "1rem", color: "#94a3b8" }}>
      This is a placeholder page. The main functionality is in the "Query AI" section.
    </p>
  </div>
);

export default function App() {
  // State to manage which page is currently active
  const [activePage, setActivePage] = useState("Query AI");

  const renderPage = () => {
    switch (activePage) {
      case "Query AI":
        return <SQLChat />;
      case "Dashboard":
        return <Placeholder title="Dashboard" />;
      case "History":
        return <Placeholder title="Query History" />;
      case "Settings":
        return <Placeholder title="Settings" />;
      default:
        return <SQLChat />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#071024" }}>
      {/* Pass the state and the updater function to the Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main style={{ flex: 1, padding: 28 }}>
        {renderPage()}
      </main>
    </div>
  );
}