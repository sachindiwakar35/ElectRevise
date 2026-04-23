import React, { useEffect, useState } from "react";
import axios from "axios";
import './CreateVidhanTable.css'

export default function CreateVidhanTable() {
  const [jillaList, setJillaList] = useState([]);
  const [vidhanList, setVidhanList] = useState([]);
  const [selectedJilla, setSelectedJilla] = useState("");
  const [selectedVidhan, setSelectedVidhan] = useState("");
  const [selectedVidhanNo, setSelectedVidhanNo] = useState("");
  const [tableName, setTableName] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetchJilla();
  }, []);
  const fetchJilla = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/getJillaList`);
    setJillaList(res.data);
  };
  const handleJillaChange = async (e) => {
    const selected = e.target.value;
    setSelectedJilla(selected);
    setSelectedVidhan("");
    setSelectedVidhanNo("");
    if (!selected) return;
    const res = await axios.get(
      `${process.env.REACT_APP_API_URL}/getVidhansabhaByJilla?jilla=${selected}`
    );
    setVidhanList(res.data);
  };
  const handleVidhanSelect = (value) => {
    const details = JSON.parse(value);
    setSelectedVidhan(details.vidhansabha);
    setSelectedVidhanNo(details.vidhansabha_no);
    // Auto-generate table name
    const autoName =
    `${selectedJilla}_${details.vidhansabha_no}`
        .replace(/\s+/g, "_")                      // Replace spaces with _
        .replace(/[^\u0900-\u097FFA-Za-z0-9_]/g, "") // Keep Hindi + English + digits
        .toLowerCase();
    setTableName(autoName);
  };
  const createTable = async () => {
    if (!selectedJilla || !selectedVidhan || !tableName) {
      return setMessage("⚠️ Please select Jilla and Vidhansabha.");
    }
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/createVidhanTables`, {
      jilla: selectedJilla,
      vidhansabha: selectedVidhan,
      vidhansabha_no: selectedVidhanNo,
      tableName,
    });
    setMessage(res.data.message);
  };
  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>Create Vidhansabha Table</h2>
      <label>Jilla:</label>
      <select value={selectedJilla} onChange={handleJillaChange} className="form-control">
        <option value="">Select Jilla</option>
        {jillaList.map((item, i) => (
          <option key={i} value={item.jilla}>{item.jilla}</option>
        ))}
      </select>
      <br />
      <label>Vidhansabha:</label>
      <select
        value={selectedVidhan ? JSON.stringify({}) : ""}
        onChange={(e) => handleVidhanSelect(e.target.value)}
        className="form-control"
      >
        <option value="">Select Vidhansabha</option>
        {vidhanList.map((item, i) => (
          <option key={i} value={JSON.stringify(item)}>
            {item.vidhansabha} (No: {item.vidhansabha_no})
          </option>
        ))}
      </select>
      <br />
      <label>Generated Table Name:</label>
      <input type="text" className="form-control" value={tableName} readOnly />
      <br />
      <button onClick={createTable} className="btn btn-primary">
        Create Table
      </button>
      {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
    </div>
  );
}