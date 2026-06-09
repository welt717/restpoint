import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  X,
  DollarSign,
  Settings,
  Save,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import axios from 'axios';

// API Gateway URL
const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased`;

// Colors
const Colors = {
  primaryDark: '#0f172a',
  accentBlue: '#3b82f6',
  accentPurple: '#8b5cf6',
  successGreen: '#10b981',
  dangerRed: '#ef4444',
  warningYellow: '#f59e0b',
  lightGray: '#f8fafc',
  mediumGray: '#e2e8f0',
  darkGray: '#1e293b',
  textMuted: '#64748b',
  white: '#ffffff',
  borderGray: '#e2e8f0',
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: ${Colors.white};
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.3s ease-out;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${Colors.borderGray};
  background: linear-gradient(135deg, ${Colors.primaryDark} 0%, ${Colors.accentPurple} 100%);
  
  h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: ${Colors.white};
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: ${Colors.white};
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${Colors.borderGray};
  background-color: ${Colors.lightGray};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${Colors.borderGray};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${({ cols }) => cols || '1fr 1fr'};
  gap: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${Colors.darkGray};
`;

const Select = styled.select`
  padding: 0.625rem 1rem;
  border: 1px solid ${Colors.borderGray};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background-color: ${Colors.white};
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Input = styled.input`
  padding: 0.625rem 1rem;
  border: 1px solid ${Colors.borderGray};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, ${Colors.accentBlue} 0%, ${Colors.accentPurple} 100%);
  color: ${Colors.white};
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
`;

const SecondaryButton = styled(Button)`
  background-color: ${Colors.mediumGray};
  color: ${Colors.darkGray};
  
  &:hover:not(:disabled) {
    background-color: #d1d5db;
  }
`;

const OutlineButton = styled(Button)`
  background: transparent;
  border: 1px solid ${Colors.borderGray};
  color: ${Colors.darkGray};
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  
  &:hover:not(:disabled) {
    border-color: ${Colors.accentBlue};
    color: ${Colors.accentBlue};
    background-color: #eff6ff;
  }
`;

const StatCard = styled.div`
  background: ${Colors.white};
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid ${Colors.borderGray};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${Colors.textMuted};
  margin-top: 0.25rem;
`;

const HistoryPanel = styled.div`
  border: 1px solid ${Colors.borderGray};
  border-radius: 0.75rem;
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background-color: ${Colors.lightGray};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${Colors.mediumGray};
  }
  
  h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${Colors.primaryDark};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const HistoryList = styled.div`
  max-height: ${({ isOpen }) => (isOpen ? '300px' : '0')};
  overflow-y: auto;
  transition: max-height 0.3s ease;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${Colors.borderGray};
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${Colors.lightGray};
  }
`;

const HistoryItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const HistoryItemTitle = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${Colors.primaryDark};
`;

const HistoryItemMeta = styled.span`
  font-size: 0.7rem;
  color: ${Colors.textMuted};
`;

const AnimatedLoader = styled(RefreshCw)`
  animation: ${spin} 1s linear infinite;
`;

const AlertBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background-color: ${(props) => props.type === 'warning' ? '#fef3c7' : props.type === 'success' ? '#d1fae5' : '#dbeafe'};
  border: 1px solid ${(props) => props.type === 'warning' ? '#f59e0b' : props.type === 'success' ? '#10b981' : '#3b82f6'};
  color: ${(props) => props.type === 'warning' ? '#92400e' : props.type === 'success' ? '#065f46' : '#1e40af'};
  font-size: 0.8rem;
`;

// Get tenant slug
const getTenantSlug = () => {
  return localStorage.getItem('tenantSlug') || 
         localStorage.getItem('tenant_slug') ||
         (() => {
           try {
             const user = JSON.parse(localStorage.getItem('user') || '{}');
             return user.tenantSlug || user.tenant?.slug || 'default';
           } catch {
             return 'default';
           }
         })();
};

// Main Component
const ChargeSettingsModal = ({ isOpen, onClose, deceasedId, deceasedData, onUpdate }) => {
  // Form State
  const [rateProfile, setRateProfile] = useState('standard');
  const [currency, setCurrency] = useState('KES');
  const [chargeType, setChargeType] = useState('daily');
  const [dailyRate, setDailyRate] = useState(3000);
  const [hourlyRate, setHourlyRate] = useState(125);
  const [usdRate, setUsdRate] = useState(130);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [chargeHistory, setChargeHistory] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  
  // API Client
  const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });
  
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      const tenantSlug = getTenantSlug();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (tenantSlug && tenantSlug !== 'default') config.headers['x-tenant-slug'] = tenantSlug;
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Load charge settings
  const loadChargeSettings = async () => {
    if (!deceasedId) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/charge-settings?id=${deceasedId}`);
      if (response.data.success) {
        const data = response.data.data;
        setRateProfile(data.rateProfile || 'standard');
        setCurrency(data.currency || 'KES');
        setChargeType(data.chargeType || 'daily');
        setDailyRate(data.dailyRate || 3000);
        setHourlyRate(data.hourlyRate || 125);
        setUsdRate(data.usdRate || 130);
      }
    } catch (error) {
      console.error('Error loading charge settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && deceasedId) {
      loadChargeSettings();
    }
  }, [isOpen, deceasedId]);
  
  // Handle save
  const handleSave = async () => {
    if (!deceasedId) return;
    
    setIsSaving(true);
    try {
      const response = await apiClient.put(`/charge-settings/${deceasedId}`, {
        rateProfile, currency, chargeType, dailyRate, hourlyRate, usdRate,
      });
      
      if (response.data.success) {
        if (onUpdate) onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error saving charge settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const getDaysInMorgue = () => {
    if (!deceasedData?.date_admitted) return 0;
    const admissionDate = new Date(deceasedData.date_admitted);
    const today = new Date();
    return Math.ceil((today - admissionDate) / (1000 * 60 * 60 * 24));
  };
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>
            <Settings size={20} />
            Charge Settings - {deceasedData?.full_name}
          </h2>
          <CloseButton onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {/* Summary Stats */}
          <Grid cols="1fr 1fr">
            <StatCard>
              <StatValue>{deceasedData?.total_mortuary_charge || 0} {currency}</StatValue>
              <StatLabel>Current Balance</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{getDaysInMorgue()} days</StatValue>
              <StatLabel>Days in Morgue</StatLabel>
            </StatCard>
          </Grid>
          
          {/* Rate Settings */}
          <Section>
            <SectionTitle>
              <DollarSign size={16} />
              Rate Configuration
            </SectionTitle>
            
            <Grid cols="1fr 1fr">
              <FormGroup>
                <Label>Rate Profile</Label>
                <Select value={rateProfile} onChange={(e) => setRateProfile(e.target.value)}>
                  <option value="standard">Standard (KES 3,000/day)</option>
                  <option value="premium">Premium (KES 5,000/day)</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Currency</Label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="KES">KES (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                </Select>
              </FormGroup>
            </Grid>
            
            <Grid cols="1fr 1fr">
              <FormGroup>
                <Label>Billing Type</Label>
                <Select value={chargeType} onChange={(e) => setChargeType(e.target.value)}>
                  <option value="daily">Daily Rate</option>
                  <option value="hourly">Hourly Rate</option>
                </Select>
              </FormGroup>
              
              {chargeType === 'daily' ? (
                <FormGroup>
                  <Label>Daily Rate ({currency})</Label>
                  <Input type="number" value={dailyRate} onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)} min="0" step="100" />
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>Hourly Rate ({currency})</Label>
                  <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)} min="0" step="10" />
                </FormGroup>
              )}
            </Grid>
            
            {currency === 'USD' && (
              <FormGroup>
                <Label>USD to KES Exchange Rate</Label>
                <Input type="number" value={usdRate} onChange={(e) => setUsdRate(parseFloat(e.target.value) || 130)} min="1" step="1" />
              </FormGroup>
            )}
          </Section>
          
          <AlertBox type="warning">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Note:</strong> Changing these settings will apply the new rate to future charges. 
              Existing charges will remain unchanged.
            </div>
          </AlertBox>
        </ModalBody>
        
        <ModalFooter>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <><AnimatedLoader size={18} /> Saving...</> : <><Save size={18} /> Save Changes</>}
          </PrimaryButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ChargeSettingsModal;