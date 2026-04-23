const mysql = require("mysql2");
const data = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"Your_DB_Password",
    database:"Your_DB_Name",
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Use promises
const con = data.promise();
// Test connection
data.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB Connection Failed:", err);
  } else {
    console.log("✅ MySQL Pool Connected...");
    connection.release();
  }
});
module.exports = con;