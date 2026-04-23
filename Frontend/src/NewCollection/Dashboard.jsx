import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

export const Dashboard=()=> {
  const [familyId, setFamilyId] = useState("");
  const [mukhiya, setMukhiya] = useState("");
  const [tableData, setTableData] = useState([]);
  const [lastSearch, setLastSearch] = useState({ familyId: "", mukhiya: "" });


  // ✅ Columns you want to display
  const columns = [
    "number",
    "id",
    "name",
    "father",
    "house",
    "age",
    "gender",
    "polling_station",
    "kinType",
    "mukhiya",
    "category",
    "jati",
    "upjati",
    "mobileno",
    "family_id"
  ];

  // ✅ Fetch all data on page load
  const fetchAllData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/all`,{
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setTableData(response.data);
    } catch (error) {
      console.error(error);
      alert("❌ Server error! Cannot fetch all data.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ✅ Handle search
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!familyId && !mukhiya) {
      alert("कृपया Family ID या Mukhiya Name में से एक दर्ज करें।");
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/search`, {
        familyId,
        mukhiya,
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setTableData(response.data.data);
        setLastSearch({ familyId, mukhiya }); // ✅ Store current search
        } else {
        setTableData([]);
        setLastSearch({ familyId, mukhiya });
        alert(response.data.message);
        }
    } catch (error) {
      console.error(error);
      alert("❌ Server error! Please try again later.");
    }
  };

  // ✅ Reset search
  const handleReset = () => {
    setFamilyId("");
    setMukhiya("");
    setLastSearch("");
    fetchAllData();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title">🏠 परिवार खोज पोर्टल</h2>
        <p className="dashboard-subtitle">
          कृपया Family ID या Mukhiya का नाम दर्ज करें
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="form-group">
            <label htmlFor="familyId">Family ID</label>
            <input
              type="text"
              id="familyId"
              placeholder="Family ID दर्ज करें"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mukhiya">Mukhiya Name</label>
            <input
              type="text"
              id="mukhiya"
              placeholder="मुखिया का नाम दर्ज करें"
              value={mukhiya}
              onChange={(e) => setMukhiya(e.target.value)}
            />
          </div>

          <div className="button-group">
            <button type="submit" className="search-btn">
              🔍 Search
            </button>
            <button type="button" className="reset-btn" onClick={handleReset}>
              ♻️ Reset
            </button>
          </div>
        </form>
      </div>

      {/* ✅ Table */}
      <div className="results-table-container">
        {/* ✅ Show number of results */}
        {tableData.length > 0 && (
            <div>
                <p className="results-count">कुल परिणाम: {tableData.length}</p>
                {(lastSearch.familyId || lastSearch.mukhiya) && (
                <p className="results-count">
                    {lastSearch.familyId && `Family ID: ${lastSearch.familyId} `}
                    {lastSearch.mukhiya && `Mukhiya: ${lastSearch.mukhiya}`}
                </p>
                )}
            </div>
        )}
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace("_", " ").toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0 ? (
              tableData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center" }}>
                  कोई डेटा नहीं मिला
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
