import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VoterMerge.css";
export default function VoterMerge() {
  const [selectedOption, setSelectedOption] = useState("");
  const [jillaList, setJillaList] = useState([]);
  // Separate state variables for each section
  const [vidhanSabhaListForMerge, setVidhanSabhaListForMerge] = useState([]);
  const [pollingStationListForMerge, setPollingStationListForMerge] = useState([]);
  const [vidhanSabhaListForUF, setVidhanSabhaListForUF] = useState([]);
  const [pollingStationListForUF, setPollingStationListForUF] = useState([]);
  const [vidhanSabhaListForDelete, setVidhanSabhaListForDelete] = useState([]);
  const [pollingStationListForDelete, setPollingStationListForDelete] = useState([]);
  const [boothNumber, setBoothNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteValues, setDeleteValues] = useState({
    type: "", // "delete_vidhansabha" or "delete_polling"
    jilla: "",
    vidhan: "",
    polling: "",
  });
  const [dropdownValues, setDropdownValues] = useState({
    jilla1: "", jilla2: "",
    vidhan1: "", vidhan2: "",
    polling1: "", polling2: "",
  });
  const [updateFinalValues, setUpdateFinalValues] = useState({
    type: "",
    jillaUF: "", 
    vidhanUF: "", 
    pollingUF: ""
  });
  // Fetch Jilla list on component mount
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${process.env.REACT_APP_API_URL}/getJillaList`)
      .then((res) => {
        const jillaValues = res.data.map(item => item.jilla);
        setJillaList(jillaValues);
      })
      .catch((err) => console.error("Error fetching Jilla:", err));
    setLoading(false);
  }, []);
  // Fetch Vidhan Sabha for MERGE section
  useEffect(() => {
    setLoading(true);
    if (dropdownValues.jilla1) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getVidhansabhaList`, {
          params: { jilla: dropdownValues.jilla1 },
        })
        .then((res) => {
          const vidhanValues = res.data.map(item => item.vidhansabha);
          setVidhanSabhaListForMerge(vidhanValues);
        })
        .catch((err) => console.error("Error fetching Vidhan Sabha for Merge:", err));
    } else {
      setVidhanSabhaListForMerge([]);
      setPollingStationListForMerge([]);
    }
    setLoading(false);
  }, [dropdownValues.jilla1]);
  // Fetch Polling Station for MERGE section
  useEffect(() => {
    setLoading(true);
    if (dropdownValues.jilla1 && dropdownValues.vidhan1) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getPollingStations`, {
          params: {
            jilla: dropdownValues.jilla1,
            vidhansabha: dropdownValues.vidhan1,
          },
        })
        .then((res) => {
          setPollingStationListForMerge(res.data);
        })
        .catch((err) => {
          console.error("Error fetching Polling Station for Merge:", err);
          setPollingStationListForMerge([]);
        });
    } else {
      setPollingStationListForMerge([]);
    }
    setLoading(false);
  }, [dropdownValues.jilla1, dropdownValues.vidhan1]);
  // Fetch Vidhan Sabha for UPDATE FINAL section
  useEffect(() => {
    setLoading(true);
    if (updateFinalValues.jillaUF) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getVidhansabhaList`, {
          params: { jilla: updateFinalValues.jillaUF }
        })
        .then((res) => {
          const vidhanValues = res.data.map(item => item.vidhansabha);
          setVidhanSabhaListForUF(vidhanValues);
        })
        .catch((err) => console.error("UF Vidhan Sabha Error:", err));
    } else {
      setVidhanSabhaListForUF([]);
      setUpdateFinalValues(prev => ({ ...prev, vidhanUF: "", pollingUF: "" }));
    }
    setLoading(false);
  }, [updateFinalValues.jillaUF]);
  // Fetch Polling Station for UPDATE FINAL section
  useEffect(() => {
    setLoading(true);
    if (updateFinalValues.jillaUF && updateFinalValues.vidhanUF) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getPollingStations`, {
          params: {
            jilla: updateFinalValues.jillaUF,
            vidhansabha: updateFinalValues.vidhanUF,
          },
        })
        .then((res) => {
          setPollingStationListForUF(res.data);
        })
        .catch((err) => {
          console.error("UF Polling Station Error:", err);
          setPollingStationListForUF([]);
        });
    } else {
      setPollingStationListForUF([]);
      setUpdateFinalValues(prev => ({ ...prev, pollingUF: "" }));
    }
    setLoading(false);
  }, [updateFinalValues.jillaUF, updateFinalValues.vidhanUF]);
  // Fetch Vidhan Sabha for DELETE section
  useEffect(() => {
    setLoading(true);
    if (deleteValues.jilla) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getVidhansabhaList`, {
          params: { jilla: deleteValues.jilla }
        })
        .then((res) => {
          const vidhanValues = res.data.map(item => item.vidhansabha);
          setVidhanSabhaListForDelete(vidhanValues);
        })
        .catch((err) => console.error("Delete Vidhan Sabha Error:", err));
    } else {
      setVidhanSabhaListForDelete([]);
      setDeleteValues(prev => ({ ...prev, vidhan: "", polling: "" }));
    }
    setLoading(false);
  }, [deleteValues.jilla]);
  // Fetch Polling Station for DELETE section
  useEffect(() => {
    setLoading(true);
    if (deleteValues.jilla && deleteValues.vidhansabha) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/getPollingStations`, {
          params: {
            jilla: deleteValues.jilla,
            vidhansabha: deleteValues.vidhansabha,
          },
        })
        .then((res) => {
          setPollingStationListForDelete(res.data);
        })
        .catch((err) => {
          console.error("Delete Polling Station Error:", err);
          setPollingStationListForDelete([]);
        });
    } else {
      setPollingStationListForDelete([]);
      setDeleteValues(prev => ({ ...prev, polling: "" }));
    }
    setLoading(false);
  }, [deleteValues.jilla, deleteValues.vidhansabha]);
  // Reset dependent dropdowns when jilla changes for MERGE
  const handleChange = (field, value) => {
    setDropdownValues((prev) => {
      const newValues = { ...prev, [field]: value };
      // Reset dependent dropdowns
      if (field === "jilla1") {
        newValues.vidhan1 = "";
        newValues.vidhan2 = "";
        newValues.polling1 = "";
        newValues.polling2 = "";
      } else if (field === "vidhan1") {
        newValues.polling1 = "";
        newValues.polling2 = "";
      }
      return newValues;
    });
  };
  const handleUFChange = (field, value) => {
    setUpdateFinalValues((prev) => {
      const newValues = { ...prev, [field]: value };  
      // Reset dependent dropdowns
      if (field === "jillaUF") {
        newValues.vidhanUF = "";
        newValues.pollingUF = "";
      } else if (field === "vidhanUF") {
        newValues.pollingUF = "";
      }
      return newValues;
    });
  };
  const handleMerge = async () => {
    try {
      let type = selectedOption;
      let fromValue, toValue;
      let jilla, vidhansabha;
      if (type === "jilla") {
        fromValue = dropdownValues.jilla1;
        toValue = dropdownValues.jilla2;
      } else if (type === "vidhansabha") {
        fromValue = dropdownValues.vidhan1;
        toValue = dropdownValues.vidhan2;
        jilla = dropdownValues.jilla1;
      } else if (type === "pollingstation") {
        fromValue = dropdownValues.polling1;
        toValue = dropdownValues.polling2;
        jilla = dropdownValues.jilla1;
        vidhansabha = dropdownValues.vidhan1;
      }
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/mergedata`, {
        type,
        fromValue,
        toValue,
        jilla,
        vidhansabha,
        boothNumber: type === "pollingstation" ? boothNumber : undefined, // Add booth number
      });  
      alert(`✅ ${response.data.message}\nRows Updated: ${response.data.rowsAffected}`);
      window.location.reload();
    } catch (err) {
      console.error("Merge Error:", err);
      if (err.response?.data?.error) {
        alert(`❌ ${err.response.data.error}`);
      } else {
        alert("❌ Merge failed. Please try again.");
      }
    }
  };

  const handleUpdateFinal = async () => {
    try {
      const updateData = {
        jilla: updateFinalValues.jillaUF,
        vidhansabha: updateFinalValues.vidhanUF
      };
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/updatefinal`,
        updateData
      );
      if (response.data.success) {
        alert(`✅ ${response.data.message}\nTotal Voters: ${response.data.totalVoters}\nTable: ${response.data.voterTableName}`);
      } else {
        alert("⚠️ No changes were made in update final!");
      }
    } catch (error) {
      console.error("Update Final Error:", error);
      alert("❌ Failed to update final voter count.");
    }
  };
  const renderDropdownOrInput = (value, setValue, options, isEditable = true) => {
    if (isEditable) {
      return (
        <div className="editable-dropdown-container">
          <input
            list={`datalist-${options.join('').replace(/\s+/g, '')}`}
            className="merge-input editable-dropdown"
            placeholder="Select or type new value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <datalist id={`datalist-${options.join('').replace(/\s+/g, '')}`}>
            <option value="">Select existing</option>
            {options.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </datalist>
        </div>
      );
    }
    const hasEmptyOption = options.includes("");
    if (hasEmptyOption) {
      return (
        <input
          type="text"
          className="merge-input"
          placeholder="Enter value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    return (
      <select
        className="styled-dropdown"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">Select</option>
        {options.map((item, index) => (
          <option key={index} value={item}>
            {item}
          </option>
        ))}
      </select>
    );
  };
  return (
    <div>
      {/* Merge Section */}
      <div className="voter-merge-container">
        <h2>🗳 वोटर डेटा मर्ज विकल्प</h2>
        <div className="radio-group">
          {[
            { id: "jilla", label: "जिला मर्ज" },
            { id: "vidhansabha", label: "विधानसभा मर्ज" },
            { id: "pollingstation", label: "पोलिंग स्टेशन मर्ज" },
          ].map((item) => (
            <label
              key={item.id}
              className={`radio-option ${selectedOption === item.id ? "active-radio" : ""}`}
            >
              <input
                type="radio"
                name="mergeType"
                value={item.id}
                checked={selectedOption === item.id}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <span className="radio-label">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="dropdown-section">
          {selectedOption === "jilla" && (
            <div className="merge-block">
              <h4>जिला मर्ज</h4>
              <div className="dropdown-group">
                {renderDropdownOrInput(
                  dropdownValues.jilla1,
                  (val) => handleChange("jilla1", val),
                  jillaList
                )}
                {renderDropdownOrInput(
                  dropdownValues.jilla2,
                  (val) => handleChange("jilla2", val),
                  jillaList
                )}
              </div>
            </div>
          )}
          {selectedOption === "vidhansabha" && (
            <div className="merge-block">
              <h4>विधानसभा मर्ज</h4>
              <div className="dropdown-group">
                {renderDropdownOrInput(
                  dropdownValues.jilla1,
                  (val) => handleChange("jilla1", val),
                  jillaList
                )}
                {renderDropdownOrInput(
                  dropdownValues.vidhan1,
                  (val) => handleChange("vidhan1", val),
                  vidhanSabhaListForMerge
                )}
                {renderDropdownOrInput(
                  dropdownValues.vidhan2,
                  (val) => handleChange("vidhan2", val),
                  vidhanSabhaListForMerge
                )}
              </div>
            </div>
          )}
          {selectedOption === "pollingstation" && (
            <div className="merge-block">
              <h4>पोलिंग स्टेशन मर्ज</h4>
              <div className="dropdown-group">
                {renderDropdownOrInput(
                  dropdownValues.jilla1,
                  (val) => handleChange("jilla1", val),
                  jillaList
                )}
                {renderDropdownOrInput(
                  dropdownValues.vidhan1,
                  (val) => handleChange("vidhan1", val),
                  vidhanSabhaListForMerge
                )}
                {renderDropdownOrInput(
                  dropdownValues.polling1,
                  (val) => handleChange("polling1", val),
                  pollingStationListForMerge
                )}
                {renderDropdownOrInput(
                  dropdownValues.polling2,
                  (val) => handleChange("polling2", val),
                  pollingStationListForMerge
                )}
                {/* Add Booth Number Input */}
                <div className="input-group">
                  <label className="input-label">Booth Number:</label>
                  <input
                    type="text"
                    className="merge-input"
                    placeholder="Enter booth number"
                    value={boothNumber}
                    onChange={(e) => setBoothNumber(e.target.value)}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {selectedOption && (
          <div className="merge-btn-container">
            <button
              className="merge-btn"
              disabled={
                (selectedOption === "jilla" &&
                  (!dropdownValues.jilla1 || !dropdownValues.jilla2)) ||
                (selectedOption === "vidhansabha" &&
                  (!dropdownValues.vidhan1 || !dropdownValues.vidhan2)) ||
                (selectedOption === "pollingstation" &&
                  (!dropdownValues.polling1 || !dropdownValues.polling2 || !boothNumber)) // Add booth number validation
              }
              onClick={handleMerge}
            >
              🔄 Merge Now
            </button>
          </div>
        )}
      </div>

      {/* Update Final Section */}
      <div className="voter-merge-container">
        <h2>⚙️ UPDATE FINAL VOTER COUNT</h2>
        <div className="radio-group">
          <label className="radio-option active-radio">
            <input
              type="radio"
              name="updateFinalType"
              value="uf_vidhansabha"
              checked={true}
              readOnly
            />
            <span className="radio-label">विधानसभा</span>
          </label>
        </div>
        <div className="dropdown-group">
          <select
            className="styled-dropdown"
            value={updateFinalValues.jillaUF}
            onChange={(e) => handleUFChange("jillaUF", e.target.value)}
          >
            <option value="">Select Jilla</option>
            {jillaList.map((jilla, i) => (
              <option key={i} value={jilla}>
                {jilla}
              </option>
            ))}
          </select>
          <select
            className="styled-dropdown"
            value={updateFinalValues.vidhanUF}
            onChange={(e) => handleUFChange("vidhanUF", e.target.value)}
            disabled={!updateFinalValues.jillaUF}
          >
            <option value="">Select Vidhan Sabha</option>
            {vidhanSabhaListForUF.map((vs, i) => (
              <option key={i} value={vs}>
                {vs}
              </option>
            ))}
          </select>
        </div>
        <button 
          className="update-final-btn" 
          onClick={handleUpdateFinal}
          disabled={!updateFinalValues.jillaUF || !updateFinalValues.vidhanUF}
        >
          ⚙️ Update Final
        </button>
      </div>

      {/* Delete Section */}
      <div className="delete-voter-section">
        <h2>🗑️ मतदाता डेटा हटाएं</h2>
        
        {/* Delete Type Selection */}
        <div className="radio-group">
          {[
            { id: "delete_vidhansabha", label: "विधानसभा डिलीट" },
            { id: "delete_polling", label: "पोलिंग स्टेशन डिलीट" },
          ].map((item) => (
            <label
              key={item.id}
              className={`radio-option ${
                deleteValues.type === item.id ? "active-radio" : ""
              }`}
            >
              <input
                type="radio"
                name="deleteType"
                value={item.id}
                checked={deleteValues.type === item.id}
                onChange={(e) =>
                  setDeleteValues((prev) => ({ 
                    ...prev, 
                    type: e.target.value,
                    vidhan: "",
                    polling: ""
                  }))
                }
              />
              <span className="radio-label">{item.label}</span>
            </label>
          ))}
        </div>

        <div className="dropdown-group">
          {/* Jilla - Always required */}
          <select
            className="styled-dropdown"
            value={deleteValues.jilla}
            onChange={(e) =>
              setDeleteValues((prev) => ({ 
                ...prev, 
                jilla: e.target.value,
                vidhan: "",
                polling: ""
              }))
            }
          >
            <option value="">Select Jilla</option>
            {jillaList.map((jilla, i) => (
              <option key={i} value={jilla}>
                {jilla}
              </option>
            ))}
          </select>

          {/* Vidhan Sabha - Required for both delete types */}
          {deleteValues.type && (
            <select
              className="styled-dropdown"
              value={deleteValues.vidhansabha}
              onChange={(e) =>
                setDeleteValues((prev) => ({ 
                  ...prev, 
                  vidhan: e.target.value,
                  polling: ""
                }))
              }
              disabled={!deleteValues.jilla}
            >
              <option value="">Select Vidhan Sabha</option>
              {vidhanSabhaListForDelete.map((vs, i) => (
                <option key={i} value={vs}>
                  {vs}
                </option>
              ))}
            </select>
          )}

          {/* Polling Station - Only for polling station delete */}
          {deleteValues.type === "delete_polling" && (
            <select
              className="styled-dropdown"
              value={deleteValues.polling}
              onChange={(e) =>
                setDeleteValues((prev) => ({ ...prev, polling: e.target.value }))
              }
              disabled={!deleteValues.vidhansabha}
            >
              <option value="">Select Polling Station</option>
              {pollingStationListForDelete.map((ps, i) => (
                <option key={i} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          className="delete-btn"
          onClick={async () => {
            // Validation based on delete type
            if (!deleteValues.jilla || !deleteValues.vidhansabha) {
              alert("⚠️ Please select Jilla and Vidhan Sabha!");
              return;
            }
            if (deleteValues.type === "delete_polling" && !deleteValues.polling) {
              alert("⚠️ Please select Polling Station!");
              return;
            }
            const confirmMessage = deleteValues.type === "delete_vidhansabha" 
              ? `Delete COMPLETE Vidhan Sabha data?\nJilla: ${deleteValues.jilla}\nVidhan Sabha: ${deleteValues.vidhansabha}\n\nThis will delete ALL polling stations under this Vidhan Sabha!`
              : `Delete Polling Station data?\nJilla: ${deleteValues.jilla}\nVidhan Sabha: ${deleteValues.vidhansabha}\nPolling: ${deleteValues.polling}`;
            if (!window.confirm(confirmMessage)) return;
            try {
              const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/deletevoterdata`,
                {
                  type: deleteValues.type,
                  jilla: deleteValues.jilla,
                  vidhansabha: deleteValues.vidhansabha,
                  polling_station: deleteValues.polling,
                }
              );
              alert(`✅ ${res.data.message}`);
              window.location.reload();
            } catch (err) {
              console.error("Delete Error:", err);
              if (err.response?.data?.error) {
                alert(`❌ ${err.response.data.error}`);
              } else {
                alert("❌ Failed to delete data.");
              }
            }
          }}
          disabled={
            !deleteValues.type || 
            !deleteValues.jilla || 
            !deleteValues.vidhansabha ||
            (deleteValues.type === "delete_polling" && !deleteValues.polling)
          }
        >
          🗑️ {deleteValues.type === "delete_vidhansabha" ? "Delete Vidhan Sabha" : "Delete Polling Station"}
        </button>
      </div>
    </div>
  );
}