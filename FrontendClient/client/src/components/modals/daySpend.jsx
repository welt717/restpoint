import React from 'react';
import { CalendarDays, Tag, Calendar, X, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import styled from 'styled-components';

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

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 1.5rem 0;
  text-align: center;
`;

const StatItem = styled.div`
  flex: 1;
  padding: 1rem;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${props => props.color || Colors.accentBlue};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: ${Colors.textMuted};
  font-size: 0.9rem;
`;

const Divider = styled.div`
  border-left: 1px solid ${Colors.mediumGray};
  height: 60px;
  align-self: center;
`;

const ChargesSection = styled.div`
  background-color: ${Colors.lightGray};
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
`;

const ChargeRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
`;

const TotalRow = styled(ChargeRow)`
  font-weight: bold;
  border-top: 1px solid ${Colors.mediumGray};
  padding-top: 0.75rem;
  margin-top: 0.5rem;
`;

const AlertBanner = styled.div`
  background-color: ${props => 
    props.type === 'warning' ? '#FEF3CD' : 
    props.type === 'success' ? '#D1F2EB' : 
    '#E3F2FD'};
  border-left: 4px solid ${props => 
    props.type === 'warning' ? Colors.warningYellow : 
    props.type === 'success' ? Colors.successGreen : 
    Colors.infoBlue};
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DaysSpentModal = ({ isOpen, onClose, deceasedData }) => {
  const calculateDaysSpent = () => {
    if (!deceasedData?.date_admitted) return 0;
    const admitted = new Date(deceasedData.date_admitted);
    const today = new Date();
    const diffTime = today - admitted;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getDailyRate = () => {
    // You might want to get this from deceasedData.rate_category or financial_details
    return 800; // Default daily rate in KES
  };

  const daysSpent = calculateDaysSpent();
  const financialDetails = deceasedData?.financial_details || {};
  const apiDaysSpent = financialDetails.days_spent || 0;
  const coldRoomCharges = financialDetails.cold_room_charges || 0;
  const otherCharges = financialDetails.other_charges || 0;
  const totalCharges = financialDetails.total_charges || 0;
  const totalPayments = financialDetails.total_payments || 0;
  const balance = financialDetails.balance || 0;
  const currency = financialDetails.currency || 'KES';

  const dailyRate = getDailyRate();
  const calculatedColdRoomCharges = apiDaysSpent * dailyRate;

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <ModalHeader>
          <ModalTitle>
            <CalendarDays size={24} />
            Days Spent in Mortuary
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <div style={{ padding: '1rem 0' }}>
          <ModalInfoItem>
            <ModalInfoLabel><Tag size={16} /> Deceased ID:</ModalInfoLabel>
            <ModalInfoValue>{deceasedData?.deceased_id || 'N/A'}</ModalInfoValue>
          </ModalInfoItem>
          
          <ModalInfoItem>
            <ModalInfoLabel><Calendar size={16} /> Date Admitted:</ModalInfoLabel>
            <ModalInfoValue>
              {deceasedData?.date_admitted ? new Date(deceasedData.date_admitted).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'}
            </ModalInfoValue>
          </ModalInfoItem>

          {/* Days Comparison */}
          <StatsContainer>
            <StatItem>
              <StatValue color={Colors.accentBlue}>
                {apiDaysSpent}
              </StatValue>
              <StatLabel>Days (from API)</StatLabel>
            </StatItem>
            
            <Divider />
            
            <StatItem>
              <StatValue color={Colors.infoBlue}>
                {daysSpent}
              </StatValue>
              <StatLabel>Days (calculated)</StatLabel>
            </StatItem>
          </StatsContainer>

          {/* Alert if days don't match */}
          {apiDaysSpent !== daysSpent && (
            <AlertBanner type="warning">
              <AlertCircle size={18} color={Colors.warningYellow} />
              <span>Days spent calculation differs from API data</span>
            </AlertBanner>
          )}

          {/* Charges Calculation */}
          <ChargesSection>
            <h4 style={{ margin: '0 0 1rem 0', color: Colors.darkGray, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} />
              Charges Calculation
            </h4>
            
            <ChargeRow>
              <span>Days Spent:</span>
              <span>{apiDaysSpent} days</span>
            </ChargeRow>
            
            <ChargeRow>
              <span>Daily Rate:</span>
              <span>{currency} {dailyRate.toLocaleString()}</span>
            </ChargeRow>
            
            <ChargeRow>
              <span>Cold Room Charges:</span>
              <span>{currency} {coldRoomCharges.toLocaleString()}</span>
            </ChargeRow>
            
            <ChargeRow>
              <span>Other Charges:</span>
              <span>{currency} {otherCharges.toLocaleString()}</span>
            </ChargeRow>
            
            <TotalRow>
              <span>Total Charges:</span>
              <span>{currency} {totalCharges.toLocaleString()}</span>
            </TotalRow>
          </ChargesSection>

          {/* Payment Summary */}
          <ChargesSection>
            <h4 style={{ margin: '0 0 1rem 0', color: Colors.darkGray, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} />
              Payment Summary
            </h4>
            
            <ChargeRow>
              <span>Total Payments:</span>
              <span style={{ color: Colors.successGreen }}>
                {currency} {totalPayments.toLocaleString()}
              </span>
            </ChargeRow>
            
            <TotalRow>
              <span>Balance Due:</span>
              <span style={{ 
                color: balance > 0 ? Colors.dangerRed : Colors.successGreen,
                fontWeight: 'bold'
              }}>
                {currency} {balance.toLocaleString()}
              </span>
            </TotalRow>

            {balance > 0 && (
              <AlertBanner type="warning">
                <AlertCircle size={18} color={Colors.warningYellow} />
                <span>Outstanding balance of {currency} {balance.toLocaleString()}</span>
              </AlertBanner>
            )}
          </ChargesSection>

          {/* Additional Information */}
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: Colors.textMuted }}>
            <p><strong>Note:</strong> Days are calculated from admission date to current date.</p>
            <p><strong>Last updated:</strong> {deceasedData?.last_charge_update ? 
              new Date(deceasedData.last_charge_update).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'
            }</p>
          </div>
        </div>

        <SubmitButton onClick={onClose}>
          Close
        </SubmitButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DaysSpentModal;