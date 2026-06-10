// modals/ColdRoomModal.js
import React from 'react';
import { Box, Tag, Calendar, Clock, Ruler, X } from 'lucide-react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

// --- Modern Color Palette ---
const Colors = {
  primaryDark: '#1E293B',
  accentRed: '#EF4444',
  accentBlue: '#3B82F6',
  lightGray: '#F8FAFC',
  mediumGray: '#E2E8F0',
  darkGray: '#334155',
  successGreen: '#10B981',
  dangerRed: '#DC2626',
  warningYellow: '#F59E0B',
  infoBlue: '#0EA5E9',
  textMuted: '#64748B',
  cardBg: '#FFFFFF',
  cardShadow: '0 4px 16px rgba(0,0,0,0.08)',
  borderColor: '#CBD5E1',
  activeTab: '#F0F4F8',
  infoBlueLight: '#93c5fd',
  purple: '#8b5cf6'
};

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${Colors.primaryDark};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${Colors.mediumGray};
  }
`;

const ModalInfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: ${Colors.lightGray};
`;

const ModalInfoLabel = styled.span`
  font-weight: 600;
  color: ${Colors.textMuted};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 150px;
`;

const ModalInfoValue = styled.span`
  font-weight: 500;
  color: ${Colors.darkGray};
`;

const SubmitButton = styled.button`
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, ${Colors.accentBlue} 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    background: ${Colors.textMuted};
    cursor: not-allowed;
  }
`;

const GenerateButton = styled.button`
  background: linear-gradient(135deg, ${Colors.warningYellow} 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ColdRoomModal = ({ isOpen, onClose, deceasedData }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <ModalHeader>
          <ModalTitle>
            <Box size={24} />
            Cold Room Details
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <div style={{ padding: '1rem 0' }}>
          <ModalInfoItem>
            <ModalInfoLabel><Tag size={16} /> Deceased ID:</ModalInfoLabel>
            <ModalInfoValue>{deceasedData.deceased_id}</ModalInfoValue>
          </ModalInfoItem>
          
          <ModalInfoItem>
            <ModalInfoLabel><Box size={16} /> Cold Room Number:</ModalInfoLabel>
            <ModalInfoValue>
              {deceasedData.cold_room_no || 
                <span style={{ color: Colors.textMuted, fontStyle: 'italic' }}>Not assigned</span>}
            </ModalInfoValue>
          </ModalInfoItem>
          
          <ModalInfoItem>
            <ModalInfoLabel><Ruler size={16} /> Tray Number:</ModalInfoLabel>
            <ModalInfoValue>
              {deceasedData.tray_no || 
                <span style={{ color: Colors.textMuted, fontStyle: 'italic' }}>Not assigned</span>}
            </ModalInfoValue>
          </ModalInfoItem>
          
          <ModalInfoItem>
            <ModalInfoLabel><Calendar size={16} /> Date Admitted:</ModalInfoLabel>
            <ModalInfoValue>
              {deceasedData.date_admitted ? new Date(deceasedData.date_admitted).toLocaleString() : 'N/A'}
            </ModalInfoValue>
          </ModalInfoItem>
          
          <ModalInfoItem>
            <ModalInfoLabel><Clock size={16} /> Days in Mortuary:</ModalInfoLabel>
            <ModalInfoValue>
              {deceasedData.financial_details?.days_spent || 0} days
            </ModalInfoValue>
          </ModalInfoItem>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <SubmitButton onClick={onClose}>
            Close
          </SubmitButton>
          
          {(!deceasedData.cold_room_no || !deceasedData.tray_no) && (
            <GenerateButton onClick={() => {
              toast.info('Cold room assignment feature coming soon');
            }}>
              Assign Location
            </GenerateButton>
          )}
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ColdRoomModal;