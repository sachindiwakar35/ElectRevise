const express = require("express");
const axios = require("axios");
const router = express.Router();
const con = require("../db");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
const SECRET_KEY = "Your_Secret_Key";
router.post("/master", async (req, res) => {
  try {
    const { mobile_no } = req.body;

    if (!mobile_no) {
      return res.json({
        status: false,
        message: "Mobile number required",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    // Save OTP in DB
    await con.query(
      "INSERT INTO registerdata (number, otp) VALUES (?, ?)",
      [mobile_no, otp]
    );

    // SEND OTP SMS
    await axios.get(
      `https://api.msg91.com/api/v5/otp?template_id=YOUR_TEMPLATE_ID&mobile=91${mobile_no}&authkey=YOUR_AUTH_KEY&otp=${otp}`
    );

    return res.json({
      status: true,
      message: "OTP Sent Successfully",
    });

  } catch (err) {
    console.log(err);
    return res.json({
      status: false,
      message: "Failed to send OTP",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { number, otp } = req.body;
    if (!number || !otp) {
      return res.status(400).json({
        status: false,
        message: "Number and OTP are required",
      });
    }
    if (!/^\d{10}$/.test(number)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid 10-digit number",
      });
    }
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid 4-digit OTP",
      });
    }
    const query = `
      SELECT * FROM registerdata 
      WHERE number = ? 
      ORDER BY sno DESC 
      LIMIT 1
    `;
    const [result] = await con.query(query, [number]);
    if (result.length === 0) {
      return res.status(401).json({
        status: false,
        message: "Invalid OTP",
      });
    }
    const latestOtp = result[0].otp;
    if (String(latestOtp) !== String(otp)) {
      return res.status(401).json({
        status: false,
        message: "Incorrect OTP",
      });
    }
    const token = jwt.sign({ number }, SECRET_KEY, { expiresIn: "1h" });
    await con.query("DELETE FROM registerdata WHERE number = ? AND sno != ?", [
      number,
      result[0].sno,
    ]);
    return res.json({
      status: true,
      message: "OTP verified successfully!",
      token,
    });
  } catch (err) {
    console.error("❌ Error in /verify-otp:", err);
    return res.status(500).json({
      status: false,
      message: "Server error during OTP verification",
    });
  }
});

router.get("/getDataFromMaster", async (req, res) => {
  try {
    const { number } = req.query;
    if (!number || number.length !== 10 || isNaN(number)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid 10-digit number",
      });
    }
    const q = `SELECT loksabha, vidhansabha FROM master WHERE number = ?`;
    const [result] = await con.query(q, [number]);
    const lokSabhaSet = new Set();
    const vidhanSabhaSet = new Set();
    result.forEach((row) => {
      const lok = row.loksabha ? String(row.loksabha).trim() : "";
      const vid = row.vidhansabha ? String(row.vidhansabha).trim() : "";
      if (lok) lokSabhaSet.add(lok);
      if (vid) vidhanSabhaSet.add(vid);
    });
    return res.json({
      status: true,
      lokSabha: [...lokSabhaSet],
      vidhanSabha: [...vidhanSabhaSet],
    });
  } catch (err) {
    console.error("❌ Error in /getDataFromMaster:", err);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
});

router.get("/getMasterNew", verifyToken, async (req, res) => {
  try {
    const { mobile_no } = req.query;
    console.log("🔍 Request received for number:", mobile_no);

    if (!mobile_no || mobile_no.length !== 10 || isNaN(mobile_no)) {
      return res.status(400).json({
        status: false,
        message: "Mobile Number are required",
      });
    }

    const query = `
      SELECT 
        jilla, 
        vidhansabha_no,
        vidhansabha, 
        booth_number, 
        worker_name,
        allotted_table_name,
        allotted_newvoter_table_name,
        position,
        mobile_no
      FROM master_new 
      WHERE mobile_no = ?
    `;

    const [rows] = await con.query(query, [mobile_no]);

    console.log("📦 Raw DB Response:", rows);

    return res.json({
      status: true,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("❌ Error in /gtMasterNew:", err);

    return res.status(500).json({
      status: false,
      message: "Server error while fetching station data",
    });
  }
});

router.get("/getBoothDetails", verifyToken, async (req, res) => {
  try {
    const { vidhansabha_no, booth_number, allotted_table_name } = req.query;
    if (!vidhansabha_no || !booth_number) {
      return res.status(400).json({
        status: false,
        message: "Missing vidhansabha_no or booth_number",
      });
    }
    const query = `
      SELECT 
        polling_station,
        add1 as vidhansabha_name
      FROM ${allotted_table_name}
      WHERE add1_number = ?
      LIMIT 1
    `;
    const [rows] = await con.query(query, [vidhansabha_no, booth_number]);
    return res.json({
      status: true,
      data: rows.length > 0 ? rows[0] : {},
    });
  } catch (err) {
    console.error("❌ Error in /getBoothDetails:", err);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching booth details",
    });
  }
});

router.get("/getFamilyMembers", verifyToken, async (req, res) => {
  try {
    const { family_id, allotted_newvoter_table_name } = req.query;
    if (!family_id || !allotted_newvoter_table_name) {
      return res.status(400).json({
        status: false,
        message: "family_id and allotted_newvoter_table_name are required",
      });
    }
    const familyIdNum = parseInt(family_id);
    const familyIdsToTry = [
      family_id,
      familyIdNum,
      family_id.toString().trim(),
    ];

    for (const fid of familyIdsToTry) {
      const sql = `SELECT * FROM ${allotted_newvoter_table_name} WHERE family_id = ?`;
      const [rows] = await con.query(sql, [fid]);
      if (rows.length > 0) {
        console.log("✅ Found data with family_id:", fid);
        console.log(rows);
        const cleanData = rows.map(cleanRow);
        return res.json({
          status: true,
          count: cleanData.length,
          data: cleanData,
        });
      }
    }
    console.log("❌ No data found for any family_id format");
    return res.json({
      status: true,
      count: 0,
      data: [],
      message: "No family data found.",
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({
      status: false,
      message: "Server error: " + err.message,
    });
  }
});

function cleanRow(row) {
  const cleaned = {};
  for (const key in row) {
    cleaned[key] = Buffer.isBuffer(row[key])
      ? row[key].toString("utf8").trim()
      : row[key] !== null && row[key] !== undefined
      ? row[key].toString().trim()
      : row[key];
  }
  return cleaned;
}

router.post("/addNewVoter", verifyToken, async (req, res) => {
  console.log("📥 ===== START: Received addNewVoter Request =====");
  console.log("📥 Full Request Body:", JSON.stringify(req.body, null, 2));

  try {
    const {
      voters,
      category,
      jati,
      upjati,
      mobileno,
      mukhiya,
      address,
      person_mobile_number,
      political_party,
      votein2003,
      formEF,
      allotted_table_name,
      allotted_newvoter_table_name,
      jilla,
      vidhansabha,
      polling_station,
    } = req.body;
    const singleVoterMode = !voters;
    if (!mukhiya || !address) {
      return res.status(400).json({
        status: false,
        error: "Mukhiya and Address are required",
      });
    }
    const checkQuery = `
      SELECT family_id 
      FROM ${allotted_newvoter_table_name} 
      WHERE mukhiya = ? AND address = ? 
      LIMIT 1
    `;
    const [familyRows] = await con.query(checkQuery, [mukhiya, address]);
    const finalFamilyId =
      familyRows.length > 0 && familyRows[0].family_id
        ? familyRows[0].family_id
        : "BJP-" + Date.now();
    if (singleVoterMode) {
      const {
        number,
        id,
        name,
        father,
        house,
        age,
        gender,
        kinType,
        year,
        date1,
        date2,
        add1,
        add2,
        postcode,
        booth_number,
        add1_number,
        add2_number,
      } = req.body;

      if (!id || !name) {
        return res.status(400).json({
          status: false,
          error: "Missing required fields: id and name",
        });
      }
      const newVoterQuery = `
        INSERT INTO ${allotted_newvoter_table_name} (
          number,id,name,father,house,age,gender,polling_station,
          station_address,kinType,year,date1,date2,add1,add2,postcode,
          mukhiya,address,category,jati,upjati,mobileno,
          person_mobile_number,booth_number,add1_number,add2_number,status,family_id,
          voterof,votein2003,formEF
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      const newVoterValues = [
        number || 0,
        id,
        name,
        father || "",
        house || "",
        age || 0,
        gender || "",
        polling_station || "",
        "",
        kinType || "",
        year || 0,
        date1 || "",
        date2 || "",
        add1 || "",
        add2 || "",
        postcode || 0,
        mukhiya,
        address,
        category || "",
        jati || "",
        upjati || "",
        mobileno || "",
        person_mobile_number || "",
        booth_number || "",
        add1_number || "",
        add2_number || "",
        "completed",
        finalFamilyId,
        political_party || "",
        votein2003 || "",
        formEF || "not_received",
      ];
      await con.query(newVoterQuery, newVoterValues);

      await con.query(
        `UPDATE ${allotted_table_name} SET status='completed', family_id=? WHERE id=?`,
        [finalFamilyId, id]
      );
      await updateVoterCount(jilla, vidhansabha, polling_station, 1);
      return res.status(200).json({
        status: true,
        message: "Voter added successfully",
        family_id: finalFamilyId,
      });
    }
    if (!Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No voters data received",
      });
    }
    const insertMultiQuery = `
      INSERT INTO ${allotted_newvoter_table_name} (
        number,id,name,father,house,age,gender,polling_station,
        station_address,kinType,year,date1,date2,add1,add2,postcode,
        mukhiya,address,category,jati,upjati,mobileno,
        person_mobile_number,booth_number,add1_number,add2_number,status,family_id,
        voterof,votein2003,formEF
      )
      VALUES ?
    `;
    const insertValues = voters.map((v) => [
      v.number || 0,
      v.id,
      v.name,
      v.father || "",
      v.house || "",
      v.age || 0,
      v.gender || "",
      v.polling_station || polling_station,
      v.station_address || "",
      v.kinType || "",
      v.year || 0,
      v.date1 || "",
      v.date2 || "",
      v.vidhansabha || "",
      v.loksabha || "",
      v.postcode || 0,
      mukhiya,
      address,
      category || "",
      jati || "",
      upjati || "",
      mobileno || "",
      person_mobile_number || "",
      v.booth_number || "",
      v.add1_number || "",
      v.add2_number || "",
      "completed",
      finalFamilyId,
      political_party || "",
      votein2003 || "",
      formEF || "not_received",
    ]);
    await con.query(insertMultiQuery, [insertValues]);
    const ids = voters.map((v) => v.id);
    await con.query(
      `UPDATE ${allotted_table_name} SET status='completed', family_id=? WHERE id IN (?)`,
      [finalFamilyId, ids]
    );
    await updateVoterCount( voters[0].booth_number, voters[0].add1_number, voters.length);
    return res.status(200).json({
      status: true,
      message: "All voters added successfully",
      family_id: finalFamilyId,
      total: voters.length,
    });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
});

router.post("/addNewSirVoter", verifyToken, async (req, res) => {
  console.log("📥 ===== START: Received addNewVoter Request =====");
  console.log("📥 Full Request Body:", JSON.stringify(req.body, null, 2));

  try {
    const {
      voters,
      category,
      jati,
      upjati,
      mobileno,
      mukhiya,
      address,
      person_mobile_number,
      political_party,
      votein2003,
      formEF,
      allotted_table_name,
      allotted_newvoter_table_name,
      jilla,
      vidhansabha,
      polling_station,
    } = req.body;
    
    const singleVoterMode = !voters;
    
    if (!mukhiya || !address) {
      return res.status(400).json({
        status: false,
        error: "Mukhiya and Address are required",
      });
    }

    // Create sir table name by adding "sir_" prefix
    const sir_allotted_table_name = "sir_" + allotted_table_name;

    // STEP 1: Check for existing family or create new family ID
    const checkQuery = `
      SELECT family_id 
      FROM ${allotted_newvoter_table_name} 
      WHERE mukhiya = ? AND address = ? 
      LIMIT 1
    `;
    const [familyRows] = await con.query(checkQuery, [mukhiya, address]);
    
    const finalFamilyId =
      familyRows.length > 0 && familyRows[0].family_id
        ? familyRows[0].family_id
        : "BJP-" + Date.now();

    if (singleVoterMode) {
      // Single voter processing
      const {
        number,
        id,
        name,
        father,
        house,
        age,
        gender,
        kinType,
        year,
        date1,
        date2,
        add1,
        add2,
        postcode,
        booth_number,
        add1_number,
        add2_number,
      } = req.body;

      if (!id || !name) {
        return res.status(400).json({
          status: false,
          error: "Missing required fields: id and name",
        });
      }

      // STEP 2: Update status to "wait" in allotted_table_name (keep as wait, don't change to completed)
      await con.query(
        `UPDATE ${allotted_table_name} SET status='wait' WHERE id=?`,
        [id]
      );

      // STEP 3: Insert into new voter table with status 'completed'
      const newVoterQuery = `
        INSERT INTO ${allotted_newvoter_table_name} (
          number,id,name,father,house,age,gender,polling_station,
          station_address,kinType,year,date1,date2,add1,add2,postcode,
          mukhiya,address,category,jati,upjati,mobileno,
          person_mobile_number,booth_number,add1_number,add2_number,status,family_id,
          voterof,votein2003,formEF
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      
      const newVoterValues = [
        number || 0,
        id,
        name,
        father || "",
        house || "",
        age || 0,
        gender || "",
        polling_station || "",
        "",
        kinType || "",
        year || 0,
        date1 || "",
        date2 || "",
        add1 || "",
        add2 || "",
        postcode || 0,
        mukhiya,
        address,
        category || "",
        jati || "",
        upjati || "",
        mobileno || "",
        person_mobile_number || "",
        booth_number || "",
        add1_number || "",
        add2_number || "",
        "completed",
        finalFamilyId,
        political_party || "",
        votein2003 || "",
        formEF || "not_received",
      ];
      
      await con.query(newVoterQuery, newVoterValues);

      // STEP 4: Insert into SIR table with status 'wait'
      const sirInsertQuery = `
        INSERT INTO ${sir_allotted_table_name} (
          number,id,name,father,house,age,gender,polling_station,
          station_address,kinType,year,date1,date2,add1,add2,postcode,
          booth_number,add1_number,add2_number,status
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      
      const sirInsertValues = [
        number || 0,
        id,
        name,
        father || "",
        house || "",
        age || 0,
        gender || "",
        polling_station || "",
        "",
        kinType || "",
        year || 0,
        date1 || "",
        date2 || "",
        add1 || "",
        add2 || "",
        postcode || 0,
        booth_number || "",
        add1_number || "",
        add2_number || "",
        "wait", // Status as 'wait' for sir table
      ];
      
      await con.query(sirInsertQuery, sirInsertValues);
      
      await updateVoterCount(jilla, vidhansabha, polling_station, 1);
      
      return res.status(200).json({
        status: true,
        message: "Voter added successfully",
        family_id: finalFamilyId,
      });
    }

    // Multi-voter processing
    if (!Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No voters data received",
      });
    }

    // STEP 2 (for multiple voters): Update status to "wait" for all voters in allotted_table_name
    const ids = voters.map((v) => v.id);
    if (ids.length > 0) {
      await con.query(
        `UPDATE ${allotted_table_name} SET status='wait' WHERE id IN (?)`,
        [ids]
      );
    }

    // STEP 3: Insert all voters into new voter table with status 'completed'
    const insertMultiQuery = `
      INSERT INTO ${allotted_newvoter_table_name} (
        number,id,name,father,house,age,gender,polling_station,
        station_address,kinType,year,date1,date2,add1,add2,postcode,
        mukhiya,address,category,jati,upjati,mobileno,
        person_mobile_number,booth_number,add1_number,add2_number,status,family_id,
        voterof,votein2003,formEF
      )
      VALUES ?
    `;
    
    const insertValues = voters.map((v) => [
      v.number || 0,
      v.id,
      v.name,
      v.father || "",
      v.house || "",
      v.age || 0,
      v.gender || "",
      v.polling_station || polling_station,
      v.station_address || "",
      v.kinType || "",
      v.year || 0,
      v.date1 || "",
      v.date2 || "",
      v.vidhansabha || "",
      v.loksabha || "",
      v.postcode || 0,
      mukhiya,
      address,
      category || "",
      jati || "",
      upjati || "",
      mobileno || "",
      person_mobile_number || "",
      v.booth_number || "",
      v.add1_number || "",
      v.add2_number || "",
      "completed",
      finalFamilyId,
      political_party || "",
      votein2003 || "",
      formEF || "not_received",
    ]);
    
    await con.query(insertMultiQuery, [insertValues]);

    // STEP 4: Insert all voters into SIR table with status 'wait'
    const sirMultiInsertQuery = `
      INSERT INTO ${sir_allotted_table_name} (
        number,id,name,father,house,age,gender,polling_station,
        station_address,kinType,year,date1,date2,add1,add2,postcode,
        booth_number,add1_number,add2_number,status
      )
      VALUES ?
    `;
    
    const sirInsertValues = voters.map((v) => [
      v.number || 0,
      v.id,
      v.name,
      v.father || "",
      v.house || "",
      v.age || 0,
      v.gender || "",
      v.polling_station || polling_station,
      v.station_address || "",
      v.kinType || "",
      v.year || 0,
      v.date1 || "",
      v.date2 || "",
      v.vidhansabha || "",
      v.loksabha || "",
      v.postcode || 0,
      v.booth_number || "",
      v.add1_number || "",
      v.add2_number || "",
      "wait", // Status as 'wait' for sir table
    ]);
    
    await con.query(sirMultiInsertQuery, [sirInsertValues]);
    
    await updateVoterCount(voters[0].booth_number, voters[0].add1_number, voters.length);
    
    return res.status(200).json({
      status: true,
      message: "All voters added successfully",
      family_id: finalFamilyId,
      total: voters.length,
    });
    
  } catch (error) {
    console.error("❌ API ERROR:", error);
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
});

// Helper function for updating voter count
async function updateVoterCount(jilla, vidhansabha, polling_station, count) {
  try {
    const updateQuery = `
      UPDATE voter_counts 
      SET total_voters = total_voters + ?
      WHERE jilla = ? AND vidhansabha = ? AND polling_station = ?
    `;
    await con.query(updateQuery, [count, jilla, vidhansabha, polling_station]);
  } catch (error) {
    console.error("Error updating voter count:", error);
  }
}


async function updateVoterCount(booth_number, vidhansabha_no, processedCount) {
  try {
    // Check existing row
    const checkQuery = `
      SELECT completedvoter 
      FROM votercount 
      WHERE booth_number=? AND vidhansabha_no=? LIMIT 1
    `;
    const [rows] = await con.query(checkQuery, [ 
      booth_number,
      vidhansabha_no
    ]);
    if (rows.length > 0) {
      const updateQuery = `
        UPDATE votercount 
        SET completedvoter = completedvoter + ?
        WHERE booth_number=? AND vidhansabha_no = ? 
      `;
      await con.query(updateQuery, [
        processedCount,
        booth_number,
        vidhansabha_no,
      ]);
    }
  } catch (err) {
    console.error("❌ Error updating votercount:", err.message);
  }
}

router.get("/Data", verifyToken, async (req, res) => {
  try {
    const { lok, vidhan, station, address } = req.query;
    if (!lok || !vidhan || !station) {
      return res.status(400).json({
        error: "Missing required parameters: lok, vidhan, station",
        details: { lok, vidhan, station },
      });
    }
    let query = `
      SELECT 
        c.*,
        CASE 
          WHEN n.family_id IS NOT NULL THEN 'completed' 
          ELSE 'pending' 
        END as status,
        n.family_id,
        n.category,
        n.jati,
        n.upjati,
        n.mobileno,
        n.mukhiya,
        n.address
      FROM completecollection c
      LEFT JOIN newvotercollection n ON c.id = n.id
      WHERE c.add1 LIKE ? AND c.add2 LIKE ? AND c.polling_station LIKE ?
    `;
    const params = [`%${lok}%`, `%${vidhan}%`, `%${station}%`];
    if (address && address !== "null") {
      query += " AND c.station_address LIKE ?";
      params.push(`%${address}%`);
    }
    query += " ORDER BY c.number";
    const [rows] = await con.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      error: "Database query failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.post("/addNewFamily", verifyToken, async (req, res) => {
  try {
    const { familyMembers, allotted_newvoter_table_name } = req.body;

    if (!familyMembers || !Array.isArray(familyMembers) || familyMembers.length === 0) {
      return res.status(400).json({
        status: false,
        message: "familyMembers array is required and cannot be empty",
      });
    }

    const qu = `SELECT * FROM ${allotted_newvoter_table_name} LIMIT 1`;
    const [refRows] = await con.query(qu);
    const ref = refRows[0] || {};

    const randomNum = Date.now() + Math.floor(Math.random() * 9999);
    const family_id = `BJP-${randomNum}`;
    console.log("🆔 Generated Family ID:", family_id);

    const insertQuery = `
      INSERT INTO ${allotted_newvoter_table_name}
      (
        number, id, name, father, house, age, gender, raw,
        polling_station, station_address, deleted, kinType, extra,
        year, date1, date2, add1, add2, jilla, postcode, mukhiya,
        address, category, jati, upjati, mobileno, voterof,
        family_id, votein2003, formEF, person_mobile_number,
        booth_number, add1_number, add2_number, status, created_at
      )
      VALUES ?
    `;
    const values = familyMembers.map((m) => [
      m.number || "",
      m.id || "",
      m.name || "",
      m.father || "",
      m.house || "",
      m.age || "",
      m.gender || "",
      m.raw || "",
      ref.polling_station || "",
      ref.station_address || "",
      m.deleted || "",
      m.kinType || "",
      m.extra || "",
      m.year || "",
      m.date1 || "",
      m.date2 || "",
      ref.add1 || "",
      ref.add2 || "",
      m.jilla || "",
      m.postcode || "",
      m.mukhiya || "",
      m.address || "",
      m.category || "",
      m.jati || "",
      m.upjati || "",
      m.mobileno || "",
      m.voterof || "",
      family_id,
      m.votein2003 || "",
      m.formEF || "",
      m.person_mobile_number || "",
      m.booth_number || "",
      m.add1_number || "",
      ref.add2_number || "",
      m.status || "",
      new Date()
    ]);

    const [result] = await con.query(insertQuery, [values]);

    console.log("✅ Family Insert Successful, Rows:", result.affectedRows);

    return res.json({
      status: true,
      message: "Family added successfully",
      family_id: family_id,
      inserted_rows: result.affectedRows,
    });

  } catch (error) {
    console.error("❌ Error inserting new family:", error);
    return res.status(500).json({
      status: false,
      error: error.sqlMessage || error.message,
    });
  }
});

router.post("/addNewFamilyMember", async (req, res) => {
  const { payload, allotted_newvoter_table_name } = req.body;

  try {
    const qu = `SELECT * FROM ${allotted_newvoter_table_name} WHERE family_id = ? LIMIT 1`;
    const [rows] = await con.query(qu, [payload.family_id]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({
        status: false,
        error: "Family ID not found in database",
      });
    }
    const family = rows[0];

    const insertQuery = `
      INSERT INTO ${allotted_newvoter_table_name}
      (id, name, father, house, age, gender, polling_station, station_address, kinType, year, date1, date2,
       add1, add2, jilla, postcode, mukhiya, address, category, jati, upjati, mobileno, voterof, family_id,
       person_mobile_number, booth_number, add1_number, add2_number, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const values = [
      payload.voterid,
      payload.name,
      payload.father?.trim() || "",
      payload.house?.trim() || "",
      payload.age || "",
      payload.gender || "",
      family.polling_station || "",
      family.station_address || "",
      payload.kinType || "",
      family.year || "",
      family.date1 || "",
      family.date2 || "",
      family.add1 || "",
      family.add2 || "",
      family.jilla || "",
      family.postcode || "",
      payload.mukhiya?.trim() || "",
      payload.address?.trim() || "",
      family.category || "",
      family.jati || "",
      family.upjati || "",
      payload.mobileno || "",
      family.voterof || "",
      family.family_id || "",
      family.person_mobile_number || "",
      family.booth_number || "",
      family.add1_number || "",
      family.add2_number || "",
      payload.status || "pending",
    ];
    const [result] = await con.query(insertQuery, values);
    return res.json({
      status: true,
      message: "New voter added successfully",
      insertedId: result.insertId,
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.sqlMessage || error.message || "Database error",
    });
  }
});

router.post("/search-booth", async (req, res) => {
  try {
    const { add1_number, pollingStation, allotted_newvoter_table_name } =
      req.body;

    // STEP 1️⃣ — FIND MATCHING ROWS
    const sql1 = `
      SELECT *
      FROM ${allotted_newvoter_table_name}
      WHERE add1_number = ? AND booth_number = ?
    `;
    const params1 = [add1_number, pollingStation];

    const [collectionRows] = await con.query(sql1, params1);

    if (collectionRows.length === 0) {
      return res.json({
        success: false,
        message: "इस Booth संयोजन के लिए कोई डेटा नहीं मिला ⚠️",
      });
    }

    // STEP 2️⃣ — COLLECT FAMILY IDs
    const familyIds = [
      ...new Set(collectionRows.map((p) => p.family_id).filter(Boolean)),
    ];

    // If no family_id → directly return results
    if (familyIds.length === 0) {
      return res.json({
        success: true,
        message: "Booth डेटा सफलतापूर्वक मिला",
        count: collectionRows.length,
        data: collectionRows,
      });
    }

    // STEP 3️⃣ — FETCH ALL FAMILY MEMBERS ONCE
    const placeholders = familyIds.map(() => "?").join(",");
    const sql2 = `
      SELECT *
      FROM ${allotted_newvoter_table_name}
      WHERE family_id IN (${placeholders})
    `;
    const [familyRows] = await con.query(sql2, familyIds);

    // STEP 4️⃣ — REMOVE DUPLICATES USING 'id'
    const unique = [];
    const seen = new Set();

    for (const row of familyRows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        unique.push(row);
      }
    }

    // STEP 5️⃣ — SORT FAMILY-WISE
    const sorted = unique.sort((a, b) =>
      (a.family_id || "").localeCompare(b.family_id || "")
    );

    return res.json({
      success: true,
      message: "Booth डेटा सफलतापूर्वक मिला",
      count: sorted.length,
      data: sorted,
    });
  } catch (error) {
    console.error("❌ Error in /search-booth:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
});

router.post("/update-person", async (req, res) => {
  try {
    const { person, allotted_newvoter_table_name } = req.body;
    const id = String(person.id);
    const {
      sno,
      number,
      created_at,
      updated_at,
      id: _ignoredId, 
      ...fieldsToUpdate
    } = person;

    const filteredFields = {};
    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] !== undefined) {
        filteredFields[key] = fieldsToUpdate[key];
      }
    });

    if (Object.keys(filteredFields).length === 0) {
      return res.json({ success: false, message: "No fields to update" });
    }

    const setClause = Object.keys(filteredFields)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(filteredFields);

    const updateQuery = `
      UPDATE ${allotted_newvoter_table_name}
      SET ${setClause}
      WHERE id = ?
    `;
    console.log("🛠 SQL:", updateQuery, [...values, id]);
    const [result] = await con.query(updateQuery, [...values, id]);
    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: "No record found with the specified ID",
      });
    }
    return res.json({
      success: true,
      message: "Record updated successfully",
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
});

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(403);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.get("/getVoterData", verifyToken, async (req, res) => {
  try{
    const {
      vidhan,
      booth_number,
      allotted_newvoter_table_name,
      allotted_table_name,
    } = req.query;

    const sirTable =  allotted_table_name;
    if (!vidhan) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }
    const q = `SELECT * FROM ${sirTable} WHERE add1_number = ? AND booth_number = ?`;
    console.log("query->",q);
    const [rows] = await con.query(q, [vidhan, booth_number]);
    res.json(rows);
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

router.get("/getVoterSirData", verifyToken, async (req, res) => {
  try {
    const { vidhan, booth_number, allotted_table_name } = req.query;
    if (!vidhan || !booth_number || !allotted_table_name) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }
    const mainTable = allotted_table_name;
    const sirTable = "sir_" + allotted_table_name;

    const [sirRows] = await con.query(
      `SELECT * FROM \`${sirTable}\` WHERE booth_number = ?`,
      [booth_number]
    );

    const [mainRows] = await con.query(
      `SELECT * FROM \`${mainTable}\` WHERE booth_number = ?`,
      [booth_number]
    );
    return res.json({
      sirData: sirRows,
      mainData: mainRows,
    });
  } catch (err) {
    console.error("getVoterSirData ERROR:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});


router.get("/getStationSirData", verifyToken, async (req, res) => {
  try {
    let { vidhan, booth_number, allotted_table_name, startingRange, endingRange } = req.query;

    // 1️⃣ Basic validation
    if (!vidhan || !booth_number || !allotted_table_name) {
      return res.status(400).json({
        error: "Missing required query parameters"
      });
    }

    // 2️⃣ booth_number ko number me convert karo
    booth_number = Number(booth_number);
    if (isNaN(booth_number)) {
      return res.status(400).json({
        error: "booth_number must be a valid number"
      });
    }

    const mainTable = allotted_table_name;
    const sirTable = "sir_" + allotted_table_name;

    const startRange = startingRange;
    const endRange = endingRange;

    // 3️⃣ Sir table query (safe even if records < 50)
    const [sirRows] = await con.query(
      `SELECT * FROM \`${sirTable}\`
       WHERE booth_number BETWEEN ? AND ?`,
      [startRange, endRange]
    );

    // 4️⃣ Main table query
    const [mainRows] = await con.query(
      `SELECT * FROM \`${mainTable}\`
       WHERE booth_number = ?`,
      [booth_number]
    );
    console.log("Main Table data", mainRows);

    // 5️⃣ Graceful handling if no data found
    if (sirRows.length === 0 && mainRows.length === 0) {
      return res.status(404).json({
        message: "No data found for given booth range",
        sirData: [],
        mainData: []
      });
    }

    // 6️⃣ Success response
    return res.status(200).json({
      boothRange: `${startRange} - ${endRange}`,
      sirCount: sirRows.length,
      sirData: sirRows,
      mainData: mainRows
    });

  } catch (err) {
    console.error("getStationSirData ERROR:", err);

    // 7️⃣ Database / unexpected error handling
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
});


router.post("/updateVoter", async (req, res) => {
  try {
    const {
      voterId,
      name,
      mukhiya,
      address,
      category,
      jati,
      upjati,
      mobileno,
      votein2003,
      voterof,
      formEF,
      family_id,
      status,
      tableName,
    } = req.body;
    console.log(tableName);
    const updateQuery = `
      UPDATE ${tableName} 
      SET name = ?, mukhiya = ?, address = ?, category = ?, jati = ?, upjati = ?, 
          mobileno = ?, votein2003 = ?, voterof = ?, formEF = ?, family_id = ?, status = ?
      WHERE id = ?
    `;

    const values = [
      name,
      mukhiya,
      address,
      category,
      jati,
      upjati,
      mobileno,
      votein2003,
      voterof,
      formEF,
      family_id,
      status,
      voterId,
    ];

    await con.execute(updateQuery, values);

    res.json({ success: true, message: "Voter updated successfully" });
  } catch (error) {
    console.error("Update voter error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/updateMultipleVoters", async (req, res) => {
  try {
    const { voters } = req.body;
    for (const voter of voters) {
      const {
        voterId,
        name,
        mukhiya,
        address,
        category,
        jati,
        upjati,
        mobileno,
        votein2003,
        voterof,
        formEF,
        family_id,
        status,
        tableName,
      } = voter;

      const updateQuery = `
        UPDATE ${tableName} 
        SET name = ?, mukhiya = ?, address = ?, category = ?, jati = ?, upjati = ?, 
            mobileno = ?, votein2003 = ?, voterof = ?, formEF = ?, family_id = ?, status = ?
        WHERE id = ?
      `;
      const values = [
        name,
        mukhiya,
        address,
        category,
        jati,
        upjati,
        mobileno,
        votein2003,
        voterof,
        formEF,
        family_id,
        status,
        voterId,
      ];
      await con.execute(updateQuery, values);
    }

    res.json({
      success: true,
      message: `${voters.length} voters updated successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;