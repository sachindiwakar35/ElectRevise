import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DashBooth.css";
import { useLocation, useNavigate } from "react-router-dom";

export const DashBooth = () => {
  const [allMembers, setAllMembers] = useState([]);
  // setAllMembers(RESULT_FROM_API);
  const [pollingStation, setPollingStation] = useState("");
  const [groupedData, setGroupedData] = useState({});
  const [multiFamilies, setMultiFamilies] = useState({});
  console.log("family data -> ", multiFamilies);
  const [singleFamilies, setSingleFamilies] = useState({});
  const [lastSearch, setLastSearch] = useState("");
  const location = useLocation();
  const {
    selectedLok,
    selectedVidhan,
    selectedAddress,
    selectedStation,
    vidhansabha_no,
    booth_number,
    vidhansabha_name,
    polling_station,
    allotted_table_name,
    allotted_newvoter_table_name,
  } = location.state || {};
  const [familyData, setFamilyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddVoterForm, setShowAddVoterForm] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddFamilyForm, setShowAddFamilyForm] = useState(false);

  const [newVoterData, setNewVoterData] = useState({
    name: "",
    father: "",
    house: "",
    kinType: "",
    status: "",
    age: "",
    gender: "",
    mobileno: "",
    category: "",
    jati: "",
    upjati: "",
    person_mobile_number: "",
    mukhiya: "",
    address: "",
  });

  const jatiOptions = {
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
      "ष्मछुआरा",
      "बिन्द-निष्षाद",
      "निष्षादष्",
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
    ],
    GENERAL: ["लोध", "क्षत्रिय", "ब्राह्मण", "कायस्थ", "भूमिहार", "वैश्य"],
    Others: ["त्यागी", "बंगाली", "सिक्ख", "पंजाबी", "अन्य/मुस्लिम"],
  };

  const voterOfOptions = [
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

  const sendFamilyWhatsApp = (fid) => {
    const familyArray = multiFamilies[fid];
    if (!familyArray || familyArray.length === 0) {
      return alert("Family data not found!");
    }

    const m = familyArray[0]; // Mukhiya
    console.log("Mukhiya data ->", m);

    // --- Mukhiya Details ---
    let msg = `
      *Mukhiya Details*
      • Voter ID: ${m.id}
      • Name: ${m.name}
      • Father: ${m.father}
      • Polling Station: ${m.polling_station}

      *Family Members*
      `;

    // --- Loop for All Family Members ---
    familyArray.forEach((member, index) => {
      msg += `
      ${index + 1}. *${member.name}*
        • Voter ID: ${member.id}
        • Father: ${member.father}
        • Age: ${member.age || "N/A"}
        • Gender: ${member.gender || "N/A"}
        • Mobile: ${member.mobileno || "N/A"}
      `;
    });

    // Mukhiya phone number
    const phone = m.mobileno;
    console.log("Mukhiya no ->", phone);

    if (!phone) return alert("Mukhiya mobile number not found!");

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const callFamilyMukhiya = (fid) => {
    const familyArray = multiFamilies[fid];
    if (!familyArray || familyArray.length === 0) {
      alert("Family not found!");
      return;
    }
    const phone = familyArray[0].mobileno;
    if (!phone) {
      alert("Mukhiya mobile number missing!");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  useEffect(() => {
    console.log("Hello");
    const fetchStationsAndFamilies = async () => {
      try {
        setLoading(true);
        const resFamilies = await axios.post(
          `${process.env.REACT_APP_API_URL}/search-booth`,
          {
            add1_number: vidhansabha_no,
            add2_number: "INDIA",
            stationAddress: "agra",
            pollingStation: booth_number,
            allotted_table_name,
            allotted_newvoter_table_name,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        console.log("Response:", resFamilies.data);

        if (resFamilies.data.success) {
          const data = resFamilies.data.data || [];

          // GROUPING BY FAMILY ID
          const grouped = data.reduce((acc, person) => {
            const fid = person.family_id || `single-${person.id}`;
            if (!acc[fid]) acc[fid] = [];
            acc[fid].push(person);
            return acc;
          }, {});

          const multi = {};
          const single = {};

          Object.entries(grouped).forEach(([fid, members]) => {
            if (members.length > 1) multi[fid] = members;
            else single[fid] = members;
          });

          setFamilyData(data);
          setMultiFamilies(multi);
          setSingleFamilies(single);
          setLastSearch(`${selectedStation} — ${selectedAddress}`);
        } else {
          setFamilyData([]);
          setMultiFamilies({});
          setSingleFamilies({});
        }
      } catch (error) {
        console.error("❌ Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStationsAndFamilies();
  }, [
    vidhansabha_no,
    booth_number,
    allotted_table_name,
    allotted_newvoter_table_name,
  ]);

  const handleAddFamilyMember = () => {
    const { name, mukhiya, address } = newFamilyData;
    if (!name || !mukhiya || !address) {
      alert("❌ कृपया नाम, मुखिया और पता भरें");
      return;
    }
    setFamilyMembers((prev) => [...prev, newFamilyData]);
    setNewFamilyData((prev) => ({
      ...prev,
      name: "",
      father: "",
      age: "",
      gender: "",
      mobileno: "",
      polling_station: sessionStorage.getItem("booth_nimber") || "",
      station_address: selectedAddress || "",
      loksabha: selectedLok || "",
      vidhansabha: vidhansabha_name || "",
    }));
  };

  const [newFamilyData, setNewFamilyData] = useState({
    name: "",
    father: "",
    house: "",
    age: "",
    gender: "",
    mukhiya: "",
    address: "",
    category: "",
    jati: "",
    upjati: "",
    mobileno: "",
    lok: "" || "",
    voterof: "",
    votein2003: "",
    formEFReceived: false,
    formEFSubmitted: false,
  });

  const handleMemberChange = (field, value) => {
    setSelectedMember((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNewFamilyChange = (field, value) => {
    if (field === "category") {
      setNewFamilyData((prev) => ({
        ...prev,
        [field]: value,
        jati: "",
        upjati: "",
        lok: selectedLok,
        vidhan: vidhansabha_name,
      }));
    } else if (field === "formEFSubmitted" && value === true) {
      // If Form EF Submitted is checked, automatically check Form EF Received
      setNewFamilyData((prev) => ({
        ...prev,
        formEFSubmitted: true,
        formEFReceived: true,
      }));
    } else {
      setNewFamilyData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmitFamily = async () => {
    try {
      let payload = [];

      const formEFStatus = [];
      if (newFamilyData.formEFReceived) formEFStatus.push("Form EF Received");
      if (newFamilyData.formEFSubmitted) formEFStatus.push("Form EF Submitted");
      const formEFValue = formEFStatus.join(", ");

      const vidhansabha_no = sessionStorage.getItem("vidhansabha_no") || "";
      const booth_number = sessionStorage.getItem("booth_number") || "";

      if (familyMembers.length > 0) {
        payload = familyMembers.map((member) => ({
          ...member,
          formEF: formEFValue,
          add1_number: vidhansabha_no, // ⭐ NEW
          booth_number: booth_number, // ⭐ NEW
        }));
      } else {
        const { name, mukhiya, address } = newFamilyData;

        if (!name || !mukhiya || !address) {
          alert("❌ कृपया नाम, मुखिया और पता भरें");
          return;
        }

        payload = [
          {
            ...newFamilyData,
            formEF: formEFValue,
            add1_number: vidhansabha_no, // ⭐ NEW
            booth_number: booth_number, // ⭐ NEW
          },
        ];
      }

      console.log("Payload to add new family:", payload);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/addNewFamily`,
        {
          familyMembers: payload,
          allotted_newvoter_table_name: allotted_newvoter_table_name,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      console.log("Add Family response:", response.data);
      if (response.data.status) {
        alert("✅ परिवार सफलतापूर्वक जोड़ा गया!");
        setFamilyMembers([]);
        setNewFamilyData({
          name: "",
          father: "",
          house: "",
          age: "",
          gender: "",
          polling_station: "",
          station_address: "",
          mukhiya: "",
          address: "",
          category: "",
          jati: "",
          upjati: "",
          mobileno: "",
          person_mobile_number: "",
          voterof: "",
          votein2003: "",
          formEFReceived: false,
          formEFSubmitted: false,
        });
        setShowAddFamilyForm(false);
        if (lastSearch) handleSearch({ preventDefault: () => {} });
        window.location.reload();
      } else {
        alert("⚠ परिवार जोड़ने में असफल: " + response.data.error);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding family:", error);
      alert("❌ सर्वर त्रुटि! कृपया बाद में प्रयास करें।");
    }
  };

  const handleAddNewFamilyClick = () => {
    setShowAddFamilyForm(true);
    setNewFamilyData((prev) => ({
      ...prev,
      polling_station: polling_station || "",
      station_address: selectedAddress || "",
      loksabha: "INDIA" || "",
      vidhansabha: vidhansabha_name || "",
    }));
  };

  const handleNewVoterChange = (field, value) => {
    if (field === "category") {
      setNewVoterData((prev) => ({
        ...prev,
        [field]: value,
        jati: "",
        upjati: "",
      }));
    } else {
      setNewVoterData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      console.log("Selected Member to update:", selectedMember);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/update-person`,
        {
          person: selectedMember,
          allotted_newvoter_table_name: allotted_newvoter_table_name,
        }
      );
      console.log(selectedMember);
      console.log("Update response:", response.data);
      if (response.data.success) {
        alert("✅ Record updated successfully!");
        setShowEditForm(false);
        if (lastSearch) handleSearch({ preventDefault: () => {} });
        window.location.reload();
      } else {
        alert("⚠ Failed to update record: " + response.data.message);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error during update!");
      window.location.reload();
    }
  };

  const handleAddNewVoter = async () => {
    try {
      if (!newVoterData.name || !newVoterData.age || !selectedFamilyId) {
        alert("❌ कृपया नाम, उम्र और Family ID भरें");
        return;
      }
      const payload = {
        ...newVoterData,
        family_id: selectedFamilyId,
      };
      console.log(
        "Payload to add new voter:",
        payload,
        "AND FID:",
        selectedFamilyId
      );
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/addNewFamilyMember`,
        {
          payload: payload,
          allotted_newvoter_table_name: allotted_newvoter_table_name,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.status) {
        alert("✅ नया मतदाता सफलतापूर्वक जोड़ा गया!");
        setShowAddVoterForm(false);
        setNewVoterData({
          name: "",
          age: "",
          gender: "",
          mobileno: "",
          category: "",
          jati: "",
          upjati: "",
          person_mobile_number: "",
          mukhiya: "",
          address: "",
        });
        setSelectedFamilyId("");
        if (lastSearch) handleSearch({ preventDefault: () => {} });
        window.location.reload();
      } else {
        alert("⚠ मतदाता जोड़ने में असफल: " + response.data.error);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding new voter:", error);
      alert("❌ सर्वर त्रुटि! कृपया बाद में प्रयास करें।");
      window.location.reload();
    }
  };

  const handleOpenAddVoterForm = (familyId, mukhiya = "", address = "") => {
    setSelectedFamilyId(familyId);
    setNewVoterData((prev) => ({
      ...prev,
      mukhiya: mukhiya,
      address: address,
    }));
    setShowAddVoterForm(true);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

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
    "family_id",
    "status",
  ];

  const handleCancelAddFamily = () => {
    setNewFamilyData({
      name: "",
      father: "",
      house: "",
      age: "",
      gender: "",
      polling_station: "",
      station_address: "",
      mukhiya: "",
      address: "",
      category: "",
      jati: "",
      upjati: "",
      mobileno: "",
      person_mobile_number: "",
      loksabha: "",
      vidhansabha: "",
      voterof: "",
      votein2003: "",
      formEFReceived: false,
      formEFSubmitted: false,
    });
    setFamilyMembers([]);
    setShowAddFamilyForm(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!pollingStation) return;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/search-booth`,
        { pollingStation },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        const data = response.data.data;
        const grouped = data.reduce((acc, person) => {
          const fid = person.family_id || "UNKNOWN";
          if (!acc[fid]) acc[fid] = [];
          acc[fid].push(person);
          return acc;
        }, {});
        const multi = {};
        const single = {};
        for (const [fid, members] of Object.entries(grouped)) {
          if (members.length > 1) multi[fid] = members;
          else single[fid] = members;
        }
        setGroupedData(grouped);
        setMultiFamilies(multi);
        setSingleFamilies(single);
        setLastSearch(pollingStation);
      } else {
        alert(response.data.message);
        setGroupedData({});
        setMultiFamilies({});
        setSingleFamilies({});
        setLastSearch(pollingStation);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Server error! Please try again later.");
      window.location.reload();
    }
  };

  const handleRowClick = (member) => {
    setSelectedMember(member);
    setShowEditForm(true);
  };

  return (
    <div className="dash-booth-container" id="dashBoothContainer">
      <div className="dash-booth-card" id="dashBoothCard">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
        <h2 className="dash-booth-title" id="dashBoothTitle">
          🗳 बूथ खोज पोर्टल
        </h2>
        <p className="dash-booth-subtitle" id="dashBoothSubtitle">
          कृपया Polling Station चुनें
        </p>
        <h3 className="dash-booth-current">
          📍 Current Booth: {selectedStation} — {selectedAddress}
        </h3>
        <button className="add-family-btn" onClick={handleAddNewFamilyClick}>
          ➕ नया परिवार जोड़ें
        </button>
      </div>

      {showAddFamilyForm && (
        <div className="dash-booth-modal">
          <div className="dash-booth-modal-content">
            <h3>🏡 नया परिवार जोड़ें</h3>
            <h4>👨‍👩‍👧‍👦 परिवार की जानकारी</h4>
            <button
              className="top-cancel-btn"
              onClick={handleCancelAddFamily}
              style={{
                background: "#ff4d4d",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              ❌ Cancel
            </button>

            <div className="form-group">
              <label>ID</label>
              <input
                type="text"
                value={newFamilyData.id}
                onChange={(e) => handleNewFamilyChange("id", e.target.value)}
                placeholder="ID"
              />
            </div>

            <div className="form-group">
              <label>नाम *</label>
              <input
                type="text"
                value={newFamilyData.name}
                onChange={(e) => handleNewFamilyChange("name", e.target.value)}
                placeholder="नाम"
              />
            </div>

            <div className="form-group">
              <label>पिता का नाम</label>
              <input
                type="text"
                value={newFamilyData.father}
                onChange={(e) =>
                  handleNewFamilyChange("father", e.target.value)
                }
                placeholder="पिता का नाम"
              />
            </div>

            <div className="form-group">
              <label>घर नंबर</label>
              <input
                type="text"
                value={newFamilyData.house}
                onChange={(e) => handleNewFamilyChange("house", e.target.value)}
                placeholder="घर नंबर"
              />
            </div>

            <div className="form-group">
              <label>उम्र</label>
              <input
                type="number"
                value={newFamilyData.age}
                onChange={(e) => handleNewFamilyChange("age", e.target.value)}
                placeholder="उम्र"
              />
            </div>

            <div className="form-group">
              <label>लिंग</label>
              <select
                value={newFamilyData.gender}
                onChange={(e) =>
                  handleNewFamilyChange("gender", e.target.value)
                }
              >
                <option value="">चुनें</option>
                <option value="पुरुष">पुरुष</option>
                <option value="महिला">महिला</option>
                <option value="अन्य">अन्य</option>
              </select>
            </div>

            <div className="form-group">
              <label>संबंध (Relation)</label>
              <select
                value={newFamilyData.kinType}
                onChange={(e) =>
                  handleNewFamilyChange("kinType", e.target.value)
                }
              >
                <option value="">संबंध चुनें</option>
                <option value="पिता">पिता (Father)</option>
                <option value="माता">माता (Mother)</option>
                <option value="पति">पति (Husband)</option>
                <option value="पत्नी">पत्नी (Wife)</option>
                <option value="पुत्र">पुत्र (Son)</option>
                <option value="पुत्री">पुत्री (Daughter)</option>
                <option value="भाई">भाई (Brother)</option>
                <option value="बहन">बहन (Sister)</option>
                <option value="दादा">दादा (Grandfather)</option>
                <option value="दादी">दादी (Grandmother)</option>
                <option value="नाना">नाना (Maternal Grandfather)</option>
                <option value="नानी">नानी (Maternal Grandmother)</option>
                <option value="अन्य">अन्य (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Postcode</label>
              <input
                type="text"
                value={newFamilyData.postcode}
                onChange={(e) =>
                  handleNewFamilyChange("postcode", e.target.value)
                }
                placeholder="Postcode"
              />
            </div>

            <div className="form-group">
              <label>मुखिया *</label>
              <input
                type="text"
                value={newFamilyData.mukhiya}
                onChange={(e) =>
                  handleNewFamilyChange("mukhiya", e.target.value)
                }
                placeholder="मुखिया"
              />
            </div>

            <div className="form-group">
              <label>पता *</label>
              <input
                type="text"
                value={newFamilyData.address}
                onChange={(e) =>
                  handleNewFamilyChange("address", e.target.value)
                }
                placeholder="पता"
              />
            </div>

            <div className="form-group">
              <label>श्रेणी</label>
              <select
                value={newFamilyData.category}
                onChange={(e) =>
                  handleNewFamilyChange("category", e.target.value)
                }
              >
                <option value="">श्रेणी चुनें</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OBC">OBC</option>
                <option value="GENERAL">GENERAL</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label>जाति</label>
              <select
                value={newFamilyData.jati}
                onChange={(e) => handleNewFamilyChange("jati", e.target.value)}
                disabled={!newFamilyData.category}
              >
                <option value="">जाति चुनें</option>
                {newFamilyData.category &&
                  jatiOptions[newFamilyData.category]?.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>उपजाति</label>
              <input
                type="text"
                value={newFamilyData.upjati}
                onChange={(e) =>
                  handleNewFamilyChange("upjati", e.target.value)
                }
                placeholder="उपजाति"
              />
            </div>

            <div className="form-group">
              <label>मोबाइल नंबर</label>
              <input
                type="text"
                value={newFamilyData.mobileno}
                onChange={(e) =>
                  handleNewFamilyChange("mobileno", e.target.value)
                }
                placeholder="मोबाइल नंबर"
              />
            </div>

            <div className="form-group">
              <label>Voter Of</label>
              <select
                value={newFamilyData.voterof}
                onChange={(e) =>
                  handleNewFamilyChange("voterof", e.target.value)
                }
              >
                <option value="">Select Party</option>
                {voterOfOptions.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Voted in 2003? *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="votein2003"
                    value="YES"
                    checked={newFamilyData.votein2003 === "YES"}
                    onChange={(e) =>
                      handleNewFamilyChange("votein2003", e.target.value)
                    }
                  />
                  YES
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="votein2003"
                    value="NO"
                    checked={newFamilyData.votein2003 === "NO"}
                    onChange={(e) =>
                      handleNewFamilyChange("votein2003", e.target.value)
                    }
                  />
                  NO
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Form EF Status</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newFamilyData.formEFReceived}
                    onChange={(e) =>
                      handleNewFamilyChange("formEFReceived", e.target.checked)
                    }
                  />
                  Form EF Received
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newFamilyData.formEFSubmitted}
                    onChange={(e) =>
                      handleNewFamilyChange("formEFSubmitted", e.target.checked)
                    }
                  />
                  Form EF Submitted
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Booth Number</label>
              <input
                type="text"
                value={sessionStorage.getItem("booth_number") || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Add1 Number</label>
              <input
                type="text"
                value={sessionStorage.getItem("vidhansabha_no") || ""}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={newFamilyData.status}
                onChange={(e) =>
                  handleNewFamilyChange("status", e.target.value)
                }
              >
                <option value="">Select Status</option>
                <option value="New Family">New Family</option>
                <option value="Existing Family">Existing Family</option>
              </select>
            </div>

            <div className="modal-btn-group">
              <button onClick={handleAddFamilyMember} className="add-btn">
                ➕ Add Member
              </button>
              <button onClick={handleSubmitFamily} className="save-btn">
                💾 Save Family
              </button>
              <button onClick={handleCancelAddFamily} className="close-btn">
                ❌ Cancel
              </button>
            </div>

            {familyMembers.length > 0 && (
              <div className="family-members-preview">
                <h4>👨‍👩‍👧‍👦 जोड़े गए सदस्य:</h4>
                <ul>
                  {familyMembers.map((m, idx) => (
                    <li key={idx}>
                      {m.name} ({m.age} वर्ष, {m.gender})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="dash-booth-results-container"
        id="dashBoothResultsContainer"
      >
        <h3 className="dash-booth-station-title">
          📍 Polling Station: {lastSearch.split(" — ")[0]}
        </h3>
        <p className="dash-booth-results-count">
          🏠 कुल परिवार: {Object.keys(multiFamilies).length} &nbsp;&nbsp; 👤
          अकेले व्यक्ति: {Object.keys(singleFamilies).length}
        </p>
        {Object.keys(multiFamilies).length > 0 && (
          <div className="dash-booth-multi-families">
            <h3 className="dash-booth-section-title">🏠 परिवार</h3>
            {Object.entries(multiFamilies).map(([fid, members]) => {
              const familyMukhiya = members[0]?.mukhiya || "";
              const mukhiyafather = members[0]?.father || "";
              return (
                <details key={fid} className="dash-booth-family-section">
                  <summary className="dash-booth-family-header">
                    <div className="family-header-content">
                      <span>👪 Family ID: {fid}</span>
                      <span>
                        🥸 Mukhiya: {familyMukhiya} / {mukhiyafather}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendFamilyWhatsApp(fid);
                        }}
                      >
                        📲 WhatsApp
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          callFamilyMukhiya(fid);
                        }}
                      >
                        ☎
                      </button>

                      <button
                        className="add-voter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddVoterForm(
                            fid,
                            familyMukhiya,
                            mukhiyafather
                          );
                        }}
                      >
                        ➕ Add New Voter
                      </button>
                    </div>
                  </summary>
                  <table className="dash-booth-results-table">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="dash-booth-table-header">
                            {col.replace("_", " ").toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((person, idx) => (
                        <tr
                          key={idx}
                          className="dash-booth-table-row"
                          onClick={() => handleRowClick(person)}
                        >
                          {columns.map((col) => (
                            <td key={col} className="dash-booth-table-cell">
                              {person[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        )}
        {Object.keys(singleFamilies).length > 0 && (
          <div className="dash-booth-single-families">
            <h3 className="dash-booth-section-title">👤 अकेले व्यक्ति</h3>
            {Object.entries(singleFamilies).map(([fid, members]) => {
              const familyMukhiya = members[0]?.mukhiya || "";
              const familyAddress = members[0]?.address || "";
              return (
                <details key={fid} className="dash-booth-family-section">
                  <summary className="dash-booth-family-header">
                    <div className="family-header-content">
                      <span>👤 Family ID: {fid}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendFamilyWhatsApp(fid);
                        }}
                      >
                        📲 WhatsApp
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          callFamilyMukhiya(fid);
                        }}
                      >
                        ☎
                      </button>
                      <button
                        className="add-voter-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddVoterForm(
                            fid,
                            familyMukhiya,
                            familyAddress
                          );
                        }}
                      >
                        ➕ Add New Voter
                      </button>
                    </div>
                  </summary>
                  <table className="dash-booth-results-table">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col} className="dash-booth-table-header">
                            {col.replace("_", " ").toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((person, idx) => (
                        <tr
                          key={idx}
                          className="dash-booth-table-row"
                          onClick={() => handleRowClick(person)}
                        >
                          {columns.map((col) => (
                            <td key={col} className="dash-booth-table-cell">
                              {person[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        )}
      </div>

      {showEditForm && selectedMember && (
        <div className="dash-booth-modal">
          <div className="dash-booth-modal-content">
            <h3>✏ Edit Record (ID: {selectedMember.id})</h3>
            <button onClick={() => setShowEditForm(false)}>❌ Close</button>
            <div className="form-group">
              <label>STATUS</label>
              <select
                value={selectedMember["status"] || ""}
                onChange={(e) => handleMemberChange("status", e.target.value)}
              >
                <option value="Completed">सामान्य</option>
                <option value="Dead">मृतक</option>
                <option value="Shiftes">शिफ्टेड</option>
              </select>
            </div>
            {columns
              .filter((col) => col !== "status")
              .map((col) => (
                <div key={col} className="form-group">
                  <label>{col.replace("_", " ").toUpperCase()}</label>
                  {col === "family_id" ? (
                    <input
                      type="text"
                      value={selectedMember[col] || ""}
                      readOnly
                      style={{
                        backgroundColor: "#f3f3f3",
                        cursor: "not-allowed",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedMember[col] || ""}
                      onChange={(e) => handleMemberChange(col, e.target.value)}
                    />
                  )}
                </div>
              ))}
            <div className="modal-btn-group">
              <button onClick={handleSaveChanges}>💾 Save</button>
              <button onClick={() => setShowEditForm(false)}>❌ Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddVoterForm && (
        <div className="dash-booth-modal">
          <div className="dash-booth-modal-content">
            <h3>➕ नया मतदाता जोड़ें</h3>
            <p className="family-id-display">
              Family ID: <strong>{selectedFamilyId}</strong>
            </p>
            <button className="back-btn" onClick={() => navigate(-1)}>
              ⬅ Back
            </button>

            <div className="form-group">
              <label>Voter ID</label>
              <input
                type="text"
                value={newVoterData.voterid}
                onChange={(e) =>
                  handleNewVoterChange("voterid", e.target.value)
                }
                placeholder="Voter ID (यदि उपलब्ध हो)"
              />
            </div>

            <div className="form-group">
              <label>नाम *</label>
              <input
                type="text"
                value={newVoterData.name}
                onChange={(e) => handleNewVoterChange("name", e.target.value)}
                placeholder="मतदाता का पूरा नाम"
              />
            </div>

            <div className="form-group">
              <label>संबंधित का नाम</label>
              <input
                type="text"
                value={newVoterData.father}
                onChange={(e) => handleNewVoterChange("father", e.target.value)}
                placeholder="संबंधित का नाम"
              />
            </div>

            <div className="form-group">
              <label>रिश्ता</label>
              <select
                value={newVoterData.kinType}
                onChange={(e) =>
                  handleNewVoterChange("kinType", e.target.value)
                }
              >
                <option value="">संबंध चुनें</option>
                <option value="पुत्र">पुत्र</option>
                <option value="पुत्री">पुत्री</option>
                <option value="पत्नी">पत्नी</option>
                <option value="पति">पति</option>
                <option value="अन्य">अन्य</option>
              </select>
            </div>

            <div className="form-group">
              <label>घर नंबर</label>
              <input
                type="text"
                value={newVoterData.house}
                onChange={(e) => handleNewVoterChange("house", e.target.value)}
                placeholder="घर नंबर"
              />
            </div>

            <div className="form-group">
              <label>उम्र *</label>
              <input
                type="number"
                value={newVoterData.age}
                onChange={(e) => handleNewVoterChange("age", e.target.value)}
                placeholder="उम्र"
              />
            </div>

            <div className="form-group">
              <label>लिंग</label>
              <select
                value={newVoterData.gender}
                onChange={(e) => handleNewVoterChange("gender", e.target.value)}
              >
                <option value="">लिंग चुनें</option>
                <option value="पुरुष">पुरुष</option>
                <option value="महिला">महिला</option>
                <option value="अन्य">अन्य</option>
              </select>
            </div>

            <div className="form-group">
              <label>मोबाइल नंबर</label>
              <input
                type="tel"
                value={newVoterData.mobileno}
                onChange={(e) =>
                  handleNewVoterChange("mobileno", e.target.value)
                }
                placeholder="मोबाइल नंबर"
                maxLength="10"
              />
            </div>

            <div className="form-group">
              <label>Voter Info</label>
              <select
                value={newVoterData.status}
                onChange={(e) => handleNewVoterChange("status", e.target.value)}
              >
                <option value="">Voter Info</option>
                <option value="18 Present Voter">
                  नया वोटर (18 वर्ष से अधिक)
                </option>
                <option value="18 New Voter">नया वोटर (18 वर्ष से कम)</option>
              </select>
            </div>

            <div className="modal-btn-group">
              <button onClick={handleAddNewVoter} className="save-btn">
                💾 Save New Voter
              </button>
              <button
                onClick={() => setShowAddVoterForm(false)}
                className="close-btn"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};