import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Insert.css";

export const Insert = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalJilla: 0, totalVidhansabha: 0 });
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [pollingStations, setPollingStations] = useState([]);
  const [selectedPollingStation, setSelectedPollingStation] = useState("");

  const navigate = useNavigate();

  // Fetch jilla + vidhansabha counts
  const fetchCounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/count-stats`);
      if (res.data.status) {
        setStats({
          totalJilla: res.data.data.totalJilla || 0,
          totalVidhansabha: res.data.data.totalVidhansabha || 0
        });
      }
    } catch (err) {
      console.error("Count fetch error:", err);
    }
    setLoading(false);
  };

  // Fetch voter table list
  const fetchTableList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/getAllVoterTables`);
      console.log(res.data.data);
      if (res.data.status) setTables(res.data.data);
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  // Fetch polling stations when table is selected
  const fetchPollingStations = async (tableName) => {
    if (!tableName) {
      setPollingStations([]);
      setSelectedPollingStation("");
      return;
    }
    
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/getAllPollingStations?table=${tableName}`
      );
      if (res.data.status) {
        setPollingStations(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching polling stations:", err);
      setPollingStations([]);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchTableList();
  }, []);

  // Handle table selection change
  const handleTableChange = (e) => {
    const tableName = e.target.value;
    setSelectedTable(tableName);
    setSelectedPollingStation(""); // Reset polling station selection
    fetchPollingStations(tableName);
  };

  // Download Excel (with polling station filter if selected)
  const handleDownload = async () => {
    if (!selectedTable) {
      alert("Please select a table");
      return;
    }

    let url = `${process.env.REACT_APP_API_URL}/downloadTableExcel?table=${selectedTable}`;
    
    // Add polling station filter if selected
    if (selectedPollingStation) {
      url += `&polling_station=${encodeURIComponent(selectedPollingStation)}`;
    }

    window.open(url, "_blank");
  };

  const handleDownloadMasterData = async () => {
    setLoading(true);
    try {
      window.open(
        `${process.env.REACT_APP_API_URL}/downloadMasterDataExcel`,
        "_blank"
      );
    } catch (err) {
      console.error("Download master data error:", err);
      alert("Failed to download master data");
    }
    setLoading(false);
  };

  return (
    <div className="insert-container">
      <header className="insert-header">
        <h1>🪷 BJP Admin Dashboard</h1>
        <button onClick={fetchCounts} disabled={loading} className="refresh-all">
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
        <button className="logout-btn" onClick={() => navigate("/")}>🚪 Logout</button>
      </header>

      <section className="stats-section">
        <div className="stat-card orange">
          <h3>Total Districts (Jilla)</h3>
          <p>{loading ? "..." : stats.totalJilla}</p>
        </div>
        <div className="stat-card green">
          <h3>Total Vidhan Sabha</h3>
          <p>{loading ? "..." : stats.totalVidhansabha}</p>
        </div>
      </section>

      {/* Dropdown Section */}
      <section className="data-section">
        <h2>📄 Download Voter Table Data</h2>

        <div className="dropdown-group">
          <div className="dropdown-item">
            <label>Select Voter Table:</label>
            <select
              value={selectedTable}
              onChange={handleTableChange}
              className="table-dropdown"
            >
              <option value="">-- Select Voter Table --</option>
              {tables.map((t, i) => (
                <option key={i} value={t.voter_table_name}>
                  {t.voter_table_name}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown-item">
            <label>Select Polling Station (Optional):</label>
            <select
              value={selectedPollingStation}
              onChange={(e) => setSelectedPollingStation(e.target.value)}
              className="table-dropdown"
              disabled={!selectedTable}
            >
              <option value="">-- All Polling Stations --</option>
              {pollingStations.map((station, i) => (
                <option key={i} value={station.polling_station}>
                  {station.polling_station}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="download-btn" onClick={handleDownload} disabled={!selectedTable}>
          ⬇️ Download Excel {selectedPollingStation ? `(${selectedPollingStation})` : "(All Data)"}
        </button>
      </section>

      <section className="data-section">
        <h2>📊 Download Master Jilla Data</h2>
        <p className="section-description">
          Download complete data with Jilla, Vidhan Sabha, and Polling Station information
        </p>
        <button 
          className="download-btn master-download" 
          onClick={handleDownloadMasterData}
          disabled={loading}
        >
          {loading ? "⏳ Generating..." : "📥 Download Master Data Excel"}
        </button>
      </section>
      
      <footer className="insert-footer">© 2025 BJP Admin Panel • Developed by Team Kadu</footer>
    </div>
  );
};