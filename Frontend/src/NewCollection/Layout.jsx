import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import "./Layout.css";
export const Layout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  return (
    <div className="layout-container">
      {/* Sidebar */}
      <nav className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>🪷 BJP Panel</h2>
          {/* Close button visible only on mobile */}
          <button className="close-btn" onClick={toggleSidebar}>
            ✖
          </button>
        </div>
        <ul className="sidebar-menu">
          <li
            onClick={() => {
              navigate("/AdminHome");
              setIsSidebarOpen(false);
            }}
          >
            📤 Home
          </li>
          <li
            onClick={() => {
              navigate("/ZillaUpload");
              setIsSidebarOpen(false);
            }}
          >
            📥 Zilla Upload
          </li>
          <li
            onClick={() => {
              navigate("/CreateVidhanTable");
              setIsSidebarOpen(false);
            }}
          >
            📥 Create Vidhan Table
          </li>
          <li
            onClick={() => {
              navigate("/Upload");
              setIsSidebarOpen(false);
            }}
          >
            📊 Upload
          </li>
          <li
            onClick={() => {
              navigate("/View");
              setIsSidebarOpen(false);
            }}
          >
            🧾 Assign Booth
          </li>
          <li
            onClick={() => {
              navigate("/VoterMerge");
              setIsSidebarOpen(false);
            }}
          >
            🎡 Settings
          </li>
          <li
            onClick={() => {
              navigate("/CreateJillaLogin");
              setIsSidebarOpen(false);
            }}
          >
            🎯 CreateJillaLogin
          </li>
          {/* <li onClick={() => {navigate("/UserVhidhan");setIsSidebarOpen(false);}}>📄 Vhidhan Report</li> */}
          {/* <li onClick={() => {navigate("/VoterDown");setIsSidebarOpen(false);}}>📥 Voter Download</li> */}
        </ul>
        <button
          onClick={() => {
            sessionStorage.removeItem("adminToken");
            sessionStorage.removeItem("userData");
            sessionStorage.clear(); // optional → sab hata dega
            navigate("/Admin");
          }}
        >
          🚪 Logout
        </button>
      </nav>
      {/* Main Content */}
      <main className="main-content">
        {/* Mobile top bar */}
        <div className="mobile-header">
          <button className="menu-btn" onClick={toggleSidebar}>
            ☰
          </button>
          <h3>Admin Dashboard</h3>
        </div>
        <Outlet />
      </main>
    </div>
  );
};
