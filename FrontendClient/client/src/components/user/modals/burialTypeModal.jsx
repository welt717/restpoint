import React, { useState } from 'react';
import styled from 'styled-components';
import { Landmark, Calendar, MapPin, User, Phone, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';

const BurialTypeModal = ({ isOpen, onClose, deceasedData, onUpdate }) => {
  const [burialData, setBurialData] = useState({
    burialType: deceasedData?.burial_type || 'burial',
    cremationDate: '',
    burialDate: '',
    location: '',
    contactPerson: '',
    contactPhone: '',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBurialData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/restpoint/update-burial-type/${deceasedData.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(burialData)
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success('Burial type updated successfully');
        onClose();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(result.message || 'Failed to update burial type');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Landmark size={24} />
            Update Burial Type
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Burial Type</Label>
            <Select
              name="burialType"
              value={burialData.burialType}
              onChange={handleInputChange}
            >
              <option value="burial">Burial</option>
              <option value="cremation">Cremation</option>
              <option value="repatriation">Repatriation</option>
            </Select>
          </FormGroup>

          {burialData.burialType === 'cremation' && (
            <FormGroup>
              <Label>
                <Calendar size={16} />
                Cremation Date
              </Label>
              <Input
                type="datetime-local"
                name="cremationDate"
                value={burialData.cremationDate}
                onChange={handleInputChange}
              />
            </FormGroup>
          )}

          {burialData.burialType === 'burial' && (
            <FormGroup>
              <Label>
                <Calendar size={16} />
                Burial Date
              </Label>
              <Input
                type="datetime-local"
                name="burialDate"
                value={burialData.burialDate}
                onChange={handleInputChange}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>
              <MapPin size={16} />
              Location
            </Label>
            <Input
              type="text"
              name="location"
              value={burialData.location}
              onChange={handleInputChange}
              placeholder="Enter burial/cremation location"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <User size={16} />
              Contact Person
            </Label>
            <Input
              type="text"
              name="contactPerson"
              value={burialData.contactPerson}
              onChange={handleInputChange}
              placeholder="Enter contact person name"
            />
          </FormGroup>

          <FormGroup>
            <Label>
              <Phone size={16} />
              Contact Phone
            </Label>
            <Input
              type="tel"
              name="contactPhone"
              value={burialData.contactPhone}
              onChange={handleInputChange}
              placeholder="Enter contact phone number"
            />
          </FormGroup>

          <FormGroup>
            <Label>Remarks</Label>
            <TextArea
              name="remarks"
              value={burialData.remarks}
              onChange={handleInputChange}
              placeholder="Add any additional remarks"
              rows="3"
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
            {!loading && <Save size={16} />}
          </SubmitButton>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default BurialTypeModal;

/* ================================
   STYLED COMPONENTS SECTION
================================ */

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.4rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.2s;
  &:hover {
    background: #f2f2f2;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Input = styled.input`
  padding: 0.65rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
`;

const Select = styled.select`
  padding: 0.65rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
`;

const TextArea = styled.textarea`
  padding: 0.65rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.95rem;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;
