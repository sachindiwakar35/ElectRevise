import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Register.css";
import { useNavigate } from "react-router-dom";

export const Register = () => {
  const refName = useRef();
  const refNumber = useRef();
  const refPosition = useRef();
  const navigate = useNavigate();
  const [lokSabhaList, setLokSabhaList] = useState([]);
  const [vidhanSabhaList, setVidhanSabhaList] = useState([]);
  const [stationAddressList, setStationAddressList] = useState([]);
  const [pollingStationList, setPollingStationList] = useState([]);
  const [selectedLokSabha, setSelectedLokSabha] = useState("");
  const [selectedVidhanSabha, setSelectedVidhanSabha] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPollingStation, setSelectedPollingStation] = useState("");
  // ✅ Fetch Lok Sabha List
  useEffect(() => {
    const fetchLokSabha = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/loksabha`);
        console.log("✅ Lok Sabha List:", res.data);
        setLokSabhaList(res.data);
      } catch (err) {
        console.error("Error fetching Lok Sabha:", err);
      }
    };
    fetchLokSabha();
  }, []);
  // ✅ Fetch Vidhan Sabha based on selected Lok Sabha
  useEffect(() => {
    const fetchVidhanSabha = async () => {
      if (!selectedLokSabha) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/vidhansabha`, {
          params: { loksabha: selectedLokSabha },
        });
        console.log("✅ Vidhan Sabha List:", res.data);
        setVidhanSabhaList(res.data);
        setSelectedVidhanSabha("");
        setStationAddressList([]);
        setPollingStationList([]);
      } catch (err) {
        console.error("Error fetching Vidhan Sabha:", err);
      }
    };
    fetchVidhanSabha();
  }, [selectedLokSabha]);
  // ✅ Fetch addresses & polling stations from completecollection
  useEffect(() => {
    const fetchAllData = async () => {
      if (!selectedLokSabha || !selectedVidhanSabha) return;
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getAllData`, {
          params: { add1: selectedLokSabha, add2: selectedVidhanSabha },
        });
        console.log("✅ All Data:", res.data);
        const uniqueAddresses = [
          ...new Set(res.data.map((item) => item.station_address).filter(Boolean)),
        ];
        const uniqueStations = [
          ...new Set(res.data.map((item) => item.polling_station).filter(Boolean)),
        ];
        setStationAddressList(uniqueAddresses);
        setPollingStationList(uniqueStations);
      } catch (err) {
        console.error("Error fetching all data:", err);
      }
    };
    fetchAllData();
  }, [selectedLokSabha, selectedVidhanSabha]);
  // ✅ Submit form to master table
  const handleSubmit = async () => {
    const name = refName.current.value.trim();
    const number = refNumber.current.value.trim();
    const position = refPosition.current.value.trim();
    if (
      !name ||
      !number ||
      !selectedLokSabha ||
      !selectedVidhanSabha ||
      !selectedAddress ||
      !selectedPollingStation
    ) {
      alert("⚠️ Please fill all fields before submitting!");
      return;
    }
    const payload = {
      name,
      number,
      loksabha: selectedLokSabha,
      vidhansabha: selectedVidhanSabha,
      polling_station: selectedPollingStation,
      station_address: selectedAddress,
      position,
    };
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/addMaster`, payload);
      alert("✅ Data saved successfully!");
      // Reset fields
      refName.current.value = "";
      refNumber.current.value = "";
      refPosition.current.value = "";
      setSelectedLokSabha("");
      setSelectedVidhanSabha("");
      setSelectedAddress("");
      setSelectedPollingStation("");
    } catch (err) {
      console.error("❌ Error saving data:", err);
      alert("Something went wrong! Please try again.");
    }
  };
  const handleBack = () => {
    navigate("/View");
  };
  return (
    <div className="register-container">
      <button className="register-back" onClick={handleBack}>
        🔙 Back
      </button>

      <h2 className="register-title">Single Booth Assignment Form</h2>

      <div className="register-box">
        <input
          type="text"
          className="register-input"
          placeholder="Enter Full Name"
          ref={refName}
        />
        <input
          type="number"
          className="register-input"
          placeholder="Enter Phone Number"
          ref={refNumber}
        />
        <input
          type="text"
          className="register-input"
          placeholder="Enter Position (optional)"
          ref={refPosition}
        />

        {/* Dropdowns */}
        <select
          className="register-select"
          value={selectedLokSabha}
          onChange={(e) => setSelectedLokSabha(e.target.value)}
        >
          <option value="">-- Select Lok Sabha --</option>
          {lokSabhaList.map((lok, i) => (
            <option key={i} value={lok.loksabha || lok}>
              {lok.loksabha || lok}
            </option>
          ))}
        </select>

        <select
          className="register-select"
          value={selectedVidhanSabha}
          onChange={(e) => setSelectedVidhanSabha(e.target.value)}
          disabled={!selectedLokSabha}
        >
          <option value="">-- Select Vidhan Sabha --</option>
          {vidhanSabhaList.map((vidhan, i) => (
            <option key={i} value={vidhan}>
              {vidhan}
            </option>
          ))}
        </select>

        <select
          className="register-select"
          value={selectedAddress}
          onChange={(e) => setSelectedAddress(e.target.value)}
          disabled={!selectedVidhanSabha}
        >
          <option value="">-- Select Station Address --</option>
          {stationAddressList.map((address, i) => (
            <option key={i} value={address}>
              {address}
            </option>
          ))}
        </select>

        <select
          className="register-select"
          value={selectedPollingStation}
          onChange={(e) => setSelectedPollingStation(e.target.value)}
          disabled={!selectedAddress}
        >
          <option value="">-- Select Polling Station --</option>
          {pollingStationList.map((station, i) => (
            <option key={i} value={station}>
              {station}
            </option>
          ))}
        </select>

        <button className="register-button" onClick={handleSubmit}>
          💾 Register
        </button>
      </div>
    </div>
  );
};
