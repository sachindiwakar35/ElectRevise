import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import "./View.css";

export const JillaView = () => {
  const [loading, setLoading] = useState(false);
  const [jillaList, setJillaList] = useState([]); 
  const [selectedJilla, setSelectedJilla] = useState("");
  const [vidhansabhaList, setVidhansabhaList] = useState([]);
  const [selectedVidhansabha, setSelectedVidhansabha] = useState("");
  const [tableData, setTableData] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});
  
  // Single worker form states
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    jilla: "",
    vidhansabha_no: "",
    vidhansabha: "",
    mandal_name: "",
    shakti_kshtra: "",
    personal_booth_no: "",
    personal_booth_name: "",
    booth_number: "",
    worker_name: "",
    position: "",
    mobile_no: "",
    allotted_table_name: "",
    allotted_newvoter_table_name: ""
  });
  const [masterData, setMasterData] = useState([]);
  const [filteredVidhansabhaList, setFilteredVidhansabhaList] = useState([]);
  const [filteredTableList, setFilteredTableList] = useState([]);
  const [filteredNewVoterTableList, setFilteredNewVoterTableList] = useState([]);
  
  const navigate = useNavigate(); // For logout functionality

  // Get logged in jilla from sessionStorage on component mount
  useEffect(() => {
    const loggedInJilla = sessionStorage.getItem('loggedInJilla');
    if (!loggedInJilla) {
      // If no jilla is in sessionStorage, redirect to login
      navigate('/JillaLogin');
      return;
    }
    setSelectedJilla(loggedInJilla);
  }, [navigate]);

  // Fetch jilla list and filter it
  useEffect(() => {
    const fetchJilla = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getJillaList`);
        const loggedInJilla = sessionStorage.getItem('loggedInJilla');
        
        if (loggedInJilla) {
          // Filter jillaList to only show the logged in jilla
          const filtered = res.data.filter(item => item.jilla === loggedInJilla);
          setJillaList(filtered);
        } else {
          setJillaList(res.data);
        }
      } catch (err) {
        console.error("Jilla Fetch Error:", err);
      }
      setLoading(false);
    };
    fetchJilla();
  }, []);

  useEffect(() => {
    const fetchVidhansabha = async () => {
      if (!selectedJilla) {
        setVidhansabhaList([]);
        setSelectedVidhansabha("");
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getVidhansabhaList?jilla=${selectedJilla}`);
        setVidhansabhaList(res.data);
      } catch (err) {
        console.error("Vidhansabha Fetch Error:", err);
      }
      setLoading(false);
    };
    fetchVidhansabha();
  }, [selectedJilla]);

  // Fetch master data for dropdowns
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getMasterData`);
        setMasterData(res.data);
      } catch (err) {
        console.error("Master Data Fetch Error:", err);
      }
      setLoading(false);
    };
    fetchMasterData();
  }, []);

  // Auto-set worker form jilla from sessionStorage
  useEffect(() => {
    const loggedInJilla = sessionStorage.getItem('loggedInJilla');
    if (loggedInJilla) {
      setWorkerForm(prev => ({
        ...prev,
        jilla: loggedInJilla
      }));
    }
  }, []);

  // Filter data when jilla changes for single worker
  useEffect(() => {
    if (workerForm.jilla) {
      const filtered = masterData.filter(item => item.jilla === workerForm.jilla);
      setFilteredVidhansabhaList([...new Set(filtered.map(item => ({ vidhansabha_no: item.vidhansabha_no, vidhansabha: item.vidhansabha })))]);
    } else {
      setFilteredVidhansabhaList([]);
    }
    setWorkerForm(prev => ({
      ...prev,
      vidhansabha_no: "",
      vidhansabha: "",
      allotted_table_name: "",
      allotted_newvoter_table_name: ""
    }));
  }, [workerForm.jilla, masterData]);

  // Filter tables when vidhansabha changes
  useEffect(() => {
    if (workerForm.jilla && workerForm.vidhansabha) {
      const filtered = masterData.filter(item => 
        item.jilla === workerForm.jilla && item.vidhansabha === workerForm.vidhansabha
      );
      setFilteredTableList([...new Set(filtered.map(item => item.voter_table_name).filter(Boolean))]);
      setFilteredNewVoterTableList([...new Set(filtered.map(item => item.new_voter_table_name).filter(Boolean))]);
    } else {
      setFilteredTableList([]);
      setFilteredNewVoterTableList([]);
    }
    setWorkerForm(prev => ({
      ...prev,
      allotted_table_name: "",
      allotted_newvoter_table_name: ""
    }));
  }, [workerForm.jilla, workerForm.vidhansabha, masterData]);

  // Toggle worker form
  const toggleWorkerForm = () => {
    setShowWorkerForm(!showWorkerForm);
    // Reset form when closing
    if (showWorkerForm) {
      setWorkerForm({
        jilla: sessionStorage.getItem('loggedInJilla') || "", // Keep logged in jilla
        vidhansabha_no: "",
        vidhansabha: "",
        mandal_name: "",
        shakti_kshtra: "",
        personal_booth_no: "",
        personal_booth_name: "",
        booth_number: "",
        worker_name: "",
        position: "",
        mobile_no: "",
        allotted_table_name: "",
        allotted_newvoter_table_name: ""
      });
    }
  };

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem('loggedInJilla');
    navigate('/JillaLogin');
  };

  // Handle single worker form submission
  const handleAddWorker = async () => {
    const loggedInJilla = sessionStorage.getItem('loggedInJilla');
    
    if (!workerForm.jilla || !workerForm.vidhansabha_no || !workerForm.vidhansabha || 
        !workerForm.booth_number || !workerForm.worker_name || !workerForm.mobile_no) {
      return alert("कृपया सभी आवश्यक फील्ड्स भरें! (जिला, विधानसभा नंबर, विधानसभा, बूथ नंबर, वर्कर नाम, मोबाइल नंबर)");
    }

    // Ensure worker is being added to logged in jilla only
    if (workerForm.jilla !== loggedInJilla) {
      return alert(`आप सिर्फ ${loggedInJilla} जिले के लिए वर्कर जोड़ सकते हैं!`);
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/addSingleWorker`, workerForm);
      alert("वर्कर सफलतापूर्वक जोड़ा गया!");
      // Reset form and close
      setWorkerForm({
        jilla: loggedInJilla,
        vidhansabha_no: "",
        vidhansabha: "",
        mandal_name: "",
        shakti_kshtra: "",
        personal_booth_no: "",
        personal_booth_name: "",
        booth_number: "",
        worker_name: "",
        position: "",
        mobile_no: "",
        allotted_table_name: "",
        allotted_newvoter_table_name: ""
      });
      setShowWorkerForm(false);
    } catch (err) {
      console.error("Add Worker Error:", err);
      alert("वर्कर जोड़ने में विफल!");
    }
    setLoading(false);
  };

  const handleShowData = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_API_URL}/getMemberData`;
      const params = new URLSearchParams();
      const loggedInJilla = sessionStorage.getItem('loggedInJilla');
      
      // Always filter by logged in jilla
      if (loggedInJilla) {
        params.append('jilla', loggedInJilla);
      }
      
      if (selectedVidhansabha) {
        params.append('vidhansabha', selectedVidhansabha);
      }
      
      url += `?${params.toString()}`;
      
      const res = await axios.get(url);
      setTableData(res.data);
      console.log("Saved Data:", res.data);
      alert("Data successfully loaded!");
    } catch (err) {
      console.error("Show Data Error:", err);
      alert("Data Fetch Failed!");
    }
    setLoading(false);
  };

  const startEdit = (row) => {
    setEditingRow(row.sno);
    setEditValues({
      worker_name: row.worker_name,
      position: row.position,
      shakti_kshtra: row.shakti_kshtra,
      mandal_name: row.mandal_name,
      mobile_no: row.mobile_no,
    });
  };

  const saveEdit = async (sno) => {
    try {
      setLoading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/updateMemberRow`, {
        sno,
        ...editValues,
      });
      alert("Row Updated Successfully!");
      setTableData((prev) =>
        prev.map((row) =>
          row.sno === sno ? { ...row, ...editValues } : row
        )
      );
      setEditingRow(null);
    } catch (err) {
      console.error("Update Error:", err);
      alert("Update Failed!");
    }
    setLoading(false);
  };

  const handleWorkerFormChange = (field, value) => {
    setWorkerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
      <div className={`view-con ${loading ? "blur" : ""}`}>
        {/* Header with Logout button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 className="register-title" style={{ marginBottom: "0" }}>
            जिला व्यू पैनल - {sessionStorage.getItem('loggedInJilla') || "Unknown District"}
          </h2>
          <button
            onClick={handleLogout}
            className="register-upload"
            style={{ 
              backgroundColor: "#dc3545", 
              color: "#fff",
              padding: "8px 16px",
              fontSize: "14px"
            }}
          >
            🔓 Logout
          </button>
        </div>

        {/* Add Single Worker Panel with Toggle */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <h2 className="register-title" style={{ marginBottom: "0" }}>👤 Add Single Worker</h2>
          <button
            onClick={toggleWorkerForm}
            className="register-upload"
            style={{ 
              backgroundColor: showWorkerForm ? "#dc3545" : "#17a2b8", 
              color: "#fff",
              padding: "8px 16px",
              fontSize: "14px"
            }}
          >
            {showWorkerForm ? "✕ Close Form" : "➕ Open Form"}
          </button>
        </div>

        {showWorkerForm && (
          <div className="worker-form" style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
            <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#e9f7fe", borderRadius: "5px" }}>
              <strong>Note:</strong> आप सिर्फ <span style={{ color: "green", fontWeight: "bold" }}>{sessionStorage.getItem('loggedInJilla')}</span> जिले के लिए वर्कर जोड़ सकते हैं।
            </div>
            
            <div className="worker-form-grid">
              {/* Required Fields */}
              <div className="form-group">
                <label className="required-field">जिला</label>
                <select 
                  value={workerForm.jilla}
                  onChange={(e) => handleWorkerFormChange("jilla", e.target.value)}
                  className="register-upload"
                  disabled // Disable jilla selection as it's fixed
                >
                  <option value={sessionStorage.getItem('loggedInJilla')}>
                    {sessionStorage.getItem('loggedInJilla')}
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="required-field">विधानसभा नंबर</label>
                <select 
                  value={workerForm.vidhansabha_no}
                  onChange={(e) => handleWorkerFormChange("vidhansabha_no", e.target.value)}
                  className="register-upload"
                >
                  <option value="">-- विधानसभा नंबर चुनें --</option>
                  {filteredVidhansabhaList.map((item, i) => (
                    <option key={i} value={item.vidhansabha_no}>
                      {item.vidhansabha_no}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="required-field">विधानसभा</label>
                <select 
                  value={workerForm.vidhansabha}
                  onChange={(e) => handleWorkerFormChange("vidhansabha", e.target.value)}
                  className="register-upload"
                >
                  <option value="">-- विधानसभा चुनें --</option>
                  {filteredVidhansabhaList.map((item, i) => (
                    <option key={i} value={item.vidhansabha}>
                      {item.vidhansabha}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="required-field">बूथ नंबर</label>
                <input
                  type="text"
                  value={workerForm.booth_number}
                  onChange={(e) => handleWorkerFormChange("booth_number", e.target.value)}
                  className="register-upload"
                  placeholder="बूथ नंबर दर्ज करें"
                />
              </div>

              <div className="form-group">
                <label className="required-field">वर्कर नाम</label>
                <input
                  type="text"
                  value={workerForm.worker_name}
                  onChange={(e) => handleWorkerFormChange("worker_name", e.target.value)}
                  className="register-upload"
                  placeholder="वर्कर का नाम दर्ज करें"
                />
              </div>

              <div className="form-group">
                <label className="required-field">मोबाइल नंबर</label>
                <input
                  type="text"
                  value={workerForm.mobile_no}
                  onChange={(e) => handleWorkerFormChange("mobile_no", e.target.value)}
                  className="register-upload"
                  placeholder="मोबाइल नंबर दर्ज करें"
                />
              </div>

              {/* Optional Fields */}
              <div className="form-group">
                <label>पद (Position)</label>
                <input
                  type="text"
                  value={workerForm.position}
                  onChange={(e) => handleWorkerFormChange("position", e.target.value)}
                  className="register-upload"
                  placeholder="पद दर्ज करें (वैकल्पिक)"
                />
              </div>

              <div className="form-group">
                <label>मंडल नाम (Mandal Name)</label>
                <input
                  type="text"
                  value={workerForm.mandal_name}
                  onChange={(e) => handleWorkerFormChange("mandal_name", e.target.value)}
                  className="register-upload"
                  placeholder="मंडल नाम दर्ज करें (वैकल्पिक)"
                />
              </div>

              <div className="form-group">
                <label>शक्ति क्षेत्र (Shakti Kshtra)</label>
                <input
                  type="text"
                  value={workerForm.shakti_kshtra}
                  onChange={(e) => handleWorkerFormChange("shakti_kshtra", e.target.value)}
                  className="register-upload"
                  placeholder="शक्ति क्षेत्र दर्ज करें (वैकल्पिक)"
                />
              </div>

              <div className="form-group">
                <label>पर्सनल बूथ नंबर</label>
                <input
                  type="text"
                  value={workerForm.personal_booth_no}
                  onChange={(e) => handleWorkerFormChange("personal_booth_no", e.target.value)}
                  className="register-upload"
                  placeholder="पर्सनल बूथ नंबर (वैकल्पिक)"
                />
              </div>

              <div className="form-group">
                <label>पर्सनल बूथ नाम</label>
                <input
                  type="text"
                  value={workerForm.personal_booth_name}
                  onChange={(e) => handleWorkerFormChange("personal_booth_name", e.target.value)}
                  className="register-upload"
                  placeholder="पर्सनल बूथ नाम (वैकल्पिक)"
                />
              </div>

              {/* Dropdowns from master table */}
              <div className="form-group">
                <label>Allotted Table Name</label>
                <select 
                  value={workerForm.allotted_table_name}
                  onChange={(e) => handleWorkerFormChange("allotted_table_name", e.target.value)}
                  className="register-upload"
                >
                  <option value="">-- टेबल चुनें --</option>
                  {filteredTableList.map((table, i) => (
                    <option key={i} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Allotted New Voter Table Name</label>
                <select 
                  value={workerForm.allotted_newvoter_table_name}
                  onChange={(e) => handleWorkerFormChange("allotted_newvoter_table_name", e.target.value)}
                  className="register-upload"
                >
                  <option value="">-- न्यू वोटर टेबल चुनें --</option>
                  {filteredNewVoterTableList.map((table, i) => (
                    <option key={i} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "15px" }}>
              <button
                onClick={handleAddWorker}
                className="register-upload btn-cyan"
              >
                ➕ Add Worker
              </button>
              <button
                onClick={toggleWorkerForm}
                className="register-upload"
                style={{ backgroundColor: "#6c757d", color: "#fff" }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        <hr />
        
        {/* View Saved Data Section */}
        <div>
          <h3 className="register-title">📄 View Saved Data</h3>
          <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
            <strong>जिला:</strong> {sessionStorage.getItem('loggedInJilla')} (लॉग इन किया हुआ जिला)
          </div>
          
          <div className="filter-section">
            <select 
              value={selectedVidhansabha}
              onChange={(e) => setSelectedVidhansabha(e.target.value)}
              className="register-upload"
              style={{ marginRight: "10px", marginBottom: "10px" }}
            >
              <option value="">-- विधानसभा चुनें (वैकल्पिक) --</option>
              {vidhansabhaList.map((item, i) => (
                <option key={i} value={item.vidhansabha}>
                  {item.vidhansabha}
                </option>
              ))}
            </select>
            <button
              onClick={handleShowData}
              className="register-upload"
              style={{ backgroundColor: "#007bff", color: "#fff" }}
            >
              📄 Show Data
            </button>
          </div>
        </div>
        
        {/* Table display */}
        {tableData.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: "20px" }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>SNO</th>
                  <th>Jilla</th>
                  <th>Vidhansabha No</th>
                  <th>Vidhansabha</th>
                  <th>Mandal Name</th>
                  <th>Shakti Kshtra</th>
                  <th>Personal Booth No</th>
                  <th>Personal Booth Name</th>
                  <th>Booth Number</th>
                  <th>Worker Name</th>
                  <th>Position</th>
                  <th>Mobile No</th>
                  <th>Allotted Table</th>
                  <th>Allotted NewVoter Table</th>
                  <th>Uploaded At</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.sno}>
                    <td>{row.sno}</td>
                    <td>{row.jilla}</td>
                    <td>{row.vidhansabha_no}</td>
                    <td>{row.vidhansabha}</td>
                    <td>
                      {editingRow === row.sno ? (
                        <input
                          value={editValues.mandal_name}
                          onChange={(e) =>
                            setEditValues({ ...editValues, mandal_name: e.target.value })
                          }
                        />
                      ) : (
                        row.mandal_name
                      )}
                    </td>
                    <td>
                      {editingRow === row.sno ? (
                        <input
                          value={editValues.shakti_kshtra}
                          onChange={(e) =>
                            setEditValues({ ...editValues, shakti_kshtra: e.target.value })
                          }
                        />
                      ) : (
                        row.shakti_kshtra
                      )}
                    </td>
                    <td>{row.personal_booth_no}</td>
                    <td>{row.personal_booth_name}</td>
                    <td>{row.booth_number}</td>
                    <td>
                      {editingRow === row.sno ? (
                        <input
                          value={editValues.worker_name}
                          onChange={(e) =>
                            setEditValues({ ...editValues, worker_name: e.target.value })
                          }
                        />
                      ) : (
                        row.worker_name
                      )}
                    </td>
                    <td>
                      {editingRow === row.sno ? (
                        <input
                          value={editValues.position}
                          onChange={(e) =>
                            setEditValues({ ...editValues, position: e.target.value })
                          }
                        />
                      ) : (
                        row.position
                      )}
                    </td>
                    <td>
                      {editingRow === row.sno ? (
                        <input
                          value={editValues.mobile_no}
                          onChange={(e) =>
                            setEditValues({ ...editValues, mobile_no: e.target.value })
                          }
                        />
                      ) : (
                        row.mobile_no
                      )}
                    </td>
                    <td>{row.allotted_table_name}</td>
                    <td>{row.allotted_newvoter_table_name}</td>
                    <td>{row.uploaded_at}</td>
                    <td>
                      {editingRow === row.sno ? (
                        <button onClick={() => saveEdit(row.sno)}>Save</button>
                      ) : (
                        <button onClick={() => startEdit(row)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};