import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserVhidhan.css";

export const UserVhidhan = () => {
  const [vidhans, setVidhans] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [pollingData, setPollingData] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    jilla: "",
    vidhansabha: "",
    polling_station: "",
  });
  const [constituencies, setConstituencies] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalVoters: 0,
    completedVoters: 0,
    overallPercentage: 0
  });

  // 🟢 Fetch all Districts from masterjilla table
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/getJillaList`
        );
        if (Array.isArray(response.data)) {
          const districtsList = response.data.map(item => item.jilla).filter(jilla => jilla);
          setDistricts(districtsList);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, []);

  // 🟢 Fetch all VidhanSabha names based on selected district
  useEffect(() => {
    const fetchVidhans = async () => {
      try {
        if (filters.jilla) {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/getVidhansabhaList`,
            { params: { jilla: filters.jilla } }
          );
          if (Array.isArray(response.data)) {
            const vidhansList = response.data.map(item => item.vidhansabha).filter(vidhansabha => vidhansabha);
            setVidhans(vidhansList.map((vidhansabha, index) => ({
              name: vidhansabha,
              id: index + 1
            })));
          }
        } else {
          // If no district selected, clear vidhans
          setVidhans([]);
        }
      } catch (error) {
        console.error("Error fetching vidhans:", error);
      }
    };
    fetchVidhans();
  }, [filters.jilla]);

  // 🟢 Fetch overall statistics when filters change
  useEffect(() => {
    const fetchOverallStats = async () => {
      try {
        let url = `${process.env.REACT_APP_API_URL}/getVoterStats`;
        const params = new URLSearchParams();
        
        if (filters.jilla) params.append("jilla", filters.jilla);
        if (filters.vidhansabha) params.append("vidhansabha", filters.vidhansabha);
        
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await axios.get(url);
        if (response.data.status) {
          setOverallStats({
            totalVoters: response.data.totalVoters || 0,
            completedVoters: response.data.completedVoters || 0,
            overallPercentage: response.data.percentage || 0
          });
        }
      } catch (error) {
        console.error("Error fetching overall stats:", error);
      }
    };
    fetchOverallStats();
  }, [filters.jilla, filters.vidhansabha]);

  // 🟢 Fetch polling stations for a specific vidhansabha
  const toggleDropdown = async (vidhansabhaName) => {
    if (expanded === vidhansabhaName) {
      setExpanded(null);
      return;
    }

    // If already fetched earlier → just open it (no new API call)
    if (pollingData[vidhansabhaName]) {
      setExpanded(vidhansabhaName);
      return;
    }

    setLoading(true);
    try {
      // Fetch polling stations for this vidhansabha
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/getPollingCount`,
        { 
          params: { 
            jilla: filters.jilla,
            vidhansabha: vidhansabhaName
          } 
        }
      );
      
      if (response.data.status && Array.isArray(response.data.data)) {
        let pollingStations = response.data.data;
        
        // Apply polling station filter if any
        if (filters.polling_station) {
          pollingStations = pollingStations.filter(station =>
            station.polling_station?.toLowerCase().includes(filters.polling_station.toLowerCase()) ||
            station.booth_number?.toLowerCase().includes(filters.polling_station.toLowerCase())
          );
        }

        // Calculate completion percentage for each station
        const stationsWithCompletion = pollingStations.map(station => {
          const totalVoter = Number(station.totalvoter) || 0;
          const completedVoter = Number(station.completedvoter) || 0;
          const percentage = totalVoter > 0 ? Math.round((completedVoter / totalVoter) * 100) : 0;
          
          return {
            ...station,
            polling_station: station.polling_station || "N/A",
            booth_number: station.booth_number || "N/A",
            total_voters: totalVoter,
            completed: completedVoter,
            percentage: percentage
          };
        });

        setPollingData((prev) => ({
          ...prev,
          [vidhansabhaName]: stationsWithCompletion,
        }));

        setExpanded(vidhansabhaName);
      } else {
        // If no data, set empty array
        setPollingData((prev) => ({
          ...prev,
          [vidhansabhaName]: [],
        }));
        setExpanded(vidhansabhaName);
      }
    } catch (error) {
      console.error("Error fetching polling stations:", error);
      alert("Error fetching polling stations.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If district changes, reset vidhansabha
    if (name === "jilla") {
      setFilters((prev) => ({ ...prev, vidhansabha: "" }));
      setVidhans([]);
    }

    // Reset expanded state when filters change
    setExpanded(null);
    setPollingData({}); // Clear cached polling data
  };

  const clearFilters = () => {
    setFilters({ jilla: "", vidhansabha: "", polling_station: "" });
    setVidhans([]);
    setExpanded(null);
    setPollingData({});
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return "progress-high";
    if (percentage >= 60) return "progress-medium";
    if (percentage >= 40) return "progress-low";
    return "progress-very-low";
  };

  const getPercentageColorClass = (percentage) => {
    if (percentage >= 80) return "percentage-high";
    if (percentage >= 60) return "percentage-medium";
    if (percentage >= 40) return "percentage-low";
    return "percentage-very-low";
  };

  return (
    <div className="vidhan-container" id="vidhan-container">
      <h1 id="title">Voter Completion Dashboard</h1>
      <p className="subtitle">Track voting completion percentage across polling stations</p>

      {/* Overall Stats Card */}
      <div className="stats-card">
        <div className="stats-grid">
          <div className="stat-item stat-total">
            <h3>Total Voters</h3>
            <p className="stat-number">{overallStats.totalVoters.toLocaleString()}</p>
          </div>
          <div className="stat-item stat-completed">
            <h3>Completed Votes</h3>
            <p className="stat-number">{overallStats.completedVoters.toLocaleString()}</p>
          </div>
          <div className="stat-item stat-percentage">
            <h3>Overall Completion</h3>
            <p className="stat-number">{overallStats.overallPercentage}%</p>
            <div className="progress-bar-overall">
              <div 
                className={`progress-overall ${getProgressBarColor(overallStats.overallPercentage)}`}
                style={{ width: `${Math.min(overallStats.overallPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-card">
        <h2>Filters</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>District (जिल्ला)</label>
            <select
              name="jilla"
              value={filters.jilla}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Select District</option>
              {districts.map((district, index) => (
                <option key={index} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Vidhan Sabha (विधानसभा)</label>
            <select
              name="vidhansabha"
              value={filters.vidhansabha}
              onChange={handleFilterChange}
              className="filter-select"
              disabled={!filters.jilla}
            >
              <option value="">Select Vidhan Sabha</option>
              {vidhans.map((vidhan, index) => (
                <option key={index} value={vidhan.name}>
                  {vidhan.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Polling Station / Booth</label>
            <input
              type="text"
              name="polling_station"
              value={filters.polling_station}
              onChange={handleFilterChange}
              placeholder="Search polling station or booth..."
              className="filter-input"
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Vidhan Sabha List */}
      <div className="vidhan-list" id="vidhan-list">
        {filters.jilla && filters.vidhansabha ? (
          // Show only the selected vidhansabha when both filters are selected
          <div className="vidhan-block" id={`vidhan-selected`}>
            <button
              className={`vidhan-btn ${expanded === filters.vidhansabha ? "active" : ""}`}
              id={`vidhan-btn-selected`}
              onClick={() => toggleDropdown(filters.vidhansabha)}
            >
              <span className="vidhan-name">{filters.vidhansabha}</span>
              <span className="vidhan-arrow">{expanded === filters.vidhansabha ? "▲" : "▼"}</span>
            </button>

            {expanded === filters.vidhansabha && (
              <div className="dropdown" id={`dropdown-selected`}>
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading polling data...</p>
                  </div>
                ) : pollingData[filters.vidhansabha] && pollingData[filters.vidhansabha].length > 0 ? (
                  <div className="polling-stations-container">
                    {pollingData[filters.vidhansabha].map((p, idx) => (
                      <div key={idx} className="polling-card" id={`polling-card-${idx}`}>
                        <div className="polling-header">
                          <h3 id={`polling-station-${idx}`}>Polling Station: {p.polling_station}</h3>
                          <p className="booth-info-inline">
                            Booth: {p.booth_number}
                          </p>
                        </div>

                        <div className="voter-stats" id={`voter-stats-${idx}`}>
                          <div className="stat">
                            <span className="stat-label">Total:</span>
                            <span className="stat-value">{p.total_voters.toLocaleString()}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Completed:</span>
                            <span className="stat-value">{p.completed.toLocaleString()}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Remaining:</span>
                            <span className="stat-value">{(p.total_voters - p.completed).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="progress-container">
                          <div className="progress-bar" id={`progress-bar-${idx}`}>
                            <div
                              className={`progress ${getProgressBarColor(p.percentage)}`}
                              id={`progress-${idx}`}
                              style={{ width: `${p.percentage}%` }}
                            ></div>
                          </div>
                          <div className="percentage-info">
                            <p className={`percent-text ${getPercentageColorClass(p.percentage)}`} id={`percent-text-${idx}`}>
                              {p.percentage}% Completed
                            </p>
                            <p className="remaining-text">
                              {(p.total_voters - p.completed).toLocaleString()} votes remaining
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No polling stations found for {filters.vidhansabha}.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : filters.jilla ? (
          // Show all vidhansabhas for the selected district
          vidhans.length > 0 ? (
            vidhans.map((v) => (
              <div key={v.id} className="vidhan-block" id={`vidhan-${v.id}`}>
                <button
                  className={`vidhan-btn ${expanded === v.name ? "active" : ""}`}
                  id={`vidhan-btn-${v.id}`}
                  onClick={() => toggleDropdown(v.name)}
                >
                  <span className="vidhan-name">{v.name}</span>
                  <span className="vidhan-arrow">{expanded === v.name ? "▲" : "▼"}</span>
                </button>

                {expanded === v.name && (
                  <div className="dropdown" id={`dropdown-${v.id}`}>
                    {loading ? (
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading polling data...</p>
                      </div>
                    ) : pollingData[v.name] && pollingData[v.name].length > 0 ? (
                      <div className="polling-stations-container">
                        {pollingData[v.name].map((p, idx) => (
                          <div key={idx} className="polling-card" id={`polling-card-${idx}`}>
                            <div className="polling-header">
                              <h3 id={`polling-station-${idx}`}>Polling Station: {p.polling_station}</h3>
                              <p className="booth-info-inline">
                                Booth: {p.booth_number}
                              </p>
                            </div>

                            <div className="voter-stats" id={`voter-stats-${idx}`}>
                              <div className="stat">
                                <span className="stat-label">Total:</span>
                                <span className="stat-value">{p.total_voters.toLocaleString()}</span>
                              </div>
                              <div className="stat">
                                <span className="stat-label">Completed:</span>
                                <span className="stat-value">{p.completed.toLocaleString()}</span>
                              </div>
                              <div className="stat">
                                <span className="stat-label">Remaining:</span>
                                <span className="stat-value">{(p.total_voters - p.completed).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="progress-container">
                              <div className="progress-bar" id={`progress-bar-${idx}`}>
                                <div
                                  className={`progress ${getProgressBarColor(p.percentage)}`}
                                  id={`progress-${idx}`}
                                  style={{ width: `${p.percentage}%` }}
                                ></div>
                              </div>
                              <div className="percentage-info">
                                <p className={`percent-text ${getPercentageColorClass(p.percentage)}`} id={`percent-text-${idx}`}>
                                  {p.percentage}% Completed
                                </p>
                                <p className="remaining-text">
                                  {(p.total_voters - p.completed).toLocaleString()} votes remaining
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>No polling stations found for {v.name}.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-vidhans">
              <p>No vidhansabha found for {filters.jilla}.</p>
            </div>
          )
        ) : (
          <div className="select-district-prompt">
            <p>Please select a district to view Vidhan Sabha list.</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {vidhans.length > 0 && (
        <div className="footer-stats">
          <p>
            {filters.vidhansabha ? (
              `Showing polling stations for ${filters.vidhansabha}`
            ) : (
              `Showing ${vidhans.length} vidhansabha(s) in ${filters.jilla}`
            )}
            {expanded && pollingData[expanded] && (
              ` • ${pollingData[expanded].length} polling station(s)`
            )}
          </p>
        </div>
      )}
    </div>
  );
};