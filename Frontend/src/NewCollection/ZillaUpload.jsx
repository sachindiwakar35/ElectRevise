import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ZillaUpload() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({
    processedFiles: 0,
    totalFiles: 0,
    processedRows: 0,
    totalRows: 0,
  });

  const [savedFileNames, setSavedFileNames] = useState([]);

  // Load previously saved names
  useEffect(() => {
    const saved = sessionStorage.getItem("zillaFileNames");
    if (saved) setSavedFileNames(JSON.parse(saved));
  }, []);

  const handleClearFiles = () => {
    sessionStorage.removeItem("zillaFileNames");
    setSavedFileNames([]);
    setFiles([]);
    setMessage("🗑️ Zilla file buffer cleared.");
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 100) {
      setMessage("⚠️ You can upload up to 100 Excel files at once.");
      return;
    }

    setFiles(selectedFiles);

    const newNames = selectedFiles.map((f) => f.name);

    const oldNames = JSON.parse(
      sessionStorage.getItem("zillaFileNames") || "[]"
    );

    const mergedNames = [...oldNames, ...newNames];

    // save
    sessionStorage.setItem("zillaFileNames", JSON.stringify(mergedNames));

    // update UI
    setSavedFileNames(mergedNames);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setMessage("⚠️ Please select at least one Excel file.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      setUploading(true);
      setProgress({
        processedFiles: 0,
        totalFiles: 0,
        processedRows: 0,
        totalRows: 0,
      });

      setMessage("⏳ Upload started, processing Zilla Master...");

      // Start upload
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/uploadZillaMultiple`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage(response.data.message || "⏳ Processing started...");

      // Polling progress
      const pollInterval = setInterval(async () => {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/zillaUploadProgress`
        );

        setProgress(res.data);

        if (
          res.data.processedFiles >= res.data.totalFiles &&
          res.data.totalFiles > 0
        ) {
          clearInterval(pollInterval);
          setUploading(false);
          setMessage("🎉 All Zilla Master files processed successfully!");
        }
      }, 2000);
    } catch (error) {
      console.error("Upload Error:", error);
      setMessage("❌ Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="bjp-card">
      <h2 className="bjp-badge">📤 Upload Zilla Master (Multiple Excel)</h2>

      <p style={{ color: "#ffaa00" }}>
        Upload up to <b>100 Excel files</b> for: <br />
        <b>kshtra, jilla, vidhansabha_no, vidhansabha</b>
      </p>

      <button className="delete-button" onClick={handleClearFiles}>
        🗑️ Clear Buffer
      </button>

      <div className="bjp-file-wrap">
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          onChange={handleFileChange}
          className="bjp-file-input"
        />
      </div>

      <button
        className="bjp-button"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "⏳ Uploading..." : "Upload"}
      </button>

      {uploading && (
        <p style={{ color: "#00bfff", fontWeight: "bold" }}>
          Files: {progress.processedFiles}/{progress.totalFiles}{" "}
          {progress.totalRows > 0 && (
            <>| Rows: {progress.processedRows}/{progress.totalRows}</>
          )}
        </p>
      )}

      {message && (
        <p
          className={`bjp-message ${
            message.includes("🎉")
              ? "success"
              : message.includes("❌")
              ? "error"
              : "warn"
          }`}
        >
          {message}
        </p>
      )}

      {savedFileNames.length > 0 && (
        <div className="uploaded-file-list">
          <h4>📄 Files Selected:</h4>
          <ul>
            {savedFileNames.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
