import React from 'react';
import styled from 'styled-components';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Users, BookText, Phone, MapPin, X } from 'lucide-react';

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
`;

const ModalContent = styled.div`
  background: #fff;
  width: 90%;
  max-width: 550px;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #f1f1f1;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h5`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  &:hover {
    color: #ff1900;
  }
`;

const ModalInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ModalInfoLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #444;
  width: 140px;
`;

const ModalInfoValue = styled.span`
  color: #333;
  font-weight: 500;
`;

const Card = styled.div`
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h6`
  font-weight: 700;
  color: #06b10f;
`;

const TextMuted = styled.p`
  text-align: center;
  color: #777;
  font-size: 0.95rem;
`;

// Component
const NextOfKinModal = ({ isOpen, onClose, nextOfKin }) => {
  if (!isOpen || !nextOfKin) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent className="animate__animated animate__fadeInUp" onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Users size={24} />
            Next of Kin Details
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {nextOfKin.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {nextOfKin.map((kin, index) => (
              <Card key={index}>
                <CardTitle>{kin.full_name}</CardTitle>
                <ModalInfoItem>
                  <ModalInfoLabel>
                    <BookText size={16} /> Relationship:
                  </ModalInfoLabel>
                  <ModalInfoValue>{kin.relationship}</ModalInfoValue>
                </ModalInfoItem>

                <ModalInfoItem>
                  <ModalInfoLabel>
                    <Phone size={16} /> Phone:
                  </ModalInfoLabel>
                  <ModalInfoValue>{kin.phone_number}</ModalInfoValue>
                </ModalInfoItem>

                <ModalInfoItem>
                  <ModalInfoLabel>
                    <MapPin size={16} /> Address:
                  </ModalInfoLabel>
                  <ModalInfoValue>{kin.address}</ModalInfoValue>
                </ModalInfoItem>
              </Card>
            ))}
          </div>
        ) : (
          <TextMuted>No next of kin information available.</TextMuted>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default NextOfKinModal;
