import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
export default function JillaLogin() {
  const [passkey, setPasskey] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    if (!passkey) return setMsg("Please enter the passkey");
    setMsg("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/verifyJillaLogin`,
        { passkey }
      );
      if (res.data.success) {
        setMsg("Login Successful!");
        sessionStorage.setItem("loggedInJilla", res.data.jilla);
        navigate("/JillaView");
      } else {
        setMsg(res.data.error || "Invalid passkey");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 450,
        margin: "40px auto",
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 10,
        background: "#fafafa",
      }}
    >
      <h2>Jilla Login</h2>

      {/* Passkey Input */}
      <label style={{ fontWeight: "bold" }}>Enter Passkey:</label>
      <input
        type="text"
        value={passkey}
        onChange={(e) => setPasskey(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 5,
          marginBottom: 20,
          borderRadius: 6,
        }}
        placeholder="Enter your passkey"
      />

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        {loading ? "Verifying..." : "Login"}
      </button>

      {/* Message */}
      {msg && (
        <p style={{ marginTop: 20, color: msg.includes("Successful") ? "green" : "red" }}>
          {msg}
        </p>
      )}
    </div>
  );
}