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
  
  // New states for Jilla-Vidhansabha section
  const [jillaList, setJillaList] = useState([]);
  const [selectedJilla, setSelectedJilla] = useState("");
  const [vidhansabhaList, setVidhansabhaList] = useState([]);
  const [selectedVidhansabha, setSelectedVidhansabha] = useState("");
  const [loadingVidhansabhas, setLoadingVidhansabhas] = useState(false);
  
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

  // Fetch jilla list
  const fetchJillaList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/getJillaList`);
      // Assuming the API returns an array of objects with jilla property
      const jillaValues = res.data.map(item => item.jilla);
      setJillaList(jillaValues);
    } catch (err) {
      console.error("Error fetching Jilla:", err);
      setJillaList([]);
    }
    setLoading(false);
  };

  // Fetch vidhansabhas for selected jilla
  const fetchVidhansabhas = async (jillaName) => {
    if (!jillaName) {
      setVidhansabhaList([]);
      setSelectedVidhansabha("");
      return;
    }
    
    setLoadingVidhansabhas(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/getVidhansabhaList?jilla=${encodeURIComponent(jillaName)}`
      );
      // Assuming the API returns an array of objects with vidhansabha property
      const vidhanValues = res.data.map(item => item.vidhansabha);
      setVidhansabhaList(vidhanValues);
    } catch (err) {
      console.error("Error fetching vidhansabhas:", err);
      setVidhansabhaList([]);
    } finally {
      setLoadingVidhansabhas(false);
    }
  };

  // Fetch voter table list
  const fetchTableList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/getAllVoterTables`);
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
    fetchJillaList();
  }, []);

  // Handle jilla selection change
  const handleJillaChange = (e) => {
    const jillaName = e.target.value;
    setSelectedJilla(jillaName);
    setSelectedVidhansabha(""); // Reset vidhansabha selection
    fetchVidhansabhas(jillaName);
  };

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

  // Download voter count by Jilla & Vidhansabha
  const handleDownloadVoterCount = async () => {
    if (!selectedJilla) {
      alert("Please select a Jilla");
      return;
    }
    console.log("Downloading voter count for:", {
      jilla: selectedJilla,
      vidhansabha: selectedVidhansabha
    });
    // Build URL - सीधा URL बनाएं
    let url = `${process.env.REACT_APP_API_URL}/downloadVoterCountByJilla?jilla=${encodeURIComponent(selectedJilla)}`;
    if (selectedVidhansabha && selectedVidhansabha.trim() !== '') {
      url += `&vidhansabha=${encodeURIComponent(selectedVidhansabha.trim())}`;
    }
    console.log("Download URL:", url);
    // Method 1: window.open with noreferrer
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    // If window.open is blocked, show message
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert('Pop-up blocked! Please allow pop-ups for this site or try the button below.');
      // Alternative method
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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

      {/* New Section: Download Voter Count by Jilla */}
      <section className="data-section">
        <h2>📊 Download Voter Count by Jilla</h2>
        <p className="section-description">
          Download voter count data filtered by Jilla and optional Vidhansabha
        </p>
        
        <div className="dropdown-group">
          <div className="dropdown-item">
            <label>Select Jilla (District): *</label>
            <select
              value={selectedJilla}
              onChange={handleJillaChange}
              className="table-dropdown"
              disabled={loading}
            >
              <option value="">-- Select Jilla --</option>
              {jillaList.map((jilla, i) => (
                <option key={i} value={jilla}>
                  {jilla}
                </option>
              ))}
            </select>
          </div>
          
          <div className="dropdown-item">
            <label>Select Vidhansabha (Optional):</label>
            <select
              value={selectedVidhansabha}
              onChange={(e) => setSelectedVidhansabha(e.target.value)}
              className="table-dropdown"
              disabled={!selectedJilla || loadingVidhansabhas}
            >
              <option value="">-- All Vidhansabhas --</option>
              {loadingVidhansabhas ? (
                <option value="" disabled>Loading...</option>
              ) : (
                vidhansabhaList.map((vidhan, i) => (
                  <option key={i} value={vidhan}>
                    {vidhan}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        <button 
          className="download-btn jilla-download" 
          onClick={handleDownloadVoterCount}
          disabled={!selectedJilla}
        >
          📥 Download Voter Count {selectedVidhansabha ? `(${selectedJilla} - ${selectedVidhansabha})` : `(${selectedJilla} - All)`}
        </button>
      </section>

      {/* Existing Section: Download Voter Table Data */}
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

      {/* Existing Section: Download Master Jilla Data */}
      <section className="data-section">
        <h2>📋 Download Master Jilla Data</h2>
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