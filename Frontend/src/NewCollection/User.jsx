import React, { useRef } from 'react';
import './User.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
export const User=()=> {
  const passref = useRef();
  const navigate = useNavigate();
  const handleSubmit = async () => {
    const passkey = passref.current.value.trim();
    if (!passkey) {
      alert("Please enter the passkey.");
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/checkUser`, { passkey });
      if (response.data.status) {
        alert(response.data.message);
        navigate('/AdminHome'); 
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      alert("Something went wrong. Please try again.");
    }
  };
  return (
    <div className='userbod'>
      <h1>Welcome User</h1>
      <div>
        <p>Please Enter the Passkey</p>
        <input type="text" ref={passref} placeholder='Passkey' /><br />
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}