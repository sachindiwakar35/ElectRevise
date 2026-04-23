import React, { useState, useEffect } from 'react';
import axios from 'axios';
export default function CreateJillaLogin() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    jilla: '',
    passkey: ''
  });
  useEffect(() => {
    fetchPasskeys();
  }, []);
  const fetchPasskeys = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/jillaPasskeys`);
      if (res.data && res.data.success) {
        console.log('Fetched passkeys:', res.data.data); // Debug log
        setPasskeys(res.data.data);
      }
    } catch (err) {
      console.error("Could not fetch passkeys", err);
    }
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!file) return alert("Please choose an Excel file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      await axios.post(`${process.env.REACT_APP_API_URL}/uploadJillaLogin`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Passkeys generated successfully!");
      await fetchPasskeys();
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };
  const handleEditClick = (passkey) => {
    console.log('Passkey:', passkey); // Debug log
    setEditForm({
      jilla: passkey.jilla,
      passkey: passkey.passkey
    });
  };
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };
  const handleUpdate = async () => {
    if (!editForm.jilla.trim() || !editForm.passkey.trim()) {
      return alert("Both fields are required");
    }
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/jillaPasskeysUpdate`, editForm);
      alert("Passkey updated successfully!");
      setEditingId(null);
      setEditForm({ jilla: '', passkey: '' });
      fetchPasskeys();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err.response?.data?.error || err.message));
    }
  };
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ jilla: '', passkey: '' });
  };
  const handleDelete = async (jilla) => {
    console.log('Deleting passkey for jilla:', jilla); // Debug log
    if (!window.confirm("Are you sure you want to delete this passkey?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/jillaPasskeysDelete`,{params:{jilla: jilla}});
      alert("Passkey deleted successfully!");
      fetchPasskeys();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };
  // Check if we're missing IDs - use index as fallback
  const getRowKey = (p, index) => {
    return p.id || `row-${index}`;
  };
  const isEditing = (p, index) => {
    const key = getRowKey(p, index);
    return editingId === key;
  };
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create Jilla Login — Upload Excel</h2>

      <p style={styles.subText}>
        Excel columns expected: <strong>kshtra</strong>, <strong>jilla</strong>, <strong>ass no.</strong>, <strong>vidhansabha</strong>
      </p>

      <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} style={styles.fileInput} />

      <button onClick={handleUpload} disabled={uploading} style={styles.uploadBtn}>
        {uploading ? "Uploading..." : "Upload & Generate Passkeys"}
      </button>

      <h3 style={{ marginTop: 25 }}>Existing Jilla Passkeys</h3>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Jilla</th>
              <th style={styles.th}>Passkey</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {passkeys.map((p, index) => {
              const rowKey = getRowKey(p, index);
              const editing = isEditing(p, index);
              
              return (
                <tr key={rowKey}>
                  <td style={styles.td}>
                    {editing ? (
                      <input
                        type="text"
                        name="jilla"
                        value={editForm.jilla}
                        onChange={handleEditChange}
                        style={styles.input}
                        autoFocus
                      />
                    ) : (
                      p.jilla
                    )}
                  </td>
                  <td style={styles.td}>
                    {editing ? (
                      <input
                        type="text"
                        name="passkey"
                        value={editForm.passkey}
                        onChange={handleEditChange}
                        style={styles.input}
                      />
                    ) : (
                      p.passkey
                    )}
                  </td>
                  <td style={styles.td}>
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    {editing ? (
                      <div style={styles.actionButtons}>
                        <button 
                          onClick={() => handleUpdate(p.id || rowKey)} 
                          style={styles.saveBtn}
                        >
                          Save
                        </button>
                        <button 
                          onClick={handleCancel} 
                          style={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={styles.actionButtons}>
                        <button 
                          onClick={() => handleEditClick({...p, id: p.id || rowKey})} 
                          style={styles.editBtn}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(p.jilla)} 
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------
// Mobile Responsive Inline Styles
// ------------------------------

const styles = {
  container: {
    maxWidth: 800,
    margin: "20px auto",
    padding: "20px",
    border: "1px solid #eee",
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },

  heading: {
    fontSize: "20px",
    marginBottom: "10px",
  },

  subText: {
    fontSize: "14px",
    lineHeight: "20px",
    marginBottom: "12px",
  },

  fileInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: 8,
    marginBottom: 12,
  },

  uploadBtn: {
    width: "100%",
    padding: "12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: 20,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: 10,
  },
  
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 600,
  },
  
  th: {
    padding: "12px 8px",
    borderBottom: "2px solid #000000ff",
    background: "#fb8517ff",
    textAlign: "left",
    fontSize: "14px",
  },

  td: {
    padding: "12px 8px",
    borderBottom: "1px solid #ddd",
    verticalAlign: "middle",
  },

  input: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "14px",
  },

  actionButtons: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  editBtn: {
    padding: "6px 12px",
    background: "#ffc107",
    color: "#000",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  saveBtn: {
    padding: "6px 12px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  cancelBtn: {
    padding: "6px 12px",
    background: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },

  deleteBtn: {
    padding: "6px 12px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  }
};