const express = require("express");
const router = express.Router();
const con = require("../db");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");
const ExcelJS = require('exceljs');
const uploadsDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
const SECRET_KEY = "Your_Secret_Key";

let zillaProgress = {
  processedFiles: 0,
  totalFiles: 0,
  processedRows: 0,
  totalRows: 0,
};

// Home
router.post("/checkUser", async (req, res) => {
  try {
    const { passkey } = req.body;
    console.log("📥 Incoming Passkey:", passkey);
    if (!passkey) {
      return res.status(400).json({
        status: false,
        message: "Passkey is required",
      });
    }
    if (passkey.length !== 4 || isNaN(passkey)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid 4-digit passkey",
      });
    }
    const query = `SELECT * FROM UserLogin WHERE passkey = ?`;
    const [result] = await con.query(query, [passkey]);
    if (result.length === 0) {
      return res.status(401).json({
        status: false,
        message: "Invalid passkey",
      });
    }
    const user = result[0];
    const token = jwt.sign(
      { userId: user.id, passkey: user.passkey },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    console.log("✅ Passkey verified successfully!");
    return res.json({
      status: true,
      message: "Passkey verified successfully!",
      token,
      user,
    });
  } catch (err) {
    console.error("❌ Database error in passkey verification:", err);
    return res.status(500).json({
      status: false,
      message: "Database error occurred",
    });
  }
});
// Middleware function
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({
      status: false,
      message: "Access denied. No token provided."
    });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: false,
        message: "Invalid or expired token"
      });
    }
    req.user = user;
    next();
  });
}

// AdminHome
router.get("/count-stats", async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT NULLIF(jilla, '')) AS totalJilla,
        COUNT(DISTINCT NULLIF(vidhansabha_no, '')) AS totalVidhansabha
      FROM masterjilla;
    `;
    const [result] = await con.query(query);
    console.log("✔️ Count Stats Result:", result[0]);
    return res.json({
      status: true,
      message: "Count stats fetched successfully",
      data: result[0],
    });
  } catch (err) {
    console.error("❌ Error fetching count stats:", err);
    return res.status(500).json({
      status: false,
      message: "Database error while fetching count stats",
    });
  }
});

// Upload
router.post("/uploadExcelMultipleToTable", upload.array("files", 101), async (req, res) => {
  try {
    const files = req.files;
    const { tableName } = req.body;
    if (!tableName) {
      return res.status(400).json({ status: false, message: "Missing tableName" });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No files uploaded",
      });
    }
    uploadProgress = {
      totalFiles: files.length,
      processedFiles: 0,
      totalRows: 0,
      processedRows: 0,
      currentTable: tableName,
    };
    console.log("📁 Files received:", files.length, "➡ inserting into:", tableName);
    res.json({
      status: true,
      message: `Upload started... Inserting into table: ${tableName}`,
      totalFiles: files.length,
      tableName,
    });
    processFilesIntoSelectedTable(files, tableName);
  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error during file upload",
      error: err.message,
    });
  }
});

async function processFilesIntoSelectedTable(files, tableName) {
  for (const file of files) {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      uploadProgress.totalRows += sheetData.length;
      for (const row of sheetData) {
        await insertRowIntoTable(tableName, row);
        uploadProgress.processedRows++;
      }
      uploadProgress.processedFiles++;
    } catch (err) {
      console.error("❌ Error processing file:", file.originalname, err);
    }
  }
}

async function insertRowIntoTable(tableName, row) {
  console.log("👉 TABLE NAME RECEIVED:", tableName, typeof tableName);
  try {
    let fixedRow = {};
    for (const key in row) {
      const normalized = normalizeColumnName(key);
      fixedRow[normalized] = row[key];
    }
    const manualFixes = {
      "ge_ender": "gender",
      "polling_station": "polling_station",
      "station_address": "station_address",
    };
    for (const badKey in manualFixes) {
      if (fixedRow[badKey] !== undefined) {
        fixedRow[manualFixes[badKey]] = fixedRow[badKey];
        delete fixedRow[badKey];
      }
    }
    await con.query(`INSERT INTO \`${tableName}\` SET ?`, fixedRow);
    uploadProgress.processedRows++;
  } catch (err) {
    console.error("Insert error:", err);
  }
}

function normalizeColumnName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_"); // replace spaces with _
}

router.get("/uploadProgress", (req, res) => {
  res.json(uploadProgress);
});

router.get("/lokvidhan", (req, res) => {
  const qy = `SELECT DISTINCT loksabha FROM lokvidhan ORDER BY loksabha`;
  con.query(qy, (err, result) => {
    if (err) {
      console.error("DB Error (Lok Sabha):", err);
      return res.status(500).json({ error: "Database error fetching Lok Sabha" });
    }
    // Return only an array of names
    console.log("Fetched Lok Sabha:", result); // 👈 ADD THIS
    const loksabhaList = result.map((row) => row.loksabha);
    res.json(loksabhaList);
  });
});

router.get("/vidhansabha", (req, res) => {
  const { loksabha } = req.query;
  if (!loksabha) {
    return res.status(400).json({ error: "Missing Lok Sabha parameter" });
  }
  const qy = `SELECT DISTINCT add2 AS vidhansabha 
              FROM completecollection 
              WHERE add1 = ? 
              ORDER BY add2`;
  con.query(qy, [loksabha], (err, result) => {
    if (err) {
      console.error("DB Error (Vidhan Sabha):", err);
      return res.status(500).json({ error: "Database error fetching Vidhan Sabha" });
    }
    const vidhanSabhaList = result.map((row) => row.vidhansabha);
    res.json(vidhanSabhaList);
  });
});

router.get("/fetchstationaddress", (req, res) => {
  const { loksabha, vidhansabha } = req.query;
  if (!loksabha || !vidhansabha)
    return res.status(400).json({ error: "Missing parameters (Lok Sabha or Vidhan Sabha)" });
  const qy = `SELECT DISTINCT station_address 
              FROM completecollection 
              WHERE add1 = ? AND add2 = ? 
              ORDER BY station_address`;
  con.query(qy, [loksabha, vidhansabha], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error fetching Station Address" });
    const stationList = result.map((row) => row.station_address);
    res.json(stationList);
  });
});

router.get("/fetchpollingstation", (req, res) => {
  const { loksabha, vidhansabha, stationaddress } = req.query;
  if (!loksabha || !vidhansabha || !stationaddress)
    return res.status(400).json({ error: "Missing parameters (Lok Sabha, Vidhan Sabha or Station Address)" });
  const qy = `SELECT DISTINCT polling_station 
              FROM completecollection 
              WHERE add1 = ? AND add2 = ? AND station_address = ?
              ORDER BY polling_station`;
  con.query(qy, [loksabha, vidhansabha, stationaddress], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error fetching Polling Station" });
    const pollingList = result.map((row) => row.polling_station);
    res.json(pollingList);
  });
});

router.get("/loksabha", (req, res) => {
  const qy = `SELECT DISTINCT add1 AS loksabha FROM completecollection ORDER BY add1`;
  con.query(qy, (err, result) => {
    if (err) {
      console.error("DB Error (Lok Sabha):", err);
      return res.status(500).json({ error: "Database error fetching Lok Sabha" });
    }
    // Return only an array of names
    console.log("Fetched Lok Sabha:", result); // 👈 ADD THIS
    const loksabhaList = result.map((row) => row.loksabha);
    res.json(loksabhaList);
  });
});

router.post("/mergedata", async (req, res) => {
  const { type, fromValue, toValue, jilla, vidhansabha, boothNumber } = req.body;
  if (!type || !fromValue || !toValue) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  console.log(type, fromValue, toValue, jilla, vidhansabha, boothNumber);
  try {
    let totalRowsAffected = 0;
    /* ---------------------- JILLA MERGE ---------------------- */
    if (type === "jilla") {
      const masterQuery = `UPDATE masterjilla SET jilla = ? WHERE jilla = ?`;
      const [masterResult] = await con.query(masterQuery, [toValue, fromValue]);
      totalRowsAffected += masterResult.affectedRows;
      const [masterRows] = await con.query(
        "SELECT voter_table_name FROM masterjilla WHERE jilla = ?",
        [toValue]
      );
      for (const row of masterRows) {
        if (row.voter_table_name) {
          const voterQuery = `UPDATE ?? SET jilla = ? WHERE jilla = ?`;
          const [voterResult] = await con.query(voterQuery, [
            row.voter_table_name,
            toValue,
            fromValue
          ]);
          totalRowsAffected += voterResult.affectedRows;
        }
      }
    }
    /* ---------------------- VIDHANSABHA MERGE ---------------------- */
    else if (type === "vidhansabha") {
      const masterQuery = `UPDATE masterjilla SET vidhansabha = ? WHERE vidhansabha = ?`;
      const [masterResult] = await con.query(masterQuery, [toValue, fromValue]);
      totalRowsAffected += masterResult.affectedRows;
      const [masterRows] = await con.query(
        "SELECT voter_table_name FROM masterjilla WHERE vidhansabha = ?",
        [toValue]
      );
      for (const row of masterRows) {
        if (row.voter_table_name) {
          const voterQuery = `UPDATE ?? SET vidhansabha = ? WHERE vidhansabha = ?`;
          const [voterResult] = await con.query(voterQuery, [
            row.voter_table_name,
            toValue,
            fromValue
          ]);
          totalRowsAffected += voterResult.affectedRows;
        }
      }
    }
    /* ---------------------- POLLING STATION MERGE ---------------------- */
    else if (type === "pollingstation") {
      if (!jilla || !vidhansabha) {
        return res.status(400).json({
          error: "Jilla and Vidhansabha are required for polling station merge",
        });
      }
      const [masterRows] = await con.query(
        "SELECT voter_table_name FROM masterjilla WHERE jilla = ? AND vidhansabha = ?",
        [jilla, vidhansabha]
      );
      if (!masterRows.length || !masterRows[0].voter_table_name) {
        return res.status(404).json({
          error: "Voter table not found for the specified jilla and vidhansabha",
        });
      }
      const voterTableName = masterRows[0].voter_table_name;
      // Update both polling_station and booth_number
      const voterQuery = `UPDATE ?? SET polling_station = ?, booth_number = ? WHERE polling_station = ?`;
      const [voterResult] = await con.query(voterQuery, [
        voterTableName,
        toValue,
        boothNumber || null, // Use provided booth number or null
        fromValue
      ]); 
      totalRowsAffected = voterResult.affectedRows;
    }
    res.json({
      success: true,
      message: `${type} merged successfully`,
      rowsAffected: totalRowsAffected,
    });
  } catch (err) {
    console.error("DB Error (Merge):", err);
    return res.status(500).json({ error: "Database merge failed" });
  }
});

router.post("/updatefinal", async (req, res) => {
  try {
    const { jilla, vidhansabha } = req.body;
    if (!jilla || !vidhansabha) {
      return res.status(400).json({
        success: false,
        message: "Jilla and Vidhansabha are required",
      });
    }
    // 1) Get voter table name
    const [masterRows] = await con.query(
      `SELECT voter_table_name 
       FROM masterjilla 
       WHERE jilla = ? AND vidhansabha = ?`,
      [jilla, vidhansabha]
    );
    if (masterRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Voter table not found for this Jilla & Vidhansabha",
      });
    }
    const voterTableName = masterRows[0].voter_table_name;
    // 2) Get voter count per polling station - filter out NULL polling stations
    const [pollingStationCounts] = await con.query(
      `SELECT 
          polling_station,
          ANY_VALUE(booth_number) AS booth_number,
          ANY_VALUE(add1_number) AS vidhansabha_no,
          COUNT(*) AS totalVoters
       FROM ??
       WHERE polling_station IS NOT NULL AND polling_station != ''
       GROUP BY polling_station`,
      [voterTableName]
    );
    console.log(`Found ${pollingStationCounts.length} polling stations`);
    let updated = 0;
    let inserted = 0;
    let skipped = 0;
    // 3) Process each polling station
    for (const p of pollingStationCounts) {
      const pollingStationName = p.polling_station;
      const booth_number = p.booth_number || "";
      const vidhansabha_no = p.vidhansabha_no || "";
      const totalVoter = p.totalVoters;
      // Ensure no NULL values for unique constraint
      if (!pollingStationName || pollingStationName.trim() === "") {
        console.warn(`Skipping record with empty polling station`);
        skipped++;
        continue;
      }
      try {
        const [result] = await con.query(
          `INSERT INTO votercount 
           (jilla, vidhansabha, polling_station, totalvoter, completedvoter, booth_number, vidhansabha_no)
           VALUES (?, ?, ?, ?, 0, ?, ?)
           ON DUPLICATE KEY UPDATE
               totalvoter = VALUES(totalvoter),
               booth_number = VALUES(booth_number),
               vidhansabha_no = VALUES(vidhansabha_no)`,
          [jilla, vidhansabha, pollingStationName.trim(), totalVoter, booth_number, vidhansabha_no]
        );
        if (result.affectedRows === 1) inserted++;
        if (result.affectedRows === 2) updated++;
      } catch (insertErr) {
        // Handle duplicate entry error
        if (insertErr.code === 'ER_DUP_ENTRY') {
          console.log(`Duplicate entry for ${jilla}, ${vidhansabha}, ${pollingStationName}`);
          // Try update instead
          const [updateResult] = await con.query(
            `UPDATE votercount 
             SET totalvoter = ?, booth_number = ?, vidhansabha_no = ?
             WHERE jilla = ? AND vidhansabha = ? AND polling_station = ?`,
            [totalVoter, booth_number, vidhansabha_no, jilla, vidhansabha, pollingStationName]
          );
          if (updateResult.affectedRows > 0) {
            updated++;
          }
        } else {
          throw insertErr;
        }
      }
    }
    return res.json({
      success: true,
      message: `Voter count processed: ${inserted} inserted, ${updated} updated, ${skipped} skipped`,
      totalPollingStations: pollingStationCounts.length,
      inserted,
      updated,
      skipped,
      jilla,
      vidhansabha,
    });
  } catch (err) {
    console.error("Update Final Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating final voter count",
      error: err.message,
    });
  }
});

router.post("/deletevoterdata", async (req, res) => {
  try {
    const { type, voter_table, polling_station } = req.body;
    // Validation
    if (!voter_table) {
      return res.status(400).json({ error: "Voter table is required" });
    }
    if (!polling_station) {
      return res.status(400).json({ error: "Polling Station is required" });
    }
    // Check if table exists
    const [tables] = await con.query(
      "SHOW TABLES LIKE ?", 
      [voter_table]
    );
    if (tables.length === 0) {
      return res.status(404).json({ 
        error: `Table "${voter_table}" does not exist in database` 
      });
    }
    if (type === "delete_polling_station") {
      // Delete specific polling station
      if (!polling_station) {
        return res.status(400).json({ error: "Polling station is required for this operation" });
      }
      // First check if polling station exists
      const [checkRows] = await con.query(
        `SELECT COUNT(*) as count FROM ?? WHERE polling_station = ?`,
        [voter_table, polling_station]
      );
      if (checkRows[0].count === 0) {
        return res.status(404).json({ 
          error: `Polling station "${polling_station}" not found in table "${voter_table}"` 
        });
      }
      // Delete the polling station
      const [result] = await con.query(
        `DELETE FROM ?? WHERE polling_station = ?`,
        [voter_table, polling_station]
      );
      return res.json({
        message: `✅ Polling station "${polling_station}" deleted successfully from table "${voter_table}"`,
        rowsAffected: result.affectedRows,
        table: voter_table,
        polling_station: polling_station
      });
    } else if (type === "delete_entire_table") {
      // Delete entire table data (but keep table structure)
      const confirmMessage = `Are you sure you want to delete ALL data from table "${voter_table}"? This action cannot be undone.`;
      // For safety, we'll use DELETE instead of TRUNCATE
      // First get count of records
      const [countRows] = await con.query(
        `SELECT COUNT(*) as total FROM ??`,
        [voter_table]
      );
      const totalRecords = countRows[0].total;
      if (totalRecords === 0) {
        return res.json({
          message: `ℹ️ Table "${voter_table}" is already empty`,
          rowsAffected: 0,
          table: voter_table
        });
      }
      // Delete all records
      const [result] = await con.query(
        `DELETE FROM ??`,
        [voter_table]
      );
      // Also remove from masterjilla if this table is referenced there
      try {
        await con.query(
          `DELETE FROM masterjilla WHERE voter_table_name = ?`,
          [voter_table]
        );
      } catch (masterErr) {
        console.log("Note: Could not remove from masterjilla, might not exist there");
      }
      return res.json({
        message: `✅ Successfully deleted ALL data from table "${voter_table}"`,
        rowsAffected: result.affectedRows,
        table: voter_table,
        totalRecords: totalRecords
      });
    } else {
      return res.status(400).json({ error: "Invalid delete type. Use 'delete_polling_station' or 'delete_entire_table'" });
    }
  } catch (err) {
    console.error("❌ Delete Error:", err);
    // Handle specific errors
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.status(404).json({ 
        error: `Table does not exist in database`,
        details: err.message
      });
    } 
    res.status(500).json({ 
      error: "Database error during deletion",
      details: err.message 
    });
  }
});

router.get("/lokvidhansabha", (req, res) => {
  const { loksabha } = req.query;
  if (!loksabha) {
    return res.status(400).json({ error: "Missing Lok Sabha parameter" });
  }
  const qy = `SELECT DISTINCT vidhansabha FROM lokvidhan WHERE loksabha = ? ORDER BY vidhansabha`;
  con.query(qy, [loksabha], (err, result) => {
    if (err) {
      console.error("DB Error (Vidhan Sabha):", err);
      return res.status(500).json({ error: "Database error fetching Vidhan Sabha" });
    }
    const vidhanSabhaList = result.map((row) => row.vidhansabha);
    res.json(vidhanSabhaList);
  });
});

router.get("/getmaster", (req, res) => {
  const q = "SELECT * FROM master ORDER BY id DESC";
  con.query(q, (err, results) => {
    if (err) {
      console.error("❌ Error fetching data:", err);
      return res.status(500).json({ error: "Failed to fetch data" });
    }
    res.status(200).json(results);
  });
});

router.get('/getMasterData', async (req, res) => {
  try {
    const [rows] = await con.execute('SELECT * FROM masterjilla');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/getAllData", (req, res) => {
  const { add1, add2 } = req.query;
  const qy = `
    SELECT polling_station, station_address
    FROM completecollection
    WHERE add1 = ? AND add2 = ?
    GROUP BY polling_station, station_address
    ORDER BY polling_station
  `;
  con.query(qy, [add1, add2], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(result);
  });
});

router.post("/uploadExcel", upload.single("file"), (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const query = `
      INSERT INTO master (name, number, loksabha, vidhansabha, polling_station, station_address, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    sheet.forEach((row) => {
      const values = [
        row.name,
        row.number,
        row.loksabha,
        row.vidhansabha,
        row.polling_station,
        row.station_address,
        row.position,
      ];
      con.query(query, values, (err) => {
        if (err) console.error("Insert error:", err);
      });
    });
    res.json({ message: "Data inserted successfully!" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

router.put("/updateMaster/:id", (req, res) => {
  const id = req.params.id;
  const { name, number, loksabha, vidhansabha, polling_station, station_address, position } = req.body;
  const q = `
    UPDATE master
    SET name=?, number=?, loksabha=?, vidhansabha=?, polling_station=?, station_address=?, position=?
    WHERE id=?`;
  con.query(q, [name, number, loksabha, vidhansabha, polling_station, station_address, position, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Update failed" });
    res.json({ success: true, message: "Updated successfully" });
  });
});

router.post("/addMaster", (req, res) => {
  const {
    name,
    number,
    loksabha,
    vidhansabha,
    polling_station,
    station_address,
    position,
  } = req.body;
  // ✅ Validate input
  if (
    !name ||
    !number ||
    !loksabha ||
    !vidhansabha ||
    !polling_station ||
    !station_address
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const q = `
    INSERT INTO master 
    (name, number, loksabha, vidhansabha, polling_station, station_address, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  con.query(q, [name, number, loksabha, vidhansabha, polling_station, station_address, position], (err, result) => {
      if (err) {
        console.error("❌ Error inserting data:", err);
        return res.status(500).json({ error: "Database error" });
      }
      console.log("✅ Data inserted:", result.insertId);
      return res.status(200).json({ message: "Data inserted successfully", id: result.insertId });
    }
  );
});

router.get("/getVidhans", (req, res) => {
  const query = "SELECT DISTINCT number, vidhansabha FROM master";
  con.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching vidhans:", err);
      return res.status(500).json({
        status: false,
        message: "Database error fetching vidhans",
      });
    }
    if (result.length > 0) {
      res.json({
        status: true,
        data: result,
      });
    } else {
      res.json({
        status: false,
        message: "No vidhansabha found in master table",
      });
    }
  });
});

router.get("/getPollingStations/:number", (req, res) => {
  const { number } = req.params;
  console.log(number);
  // 1️⃣ Get vidhansabha name for given number
  const getVidhan = `SELECT vidhansabha FROM master WHERE number = ? LIMIT 1`;
  con.query(getVidhan, [number], (err, result) => {
    if (err) {
      console.error("❌ Error fetching vidhansabha:", err);
      return res.status(500).json({
        status: false,
        message: "Database error while fetching vidhansabha",
      });
    }
    if (result.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Vidhansabha not found for given number",
      });
    }
    const vidhansabha = result[0].vidhansabha.trim();
    // 2️⃣ Join master + votercount using polling_station
    const query = `SELECT m.polling_station, m.station_address, COALESCE(v.totalvoter, 0) AS totalvoter, COALESCE(v.completedvoter, 0) AS completedvoter FROM master AS m LEFT JOIN votercount AS v ON m.polling_station = v.polling_station WHERE m.vidhansabha = ? GROUP BY m.polling_station, m.station_address, v.totalvoter, v.completedvoter`;
    con.query(query, [vidhansabha], (err2, pollingResults) => {
      if (err2) {
        console.error("❌ Error fetching polling stations:", err2);
        return res.status(500).json({
          status: false,
          message: "Database error fetching polling stations",
        });
      }
      if (pollingResults.length === 0) {
        return res.json({
          status: false,
          message: "No polling stations found for this vidhansabha",
        });
      }
      res.json({
        status: true,
        data: pollingResults.map((p) => ({
          polling_station: p.polling_station,
          station_address: p.station_address,
          totalvoter: p.totalvoter,
          completedvoter: p.completedvoter,
          percentage: p.totalvoter
            ? ((p.completedvoter / p.totalvoter) * 100).toFixed(2)
            : 0,
        })),
      });
    });
  });
});

router.get("/getCompletionStatus", (req, res) => {
  const { polling_station } = req.query;
  if (!polling_station) {
    return res.status(400).json({
      status: false,
      message: "Polling station is required",
    });
  }
  const query = `
    SELECT totalvoter, completedvoter
    FROM votercount 
    WHERE polling_station = ?
    LIMIT 1
  `;
  con.query(query, [polling_station], (err, result) => {
    if (err) {
      console.error("❌ Error fetching voter counts:", err);
      return res.status(500).json({
        status: false,
        message: "Error fetching voter data",
      });
    }
    if (result.length === 0) {
      return res.json({
        status: false,
        message: "No data found for this polling station",
        total: 0,
        completed: 0,
        percent: 0,
      });
    }
    const total = result[0].totalvoter || 0;
    const completed = result[0].completedvoter || 0;
    const percent = total ? ((completed / total) * 100).toFixed(2) : 0;
    res.json({
      status: true,
      polling_station,
      total,
      completed,
      percent,
    });
  });
});

router.get("/lokstationaddress", (req, res) => {
  const { add1, add2 } = req.query;
  if (!add1 || !add2) {
    return res.status(400).json({ error: "Missing parameters: add1 (Lok Sabha) or add2 (Vidhan Sabha)" });
  }
  const qy = `
    SELECT DISTINCT polling_station, station_address 
    FROM pollingvidhan 
    WHERE vidhansabha = ?
    ORDER BY polling_station
  `;
  con.query(qy, [add2], (err, result) => {
    if (err) {
      console.error("DB Error (Station Address):", err);
      return res.status(500).json({ error: "Database error fetching polling stations" });
    }
    console.log("Fetched Polling Stations:", result);
    res.json(result);
  });
});

router.get("/voterdown", (req, res) => {
  const { add1, add2 } = req.query;
  if (!add1 || !add2) {
    return res.status(400).json({ error: "Missing Lok Sabha or Vidhan Sabha" });
  }
  const q = `
    SELECT * FROM newvotercollection WHERE add1 = ? AND add2 = ? ORDER BY sno ASC`;
  con.query(q, [add1, add2], (err, result) => {
    if (err) {
      console.error("❌ Database Error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    // ✅ Send sorted voter list
    res.json(result);
  });
});

router.post("/uploadZillaMultiple", upload.array("files", 100), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No Excel files uploaded." });
      }
      zillaProgress = {
        processedFiles: 0,
        totalFiles: files.length,
        processedRows: 0,
        totalRows: 0,
      };
      files.forEach((file) => {
        const workbook = xlsx.readFile(file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = xlsx.utils.sheet_to_json(sheet);
        zillaProgress.totalRows += json.length;
      });
      processZillaFiles(files);
      return res.json({
        message: "Zilla Master upload started… processing in background",
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Upload failed." });
    }
  }
);

async function processZillaFiles(files) {
  try {
    for (const file of files) {
      const workbook = xlsx.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);
      for (const row of rows) {
        const kshtra = row["kshtra"] || row["Kshtra"] || null;
        const jilla = 
          row["jila"] || 
          row["Jila"] || 
          row["jilla"] || null;
        const vidhansabha_no =
          row["ass no."] ||
          row["Ass No."] ||
          row["ass_no"] ||
          row["assno"] ||
          null;
        const vidhansabha =
          row["vidhansabha"] ||
          row["Vidhansabha"] ||
          row["vidhan sabha"] ||
          null;
        await con.query(
          `INSERT INTO masterjilla 
          (kshtra, jilla, vidhansabha_no, vidhansabha)
          VALUES (?, ?, ?, ?)`,
          [kshtra, jilla, vidhansabha_no, vidhansabha]
        );
        zillaProgress.processedRows++;
      }
      zillaProgress.processedFiles++;
    }
  } catch (error) {
    console.error("Processing error:", error);
  }
}

router.get("/zillaUploadProgress", (req, res) => {
  res.json(zillaProgress);
});

router.get("/getVidhansabhaByJilla", async (req, res) => {
  const {jilla} = req.query;
  const [rows] = await con.query(
    "select distinct vidhansabha, vidhansabha_no from masterjilla where jilla = ?",
    [jilla]
  );
  res.json(rows);
});

router.post("/createVidhanTables", async (req, res) => {
  try {
    let { jilla, vidhansabha_no, vidhansabha } = req.body;
    if (!jilla || !vidhansabha_no || !vidhansabha) {
      return res.status(400).json({ message: "Missing fields" });
    }
    // sanitize → allow letters, numbers and Devanagari range; replace others by _
    const clean = (str) =>
      str
        .toString()
        .trim()
        .replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "_")
        // avoid empty names or names starting with digit-only collisions
        .replace(/^_+|_+$/g, "")
        .replace(/__+/g, "_");
    const baseName = clean(`${jilla}_${vidhansabha_no}`);
    if (!baseName) {
      return res.status(400).json({ message: "Invalid inputs after cleaning" });
    }
    const t1 = baseName; // voter table (smaller schema) — NO "newVoter_" prefix
    const t2 = clean(`newVoter_${baseName}`); // new voter table (large schema)
    // --- table schema for the smaller (t1) table as requested ---
    const tableSmall = `
      sno INT AUTO_INCREMENT PRIMARY KEY,
      id VARCHAR(50),
      number VARCHAR(10),
      name VARCHAR(80),
      father VARCHAR(50),
      house VARCHAR(50),
      age VARCHAR(5),
      gender VARCHAR(20),
      raw VARCHAR(10),
      polling_station VARCHAR(100),
      station_address VARCHAR(100),
      deleted VARCHAR(10),
      kinType VARCHAR(50),
      extra VARCHAR(10),
      year VARCHAR(10),
      date1 VARCHAR(50),
      date2 VARCHAR(50),
      add1 VARCHAR(100),
      add2 VARCHAR(100),
      postcode VARCHAR(10),
      status VARCHAR(20),
      family_id VARCHAR(20),
      booth_number VARCHAR(5),
      add1_number VARCHAR(5),
      add2_number VARCHAR(5),
      jilla VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;
    // --- table schema for the larger (t2) table (leave fields as they were originally) ---
    const tableLarge = `
      sno INT PRIMARY KEY AUTO_INCREMENT,
      number VARCHAR(6),
      id VARCHAR(50),
      name VARCHAR(100),
      father VARCHAR(100),
      house VARCHAR(100),
      age VARCHAR(5),
      gender VARCHAR(50),
      raw VARCHAR(50),
      polling_station VARCHAR(300),
      station_address VARCHAR(500),
      deleted VARCHAR(50),
      kinType VARCHAR(100),
      extra VARCHAR(50),
      year VARCHAR(10),
      date1 VARCHAR(200),
      date2 VARCHAR(200),
      add1 VARCHAR(250),
      add2 VARCHAR(250),
      jilla VARCHAR(250),
      postcode VARCHAR(10),
      mukhiya VARCHAR(250),
      address VARCHAR(250),
      category VARCHAR(50),
      jati VARCHAR(150),
      upjati VARCHAR(150),
      mobileno VARCHAR(11),
      voterof VARCHAR(50),
      family_id VARCHAR(50),
      votein2003 VARCHAR(100),
      formEF VARCHAR(100),
      person_mobile_number VARCHAR(15),
      booth_number VARCHAR(5),
      add1_number VARCHAR(5),
      add2_number VARCHAR(5),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;
    // Create tables (using backticks around identifiers because we've cleaned them)
    await con.query(`CREATE TABLE IF NOT EXISTS \`${t1}\` (${tableSmall})`);
    await con.query(`CREATE TABLE IF NOT EXISTS \`${t2}\` (${tableLarge})`);
    // Save or update masterjilla
    const checkQuery = `
      SELECT * FROM masterjilla
      WHERE jilla = ? AND vidhansabha_no = ? AND vidhansabha = ?
    `;
    const [rows] = await con.query(checkQuery, [
      jilla,
      vidhansabha_no,
      vidhansabha,
    ]);
    if (rows.length > 0) {
      const updateQuery = `
        UPDATE masterjilla
        SET voter_table_name = ?, new_voter_table_name = ?
        WHERE jilla = ? AND vidhansabha_no = ? AND vidhansabha = ?
      `;
      await con.query(updateQuery, [
        t1,
        t2,
        jilla,
        vidhansabha_no,
        vidhansabha,
      ]);
    } else {
      const insertQuery = `
        INSERT INTO masterjilla 
        (kshtra, jilla, vidhansabha_no, vidhansabha, voter_table_name, new_voter_table_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await con.query(insertQuery, [
        jilla, // assuming kshtra = jilla; change if needed
        jilla,
        vidhansabha_no,
        vidhansabha,
        t1,
        t2,
      ]);
    }
    return res.json({
      message: "Tables created & saved successfully!",
      table1: t1,
      table2: t2,
    });
  } catch (err) {
    console.error("Table create error:", err);
    return res
      .status(500)
      .json({ message: "Failed to create tables.", error: err.message });
  }
});

router.get("/getAllVoterTables", async (req, res) => {
  try {
    const [rows] = await con.query(
      "SELECT DISTINCT voter_table_name FROM masterjilla WHERE voter_table_name IS NOT NULL"
    );
    console.log(rows);
    return res.json({ 
      status: true,
      message: "Tables fetched successfully",
      data: rows
    });
  } catch (err) {
    console.error("Fetch tables error:", err);
    return res.status(500).json({ message: "Failed to fetch tables." });
  }
});

router.get("/downloadMasterDataExcel", async (req, res) => {
  try {
    // Get all masterjilla records
    const [masterRows] = await con.query(
      "SELECT jilla, vidhansabha_no, vidhansabha, voter_table_name FROM masterjilla WHERE voter_table_name IS NOT NULL"
    );
    if (!masterRows.length) {
      return res.status(404).json({ message: "No data found" });
    }
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Master Data");
    // Add headers
    worksheet.columns = [
      { header: 'Jilla', key: 'jilla', width: 20 },
      { header: 'Vidhan Sabha No', key: 'vidhansabha_no', width: 15 },
      { header: 'Vidhan Sabha', key: 'vidhansabha', width: 25 },
      { header: 'Polling Station', key: 'polling_station', width: 25 },
      { header: 'Voter Table', key: 'voter_table_name', width: 30 }
    ];
    // Add data rows
    for (const masterRow of masterRows) {
      if (masterRow.voter_table_name) {
        try {
          // Get polling stations from the voter table
          const [voterRows] = await con.query(
            `SELECT DISTINCT polling_station FROM ${masterRow.voter_table_name} WHERE polling_station IS NOT NULL AND polling_station != ''`
          );
          if (voterRows.length > 0) {
            // Add a row for each polling station
            for (const voterRow of voterRows) {
              worksheet.addRow({
                jilla: masterRow.jilla,
                vidhansabha_no: masterRow.vidhansabha_no,
                vidhansabha: masterRow.vidhansabha,
                polling_station: voterRow.polling_station,
                voter_table_name: masterRow.voter_table_name
              });
            }
          } else {
            // If no polling stations found, add at least the master data
            worksheet.addRow({
              jilla: masterRow.jilla,
              vidhansabha_no: masterRow.vidhansabha_no,
              vidhansabha: masterRow.vidhansabha,
              polling_station: 'No polling station data',
              voter_table_name: masterRow.voter_table_name
            });
          }
        } catch (voterError) {
          console.error(`Error fetching from ${masterRow.voter_table_name}:`, voterError);
          // Add row with error message
          worksheet.addRow({
            jilla: masterRow.jilla,
            vidhansabha_no: masterRow.vidhansabha_no,
            vidhansabha: masterRow.vidhansabha,
            polling_station: 'Error fetching data',
            voter_table_name: masterRow.voter_table_name
          });
        }
      }
    }
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=master_jilla_data.xlsx');
    // Send the Excel file
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Download master data error:", err);
    return res.status(500).json({ message: "Failed to generate Excel file." });
  }
});

// Get polling stations for a specific table
router.get("/getAllPollingStations", async (req, res) => {
  try {
    const { table } = req.query;
    if (!table) {
      return res.status(400).json({ status: false, message: "Table name required" });
    }
    const [rows] = await con.query(
      `SELECT DISTINCT polling_station FROM ?? WHERE polling_station IS NOT NULL AND polling_station != '' ORDER BY polling_station`,
      [table]
    );

    return res.json({
      status: true,
      message: "Polling stations fetched successfully",
      data: rows
    });
  } catch (err) {
    console.error("Fetch polling stations error:", err);
    return res.status(500).json({ status: false, message: "Failed to fetch polling stations" });
  }
});

router.post('/addSingleWorker', async (req, res) => {
  try {
    const {
      jilla, vidhansabha_no, vidhansabha, mandal_name, shakti_kshtra,
      personal_booth_no, personal_booth_name, booth_number, worker_name,
      position, mobile_no, allotted_table_name, allotted_newvoter_table_name
    } = req.body;
    const query = `
      INSERT INTO master_new 
      (jilla, vidhansabha_no, vidhansabha, mandal_name, shakti_kshtra, 
       personal_booth_no, personal_booth_name, booth_number, worker_name, 
       position, mobile_no, allotted_table_name, allotted_newvoter_table_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await con.execute(query, [
      jilla, vidhansabha_no, vidhansabha, mandal_name, shakti_kshtra,
      personal_booth_no, personal_booth_name, booth_number, worker_name,
      position, mobile_no, allotted_table_name, allotted_newvoter_table_name
    ]);
    res.json({ message: 'Worker added successfully' });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Updated download endpoint with polling station filter
router.get("/downloadTableExcel", async (req, res) => {
  try {
    const { table, polling_station } = req.query;
    if (!table) {
      return res.status(400).json({ status: false, message: "Table name required" });
    }
    let query = `SELECT * FROM ??`;
    let queryParams = [table];
    // Add polling station filter if provided
    if (polling_station) {
      query += ` WHERE polling_station = ?`;
      queryParams.push(polling_station);
    }
    const [rows] = await con.query(query, queryParams);
    // Excel generate
    const XLSX = require("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "buffer",
    });
    // Generate filename based on filters
    let filename = `${table}_data`;
    if (polling_station) {
      filename += `_${polling_station.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    filename += ".xlsx";
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(excelBuffer);
  } catch (err) {
    console.error("❌ Excel download error:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

router.post("/uploadCleanToSelectedTable", async (req, res) => {
  try {
    const { tableName, rows } = req.body;
    if (!tableName)
      return res.status(400).json({ status: false, message: "Missing tableName" });
    if (!rows || rows.length === 0)
      return res.status(400).json({ status: false, message: "No rows received" });
    let inserted = 0;
    for (let row of rows) {
      await con.query(`INSERT INTO \`${tableName}\` SET ?`, row);
      inserted++;
    }
    return res.json({
      status: true,
      message: `🎉 Successfully inserted ${inserted} rows into ${tableName}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

router.get("/getJillaList", async (req, res) => {
  try {
    const [rows] = await con.query("SELECT distinct jilla FROM masterjilla");
    res.json(rows);
  } catch (err) {
    console.error("Jilla Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch jilla list" });
  }
});

router.get("/getPollingStations", async (req, res) => {
  try {
    let { jilla, vidhansabha } = req.query;
    if (!jilla || !vidhansabha) {
      return res.status(400).json({ error: "Jilla and Vidhansabha are required" });
    }
    // NORMALIZE (remove brackets, वैकल्पिक info)
    const normalize = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/\(.*?\)/g, "")   // remove anything inside brackets e.g. (सु0)
        .replace(/[^\p{L}\p{N}]/gu, "")  // remove special chars/spaces
        .trim();
    };
    const cleanVidhansabha = normalize(vidhansabha);
    console.log("Client:", vidhansabha, " → Clean:", cleanVidhansabha);
    // Fetch all possible matching rows
    const [masterRows] = await con.query(
      "SELECT vidhansabha, voter_table_name FROM masterjilla WHERE jilla = ?",
      [jilla]
    );
    if (masterRows.length === 0) {
      return res.status(404).json({ error: "No jilla found" });
    }
    // Find best matching vidhansabha
    let matchedRow = null;
    for (const row of masterRows) {
      const dbClean = normalize(row.vidhansabha);
      if (dbClean === cleanVidhansabha) {
        matchedRow = row;
        break;
      }
    }
    if (!matchedRow) {
      return res.status(404).json({ 
        error: "Vidhansabha did not match after normalization"
      });
    }
    const voterTableName = matchedRow.voter_table_name;
    console.log("Matched Table:", voterTableName);
    // Now get polling stations
    const [pollingRows] = await con.query(
      `SELECT DISTINCT polling_station FROM ?? WHERE 1 ORDER BY polling_station`,
      [voterTableName]
    );
    const pollingStations = pollingRows.map(r => r.polling_station);
    res.json(pollingStations);
  } catch (err) {
    console.error("Polling Station Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch polling stations" });
  }
});

router.post("/uploadMemberExcel", upload.single("file"), async (req, res) => {
  try {
    // ⭐ React से भेजा गया जिला
    const jilla = req.body.jilla || null;
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = xlsx.utils.sheet_to_json(sheet);
    for (let row of json) {
      const vidhansabha_no = row["विधानसभा का नंबर"]?.toString().trim() || null;
      const vidhansabha = row["विधानसभा का नाम"]?.toString().trim() || null;
      const mandal_name = row["मण्डल का नाम"]?.toString().trim() || null;
      const shakti_kshtra =
        row["Sector"] ||
        row["'श्शक्तिकेन्द्र का नाम"] ||
        row["श्शक्तिकेन्द्र का नाम"] ||
        row["शक्तिकेन्द्र का नाम"] ||
        row["शक्ति केन्द्र का नाम"] ||
        row["शक्ति केंद्र का नाम"] ||
        null;
      const personal_booth_no = row["बूथ नंबर"]?.toString().trim() || null;
      const personal_booth_name = row["बूथ का नाम"]?.toString().trim() || null;
      const booth_number =
        row["बूथ प्रवासी नंबर"] ||
        row["बूथ प्रवासी को एलॉॅट बूथ नंबर"] ||
        row["बूथ प्रवासी को एलॉट बूथ नंबर"] ||
        row["बूथ प्रवासी को एलाट बूथ नंबर"] ||
        row["बूथ प्रवासी को एला़ट बूथ नंबर"] ||
        null;
      const worker_name = row["बूथ प्रवासी का नाम"]?.toString().trim() || null;
      const position =
        row["दायित्व"] ||
        row["दायित्व "] ||
        row[" दायित्व"] ||
        row["दायत्व"] ||
        null;
      const mobile_no =
        row["मो0"] ||
        row["मो "] ||
        row["मो"] ||
        row["मोबाइल"] ||
        null;
      // ⭐ INSERT QUERY में "jilla" कॉलम जोड़ा
      await con.query(
        `INSERT INTO master_new (
          jilla,
          vidhansabha_no,
          vidhansabha,
          mandal_name,
          shakti_kshtra,
          personal_booth_no,
          personal_booth_name,
          booth_number,
          worker_name,
          position,
          mobile_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jilla,                 // ⭐ नया
          vidhansabha_no,
          vidhansabha,
          mandal_name,
          shakti_kshtra,
          personal_booth_no,
          personal_booth_name,
          booth_number,
          worker_name,
          position,
          mobile_no,
        ]
      );
    }
    res.json({ message: "Uploaded Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/allotTable", async (req, res) => {
  try {
    const { jilla } = req.body; // Frontend se jilla receive karo
    
    const normalizeVS = (name) => {
      if (!name) return "";
      return name
        .replace(/\(.*?\)/g, "")     // remove bracket content
        .replace(/सु[0०oO.]?/g, "")  // remove सु0 variations
        .trim();
    };

    let query = `SELECT vidhansabha, vidhansabha_no FROM master_new`;
    let params = [];
    
    if (jilla) {
      query += ` WHERE jilla = ?`;
      params.push(jilla);
    }

    const [masterNewRows] = await con.query(query, params);
    
    if (masterNewRows.length === 0) {
      const message = jilla 
        ? `No entries found in master_new for jilla: ${jilla}`
        : "No entries found in master_new";
      return res.status(404).json({ message });
    }

    let allottedCount = 0;
    
    for (const row of masterNewRows) {
      const normalizedVS = normalizeVS(row.vidhansabha);
      const [matchRows] = await con.query(
        `
        SELECT voter_table_name, new_voter_table_name
        FROM masterjilla
        WHERE 
            TRIM(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(vidhansabha, '(सु0)', ''),
                  '(सु०)', ''),
                '(सु.)', ''),
              'सु0', '')
            ) = ?
        AND vidhansabha_no = ?
        `,
        [normalizedVS, row.vidhansabha_no]
      );

      if (matchRows.length > 0) {
        const match = matchRows[0];
        await con.query(
          `
          UPDATE master_new 
          SET 
            allotted_table_name = ?,
            allotted_newvoter_table_name = ?
          WHERE vidhansabha = ? 
          AND vidhansabha_no = ?
          `,
          [
            match.voter_table_name,
            match.new_voter_table_name,
            row.vidhansabha,
            row.vidhansabha_no
          ]
        );
        allottedCount++;
      }
    }

    const message = jilla 
      ? `Allotment complete successfully for jilla: ${jilla} (${allottedCount} entries allotted)`
      : `Allotment complete successfully (${allottedCount} entries allotted)`;
    
    res.json({ 
      message,
      allottedCount,
      jilla: jilla || "All Jillas"
    });
  } catch (err) {
    console.error("Error in /allotTable:", err);
    res.status(500).json({ 
      message: "Internal server error", 
      error: err.message 
    });
  }
});

router.get("/getMemberData", async (req, res) => {
  try {
    const { jilla, vidhansabha } = req.query;
    console.log(jilla, vidhansabha);
    let query = "SELECT * FROM master_new WHERE 1=1";
    const params = [];
    if (jilla) {
      query += " AND jilla = ?";
      params.push(jilla);
    }
    if (vidhansabha) {
      const cleanVidhan = vidhansabha
        .replace(/\(.*?\)/g, "")
        .trim();
      query += " AND REPLACE(vidhansabha, '(सु0)', '') LIKE ?";
      params.push(`${cleanVidhan}%`);
    }
    const [rows] = await con.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No saved data found!" });
    }
    res.json(rows);
  } catch (err) {
    console.error("Fetch Member Data Error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

router.get("/getVidhansabhaList", async (req, res) => {
  try {
    const { jilla } = req.query;
    if (!jilla) {
      return res.status(400).json({ error: "Jilla parameter is required" });
    }
    const [rows] = await con.query(
      "SELECT DISTINCT vidhansabha FROM masterjilla WHERE jilla = ? ORDER BY vidhansabha",
      [jilla]
    );
    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.error("Vidhansabha List Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch vidhansabha list" });
  }
});

// Get overall voter statistics
router.get("/getVoterStats", async (req, res) => {
  try {
    const { jilla, vidhansabha } = req.query;
    let query = "SELECT SUM(totalvoter) as totalVoters, SUM(completedvoter) as completedVoters FROM votercount WHERE 1=1";
    const params = [];
    
    if (jilla) {
      query += " AND jilla = ?";
      params.push(jilla);
    }
    
    if (vidhansabha) {
      query += " AND vidhansabha = ?";
      params.push(vidhansabha);
    }
    
    const [rows] = await con.query(query, params);
    const totalVoters = Number(rows[0]?.totalVoters) || 0;
    const completedVoters = Number(rows[0]?.completedVoters) || 0;
    const percentage = totalVoters > 0 ? Math.round((completedVoters / totalVoters) * 100) : 0;
    
    res.json({
      status: true,
      totalVoters,
      completedVoters,
      percentage
    });
  } catch (err) {
    console.error("Error fetching voter stats:", err);
    res.status(500).json({ status: false, error: "Failed to fetch voter statistics" });
  }
});

// Get polling stations for a specific jilla and vidhansabha
router.get("/getPollingCount", async (req, res) => {
  try {
    const { jilla, vidhansabha } = req.query;
    
    if (!jilla) {
      return res.status(400).json({ status: false, error: "Jilla parameter is required" });
    }
    
    let query = "SELECT * FROM votercount WHERE jilla = ?";
    const params = [jilla];
    
    if (vidhansabha) {
      query += " AND vidhansabha = ?";
      params.push(vidhansabha);
    }
    
    query += " ORDER BY polling_station";
    
    const [rows] = await con.query(query, params);
    
    res.json({
      status: true,
      data: rows
    });
  } catch (err) {
    console.error("Error fetching polling stations:", err);
    res.status(500).json({ status: false, error: "Failed to fetch polling stations" });
  }
});

router.post("/updateMemberRow", async (req, res) => {
  try {
    const { sno, worker_name, position, shakti_kshtra, mandal_name, mobile_no } = req.body;
    console.log(sno, worker_name, position, shakti_kshtra, mandal_name, mobile_no);
    await con.query(
      `UPDATE master_new 
       SET worker_name=?, position=?, shakti_kshtra=?, mandal_name=?, mobile_no =?
       WHERE sno=?`,
      [worker_name, position, shakti_kshtra, mandal_name, mobile_no, sno]
    );
    res.json({ message: "Row updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// Utility: generate passkey in format JILLANAME-### (3 digits)
function generatePasskeyForJilla(jilla) {
  const base = jilla.replace(/\s+/g, '').toUpperCase(); // remove spaces
  const num = Math.floor(Math.random() * 900) + 100; 
  return `${base}-${num}`;
}

// Example backend route (Express.js)
router.put('/jillaPasskeysUpdate', async (req, res) => {
  const { jilla, passkey } = req.body;
  // Validation
  if (!jilla || !passkey) {
    return res.status(400).json({ 
      success: false, 
      error: 'Jilla name and passkey are required' 
    });
  }
  try {
    const [result] = await con.query(
      'UPDATE jillaPasskey SET passkey = ?, created_at = NOW() WHERE jilla = ?',
      [passkey, jilla]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Passkey not found'
      });
    }
    // Get updated record
    const [updatedRows] = await con.query(
      'SELECT id, jilla, passkey, created_at FROM jillaPasskey WHERE jilla = ?',
      [jilla]
    );
    res.json({
      success: true,
      data: updatedRows[0],
      message: 'Passkey updated successfully'
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update passkey' 
    });
  }
});

router.delete('/jillaPasskeysDelete', async (req, res) => {
  const { jilla } = req.query; // Get from query params
  if (!jilla) {
    return res.status(400).json({
      success: false,
      error: 'Jilla name is required'
    });
  }
  try {
    // First check if exists
    const [check] = await con.query(
      'SELECT jilla FROM jillaPasskey WHERE jilla = ?',
      [jilla]
    );
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Passkey not found'
      });
    }
    const [result] = await con.query(
      'DELETE FROM jillaPasskey WHERE jilla = ?',
      [jilla]
    );
    res.json({
      success: true,
      message: 'Passkey deleted successfully'
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete passkey' 
    });
  }
});

router.post('/uploadJillaLogin', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const jillaSet = new Set();
    json.forEach(row => {
      // try several possible column names robustly
      const jillaVal =
        row['jilla'] ??
        row['JILLA'] ??
        row['Jilla'] ??
        row['district'] ??
        row['jila'] ??
        row['Jila'] ??
        '';
      if (jillaVal && String(jillaVal).trim() !== '') {
        jillaSet.add(String(jillaVal).trim());
      }
    });
    if (jillaSet.size === 0) {
      return res.status(400).json({ error: 'No jilla values found in file' });
    }
    const jillas = Array.from(jillaSet);
    const inserted = [];
    const conn = await con.getConnection();

    try {
      await conn.beginTransaction();

      // ensure table exists (optional safety)
      await conn.query(
        `CREATE TABLE IF NOT EXISTS jillaPasskey (
          id INT AUTO_INCREMENT PRIMARY KEY,
          jilla VARCHAR(255) NOT NULL,
          passkey VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      );

      for (const jilla of jillas) {
        // check if this jilla already has a passkey
        const [rows] = await conn.query('SELECT * FROM jillaPasskey WHERE jilla = ?', [jilla]);
        if (rows.length > 0) {
          // optionally skip or update — we will skip and return existing
          inserted.push({ jilla, passkey: rows[0].passkey, status: 'exists' });
          continue;
        }

        let attempts = 0;
        let passkey = null;
        while (attempts < 10) {
          const candidate = generatePasskeyForJilla(jilla);
          // check if passkey exists
          const [pRows] = await conn.query('SELECT id FROM jillaPasskey WHERE passkey = ?', [candidate]);
          if (pRows.length === 0) {
            passkey = candidate;
            break;
          }
          attempts++;
        }

        if (!passkey) {
          // fallback: append timestamp slice to guarantee uniqueness
          passkey = `${jilla.replace(/\s+/g, '').toUpperCase()}-${Date.now().toString().slice(-4)}`;
        }

        // insert into table
        await conn.query('INSERT INTO jillaPasskey (jilla, passkey) VALUES (?, ?)', [jilla, passkey]);
        inserted.push({ jilla, passkey, status: 'created' });
      }

      await conn.commit();
    } catch (errInner) {
      await conn.rollback();
      throw errInner;
    } finally {
      conn.release();
    }
    // return results
    return res.json({ success: true, count: inserted.length, data: inserted });
  } catch (err) {
    console.error('Upload error', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    // optional: delete uploaded file to keep uploads folder clean
    const fs = require('fs');
    fs.unlink(req.file.path, () => {});
  }
});

// simple route to fetch all passkeys (for preview)
router.get('/jillaPasskeys', async (req, res) => {
  try {
    const [rows] = await con.query('SELECT jilla, passkey, created_at FROM jillaPasskey ORDER BY jilla');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/downloadVoterCountByJilla", async (req, res) => {
  try {
    const { jilla, vidhansabha } = req.query;
    
    if (!jilla) {
      return res.status(400).json({ error: "Jilla is required" });
    }
    
    let query = "SELECT * FROM votercount WHERE jilla = ?";
    const params = [jilla];
    
    if (vidhansabha) {
      query += " AND vidhansabha = ?";
      params.push(vidhansabha);
    }
    
    const [rows] = await con.query(query, params);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Voter Count");
    
    // Add headers
    const headers = [
      { header: 'S No', key: 'sno', width: 10 },
      { header: 'Jilla', key: 'jilla', width: 20 },
      { header: 'Vidhan Sabha', key: 'vidhansabha', width: 25 },
      { header: 'Polling Station', key: 'polling_station', width: 25 },
      { header: 'Total Voter', key: 'totalvoter', width: 15 },
      { header: 'Completed Voter', key: 'completedvoter', width: 18 },
      { header: 'Booth Number', key: 'booth_number', width: 15 },
      { header: 'Vidhan Sabha No', key: 'vidhansabha_no', width: 18 }
    ];
    
    worksheet.columns = headers;
    
    // Add rows
    rows.forEach(row => {
      worksheet.addRow({
        sno: row.sno || '',
        jilla: row.jilla || '',
        vidhansabha: row.vidhansabha || '',
        polling_station: row.polling_station || '',
        totalvoter: row.totalvoter || 0,
        completedvoter: row.completedvoter || 0,
        booth_number: row.booth_number || '',
        vidhansabha_no: row.vidhansabha_no || ''
      });
    });
    
    // Style header
    worksheet.getRow(1).font = { bold: true };
    
    // Create SIMPLE English filename
    let filename = `voter_count_${jilla}`;
    if (vidhansabha) {
      // Convert Hindi to English or use simple naming
      filename += '_selected';
    }
    filename += '.xlsx';
    
    // Clean filename
    filename = filename.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII
    filename = filename.replace(/[<>:"/\\|?*]/g, '_'); // Remove special chars
    
    console.log(`📁 Final filename: ${filename}`);
    
    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write and send
    await workbook.xlsx.write(res);
    res.end();
    
    console.log(`✅ Sent ${rows.length} records`);
    
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to generate Excel" });
  }
});

module.exports = router;