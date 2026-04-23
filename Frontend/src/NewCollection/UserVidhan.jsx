import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserVhidhan.css";

export default function UserVhidhan() {
  const [vidhans, setVidhans] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [pollingData, setPollingData] = useState({});

  useEffect(() => {
    const fetchVidhans = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/getVidhans`);
        if (response.data.status) {
          setVidhans(response.data.data);
        } else {
          alert(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching vidhans:", error);
        alert("Something went wrong while fetching data.");
      }
    };
    fetchVidhans();
  }, []);

  const toggleDropdown = async (vidhan) => {
    if (expanded === vidhan.number) {
      setExpanded(null);
      return;
    }

    // If already fetched, just toggle open
    if (pollingData[vidhan.number]) {
      setExpanded(vidhan.number);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/getPollingStations/${vidhan.number}`
      );

      if (response.data.status) {
        const pollingStations = response.data.data;

        // Fetch completion status for each polling station
        const updatedStations = await Promise.all(
          pollingStations.map(async (station) => {
            try {
              const statusRes = await axios.get(
                  `${process.env.REACT_APP_API_URL}/getCompletionStatus`,
                  { params: { polling_station: station.polling_station } }
              );


              if (statusRes.data.status) {
                return {
                  ...station,
                  total_voters: statusRes.data.total,
                  completed: statusRes.data.completed,
                  percentage: statusRes.data.percent,
                };
              } else {
                return { ...station, total_voters: 0, completed: 0, percentage: 0 };
              }
            } catch (err) {
              console.error("Error fetching completion status:", err);
              return { ...station, total_voters: 0, completed: 0, percentage: 0 };
            }
          })
        );

        setPollingData((prev) => ({
          ...prev,
          [vidhan.number]: updatedStations,
        }));

        setExpanded(vidhan.number);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching polling stations:", error);
      alert("Error fetching polling stations.");
    }
  };

  return (
    <div className="vidhan-container">
      <h1>Select Your Vidhansabha</h1>

      <div className="vidhan-list">
        {vidhans.length > 0 ? (
          vidhans.map((v) => (
            <div key={v.number} className="vidhan-block">
              <button className="vidhan-btn" onClick={() => toggleDropdown(v)}>
                {v.vidhansabha}
              </button>

              {expanded === v.number && pollingData[v.number] && (
                <div className="dropdown">
                  {pollingData[v.number].map((p, idx) => (
                    <div key={idx} className="polling-card">
                      <h3>{p.station_address}</h3>
                      <p className="address">{p.polling_station}</p>

                      <div className="voter-stats">
                        <p><strong>Total:</strong> {p.total_voters}</p>
                        <p><strong>Completed:</strong> {p.completed}</p>
                      </div>

                      <div className="progress-bar">
                        <div
                          className="progress"
                          style={{ width: `${p.percentage}%` }}
                        ></div>
                      </div>
                      <p className="percent-text">{p.percentage}% Completed</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Loading vidhansabha's...</p>
        )}
      </div>
    </div>
  );
}