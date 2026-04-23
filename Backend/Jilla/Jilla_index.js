const express = require("express");
const router = express.Router();
const con = require("../db");

router.post("/verifyJillaLogin", async (req, res) => {
  const { jilla, passkey } = req.body;

  if (!jilla || !passkey)
    return res.status(400).json({ error: "Missing jilla or passkey" });

  try {
    const [rows] = await con.query(
      "SELECT * FROM jillaPasskey WHERE jilla = ? AND passkey = ?",
      [jilla, passkey]
    );

    if (rows.length === 0) {
      return res.json({ success: false, error: "Invalid credentials" });
    }

    return res.json({ success: true, message: "Login successful" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;