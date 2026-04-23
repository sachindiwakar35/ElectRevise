import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Select.css";
import { useNavigate } from "react-router-dom";
export const Select = () => {
  const [lokSabhaList, setLokSabhaList] = useState([]);
  const [vidhanSabhaList, setVidhanSabhaList] = useState([]);
  const [selectedLok, setSelectedLok] = useState("");
  const [selectedVidhan, setSelectedVidhan] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const number = sessionStorage.getItem("mobileNumber"); // ✅ Get number here
    if (!token) {
      navigate("/");
    } else {
      setMobileNumber(number);
      console.log("📱 Logged-in number:", number);
    }
  }, [navigate]);
  useEffect(() => {
    const fetchData = async () => {
      let data = null;
      if (navigator.onLine) {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/getDataFromMaster`, {
            params: { number: sessionStorage.getItem("mobileNumber") },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          setLokSabhaList(response.data.lokSabha || []);
          setVidhanSabhaList(response.data.vidhanSabha || []);
          // Cache raw values
          localStorage.setItem("completeData", JSON.stringify(response.data));
          console.log("🌐 Loaded data from server");
          return;
        } catch (serverError) {
          console.warn("❌ Server fetch failed, trying cache", serverError);
        }
      }
      // Fallback to cache
      const cachedData = localStorage.getItem("completeData");
      if (cachedData) {
        data = JSON.parse(cachedData);
        setLokSabhaList(data.lokSabha || []);
        setVidhanSabhaList(data.vidhanSabha || []);
        console.log("📦 Loaded data from cache");
      } else {
        alert("⚠️ No internet and no cached data available!");
      }
    };
    fetchData();
  }, []);
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("mobileNumber");
    navigate("/");
  };
  return (
    <div className="select-container">
      <div className="header">
        <h2>🗳️ Select Constituencies</h2>
        <div className="user-info">
          <p>📱 Logged in as: <strong>{mobileNumber}</strong></p> {/* ✅ Display user number */}
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      {/* Lok Sabha Selection */}
      <label>Lok Sabha:</label>
      <select
        value={selectedLok}
        onChange={(e) => setSelectedLok(e.target.value)}
      >
        <option value="">Select Lok Sabha</option>
        {lokSabhaList.map((lok, idx) => (
          <option key={idx} value={lok}>
            {lok}
          </option>
        ))}
      </select>
      {/* Vidhan Sabha Selection */}
      <label>Vidhan Sabha:</label>
      <select
        value={selectedVidhan}
        onChange={(e) => setSelectedVidhan(e.target.value)}
      >
        <option value="">Select Vidhan Sabha</option>
        {vidhanSabhaList.map((vid, idx) => (
          <option key={idx} value={vid}>
            {vid}
          </option>
        ))}
      </select>
      <button
        className="submit-btn"
        onClick={() => {
          if (!selectedLok || !selectedVidhan) {
            alert("⚠️ Please select both Lok Sabha and Vidhan Sabha");
            return;
          }
          navigate("/BoothSelection", {
            state: { selectedLok, selectedVidhan },
          });
        }}
      >
        Submit
      </button>
    </div>
  );
};