// VoterForm.jsx
import React, { useEffect, useRef } from "react";

export default function VoterForm({ initialRow, onCancel, onSave, selectedCount }) {
  // useRefs as requested
  const voterIdRef = useRef(null);
  const nameRef = useRef(null);
  const mukhiyaRef = useRef(null);
  const addressRef = useRef(null);
  const categoryRef = useRef(null);
  const jatiRef = useRef(null);
  const upjatiRef = useRef(null);
  const mobilenoRef = useRef(null);
  const voted2003Ref = useRef(null);
  const voterofRef = useRef(null);
  const formEFReceivedRef = useRef(null);
  const formEFSubmittedRef = useRef(null);
  const partyRef = useRef(null);

  // Fill initial values when initialRow changes
  useEffect(() => {
    if (!initialRow) {
      clearForm();
      return;
    }
    voterIdRef.current.value = initialRow.id ?? initialRow.ID ?? initialRow.voter_id ?? "";
    nameRef.current.value = initialRow.name ?? "";
    // As user said: mukhiya should be auto-filled from father
    mukhiyaRef.current.value = initialRow.father ?? initialRow.mukhiya ?? "";
    addressRef.current.value = initialRow.address ?? "";
    categoryRef.current.value = initialRow.category ?? "";
    jatiRef.current.value = initialRow.jati ?? "";
    upjatiRef.current.value = initialRow.upjati ?? "";
    mobilenoRef.current.value = initialRow.mobileno ?? initialRow.person_mobile_number ?? "";
    voted2003Ref.current.value = initialRow.votein2003 ?? "";
    voterofRef.current.value = initialRow.voterof ?? "";
    formEFReceivedRef.current.checked = (initialRow.formEF ?? "").includes("received");
    formEFSubmittedRef.current.checked = (initialRow.formEF ?? "").includes("submitted");
    partyRef.current.value = initialRow.voterof ?? "";
  }, [initialRow]);

  const clearForm = () => {
    if (voterIdRef.current) voterIdRef.current.value = "";
    if (nameRef.current) nameRef.current.value = "";
    if (mukhiyaRef.current) mukhiyaRef.current.value = "";
    if (addressRef.current) addressRef.current.value = "";
    if (categoryRef.current) categoryRef.current.value = "";
    if (jatiRef.current) jatiRef.current.value = "";
    if (upjatiRef.current) upjatiRef.current.value = "";
    if (mobilenoRef.current) mobilenoRef.current.value = "";
    if (voted2003Ref.current) voted2003Ref.current.value = "";
    if (voterofRef.current) voterofRef.current.value = "";
    if (formEFReceivedRef.current) formEFReceivedRef.current.checked = false;
    if (formEFSubmittedRef.current) formEFSubmittedRef.current.checked = false;
    if (partyRef.current) partyRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      voterId: voterIdRef.current.value,
      name: nameRef.current.value,
      mukhiya: mukhiyaRef.current.value,
      address: addressRef.current.value,
      category: categoryRef.current.value,
      jati: jatiRef.current.value,
      upjati: upjatiRef.current.value,
      mobileno: mobilenoRef.current.value,
      votein2003: voted2003Ref.current.value,
      voterof: voterofRef.current.value,
      formEFReceived: formEFReceivedRef.current.checked,
      formEFSubmitted: formEFSubmittedRef.current.checked,
      party: partyRef.current.value,
    };

    onSave(payload);
  };

  return (
    <div className="voter-form-card">
      <div className="card-header">
        <h3>Update Voter Info</h3>
        <div className="selected-count">{selectedCount} selected</div>
      </div>
      <form onSubmit={handleSubmit}>
        <label>Voter ID:</label>
        <input type="text" ref={voterIdRef} readOnly className="readonly" />

        <label>Name:</label>
        <input type="text" ref={nameRef} required />

        <label>Mukhiya (मुखिया):</label>
        <input type="text" ref={mukhiyaRef} />

        <label>Address:</label>
        <input type="text" ref={addressRef} />

        <div className="grid-2">
          <div>
            <label>Category:</label>
            <select ref={categoryRef} defaultValue="">
              <option value="">Select Category</option>
              <option>GEN</option>
              <option>OBC</option>
              <option>SC</option>
              <option>ST</option>
            </select>
          </div>
          <div>
            <label>Jati:</label>
            <select ref={jatiRef} defaultValue="">
              <option value="">Select Jati</option>
              <option>Jati A</option>
              <option>Jati B</option>
            </select>
          </div>
        </div>

        <label>UpJati:</label>
        <input type="text" ref={upjatiRef} />

        <label>Mobile No:</label>
        <input type="text" ref={mobilenoRef} maxLength={15} />

        <div className="grid-2">
          <div>
            <label>Voted in 2003?</label>
            <div>
              <input type="radio" name="voted2003" value="yes" ref={voted2003Ref} /> Yes
              <input type="radio" name="voted2003" value="no" style={{ marginLeft: 8 }} /> No
            </div>
          </div>
          <div>
            <label>Voter of (Party):</label>
            <select ref={voterofRef}>
              <option value="">Select Party</option>
              <option>BJP</option>
              <option>INC</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="form-ef">
          <label>Form EF Received</label>
          <input type="checkbox" ref={formEFReceivedRef} />
          <label style={{ marginLeft: 12 }}>Form EF Submitted</label>
          <input type="checkbox" ref={formEFSubmittedRef} />
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn">💾 Save Voter</button>
          <button type="button" className="cancel-btn" onClick={() => { onCancel(); clearForm(); }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
