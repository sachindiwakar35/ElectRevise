import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewComponent.css";

export const NewComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedLok, selectedVidhan, selectedStation, selectedAddress } =
    location.state || {};

  const [voters, setVoters] = useState([]);
  const [selectedVoter, setSelectedVoter] = useState(null);

  // Form states
  const [category, setCategory] = useState("");
  const [jati, setJati] = useState("");
  const [upjati, setUpJati] = useState("");
  const [mobile, setMobile] = useState("");
  const [mukhiya, setMukhiya] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fetchVoters = async () => {
      try {
        const response = await axios.get("http://localhost:5000/getVoterData", {
          params: {
            lok: selectedLok,
            vidhan: selectedVidhan,
            station: selectedStation,
            address: selectedAddress,
          },
        });
        setVoters(response.data);
      } catch (err) {
        console.error("❌ Failed to fetch voter data", err);
      }
    };
    fetchVoters();
  }, [selectedLok, selectedVidhan, selectedStation, selectedAddress]);

  const handleRowClick = (voter) => {
    setSelectedVoter(voter);
    setCategory(voter.category || "");
    setJati(voter.jati || "");
    setUpJati(voter.upjati || "");
    setMobile(voter.mobileno || "");
    setMukhiya(voter.name || "");
    setAddress(voter.address || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Form submitted!");
    // Here you can integrate axios POST request like in CompleteList
  };

  return (
    <div className="voter-container">
      <button className="back-btn" onClick={() => navigate(-1)}>⬅ Back</button>

      <div className="voter-table-form-container">
        {/* Table */}
        <div className={`voter-table-wrapper ${selectedVoter ? "shrink" : ""}`}>
          <div className="selection-info">
            <p><strong>Lok Sabha:</strong> {selectedLok || "N/A"}</p>
            <p><strong>Vidhan Sabha:</strong> {selectedVidhan || "N/A"}</p>
            <p><strong>Polling Booth:</strong> {selectedStation || "N/A"}</p>
            <p><strong>Station Address:</strong> {selectedAddress || "N/A"}</p>
          </div>

          <h2>Voter List</h2>

          {voters.length === 0 ? (
            <p>No voters found</p>
          ) : (
            <div className="table-wrapper">
              <table className="voter-table">
                <thead>
                  <tr>
                    <th>Sl. No.</th>
                    <th>Voter ID</th>
                    <th>Name</th>
                    <th>Father</th>
                    <th>House</th>
                    <th>Age</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter, index) => (
                    <tr key={voter.id} onClick={() => handleRowClick(voter)}>
                      <td>{index + 1}</td>
                      <td>{voter.id}</td>
                      <td>{voter.name}</td>
                      <td>{voter.father}</td>
                      <td>{voter.house}</td>
                      <td>{voter.age}</td>
                      <td>{voter.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form */}
        {selectedVoter && (
          <div className="voter-form">
            <h3>Voter Details</h3>
            <form onSubmit={handleSubmit}>
              <label>Voter ID:</label>
              <input type="text" value={selectedVoter.id} readOnly />

              <label>Mukhiya (मुखिया):</label>
              <input type="text" value={mukhiya} onChange={(e) => setMukhiya(e.target.value)} />

              <label>Category (वर्ग):</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>

              <label>Jati (जाति):</label>
              <input type="text" value={jati} onChange={(e) => setJati(e.target.value)} />

              <label>UpJati (उपजाति):</label>
              <input type="text" value={upjati} onChange={(e) => setUpJati(e.target.value)} />

              <label>Mobile No:</label>
              <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} />

              <label>Address (पता):</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} />

              <div className="form-buttons">
                <button type="submit">💾 Save</button>
                <button type="button" onClick={() => setSelectedVoter(null)}>✖ Close</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
