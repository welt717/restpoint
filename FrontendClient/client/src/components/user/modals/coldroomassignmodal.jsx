import React, { useState } from "react";
import { MapPin, Home, Save, X } from "lucide-react";
import { toast } from "react-toastify";

const ColdRoomAssignmentModal = ({ isOpen, onClose, deceasedData, onUpdate }) => {
  const [assignmentData, setAssignmentData] = useState({
    // Correctly initializes with existing data or an empty string
    coldRoomNo: deceasedData?.cold_room_no || "",
    trayNo: deceasedData?.tray_no || "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🛑 FIX: Input Validation Check
    if (!assignmentData.coldRoomNo.trim() || !assignmentData.trayNo.trim()) {
      toast.error("Both Cold Room Number and Tray Number are required for assignment.");
      setLoading(false);
      return;
    }

    try {
      // Assuming deceasedData.id is available as confirmed by original code
      const response = await fetch(
        `http://localhost:5000/api/v1/restpoint/assign-cold-room/${deceasedData.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assignmentData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Cold room assignment updated successfully");
        onClose();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(result.message || "Failed to update cold room assignment");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  // Determine if this is a new assignment or an update/correction
  const isAssigned = deceasedData.cold_room_no || deceasedData.tray_no;
  const submitButtonText = isAssigned ? "Update Assignment" : "Assign Cold Room";

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>
            <Home size={22} style={{ marginRight: "8px" }} />
            {isAssigned ? "Update Room Assignment" : "Cold Room Assignment"}
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        {/* Info paragraph adjusted based on assignment status */}
        <p style={styles.promptText}>
          {isAssigned 
            ? `Update the Cold Room and Tray details for ${deceasedData?.full_name || 'this record'}.`
            : `Assign Cold Room and Tray details for ${deceasedData?.full_name || 'this record'}.`}
        </p>

        {/* Current Assignment Info (Conditional) */}
        {isAssigned && (
          <div style={styles.infoBox}>
            <h4 style={styles.infoHeader}>Currently Assigned</h4>
            <p style={styles.infoText}>
              {deceasedData.cold_room_no && 
                <><Home size={14} style={{ marginRight: "4px" }} /> <strong>Room:</strong> {deceasedData.cold_room_no} </>
              }
              {deceasedData.tray_no && 
                <><MapPin size={14} style={{ marginLeft: "12px", marginRight: "4px" }} /> <strong>Tray:</strong> {deceasedData.tray_no}</>
              }
            </p>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{...styles.formGroup, marginTop: isAssigned ? '1.5rem' : '1rem'}}>
            <label style={styles.label}>
              <Home size={16} style={{ marginRight: "6px" }} />
              Cold Room Number <span style={{color: 'red', marginLeft: '4px'}}>*</span>
            </label>
            <input
              type="text"
              name="coldRoomNo"
              value={assignmentData.coldRoomNo}
              onChange={handleInputChange}
              placeholder="e.g., CR-01"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <MapPin size={16} style={{ marginRight: "6px" }} />
              Tray Number <span style={{color: 'red', marginLeft: '4px'}}>*</span>
            </label>
            <input
              type="text"
              name="trayNo"
              value={assignmentData.trayNo}
              onChange={handleInputChange}
              placeholder="e.g., T-05"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              backgroundColor: loading ? "#94a3b8" : "#0284c7",
            }}
          >
            {loading ? "Saving..." : submitButtonText}
            {!loading && <Save size={16} style={{ marginLeft: "6px" }} />}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ------------------------- STYLES ------------------------- */
const styles = {
  // ... (Keep existing styles for modalOverlay, modalContent, etc.)
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "450px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    animation: "fadeIn 0.3s ease-in-out",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "0.5rem",
  },
  modalTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    color: "#0f172a",
  },
  closeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#475569",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontWeight: "500",
    marginBottom: "0.4rem",
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.8rem",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    outline: "none",
    fontSize: "0.95rem",
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "0.75rem",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "0.5rem",
    transition: "background-color 0.2s ease",
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: "0.75rem 1rem", // Reduced padding
    backgroundColor: "#f0f9ff",
    borderRadius: "0.5rem",
    border: "1px solid #bae6fd",
    marginBottom: "0.5rem", // Added small bottom margin
  },
  infoHeader: {
    margin: "0", // Removed margin
    color: "#0369a1",
    fontWeight: "600",
    fontSize: "1rem",
    marginRight: "1rem", // Added space
    whiteSpace: 'nowrap'
  },
  infoText: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#1e293b",
    display: 'flex',
    alignItems: 'center',
  },
  promptText: {
    margin: "0 0 1rem 0",
    fontSize: "0.9rem",
    color: "#475569",
  }
};

export default ColdRoomAssignmentModal;