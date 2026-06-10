import React, { useState } from 'react';
import { FlaskConical, User, DollarSign, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

const EmbalmingModal = ({ isOpen, onClose, deceased, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    isEmbalmed: deceased?.is_embalmed || false,
    embalmedBy: deceased?.embalmed_by || '',
    embalmingRemarks: deceased?.embalming_remarks || '',
    embalmingCost: deceased?.embalming_cost || ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/v1/restpoint/update-embalming/${deceased.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Embalming information updated successfully');
        onClose();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(result.message || 'Failed to update embalming information');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <FlaskConical size={22} style={{ marginRight: 8 }} />
            Embalming Information
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.checkboxContainer}>
              <input
                type="checkbox"
                name="isEmbalmed"
                checked={formData.isEmbalmed}
                onChange={handleInputChange}
                style={styles.checkbox}
              />
              Deceased has been embalmed
            </label>
          </div>

          {formData.isEmbalmed && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <User size={16} style={styles.icon} />
                  Embalmed By
                </label>
                <input
                  type="text"
                  name="embalmedBy"
                  value={formData.embalmedBy}
                  onChange={handleInputChange}
                  placeholder="Enter embalmer's name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <DollarSign size={16} style={styles.icon} />
                  Embalming Cost (Ksh)
                </label>
                <input
                  type="number"
                  name="embalmingCost"
                  value={formData.embalmingCost}
                  onChange={handleInputChange}
                  placeholder="Enter cost"
                  step="0.01"
                  min="0"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Remarks</label>
                <textarea
                  name="embalmingRemarks"
                  value={formData.embalmingRemarks}
                  onChange={handleInputChange}
                  placeholder="Add any remarks about the embalming process"
                  rows="4"
                  style={styles.textarea}
                />
              </div>
            </>
          )}

          <button type="submit" style={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
            {!isLoading && <Save size={16} style={{ marginLeft: 6 }} />}
          </button>
        </form>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#333'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '6px'
  },
  icon: {
    marginRight: '6px',
    verticalAlign: 'middle'
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '0.95rem'
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    resize: 'none',
    fontSize: '0.95rem'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  submitButton: {
    background: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.95rem',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

export default EmbalmingModal;
