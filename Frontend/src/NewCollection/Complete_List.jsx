import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CompleteList.css";

export default function Complete_List() {
  const navigate = useNavigate();
  const [vidhansabhaName, setVidhansabhaName] = useState("");
  const [pollingStation, setPollingStation] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Fetch sessionStorage + call API
  useEffect(() => {
    const vName = sessionStorage.getItem("vidhansabha_name");
    const pStation = sessionStorage.getItem("polling_station");
    const tableName = sessionStorage.getItem("allotted_table_name");
    if (!vName || !pStation || !tableName) {
        alert("❌ Missing session data");
        return navigate(-1);
    }
    setVidhansabhaName(vName);
    setPollingStation(pStation);
    fetchData(vName, pStation, tableName);
    }, []);
  // Fetch from DB
  const fetchData = async (vidhansabha, pollingStation, tableName) => {
    try {
        console.log("Sending request with:", { vidhansabha, pollingStation, tableName });
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/getComplete_List`, {
        add1: vidhansabha,
        pollingStation,
        tableName,   // 👉 send table name
        });
        setTableData(res.data.rows || []);
        setLoading(false);
    } catch (error) {
        console.error("Fetch error:", error);
        console.error("Error details:", error.response?.data);
        alert("⚠️ Failed to load table data");
        setLoading(false);
    }
    };
  return (
    <div className="complete-list-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>
      <h2 className="heading">📄 Complete Voter List</h2>
      <div className="info-box">
        <p><strong>Vidhansabha:</strong> {vidhansabhaName}</p>
        <p><strong>Polling Station:</strong> {pollingStation}</p>
      </div>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
                <tr>
                    <th>#</th>
                    {tableData.length > 0 &&
                    Object.keys(tableData[0]).map((col, i) => (
                        <th key={i}>{col.toUpperCase()}</th>
                    ))}
                </tr>
            </thead>
                <tbody>
                    {tableData.length > 0 ? (
                        tableData.map((row, i) => (
                        <tr key={i}>
                            <td>
                            <input type="checkbox" className="row-checkbox" />
                            </td>
                            {Object.values(row).map((val, j) => (
                            <td key={j}>{val}</td>
                            ))}
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan="50" style={{ textAlign: "center" }}>
                            No data found
                        </td>
                        </tr>
                    )}
                </tbody>
          </table>
        </div>
      )}
    </div>
  );
}