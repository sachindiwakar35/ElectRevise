import { useNavigate } from "react-router-dom";
import "./Home.css";
import { useRef, useState } from "react";
import axios from "axios";

export const Home = () => {
  const navigate = useNavigate();

  const numberRef = useRef(null);
  const otpRef = useRef(null);

  const [showOTP, setShowOTP] = useState(false);
  const [enteredNumber, setEnteredNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // -----------------------------------
  // SEND OTP
  // -----------------------------------
  const handleAccess = async () => {
    try {
      const number = numberRef.current.value.trim();

      if (!number) {
        alert("Please enter mobile number");
        return;
      }

      if (!/^[0-9]{10}$/.test(number)) {
        alert("Please enter valid 10 digit number");
        return;
      }

      setLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/master`,
        {
          mobile_no: number,
        }
      );

      if (response.data.status) {
        setEnteredNumber(number);
        sessionStorage.setItem("mobileNumber", number);

        setShowOTP(true);
        alert("OTP sent successfully!");
      } else {
        alert(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP Error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // VERIFY OTP
  // -----------------------------------
  const handleVerifyOTP = async () => {
    try {
      const otp = otpRef.current.value.trim();

      if (!/^[0-9]{4}$/.test(otp)) {
        alert("Please enter valid 4 digit OTP");
        return;
      }

      setOtpLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/verify-otp`,
        {
          number: enteredNumber,
          otp: otp,
        }
      );

      if (response.data.status) {
        sessionStorage.setItem("token", response.data.token || "verified");
        sessionStorage.setItem("isLogin", true);

        alert("OTP Verified Successfully");

        setShowOTP(false);
        navigate("/BoothSelection");
      } else {
        alert(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      alert("OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  // -----------------------------------
  // RESEND OTP
  // -----------------------------------
  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/master`,
        {
          mobile_no: enteredNumber,
        }
      );

      if (response.data.status) {
        alert("OTP resent successfully!");
      } else {
        alert("Failed to resend OTP");
      }
    } catch (error) {
      console.error(error);
      alert("Resend failed");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div id="home-wrapper">
      <div className="access-container">
        <label>Enter Mobile Number:</label>

        <input
          type="tel"
          ref={numberRef}
          placeholder="Enter 10 digit mobile number"
          maxLength="10"
        />

        <button
          className="access-btn"
          onClick={handleAccess}
          disabled={loading}
        >
          {loading ? "Sending..." : "Login"}
        </button>
      </div>

      {/* OTP POPUP */}
      {showOTP && (
        <div className="otp-popup">
          <div className="otp-box">
            <h3>Enter OTP</h3>

            <p>OTP sent to {enteredNumber}</p>

            <input
              type="tel"
              ref={otpRef}
              placeholder="Enter 4 digit OTP"
              maxLength="4"
              className="otp-input"
            />

            <div className="otp-actions">
              <button
                onClick={handleVerifyOTP}
                disabled={otpLoading}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={otpLoading}
              >
                Resend OTP
              </button>

              <button
                onClick={() => setShowOTP(false)}
                disabled={otpLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};