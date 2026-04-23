import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./Upload.css";
export const Upload = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savedFileNames, setSavedFileNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  /** Load tables & saved filenames */
  useEffect(() => {
      loadTables();
      const savedNames = sessionStorage.getItem("uploadedFileNames");
      if (savedNames) setSavedFileNames(JSON.parse(savedNames));
  }, []);
    /** Fetch DB table names */
    const loadTables = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/getAllVoterTables`);
            
            // Backend se data structure ke hisab se access karo
            if (res.data.status && res.data.data) {
                // Yeh line change karo - data ko directly set karo
                setTables(res.data.data || []);
            } else {
                console.error("Unexpected response structure:", res.data);
                setTables([]);
            }
        } catch (err) {
            console.error("Failed to load tables:", err);
            setTables([]); // Error case mein empty array set karo
        } finally {
            setLoading(false);
        }
    };
  /** Clean string (same as JillaUpload frontend version) */
  const cleanString = (text) => {
    if (!text) return "";
    let cleaned = text.toString();

    if (cleaned.includes(":")) {
      cleaned = cleaned.split(":").slice(1).join(":");
    }
    cleaned = cleaned.replace(/^न्‍\s*/g, "");
    cleaned = cleaned.replace(/\s*न्‍$/g, "");
    cleaned = cleaned.replace(/\s+/g, " ");
    cleaned = cleaned.replace(/[\n\r\t]+/g, "");
    return cleaned.trim();
  };
  /** Normalize column header */
  const normalizeColumnName = (name) => {
    return name.toString().trim().toLowerCase().replace(/\s+/g, "_");
  };
  const extractFirstNumber = (t) => {
    if (!t) return null;
    const converted = t.toString().replace(/[०-९]/g, (d) => 
      "०१२३४५६७८९".indexOf(d)
    );
    const m = converted.match(/^\s*(\d+)\s*-?/);
    return m ? parseInt(m[1]) : null;
  };
  /** Save selected files */
  const handleFileChange = (e) => {
    if (loading || uploading) return;
    const selectedFilesArr = Array.from(e.target.files);
    if (selectedFilesArr.length > 101) {
      setMessage("⚠️ You can upload up to 100 Excel files at once.");
      return;
    }
    setFiles(selectedFilesArr);
    const newFileNames = selectedFilesArr.map((f) => f.name);
    const oldNames = JSON.parse(sessionStorage.getItem("uploadedFileNames") || "[]");
    const combined = [...oldNames, ...newFileNames];
    sessionStorage.setItem("uploadedFileNames", JSON.stringify(combined));
    setSavedFileNames(combined);
  };
  /** Clear buffer list */
  const handleClearFiles = () => {
    if (loading || uploading) return;
    sessionStorage.removeItem("uploadedFileNames");
    setSavedFileNames([]);
    setFiles([]);
    setMessage("🗑️ File list cleared.");
  };
  /** MAIN UPLOAD (clean in frontend) */
  const handleUpload = async () => {
    if (!selectedTable) {
      setMessage("⚠️ Select a target table first.");
      return;
    }
    if (!files.length) {
      setMessage("⚠️ Select at least one Excel file.");
      return;
    }
    setUploading(true);
    setMessage("⏳ Reading & cleaning Excel files...");
    let finalAllRows = [];
    /** PROCESS ALL FILES */
    for (let f of files) {
      const data = await f.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach((row) => {
        let cleanRow = {};
        for (const key in row) {
          const newKey = normalizeColumnName(key);
          cleanRow[newKey] = cleanString(row[key]);
        }
        cleanRow.add1 = cleanString(cleanRow.add1);
        cleanRow.add2 = cleanString(cleanRow.add2);
        cleanRow.polling_station = cleanString(cleanRow.polling_station);
        cleanRow.station_address = cleanString(cleanRow.station_address);
        cleanRow.booth_number =
          extractFirstNumber(cleanRow.polling_station) || 0;
        cleanRow.add1_number = extractFirstNumber(cleanRow.add1) || 0;
        cleanRow.add2_number = extractFirstNumber(cleanRow.add2) || 0;
        finalAllRows.push(cleanRow);
      });
    }
    /** SEND CLEAN JSON TO BACKEND */
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/uploadCleanToSelectedTable`,
        {
          tableName: selectedTable,
          rows: finalAllRows,
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage("❌ Upload failed.");
    }
    setUploading(false);
  };
  /** LokVidhan Update */
  const handleLokVidhanUpdate = async () => {
    try {
      setUploading(true);
      setMessage("⏳ Updating LokSabha & VidhanSabha...");
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/lokvidhan`);
      setMessage(response.data.message);
      alert(response.data.message);
    } catch (e) {
      setMessage("❌ Failed to update LokVidhan.");
      alert("❌ Failed.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="bjp-card">
      <h2 className="bjp-badge">📤 Upload Excel → Select Table</h2>
      {/* Loading Overlay */}
      {(loading || uploading) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            {loading ? "Loading..." : "Uploading..."}
          </p>
        </div>
      )}

      {/* table dropdown */}
      <div>
        <label>Select Target Table: </label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="bjp-select"
          disabled={loading || uploading}
        >
          <option value="">-- Choose Table --</option>
          {tables.map((t, i) => (
            <option key={i} value={t.voter_table_name}>
              {t.voter_table_name}
            </option>
          ))}
        </select>
      </div>

      <p style={{ color: "#ff8800" }}>You can upload up to 100 Excel files at once.</p>

      <button 
        className="delete-button" 
        onClick={handleClearFiles} 
        disabled={loading || uploading}
      >
        🗑️ Clear Buffer List
      </button>

      <input 
        type="file" 
        accept=".xlsx,.xls" 
        multiple 
        onChange={handleFileChange} 
        disabled={loading || uploading}
      />

      <button 
        className="bjp-button" 
        onClick={handleUpload} 
        disabled={loading || uploading || !selectedTable || files.length === 0}
      >
        {uploading ? "⏳ Uploading..." : "Upload Clean Data"}
      </button>

      {message && <p className="bjp-message">{message}</p>}

      {savedFileNames.length > 0 && (
        <div className="uploaded-file-list">
          <h4>📄 Files Selected:</h4>
          <ul>{savedFileNames.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}
    </div>
  );
};