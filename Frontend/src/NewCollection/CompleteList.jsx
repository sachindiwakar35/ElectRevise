import React, { useEffect, useState, useRef, use } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./CompleteList.css";

export const CompleteList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [personNumber, setNumber] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedJati, setSelectedJati] = useState("");
  const categoryData = {
    SC: [
      "अहेरिया",
      "बंजारा",
      "धानुक",
      "धरकार",
      "धोबी",
      "बघेल धनगर",
      "बाल्मीकि",
      "बेलदार",
      "कठेरिया",
      "कोरी",
      "पासी",
      "ष्सोनकर",
      "खटीकष्",
      "चमार",
      "जाटव",
    ],
    ST: ["कोल", "गोंड", "खरवार"],
    OBC: [
      "यादव",
      "कश्यप",
      "कुर्मी",
      "पटेल",
      "सैथवार",
      "ष्मौर्य",
      "कुशवाहा",
      "शाक्य",
      "मछुआरा",
      "बिन्द-निष्षाद",
      "निषादष्",
      "नाई",
      "शिल्पकार",
      "साहू भुर्जी",
      "पाल",
      "गड़ेरिया",
      "गोस्वामी",
      "प्रजापति",
      "लोहार",
      "बढ़ई",
      "सोनार",
      "राजभर",
      "सैनी",
      "लोनिया",
      "चैहान",
      "तेली",
      "जाट",
      "गुर्जर",
      "लोध",
      "भूमिहार",
    ],
    General: ["क्षत्रिय", "ब्राह्मण", "कायस्थ", "वैश्य"],
    Others: ["बंगाली", "सिक्ख", "पंजाबी", "अन्य/मुस्लिम"],
  };

  useEffect(() => {
    const person_number = sessionStorage.getItem("mobileNumber");
    setNumber(person_number);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const {
    selectedLok,
    selectedVidhan,
    selectedStation,
    selectedAddress,
    vidhansabha_no,
    booth_number,
    allotted_table_name,
    allotted_newvoter_table_name,
  } = location.state || {};

  const upParties = [
    "Bharatiya Janata Party (BJP)",
    "Samajwadi Party (SP)",
    "Bahujan Samaj Party (BSP)",
    "Indian National Congress (INC)",
    "Apna Dal (Sonelal)",
    "Rashtriya Lok Dal (RLD)",
    "Aam Aadmi Party (AAP)",
    "Suheldev Bharatiya Samaj Party (SBSP)",
    "NISHAD Party",
    "Peace Party of India",
    "Others",
    "NOTA",
  ];
  const [voters, setVoters] = useState([]);
  const [filteredVoters, setFilteredVoters] = useState([]);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [selectedVoters, setSelectedVoters] = useState([]);

  // Popup states
  const [showFamilyPopup, setShowFamilyPopup] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyHead, setFamilyHead] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);

  // New voter form state
  const [showNewVoterForm, setShowNewVoterForm] = useState(false);
  const [newVoterData, setNewVoterData] = useState({
    name: "",
    age: "",
    gender: "male", // ✅ Default gender
    status: "live",
  });

  // Form refs
  const categoryRef = useRef("");
  const jatiRef = useRef("");
  const upjatiRef = useRef("");
  const mobileRef = useRef("");
  const mukhiyaRef = useRef("");
  const addressRef = useRef("");
  const votedIn2003Ref = useRef("");

  // ✅ Form EF states - useState का उपयोग करें
  const [formEFReceived, setFormEFReceived] = useState(false);
  const [formEFSubmitted, setFormEFSubmitted] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const tableContainerRef = useRef(null);

  // ✅ Fetch voters data from COMPLETECOLLECTION
  useEffect(() => {
    const fetchVoters = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/getVoterData`,
          {
            params: {
              vidhan: vidhansabha_no,
              booth_number: booth_number,
              allotted_newvoter_table_name: allotted_newvoter_table_name,
              allotted_table_name: allotted_table_name,
            },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        setVoters(res.data);
        setFilteredVoters(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch voter data", err);
        alert("❌ Failed to load voter data!");
      } finally {
        setLoading(false);
      }
    };

    if (allotted_newvoter_table_name && allotted_table_name) {
      fetchVoters();
    }
  }, [allotted_newvoter_table_name, allotted_table_name]);

  // ✅ Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVoters(voters);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    console.log("Search kiya hua data",searchLower);
    console.log("voter ka data->",voters);
    const filtered = voters.filter((voter) => {
      const name = voter.name?.toLowerCase() || "";
      const father = voter.father?.toLowerCase() || "";
      const id = voter.id?.toLowerCase() || "";
      const house = voter.house?.toLowerCase() || "";
      const familyId = voter.family_id?.toLowerCase() || "";

      return (
        name.includes(searchLower) ||
        father.includes(searchLower) ||
        id.includes(searchLower) ||
        house.includes(searchLower) ||
        familyId.includes(searchLower)
      );
    });

    setFilteredVoters(filtered);
  }, [searchTerm, voters]);

  // ✅ Fetch all voters by family_id and show popup
  const handleComplete = async (family_id) => {
    if (!family_id) {
      alert("⚠️ Family ID not found for this voter!");
      return;
    }

    try {
      setPopupLoading(true);
      setShowFamilyPopup(true);
      setFamilyHead(null);

      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/getFamilyMembers`,
        {
          params: { family_id, allotted_newvoter_table_name },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      console.log("family Data", res.data.data);
      if (res.data.data && res.data.data.length > 0) {
        setFamilyMembers(res.data.data);

        const head = res.data.data[0];
        setFamilyHead({
          mukhiya: head.mukhiya || "Not Available",
          address: head.address || "Not Available",
          mobile: head.mobileno || "Not Available",
          category: head.category || "Not Available",
          jati: head.jati || "Not Available",
          upjati: head.upjati || "Not Available",
          family_id: family_id,
        });
      } else {
        setFamilyMembers([]);
        setFamilyHead(null);
        alert("ℹ️ No family members found for this Family ID!");
      }
    } catch (err) {
      console.error("❌ Failed to fetch family data:", err);
      alert("❌ Failed to fetch family members. Check console for details.");
    } finally {
      setPopupLoading(false);
    }
  };

  // ✅ When a row is clicked - ONLY FOR PENDING VOTERS
  const handleRowClick = (voter) => {
    if (voter.status === "completed") {
      return;
    }
    if (voter.sir2025 === "NO") {
      return;
    }

    setSelectedVoter(voter);

    // Update ref values directly
    categoryRef.current = voter.category || "";
    jatiRef.current = voter.jati || "";
    upjatiRef.current = voter.upjati || "";
    mobileRef.current = voter.mobileno || "";
    mukhiyaRef.current = voter.mukhiya || voter.name || "";
    addressRef.current = voter.address || "";

    // Initialize new fields
    votedIn2003Ref.current = voter.votein2003 || "";

    // ✅ Form EF states को initialize करें
    setFormEFReceived(
      voter.formEF === "received" || voter.formEF === "submitted"
    );
    setFormEFSubmitted(voter.formEF === "submitted");

    if (!selectedVoters.includes(voter.id)) {
      setSelectedVoters((prev) => [...prev, voter.id]);
    }
  };

  // ✅ Checkbox handling - DISABLED FOR COMPLETED VOTERS
  const handleCheckboxChange = (voterId, voterStatus) => {
    if (voterStatus === "completed") {
      return;
    }

    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  // ✅ Get selected voter objects with their table S.No.
  const getSelectedVoterObjectsWithSNo = () => {
    return selectedVoters.map((voterId) => {
      const voter = voters.find((v) => v.id === voterId);
      const tableIndex = filteredVoters.findIndex((v) => v.id === voterId);
      return {
        ...voter,
        tableSNo: tableIndex !== -1 ? tableIndex + 1 : null,
      };
    });
  };

  // ✅ Handler functions for form inputs
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    categoryRef.current = e.target.value;
    setSelectedJati("");
  };
  const handlePartyChange = (e) => {
    const selected = e.target.value;
    setSelectedParty(selected);
    console.log("Selected Party:", selected);
  };
  const handleJatiChange = (e) => {
    setSelectedJati(e.target.value);
    jatiRef.current = e.target.value;
  };

  const handleUpjatiChange = (e) => {
    upjatiRef.current = e.target.value;
  };

  const handleMobileChange = (e) => {
    mobileRef.current = e.target.value;
  };

  const handleMukhiyaChange = (e) => {
    mukhiyaRef.current = e.target.value;
  };

  const handleAddressChange = (e) => {
    addressRef.current = e.target.value;
  };

  const handleVotedIn2003Change = (e) => {
    votedIn2003Ref.current = e.target.value;
  };

  // ✅ Form EF handlers - दोनों checkbox हमेशा enabled रहेंगे
  const handleFormEFReceivedChange = (e) => {
    const isChecked = e.target.checked;
    setFormEFReceived(isChecked);

    // ✅ अगर Form EF Received unchecked किया जाता है, तो Form EF Submitted भी automatically unchecked हो जाए
    if (!isChecked) {
      setFormEFSubmitted(false);
    }
  };

  const handleFormEFSubmittedChange = (e) => {
    const isChecked = e.target.checked;
    setFormEFSubmitted(isChecked);

    // ✅ अगर Form EF Submitted checked किया जाता है, तो Form EF Received automatically checked हो जाए
    if (isChecked && !formEFReceived) {
      setFormEFReceived(true);
    }
  };

  // ✅ Submit voters (single or multiple)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedVoters.length === 0) {
      alert("⚠️ Please select at least one voter!");
      return;
    }

    // Enhanced validation
    const currentMukhiya = mukhiyaRef.current.trim();
    const currentAddress = addressRef.current.trim();
    const currentMobile = mobileRef.current.trim();
    const currentCategory = categoryRef.current;
    const currentVotedIn2003 = votedIn2003Ref.current;

    if (!currentMukhiya) {
      alert("⚠️ Please enter Mukhiya name!");
      return;
    }

    if (!currentAddress) {
      alert("⚠️ Please enter Address!");
      return;
    }

    if (
      !currentMobile ||
      currentMobile.length !== 10 ||
      !/^\d+$/.test(currentMobile)
    ) {
      alert("⚠️ Please enter a valid 10-digit mobile number!");
      return;
    }

    if (!currentCategory) {
      alert("⚠️ Please select a category!");
      return;
    }

    if (!currentVotedIn2003) {
      alert("⚠️ Please select whether voted in 2003!");
      return;
    }

    const selectedVoterObjects = getSelectedVoterObjectsWithSNo();

    const votersData = selectedVoterObjects.map((voter) => ({
      number: voter.number || 0,
      id: voter.id,
      name: voter.name,
      father: voter.father || "",
      house: voter.house || "",
      age: voter.age || 0,
      gender: voter.gender || "",
      polling_station: voter.polling_station || "",
      station_address: voter.station_address || "",
      loksabha: voter.add2 || "",
      vidhansabha: voter.add1 || "",
      kinType: voter.kinType || "",
      year: voter.year || 0,
      date1: voter.date1 || "",
      date2: voter.date2 || "",
      // add1: voter.add1 || "",
      // add2: voter.add2 || "",
      booth_number: voter.booth_number || "",
      add1_number: voter.add1_number || 0,
      add2_number: voter.add2_number || 0,
      postcode: voter.postcode || 0,
    }));

    // ✅ Send ALL data in one payload WITH LOCATION DATA
    const payload = {
      voters: votersData,
      category: currentCategory,
      jati: jatiRef.current,
      upjati: upjatiRef.current,
      mobileno: currentMobile,
      mukhiya: currentMukhiya,
      address: currentAddress,
      votein2003: currentVotedIn2003,
      formEF: formEFSubmitted
        ? "submitted"
        : formEFReceived
        ? "received"
        : "not_received",
      person_mobile_number: sessionStorage.getItem("mobileNumber"),
      political_party: selectedParty,
      station_address: "India",
      allotted_table_name: allotted_table_name,
      allotted_newvoter_table_name: allotted_newvoter_table_name,
    };

    console.log("📤 Sending voters payload:", payload);

    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/addNewVoter`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status) {
        alert(
          `✅ ${selectedVoters.length} voter(s) saved successfully!${
            response.data.family_id
              ? `\nFamily ID: ${response.data.family_id}`
              : ""
          }`
        );

        // Refresh the data
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/getVoterData`,
          {
            params: {
              vidhan: vidhansabha_no,
              booth_number: booth_number,
              allotted_newvoter_table_name: allotted_newvoter_table_name,
              allotted_table_name: allotted_table_name,
            },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        setVoters(res.data);
        setFilteredVoters(res.data);

        // Reset everything
        setSelectedVoters([]);
        setSelectedVoter(null);

        // Clear ref values
        categoryRef.current = "";
        jatiRef.current = "";
        upjatiRef.current = "";
        mobileRef.current = "";
        mukhiyaRef.current = "";
        addressRef.current = "";
        votedIn2003Ref.current = "";
        setSelectedParty("");

        // ✅ Reset Form EF states
        setFormEFReceived(false);
        setFormEFSubmitted(false);
      } else {
        alert(`❌ Failed to save data: ${response.data.error}`);
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("❌ Failed to save voters data! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add New Family Member
  const handleAddNewVoter = async (e) => {
    e.preventDefault();

    if (!familyHead) {
      alert("⚠️ Please complete family details first!");
      return;
    }

    if (!newVoterData.name.trim() || !newVoterData.age) {
      alert("⚠️ Please enter name and age for the new voter!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: newVoterData.name,
        age: parseInt(newVoterData.age),
        gender: newVoterData.gender,
        status: newVoterData.status,
        mukhiya: familyHead.mukhiya,
        address: familyHead.address,
        mobile: familyHead.mobile,
        category: familyHead.category,
        jati: familyHead.jati,
        upjati: familyHead.upjati,
        family_id: familyHead.family_id,
        person_mobile_number: personNumber,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/addNewFamilyMember`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.status) {
        alert("✅ New family member added successfully!");
        setNewVoterData({ name: "", age: "", gender: "male", status: "live" });
        setShowNewVoterForm(false);

        // Refresh the family members data
        if (familyHead.family_id) {
          handleComplete(familyHead.family_id);
        }
      } else {
        alert(`❌ Failed to add new member: ${response.data.error}`);
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      alert("❌ Failed to add new family member!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Auto-detect family members by father name - ONLY PENDING VOTERS
  const autoDetectFamily = () => {
    if (!selectedVoter) {
      alert("⚠️ Please select a voter first to detect family members!");
      return;
    }

    const name = selectedVoter.name;
    const sameHouseVoters = voters.filter(
      (voter) =>
        voter.father === name &&
        !selectedVoters.includes(voter.id) &&
        voter.status !== "completed"
    );

    if (sameHouseVoters.length === 0) {
      alert("ℹ️ No other family members found with this voter as father!");
      return;
    }

    const newSelectedVoters = [...sameHouseVoters.map((v) => v.id)];
    setSelectedVoters((prev) => [...prev, ...newSelectedVoters]);

    setTimeout(() => {
      sameHouseVoters.forEach((voter) => {
        const element = document.querySelector(
          `tr[data-voter-id="${voter.id}"]`
        );
        if (element) {
          element.classList.add("auto-detected-member");
          setTimeout(() => {
            element.classList.remove("auto-detected-member");
          }, 3000);
        }
      });
    }, 100);

    alert(
      `✅ ${
        sameHouseVoters.length
      } family members automatically selected from father ${name}!\n\nSelected members:\n${sameHouseVoters
        .map((v, i) => `${i + 1}. ${v.name} (ID: ${v.id})`)
        .join("\n")}`
    );
  };

  // ✅ Clear all selections
  const clearAllSelections = () => {
    setSelectedVoters([]);
    setSelectedVoter(null);

    // Clear all ref values
    categoryRef.current = "";
    jatiRef.current = "";
    upjatiRef.current = "";
    mobileRef.current = "";
    mukhiyaRef.current = "";
    addressRef.current = "";
    votedIn2003Ref.current = "";

    // ✅ Reset Form EF states
    setFormEFReceived(false);
    setFormEFSubmitted(false);
  };

  // ✅ Function to scroll to a specific voter in the table
  const scrollToVoter = (voterId) => {
    const voterIndex = filteredVoters.findIndex(
      (voter) => voter.id === voterId
    );
    if (voterIndex !== -1 && tableContainerRef.current) {
      const tableRows = tableContainerRef.current.querySelectorAll("tbody tr");
      if (tableRows[voterIndex]) {
        tableRows[voterIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        tableRows[voterIndex].classList.add("highlight-row");
        setTimeout(() => {
          tableRows[voterIndex].classList.remove("highlight-row");
        }, 2000);
      }
    }
  };

  return (
    <div className="complete-list-container">
      {/* 🔙 Back button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>

      {/* 🗂️ Info */}
      <div className="selection-info">
        <h2>Voter Data Collection</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Mobile Number:</strong>{" "}
            {sessionStorage.getItem("mobileNumber") || "Not selected"}
          </div>
          <div className="info-item">
            <strong>Vidhan Sabha:</strong>{" "}
            {sessionStorage.getItem("vidhansabha_name") || "Not selected"}
          </div>
          <div className="info-item">
            <strong>Booth Number:</strong> {booth_number || "Not selected"}
          </div>
          <div className="info-item">
            <strong>Vidhansabha Number:</strong>{" "}
            {sessionStorage.getItem("vidhansabha_no") || "Not selected"}
          </div>
        </div>
      </div>

      {/* 🔍 Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search by Name, Father, Voter ID, House, Family ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="search-stats">
          <span>
            Showing {filteredVoters.length} of {voters.length} voters
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          <span className="status-stats">
            ✅ Completed:{" "}
            {voters.filter((v) => v.status === "completed").length} | ⏳
            Pending: {voters.filter((v) => v.status !== "completed").length}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          className="auto-detect-btn"
          onClick={autoDetectFamily}
          disabled={loading || !selectedVoter}
        >
          🔍 Auto Detect Family
        </button>

        {(selectedVoters.length > 0 || selectedVoter) && (
          <button
            className="clear-selection-btn"
            onClick={clearAllSelections}
            disabled={loading}
          >
            🗑️ Clear Selection
          </button>
        )}

        {selectedVoters.length > 0 && (
          <div className="selection-info">
            <p>✅ {selectedVoters.length} voters selected</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading voter data...</p>
        </div>
      )}

      <div className="voter-table-form">
        {/* 🧾 Table */}
        <div className={`table-wrapper ${selectedVoter ? "with-form" : ""}`}>
          <div className="table-container" ref={tableContainerRef}>
            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Select</th>
                  <th>No.</th>
                  <th>Voter ID</th>
                  <th>Name</th>
                  <th>Father</th>
                  <th>House</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Family ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.map((voter, idx) => {
                  const isSelected = selectedVoters.includes(voter.id);
                  const isCompleted = voter.status === "completed";
                  const isSelectable = !isCompleted;

                  return (
                    <tr
                      key={voter.id}
                      data-voter-id={voter.id}
                      onClick={() => isSelectable && handleRowClick(voter)}
                      className={`
                        ${
                          voter.status === "completed"
                            ? "completed-row"
                            : "pending-row"
                        }
                        ${
                          selectedVoter && selectedVoter.id === voter.id
                            ? "selected-row"
                            : ""
                        }
                        ${isSelected ? "family-selected-row" : ""}
                        ${!isSelectable ? "non-selectable-row" : ""}
                      `}
                      style={{
                        cursor: isSelectable ? "pointer" : "not-allowed",
                        opacity: isSelectable ? 1 : 0.7,
                      }}
                    >
                      <td>{idx + 1}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            isSelectable &&
                            handleCheckboxChange(voter.id, voter.status)
                          }
                          className={`voter-checkbox ${
                            !isSelectable ? "disabled-checkbox" : ""
                          }`}
                          disabled={!isSelectable}
                        />
                      </td>
                      <td>{voter.number}</td>
                      <td className="voter-id">{voter.id}</td>
                      <td className="voter-name">{voter.name}</td>
                      <td className="father-name">{voter.father}</td>
                      <td className="house-number">{voter.house}</td>
                      <td className="age">{voter.age}</td>
                      <td className="gender">{voter.gender}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            isCompleted ? "completed" : "pending"
                          }`}
                        >
                          {isCompleted ? (
                            <button
                              className="completed-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(voter.family_id);
                              }}
                            >
                              ✅ Completed
                            </button>
                          ) : (
                            "⏳ Pending"
                          )}
                        </span>
                      </td>
                      <td className="family-id-cell">
                        {voter.family_id ? (
                          <span title={voter.family_id}>
                            {voter.family_id.length > 12
                              ? `${voter.family_id.substring(0, 12)}...`
                              : voter.family_id}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredVoters.length === 0 && !loading && (
              <div className="no-results">
                <p>No voters found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* ✏️ Form */}
        {selectedVoter && (
          <div className="form-container">
            <form className="voter-form" onSubmit={handleSubmit}>
              <div className="form-header">
                <h3>
                  {selectedVoters.length > 1
                    ? `Update ${selectedVoters.length} Voters`
                    : `Update Voter Info - ${selectedVoter.name}`}
                </h3>
                <button
                  type="button"
                  className="close-form-btn"
                  onClick={clearAllSelections}
                  disabled={loading}
                >
                  ✖
                </button>
              </div>

              <div className="form-grid">
                {selectedVoters.length === 1 && (
                  <>
                    <div className="form-group">
                      <label>Voter ID:</label>
                      <input
                        type="text"
                        value={selectedVoter.id}
                        readOnly
                        className="readonly-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={selectedVoter.name}
                        onChange={(e) =>
                          setSelectedVoter({
                            ...selectedVoter,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Mukhiya (मुखिया): *</label>
                  <input
                    type="text"
                    defaultValue={mukhiyaRef.current}
                    onChange={handleMukhiyaChange}
                    required
                    placeholder="Enter family head name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address (पता): *</label>
                  <input
                    type="text"
                    defaultValue={addressRef.current}
                    onChange={handleAddressChange}
                    required
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="form-group">
                  <label>Category (वर्ग): *</label>
                  <select
                    defaultValue={categoryRef.current}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Jati (जाति):</label>

                  <select
                    value={selectedJati}
                    onChange={handleJatiChange}
                    disabled={!selectedCategory}
                    required
                  >
                    <option value="">Select Jati</option>
                    {selectedCategory &&
                      categoryData[selectedCategory]?.map((jati, index) => (
                        <option key={index} value={jati}>
                          {jati}
                        </option>
                      ))}
                  </select>
                  {/* <input
                    defaultValue={jatiRef.current}
                    onChange={handleJatiChange}
                    placeholder="Enter caste"
                  /> */}
                </div>

                <div className="form-group">
                  <label>UpJati (उपजाति):</label>
                  <input
                    defaultValue={upjatiRef.current}
                    onChange={handleUpjatiChange}
                    placeholder="Enter sub-caste"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile No: *</label>
                  <input
                    type="tel"
                    defaultValue={mobileRef.current}
                    onChange={handleMobileChange}
                    required
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    pattern="[0-9]{10}"
                  />
                </div>

                {/* New Fields */}
                <div className="form-group">
                  <label>Voted in 2003? *</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="votedIn2003"
                        value="yes"
                        onChange={handleVotedIn2003Change}
                        defaultChecked={votedIn2003Ref.current === "yes"}
                        required
                      />
                      Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="votedIn2003"
                        value="no"
                        onChange={handleVotedIn2003Change}
                        defaultChecked={votedIn2003Ref.current === "no"}
                        required
                      />
                      No
                    </label>
                  </div>
                  <label>Voter of :</label>
                  <select
                    value={selectedParty}
                    onChange={handlePartyChange}
                    required
                  >
                    <option value="">Select Party</option>
                    {upParties.map((party, index) => (
                      <option key={index} value={party}>
                        {party}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Form EF Status</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formEFReceived}
                        onChange={handleFormEFReceivedChange}
                      />
                      Form EF Received
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formEFSubmitted}
                        onChange={handleFormEFSubmittedChange}
                      />
                      Form EF Submitted
                    </label>
                  </div>
                </div>
              </div>

              {selectedVoters.length > 1 && (
                <div className="family-members-preview">
                  <h4>Selected Voters ({selectedVoters.length}):</h4>
                  <div className="family-members-list">
                    {getSelectedVoterObjectsWithSNo().map((voter) => (
                      <div
                        key={voter.id}
                        className="family-member-item clickable-member"
                        onClick={() => scrollToVoter(voter.id)}
                        title="Click to scroll to this voter in the table"
                      >
                        <span className="member-sno">{voter.tableSNo}.</span>
                        <span className="member-name">{voter.name}</span>
                        <span className="member-details">
                          ID: {voter.id}, Age: {voter.age} yrs, House:{" "}
                          {voter.house}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading
                    ? "⏳ Saving..."
                    : selectedVoters.length > 1
                    ? `💾 Save ${selectedVoters.length} Voters`
                    : "💾 Save Voter"}
                </button>

                {/* <button
                  type="button"
                  className="add-new-voter-btn"
                  onClick={() => setShowNewVoterForm(true)}
                  disabled={loading}
                >
                  👥 Add New Voter to Family
                </button> */}

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={clearAllSelections}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Family Popup */}
      {showFamilyPopup && (
        <div className="family-popup-overlay">
          <div className="family-popup-card">
            <div className="popup-header">
              <h3>👨‍👩‍👧‍👦 Family Details</h3>
              <button
                className="popup-close-btn"
                onClick={() => setShowFamilyPopup(false)}
              >
                ✖
              </button>
            </div>

            {popupLoading ? (
              <div className="popup-loading">
                <div className="spinner"></div>
                <p>Loading family members...</p>
              </div>
            ) : (
              <>
                {familyHead && (
                  <div className="family-head-section">
                    <h4>🏠 Family Head Details</h4>
                    <div className="family-head-grid">
                      <div className="family-head-item">
                        <strong>Mukhiya:</strong> {familyHead.mukhiya}
                      </div>
                      <div className="family-head-item">
                        <strong>Mobile:</strong> {familyHead.mobile}
                      </div>
                      <div className="family-head-item">
                        <strong>Category:</strong> {familyHead.category}
                      </div>
                      <div className="family-head-item">
                        <strong>Jati:</strong> {familyHead.jati}
                      </div>
                      <div className="family-head-item">
                        <strong>UpJati:</strong> {familyHead.upjati}
                      </div>
                      <div className="family-head-item">
                        <strong>Family ID:</strong> {familyHead.family_id}
                      </div>
                      <div className="family-head-item full-width">
                        <strong>Address:</strong> {familyHead.address}
                      </div>
                    </div>
                  </div>
                )}

                {familyMembers.length > 0 ? (
                  <>
                    <div className="family-members-section">
                      <h4>👥 Family Members ({familyMembers.length})</h4>
                      <table className="popup-table">
                        <thead>
                          <tr>
                            <th>S.No.</th>
                            <th>Voter ID</th>
                            <th>Name</th>
                            <th>Father</th>
                            <th>House</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Mobile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {familyMembers.map((member, index) => (
                            <tr key={member.id}>
                              <td>{index + 1}</td>
                              <td>{member.id}</td>
                              <td>{member.name}</td>
                              <td>{member.father}</td>
                              <td>{member.house}</td>
                              <td>{member.age}</td>
                              <td>{member.gender}</td>
                              <td>{member.mobileno || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="no-family-data">No family data found.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add New Voter Form */}
      {showNewVoterForm && (
        <div className="family-popup-overlay">
          <div className="family-popup-card">
            <div className="popup-header">
              <h3>👤 Add New Family Member</h3>
              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowNewVoterForm(false);
                  setNewVoterData({
                    name: "",
                    age: "",
                    gender: "male",
                    status: "live",
                  });
                }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleAddNewVoter} className="new-voter-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name: *</label>
                  <input
                    type="text"
                    value={newVoterData.name}
                    onChange={(e) =>
                      setNewVoterData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label>Age: *</label>
                  <input
                    type="number"
                    value={newVoterData.age}
                    onChange={(e) =>
                      setNewVoterData((prev) => ({
                        ...prev,
                        age: e.target.value,
                      }))
                    }
                    required
                    placeholder="Enter age"
                    min="1"
                    max="120"
                  />
                </div>

                {/* ✅ Gender Dropdown - Replaced Status */}
                <div className="form-group">
                  <label>Gender: *</label>
                  <select
                    value={newVoterData.gender}
                    onChange={(e) =>
                      setNewVoterData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {familyHead && (
                <div className="family-info-preview">
                  <h4>Family Details:</h4>
                  <p>
                    <strong>Mukhiya:</strong> {familyHead.mukhiya}
                  </p>
                  <p>
                    <strong>Family ID:</strong> {familyHead.family_id}
                  </p>
                  <p>
                    <strong>Address:</strong> {familyHead.address}
                  </p>
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "⏳ Adding..." : "💾 Add Member"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowNewVoterForm(false);
                    setNewVoterData({
                      name: "",
                      age: "",
                      gender: "male",
                      status: "live",
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
