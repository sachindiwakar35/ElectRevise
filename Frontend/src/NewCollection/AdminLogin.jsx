import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import "./AdminLogin.css";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const passkeyRef = useRef();
  const [loading, setLoading] = useState(false);

  // Handle Admin Login with Passkey
  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      const passkey = passkeyRef.current.value.trim();
      
      if (!passkey) {
        return alert("Please enter passkey");
      }
      if (passkey.length !== 4 || isNaN(passkey)) {
        return alert("Please enter a valid 4-digit passkey");
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/checkUser`,
        { passkey }
      );

      if (response.data.status) {
        // Store token and user data in sessionStorage
        sessionStorage.setItem("adminToken", response.data.token);
        sessionStorage.setItem("userData", JSON.stringify(response.data.user));
        
        console.log("✅ Token saved in sessionStorage:", response.data.token);
        console.log("✅ User data saved:", response.data.user);
        
        alert("Admin Login Successful!");
        navigate("/insert"); // Redirect to admin dashboard
      } else {
        alert(response.data.message || "Invalid passkey!");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      if (error.response && error.response.data) {
        alert(error.response.data.message || "Login failed!");
      } else {
        alert("Something went wrong! Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdminLogin();
    }
  };

  return (
    <div id="admin-login-wrapper">
      <div className="access-container">
        <h2>Admin Login</h2>
        <label>Enter 4-Digit Passkey:</label>
        <input
          type="password"
          placeholder="Enter 4-digit passkey"
          ref={passkeyRef}
          maxLength="4"
          onKeyPress={handleKeyPress}
          style={{ textAlign: "center", letterSpacing: "8px", fontSize: "18px" }}
        />
        <button
          className="access-btn"
          onClick={handleAdminLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          Enter the 4-digit passkey provided by the administrator
        </div>
      </div>
    </div>
  );
};