import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BoothSelection.css";

export const BoothSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedLok, selectedVidhan } = location.state || {};

  const [stations, setStations] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState("");
  const [selectedStationData, setSelectedStationData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Range inputs state
  const [startingRange, setStartingRange] = useState("");
  const [endingRange, setEndingRange] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [assignedBoothNumber, setAssignedBoothNumber] = useState("");

  // 🔴 LOGOUT FUNCTION
  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        let data;

        if (navigator.onLine) {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/getMasterNew`,
            {
              params: { mobile_no: sessionStorage.getItem("mobileNumber") },
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );

          console.log("📥 Full API Response:", response.data);

          const station = response.data.data?.[0];

          if (station) {
            sessionStorage.setItem(
              "vidhansabha_name",
              station.vidhansabha || ""
            );
            sessionStorage.setItem(
              "vidhansabha_no",
              station.vidhansabha_no || ""
            );
            sessionStorage.setItem("station", "प्रा0 वि0 नगला उम्मेद");
            sessionStorage.setItem("booth_number", station.booth_number || "");
          }

          data = response.data.data || [];

          localStorage.setItem(
            `stations_${selectedLok}_${selectedVidhan}`,
            JSON.stringify(data)
          );
        } else {
          const cached = localStorage.getItem(
            `stations_${selectedLok}_${selectedVidhan}`
          );

          if (cached) data = JSON.parse(cached);
          else {
            alert("⚠ No internet and no cached data found.");
            return;
          }
        }

        setStations(data);
        console.log("📌 Stations Loaded:", data);

        if (data.length > 0) {
          const boothNumber = data[0].booth_number;
          setSelectedBooth(boothNumber);
          setSelectedStationData(data[0]);
          setAssignedBoothNumber(boothNumber); // Store assigned booth number
          
          // Set starting range to assigned booth number
          setStartingRange(boothNumber);
          // Set ending range to booth number (equal) - आपकी requirement के अनुसार
          setEndingRange(boothNumber);
        }
      } catch (err) {
        console.error("❌ Frontend Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [selectedLok, selectedVidhan]);

  useEffect(() => {
    if (selectedBooth && stations.length > 0) {
      const station = stations.find(
        (station) => station.booth_number === selectedBooth
      );
      setSelectedStationData(station || null);
      
      // Update ranges when booth changes
      if (station) {
        setAssignedBoothNumber(station.booth_number);
        setStartingRange(station.booth_number);
        setEndingRange(station.booth_number); // Equal by default
        setRangeError(""); // Clear any previous error
      }
    }
  }, [selectedBooth, stations]);

  // Handle starting range change
  const handleStartingRangeChange = (e) => {
    const value = e.target.value;
    
    if (value === "") {
      setStartingRange("");
      setRangeError("");
      return;
    }
    
    // Allow only numbers and check if it's a valid number
    if (/^\d+$/.test(value)) {
      const startNum = parseInt(value);
      const assignedNum = parseInt(assignedBoothNumber);
      
      // Rule 1: Starting range cannot be less than assigned booth number
      if (startNum < assignedNum) {
        setRangeError(`Starting range cannot be less than assigned booth number (${assignedBoothNumber})`);
        setStartingRange(assignedBoothNumber); // Reset to assigned booth number
        setEndingRange(assignedBoothNumber); // Reset ending range too
      } else {
        setStartingRange(value);
        
        // Rule 2: Auto-update ending range to keep it valid
        if (!isNaN(startNum)) {
          const currentEndNum = parseInt(endingRange);
          // If ending range is less than starting, adjust it
          if (isNaN(currentEndNum) || currentEndNum < startNum) {
            setEndingRange(value); // Make it equal to starting
          }
          // If ending range is more than starting + 3, adjust it
          else if (currentEndNum > (startNum + 3)) {
            setEndingRange(String(startNum + 3)); // Set to max allowed
          }
        }
        setRangeError("");
      }
    }
  };

  // Handle ending range change (manual override)
  const handleEndingRangeChange = (e) => {
    const value = e.target.value;
    
    if (value === "") {
      setEndingRange("");
      setRangeError("");
      return;
    }
    
    // Allow only numbers
    if (/^\d+$/.test(value)) {
      const startNum = parseInt(startingRange);
      const endNum = parseInt(value);
      
      if (isNaN(startNum)) {
        setRangeError("Please enter starting range first");
        return;
      }
      
      // Rule 1: Ending range cannot be less than starting range
      if (endNum < startNum) {
        setRangeError(`Ending range cannot be less than starting range (${startingRange})`);
        setEndingRange(String(startNum)); // Set to starting range
        return;
      }
      
      // Rule 2: Ending range cannot be more than starting range + 3
      const maxEndNum = startNum + 3;
      if (endNum > maxEndNum) {
        setRangeError(`Ending range cannot be more than ${maxEndNum} (starting range ${startingRange} + 3)`);
        setEndingRange(String(maxEndNum));
        return;
      }
      
      // Rule 3: Ending range must be >= assigned booth number
      const assignedNum = parseInt(assignedBoothNumber);
      if (endNum < assignedNum) {
        setRangeError(`Ending range cannot be less than assigned booth number (${assignedBoothNumber})`);
        setEndingRange(String(assignedNum));
        return;
      }
      
      setEndingRange(value);
      setRangeError("");
    }
  };

  // Validate ranges before navigation
  const validateRanges = () => {
    if (!startingRange || !endingRange) {
      return "Please enter both starting and ending ranges";
    }
    
    const start = parseInt(startingRange);
    const end = parseInt(endingRange);
    const assigned = parseInt(assignedBoothNumber);
    
    if (isNaN(start) || isNaN(end)) {
      return "Please enter valid numbers";
    }
    
    // Check all rules
    if (start < assigned) {
      return `Starting range cannot be less than assigned booth number (${assignedBoothNumber})`;
    }
    
    if (end < assigned) {
      return `Ending range cannot be less than assigned booth number (${assignedBoothNumber})`;
    }
    
    if (end < start) {
      return "Ending range cannot be less than starting range";
    }
    
    if (end > (start + 3)) {
      return `Ending range cannot be more than ${start + 3} (starting range + 3)`;
    }
    
    return ""; // No error
  };

  const handleBoothChange = (event) => {
    setSelectedBooth(event.target.value);
  };

  const handleSubmit = () => {
    if (!selectedStationData || !selectedBooth) {
      alert("Please select a booth number");
      return;
    }

    const validationError = validateRanges();
    if (validationError) {
      alert(validationError);
      return;
    }

    navigate("/CompleteList", {
      state: {
        vidhansabha_no: selectedStationData.vidhansabha_no,
        booth_number: selectedStationData.booth_number,
        allotted_table_name: selectedStationData.allotted_table_name,
        allotted_newvoter_table_name:
          selectedStationData.allotted_newvoter_table_name,
        startingRange: startingRange,
        endingRange: endingRange,
      },
    });
  };

  const handleSir = () => {
    const validationError = validateRanges();
    if (validationError) {
      alert(validationError);
      return;
    }

    navigate("/Sir2025", {
      state: {
        vidhansabha_no: selectedStationData.vidhansabha_no,
        booth_number: selectedStationData.booth_number,
        allotted_table_name: selectedStationData.allotted_table_name,
        allotted_newvoter_table_name:
          selectedStationData.allotted_newvoter_table_name,
        startingRange: startingRange,
        endingRange: endingRange,
      },
    });
  };

  const handleStationSir = () => {
    if (!selectedStationData || !selectedBooth) {
      alert("Please select a booth number");
      return;
    }
    
    const validationError = validateRanges();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    navigate("/StationSIR", {
      state: {
        vidhansabha_no: selectedStationData.vidhansabha_no,
        booth_number: selectedStationData.booth_number,
        allotted_table_name: selectedStationData.allotted_table_name,
        allotted_newvoter_table_name:
          selectedStationData.allotted_newvoter_table_name,
        startingRange: startingRange,
        endingRange: endingRange,
      },
    });
  };

  const handleViewFamilyList = () => {
    if (!selectedStationData || !selectedBooth) {
      alert("Please select a booth number");
      return;
    }

    const validationError = validateRanges();
    if (validationError) {
      alert(validationError);
      return;
    }

    navigate("/Dashbooth", {
      state: {
        vidhansabha_no: selectedStationData.vidhansabha_no,
        booth_number: selectedStationData.booth_number,
        vidhansabha_name: selectedStationData.vidhansabha,
        polling_station: selectedStationData.polling_station,
        allotted_table_name: selectedStationData.allotted_table_name,
        allotted_newvoter_table_name:
          selectedStationData.allotted_newvoter_table_name,
        startingRange: startingRange,
        endingRange: endingRange,
      },
    });
  };

  const uniqueBooths = [
    ...new Set(stations.map((station) => station.booth_number)),
  ];

  return (
    <div className="booth-selection-container">
      {/* 🔴 LOGOUT BUTTON */}
      <button className="logout-btn" onClick={handleLogout}>
        🔒 Logout
      </button>

      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      <h2>📋 Assigned Booth Details</h2>

      {loading && <div className="loader">Loading booths...</div>}

      {!loading && stations.length > 0 && (
        <>
          <div className="booth-selector">
            <label htmlFor="booth-select">
              {stations.length > 1
                ? "Select Booth Number:"
                : "Your Booth Number:"}
            </label>
            <select
              id="booth-select"
              value={selectedBooth}
              onChange={handleBoothChange}
              className="booth-dropdown"
              required
            >
              <option value="">-- Select Booth Number --</option>
              {uniqueBooths.map((boothNumber) => (
                <option key={boothNumber} value={boothNumber}>
                  Booth {boothNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="range-selector-container">
            <div className="range-input-group">
              <div className="range-input-field">
                <label htmlFor="starting-range">
                  Starting Range (Min: Booth {assignedBoothNumber}):
                </label>
                <input
                  type="number"
                  id="starting-range"
                  value={startingRange}
                  onChange={handleStartingRangeChange}
                  className="range-input"
                  placeholder={`Minimum ${assignedBoothNumber}`}
                  min={assignedBoothNumber}
                />
                
              </div>

              <div className="range-input-field">
                <label htmlFor="ending-range">
                  Ending Range (Range: {startingRange || assignedBoothNumber} to {parseInt(startingRange || assignedBoothNumber) + 3}):
                </label>
                <input
                  type="number"
                  id="ending-range"
                  value={endingRange}
                  onChange={handleEndingRangeChange}
                  className="range-input"
                  placeholder={`Enter ${startingRange || assignedBoothNumber} to ${parseInt(startingRange || assignedBoothNumber) + 3}`}
                  min={parseInt(startingRange || assignedBoothNumber)}
                  max={parseInt(startingRange || assignedBoothNumber) + 3}
                />
                <br /><br />
               
              </div>
            </div>

            {rangeError && (
              <div className="range-error-message">
                ⚠ {rangeError}
              </div>
            )}

            <div className="range-summary">
              <p>
                <strong>Assigned Booth:</strong> {assignedBoothNumber}
              </p>
              <p>
                <strong>Search Range:</strong> Booth {startingRange || "?"} to Booth {endingRange || "?"}
              </p>
              {/* <p>
                <strong>Allowed Range for Ending:</strong> {startingRange || assignedBoothNumber} to {parseInt(startingRange || assignedBoothNumber) + 3}
              </p> */}
            </div>
          </div>
        </>
      )}

      {!loading && selectedStationData && (
        <div className="data-list">
          <div className="data-card">
            <p>
              <strong>Jilla:</strong> {selectedStationData.jilla}
            </p>
            <p>
              <strong>Vidhansabha:</strong> {selectedStationData.vidhansabha}
            </p>
            <p>
              <strong>Vidhansabha No:</strong>{" "}
              {selectedStationData.vidhansabha_no}
            </p>
            <p>
              <strong>Worker Name:</strong> {selectedStationData.worker_name}
            </p>
            <p>
              <strong>Allotted Table:</strong>{" "}
              {selectedStationData.allotted_table_name}
            </p>
            <p>
              <strong>New Voter Table:</strong>{" "}
              {selectedStationData.allotted_newvoter_table_name}
            </p>
            <p>
              <strong>Position:</strong> {selectedStationData.position}
            </p>
            <p>
              <strong>Mobile:</strong> {selectedStationData.mobile_no}
            </p>
          </div>
        </div>
      )}

      {!loading && stations.length > 0 && !selectedStationData && (
        <div className="no-booth-selected">
          <p>Please select a booth number above to view details</p>
        </div>
      )}

      {!loading && stations.length === 0 && <p>No booth data found.</p>}

      {loadingTable && <div className="loader">Loading booth details...</div>}

      <div className="button-group">
        <button
          onClick={handleStationSir}
          className="btn-sir"
          disabled={!selectedStationData || !selectedBooth}
        >
          2025 DATA
        </button>

        <button
          onClick={handleSubmit}
          className="btn-submit"
          disabled={!selectedStationData || !selectedBooth}
        >
          SIR 2026
        </button>

        <button
          onClick={handleViewFamilyList}
          className="btn-secondary"
          disabled={!selectedStationData || !selectedBooth}
        >
          View Family List
        </button>
      </div>
    </div>
  );
};