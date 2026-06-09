// Updated ChargeSettingsPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { 
  DollarSign, 
  Save, 
  ArrowLeft, 
  Tag, 
  Clock, 
  Calendar,
  Zap,
  Crown,
  RefreshCw,
  Percent,
  TrendingUp,
  Shield,
  UserCheck,
  Badge,
  FileText,
  CreditCard,
  BarChart
} from "lucide-react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";

// Base API URL
const BASE_API = "http://localhost:5000/api/v1/restpoint";

// Configure axios
axios.defaults.baseURL = BASE_API;

// 🎨 Modern Color Palette
const Colors = {
  primary: "#6B46C1",
  primaryDark: "#553C9A",
  primaryLight: "#9F7AEA",
  secondary: "#4C327A",
  accent: "#ED64A6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
  
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceHover: "#F9FBFC",
  
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  shadowHover: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// ===============================
// Enhanced Styled Components
// ===============================
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${Colors.background} 0%, #F1F5F9 100%);
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid ${Colors.borderLight};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${Colors.surface};
  border: 2px solid ${Colors.border};
  color: ${Colors.primary};
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: ${Colors.shadow};
  
  &:hover {
    background: ${Colors.primary};
    color: white;
    transform: translateY(-2px);
    box-shadow: ${Colors.shadowHover};
  }
`;

const PageTitle = styled.h1`
  font-weight: 800;
  color: ${Colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.75rem;
  
  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const PageContent = styled.div`
  background: ${Colors.surface};
  border-radius: 20px;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  box-shadow: ${Colors.shadowHover};
  border: 1px solid ${Colors.borderLight};
`;

const ClientInfoCard = styled.div`
  background: linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 25px rgba(107, 70, 193, 0.3);
`;

const ClientAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
`;

const ClientInfo = styled.div`
  flex: 1;
`;

const ClientName = styled.h2`
  margin: 0 0 0.25rem 0;
  font-weight: 700;
  font-size: 1.5rem;
`;

const ClientDetails = styled.p`
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
`;

const QuickStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: ${Colors.surface};
  border-radius: 12px;
  padding: 1rem;
  border: 2px solid ${Colors.borderLight};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color || Colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: ${Colors.textSecondary};
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormSection = styled.div`
  background: ${Colors.surfaceHover};
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid ${Colors.borderLight};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${Colors.primaryLight};
    transform: translateY(-2px);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${Colors.borderLight};
`;

const SectionTitle = styled.h3`
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0;
  font-size: 1.25rem;
`;

const SectionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.primaryLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${Colors.textPrimary};
  font-size: 0.95rem;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: ${Colors.textLight};
  z-index: 2;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid ${Colors.border};
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: ${Colors.surface};
  color: ${Colors.textPrimary};
  
  &:focus {
    outline: none;
    border-color: ${Colors.primary};
    box-shadow: 0 0 0 3px ${Colors.primaryLight}20;
  }
  
  &::placeholder {
    color: ${Colors.textLight};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid ${Colors.border};
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: ${Colors.surface};
  color: ${Colors.textPrimary};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${Colors.primary};
    box-shadow: 0 0 0 3px ${Colors.primaryLight}20;
  }
`;

const RateProfileCard = styled.div`
  background: ${Colors.surface};
  border: 2px solid ${props => props.active ? Colors.primary : Colors.border};
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  ${props => props.active && `
    background: linear-gradient(135deg, ${Colors.primary}08 0%, ${Colors.primaryLight}08 100%);
    border-color: ${Colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(107, 70, 193, 0.15);
  `}
  
  &:hover {
    border-color: ${Colors.primaryLight};
    transform: translateY(-2px);
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const ProfileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ProfileTitle = styled.h4`
  margin: 0;
  font-weight: 700;
  color: ${Colors.textPrimary};
  font-size: 1.1rem;
`;

const ProfileDescription = styled.p`
  margin: 0;
  color: ${Colors.textSecondary};
  font-size: 0.9rem;
  line-height: 1.4;
`;

const SummaryBox = styled.div`
  background: linear-gradient(135deg, ${Colors.surfaceHover} 0%, #F8FAFC 100%);
  border: 2px solid ${Colors.borderLight};
  padding: 2rem;
  border-radius: 20px;
  margin: 2rem 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${Colors.primary} 0%, ${Colors.accent} 100%);
  }
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${Colors.borderLight};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: ${Colors.textPrimary};
`;

const SummaryValue = styled.span`
  font-weight: 700;
  color: ${Colors.primary};
  font-size: 1.1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const PrimaryButton = styled.button`
  flex: 1;
  padding: 1.25rem;
  background: linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.secondary} 100%);
  border: none;
  border-radius: 16px;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(107, 70, 193, 0.4);
  cursor: pointer;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(107, 70, 193, 0.5);
  }
  
  &:disabled {
    background: ${Colors.textLight};
    transform: none;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background: ${Colors.surface};
  color: ${Colors.primary};
  border: 2px solid ${Colors.primary};
  
  &:hover:not(:disabled) {
    background: ${Colors.primary};
    color: white;
  }
`;

// Simplified Rate Profile Options
const rateProfiles = [
  {
    id: "standard",
    name: "Standard Rate",
    description: "Regular pricing for standard clients",
    icon: <Badge size={20} />,
    color: Colors.primary,
  },
  {
    id: "premium",
    name: "Premium Client",
    description: "Enhanced services with premium pricing",
    icon: <Crown size={20} />,
    color: Colors.warning,
  },
  {
    id: "discount",
    name: "Discounted Rate",
    description: "Special rates for specific cases",
    icon: <Percent size={20} />,
    color: Colors.success,
  }
];

// ===============================
// MAIN PAGE COMPONENT
// ===============================
const ChargeSettingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [chargeSettings, setChargeSettings] = useState({
    rateProfile: "standard",
    currency: "KES",
    chargeType: "daily",
    dailyRate: "",
    hourlyRate: "",
    usdRate: "",
  });

  const [loading, setLoading] = useState(false);
  const [deceasedData, setDeceasedData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [billingSummary, setBillingSummary] = useState(null);

  // Fetch deceased data and billing summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Fetch deceased data
        const [deceasedResponse, billingResponse] = await Promise.all([
          axios.get(`/charge-settings?id=${id}`),
          axios.get(`/billing-summary/${id}`)
        ]);

        if (deceasedResponse.data.success) {
          const data = deceasedResponse.data.data;
          setDeceasedData(data);
          
          // Set charge settings from API response
          setChargeSettings({
            rateProfile: data.rateProfile || "standard",
            currency: data.currency || "KES",
            chargeType: data.chargeType || "daily",
            dailyRate: data.dailyRate || "",
            hourlyRate: data.hourlyRate || "",
            usdRate: data.usdRate || "130",
          });
        }

        if (billingResponse.data.success) {
          setBillingSummary(billingResponse.data.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "Failed to load data");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For number inputs, remove any non-digit characters
    if (name === 'dailyRate' || name === 'hourlyRate' || name === 'usdRate') {
      // Remove any non-digit characters
      let cleanValue = value.replace(/[^\d]/g, '');
      
      // Remove leading zeros
      cleanValue = cleanValue.replace(/^0+/, '');
      
      // If empty after cleaning, set to empty string
      cleanValue = cleanValue === '' ? '' : parseInt(cleanValue, 10);
      
      setChargeSettings((prev) => ({
        ...prev,
        [name]: cleanValue,
      }));
    } else {
      // For other inputs, use the value as is
      setChargeSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle rate profile selection
  const handleRateProfileSelect = (profileId) => {
    setChargeSettings((prev) => ({
      ...prev,
      rateProfile: profileId
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      if (!id) {
        throw new Error("Deceased ID is missing");
      }

      // Convert empty strings to 0 for validation
      const dailyRate = chargeSettings.dailyRate === "" ? 0 : parseInt(chargeSettings.dailyRate, 10);
      const hourlyRate = chargeSettings.hourlyRate === "" ? 0 : parseInt(chargeSettings.hourlyRate, 10);
      const usdRate = chargeSettings.usdRate === "" ? 0 : parseInt(chargeSettings.usdRate, 10);

      // Custom validation
      if (chargeSettings.chargeType === "daily" && (!dailyRate || dailyRate <= 0)) {
        throw new Error("Please enter a valid daily rate.");
      }
      if (chargeSettings.chargeType === "hourly" && (!hourlyRate || hourlyRate <= 0)) {
        throw new Error("Please enter a valid hourly rate.");
      }
      if (chargeSettings.currency === "USD" && (!usdRate || usdRate <= 0)) {
        throw new Error("Please enter a valid USD exchange rate.");
      }

      // Prepare API data
      const apiData = {
        rateProfile: chargeSettings.rateProfile,
        currency: chargeSettings.currency,
        chargeType: chargeSettings.chargeType,
        dailyRate: dailyRate,
        hourlyRate: hourlyRate,
        usdRate: usdRate
      };

      // Send request
      const response = await axios.post(`/update-charge-settings/${id}`, apiData);

      if (response.data.success) {
        toast.success("💰 Charge settings updated successfully!");
        // Refresh data
        const [deceasedResponse, billingResponse] = await Promise.all([
          axios.get(`/charge-settings?id=${id}`),
          axios.get(`/billing-summary/${id}`)
        ]);
        
        if (deceasedResponse.data.success) {
          setDeceasedData(deceasedResponse.data.data);
        }
        
        if (billingResponse.data.success) {
          setBillingSummary(billingResponse.data.data);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  // View billing summary
  const handleViewBillingSummary = () => {
    navigate(`/billing/${id}`);
  };

  if (isLoadingData) {
    return (
      <PageContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="animate-spin" style={{ color: Colors.primary }}>
            <RefreshCw size={32} />
          </div>
          <p style={{ color: Colors.textSecondary, fontWeight: 600 }}>Loading charge settings...</p>
        </div>
      </PageContainer>
    );
  }

  const currentProfile = rateProfiles.find(profile => profile.id === chargeSettings.rateProfile);
  
  // Format currency
  const formatCurrency = (amount, currency) => {
    if (!amount || amount === "") return '0';
    const number = parseInt(amount, 10);
    if (isNaN(number)) return '0';
    
    if (currency === 'USD') {
      return `$${number.toLocaleString()}`;
    } else {
      return `KES ${number.toLocaleString()}`;
    }
  };

  // Calculate display rate
  const displayRate = chargeSettings.chargeType === "daily" 
    ? chargeSettings.dailyRate 
    : chargeSettings.hourlyRate;

  return (
    <PageContainer>
      <PageHeader>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </BackButton>
        <PageTitle>
          <TrendingUp size={32} /> Custom Billing Setup
        </PageTitle>
      </PageHeader>

      <PageContent>
        {/* Client Info Card */}
        <ClientInfoCard>
          <ClientAvatar>
            {deceasedData?.full_name?.charAt(0) || 'C'}
          </ClientAvatar>
          <ClientInfo>
            <ClientName>{deceasedData?.full_name || 'Client'}</ClientName>
            <ClientDetails>
              Deceased ID: {id} • {deceasedData?.date_admitted ? `Admitted: ${new Date(deceasedData.date_admitted).toLocaleDateString()}` : 'No admission date'}
            </ClientDetails>
          </ClientInfo>
          <Shield size={24} color="rgba(255,255,255,0.7)" />
        </ClientInfoCard>

        {/* Quick Stats */}
        <QuickStats>
          <StatCard>
            <StatIcon color={Colors.success}>
              <CreditCard size={20} />
            </StatIcon>
            <StatInfo>
              <StatLabel>Current Balance</StatLabel>
              <StatValue>
                {formatCurrency(deceasedData?.currentBalance || 0, chargeSettings.currency)}
              </StatValue>
            </StatInfo>
          </StatCard>
          
          <StatCard>
            <StatIcon color={Colors.primary}>
              <DollarSign size={20} />
            </StatIcon>
            <StatInfo>
              <StatLabel>Billing Rate</StatLabel>
              <StatValue>
                {displayRate ? formatCurrency(displayRate, chargeSettings.currency) : 'Not Set'}
              </StatValue>
            </StatInfo>
          </StatCard>
          
          <StatCard>
            <StatIcon color={Colors.info}>
              <BarChart size={20} />
            </StatIcon>
            <StatInfo>
              <StatLabel>Currency</StatLabel>
              <StatValue>{chargeSettings.currency}</StatValue>
            </StatInfo>
          </StatCard>
        </QuickStats>

        <form onSubmit={handleSubmit}>
          <FormGrid>
            {/* Rate Profile Section */}
            <FormSection>
              <SectionHeader>
                <SectionIcon>
                  <UserCheck size={24} />
                </SectionIcon>
                <SectionTitle>Client Profile</SectionTitle>
              </SectionHeader>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rateProfiles.map((profile) => (
                  <RateProfileCard
                    key={profile.id}
                    active={chargeSettings.rateProfile === profile.id}
                    onClick={() => handleRateProfileSelect(profile.id)}
                  >
                    <ProfileHeader>
                      <ProfileIcon color={profile.color}>
                        {profile.icon}
                      </ProfileIcon>
                      <ProfileTitle>{profile.name}</ProfileTitle>
                    </ProfileHeader>
                    <ProfileDescription>{profile.description}</ProfileDescription>
                  </RateProfileCard>
                ))}
              </div>
            </FormSection>

            {/* Billing Configuration */}
            <FormSection>
              <SectionHeader>
                <SectionIcon>
                  <DollarSign size={24} />
                </SectionIcon>
                <SectionTitle>Billing Setup</SectionTitle>
              </SectionHeader>

              <FormGroup>
                <Label>
                  <Zap size={16} /> Charge Frequency
                </Label>
                <Select
                  name="chargeType"
                  value={chargeSettings.chargeType}
                  onChange={handleInputChange}
                >
                  <option value="daily">Daily Rate</option>
                  <option value="hourly">Hourly Rate</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>
                  <Tag size={16} /> Currency
                </Label>
                <Select
                  name="currency"
                  value={chargeSettings.currency}
                  onChange={handleInputChange}
                >
                  <option value="KES">KES (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                </Select>
              </FormGroup>

              {chargeSettings.chargeType === "daily" && (
                <FormGroup>
                  <Label>
                    <Calendar size={16} /> Custom Daily Rate
                  </Label>
                  <InputWrapper>
                    <InputIcon>
                      <DollarSign size={18} />
                    </InputIcon>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="dailyRate"
                      value={chargeSettings.dailyRate}
                      onChange={handleInputChange}
                      placeholder="Enter amount (e.g., 4000)"
                    />
                  </InputWrapper>
                </FormGroup>
              )}

              {chargeSettings.chargeType === "hourly" && (
                <FormGroup>
                  <Label>
                    <Clock size={16} /> Custom Hourly Rate
                  </Label>
                  <InputWrapper>
                    <InputIcon>
                      <DollarSign size={18} />
                    </InputIcon>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="hourlyRate"
                      value={chargeSettings.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="Enter amount (e.g., 200)"
                    />
                  </InputWrapper>
                </FormGroup>
              )}

              {chargeSettings.currency === "USD" && (
                <FormGroup>
                  <Label>
                    <TrendingUp size={16} /> USD Exchange Rate
                  </Label>
                  <InputWrapper>
                    <InputIcon>
                      <DollarSign size={18} />
                    </InputIcon>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="usdRate"
                      value={chargeSettings.usdRate}
                      onChange={handleInputChange}
                      placeholder="Enter rate (e.g., 130)"
                    />
                  </InputWrapper>
                </FormGroup>
              )}
            </FormSection>
          </FormGrid>

          {/* Summary Section */}
          <SummaryBox>
            <h4 style={{ 
              margin: "0 0 1.5rem 0", 
              color: Colors.primary,
              fontWeight: 800,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Shield size={28} /> Billing Summary
            </h4>
            
            <SummaryItem>
              <SummaryLabel>
                <Crown size={18} /> Client Profile
              </SummaryLabel>
              <SummaryValue>{currentProfile?.name}</SummaryValue>
            </SummaryItem>
            
            <SummaryItem>
              <SummaryLabel>
                <DollarSign size={18} /> Billing Rate
              </SummaryLabel>
              <SummaryValue>
                {displayRate ? formatCurrency(displayRate, chargeSettings.currency) : 'Not Set'} / {chargeSettings.chargeType === 'daily' ? 'Day' : 'Hour'}
              </SummaryValue>
            </SummaryItem>
            
            <SummaryItem>
              <SummaryLabel>
                <Tag size={18} /> Currency
              </SummaryLabel>
              <SummaryValue>{chargeSettings.currency}</SummaryValue>
            </SummaryItem>

            {chargeSettings.currency === "USD" && chargeSettings.usdRate && (
              <SummaryItem>
                <SummaryLabel>
                  <TrendingUp size={18} /> Exchange Rate
                </SummaryLabel>
                <SummaryValue>1 USD = {chargeSettings.usdRate} KES</SummaryValue>
              </SummaryItem>
            )}
          </SummaryBox>

          <ActionButtons>
            <SecondaryButton type="button" onClick={handleViewBillingSummary}>
              <FileText size={20} /> View Billing Summary
            </SecondaryButton>
            
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin">
                    <RefreshCw size={20} />
                  </div>
                  Saving Configuration...
                </>
              ) : (
                <>
                  <Save size={20} /> Save Custom Billing Setup
                </>
              )}
            </PrimaryButton>
          </ActionButtons>
        </form>
      </PageContent>
    </PageContainer>
  );
};

export default ChargeSettingsPage;