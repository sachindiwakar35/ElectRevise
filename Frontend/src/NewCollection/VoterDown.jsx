import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./VoterDown.css";
export const VoterDown = () => {
  const [lokSabhaList, setLokSabhaList] = useState([]);
  const [vidhanSabhaList, setVidhanSabhaList] = useState([]);
  const [pollingStationList, setPollingStationList] = useState([]);
  const [stationAddressList, setStationAddressList] = useState([]);
  const [selectedLokSabha, setSelectedLokSabha] = useState("");
  const [selectedVidhanSabha, setSelectedVidhanSabha] = useState("");
  const [selectedPollingStation, setSelectedPollingStation] = useState("");
  const [selectedStationAddress, setSelectedStationAddress] = useState("");
  const [showDownload, setShowDownload] = useState(false);
  // ✅ Fetch Lok Sabha list
  useEffect(() => {
    const lokfetchLokSabha = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/lokvidhan`);
        setLokSabhaList(res.data);
      } catch (err) {
        console.error("Error fetching Lok Sabha:", err);
      }
    };
    lokfetchLokSabha();
  }, []);
  // ✅ Lok Sabha → Vidhan Sabha
  const handleLokSabhaChange = async (e) => {
    const selected = e.target.value;
    setSelectedLokSabha(selected);
    setSelectedVidhanSabha("");
    setSelectedPollingStation("");
    setSelectedStationAddress("");
    setShowDownload(false);
    if (selected) {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/lokvidhansabha`, {
          params: { loksabha: selected },
        });
        setVidhanSabhaList(res.data);
      } catch (err) {
        console.error("Error fetching Vidhan Sabha:", err);
      }
    } else {
      setVidhanSabhaList([]);
    }
  };
  // ✅ Vidhan Sabha → Polling Station
  // ✅ Vidhan Sabha → Polling Station + Address
const handleVidhanSabhaChange = async (e) => {
  const selectedvidhansabha = e.target.value;
  setSelectedVidhanSabha(selectedvidhansabha);
  setSelectedPollingStation("");
  setSelectedStationAddress("");
  setShowDownload(false);
  if (selectedLokSabha && selectedvidhansabha) {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/lokstationaddress`, {
        params: { add1: selectedLokSabha, add2: selectedvidhansabha },
      });
      const data = res.data;
      setPollingStationList(data);
      // ✅ Extract unique station addresses for the dropdown
      const uniqueAddresses = [...new Set(data.map((item) => item.station_address))];
      setStationAddressList(uniqueAddresses);
    } catch (err) {
      console.error("Error fetching polling stations:", err);
      setPollingStationList([]);
      setStationAddressList([]);
    }
  } else {
    setPollingStationList([]);
    setStationAddressList([]);
  }
};
// ✅ Polling Station selection
const handlePollingStationChange = (e) => {
  const selected = e.target.value;
  setSelectedPollingStation(selected);
  // ✅ Find corresponding address for selected polling station
  const station = pollingStationList.find((s) => s.polling_station === selected);
  if (station) {
    setSelectedStationAddress(station.station_address);
    setShowDownload(true);
  } else {
    setSelectedStationAddress("");
    setShowDownload(false);
  }
};
  // ✅ Station Address selected → Show download button
  const handleStationAddressChange = (e) => {
    const selected = e.target.value;
    setSelectedStationAddress(selected);
    if (selectedLokSabha && selectedVidhanSabha && selectedPollingStation && selected) {
      setShowDownload(true);
    } else {
      setShowDownload(false);
    }
  };

  // ✅ Download Excel
  const handleDownloadExcel = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/voterdown`, {
        params: {
          add1: selectedLokSabha,
          add2: selectedVidhanSabha,
          polling_station: selectedPollingStation,
          station_address: selectedStationAddress,
        },
      });

      const data = res.data;
      console.log("✅ Total records received:", data.length);
      if (!data || data.length === 0) {
        alert("No records found for the selected options!");
        return;
      }

      // ✅ Auto-include all columns
      const formatted = data.map((item, index) => ({ Sno: index + 1, ...item }));

      const ws = XLSX.utils.json_to_sheet(formatted, { origin: "A1" });
      ws["!cols"] = Object.keys(formatted[0]).map(() => ({ wch: 20 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Voter Data");
      XLSX.writeFile(
        wb,
        `Voters_${selectedLokSabha}_${selectedVidhanSabha}_${selectedPollingStation}.xlsx`,
        { bookType: "xlsx", type: "binary", compression: false }
      );
    } catch (err) {
      console.error("❌ Download failed:", err);
      alert("Failed to fetch voter data. Please try again.");
    }
  };

  return (
    <div className="voterdown-container">
      <h2 className="voterdown-title">Voter Booth Data Download</h2>

      {/* Lok Sabha Dropdown */}
      <select className="voterdown-select" value={selectedLokSabha} onChange={handleLokSabhaChange}>
        <option value="">-- Select Lok Sabha --</option>
        {lokSabhaList.map((lok, index) => (
          <option key={index} value={lok}>{lok}</option>
        ))}
      </select>

      {/* Vidhan Sabha Dropdown */}
      <select
        className="voterdown-select"
        value={selectedVidhanSabha}
        onChange={handleVidhanSabhaChange}
        disabled={!selectedLokSabha}
      >
        <option value="">-- Select Vidhan Sabha --</option>
        {vidhanSabhaList.map((vidhan, index) => (
          <option key={index} value={vidhan}>{vidhan}</option>
        ))}
      </select>
      {/* Station Address Dropdown */}
      <select
  className="voterdown-select"
  value={selectedStationAddress}
  onChange={handleStationAddressChange}
  disabled={!selectedVidhanSabha}
>
  <option value="">-- Select Station Address --</option>
  {stationAddressList.map((address, index) => (
    <option key={index} value={address}>{address}</option>
  ))}
</select>

{/* Polling Station Dropdown */}
<select
  className="voterdown-select"
  value={selectedPollingStation}
  onChange={handlePollingStationChange}
  disabled={!selectedVidhanSabha || !selectedStationAddress}
>
  <option value="">-- Select Polling Station --</option>
  {pollingStationList
    .filter((station) => 
      !selectedStationAddress || station.station_address === selectedStationAddress
    )
    .map((station, index) => (
      <option key={index} value={station.polling_station}>
        {station.polling_station} — {station.station_address}
      </option>
    ))}
</select>

{/* ✅ Show Station Address Below (auto-selected) */}
{selectedStationAddress && (
  <p className="station-address-display">
    📍 <strong>Station Address:</strong> {selectedStationAddress}
  </p>
)}
      {/* Download Button */}
      {showDownload && (
        <button className="voterdown-download" onClick={handleDownloadExcel}>
          📥 Download Excel
        </button>
      )}
    </div>
  );
};
