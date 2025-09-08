import React from "react";

// Helper for menu items to avoid repetition
const MenuItem = ({ title, icon, isActive, onClick }) => (
  <div
    className={`menu-item ${isActive ? "active" : ""}`}
    onClick={() => onClick(title)}
  >
    <span role="img" aria-label={title}>{icon}</span>
    {title}
  </div>
);

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="logo">SQL</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: "white" }}>Data Query</h2>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>AI Assistant</p>
          </div>
        </div>
        <nav className="menu">
          <MenuItem title="Query AI" icon="💬" isActive={activePage === "Query AI"} onClick={setActivePage} />
          <MenuItem title="Dashboard" icon="📊" isActive={activePage === "Dashboard"} onClick={setActivePage} />
          <MenuItem title="History" icon="🕒" isActive={activePage === "History"} onClick={setActivePage} />
          <MenuItem title="Settings" icon="⚙️" isActive={activePage === "Settings"} onClick={setActivePage} />
        </nav>
      </div>
      <div className="account">
        <div className="avatar">U</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, color: "white" }}>User Account</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Free Plan</p>
        </div>
      </div>
    </aside>
  );
}