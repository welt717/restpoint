import React, { useState, useEffect, lazy, Suspense, Component, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  QrCode,
  RefreshCw,
  ArrowLeft,
  User,
  Info,
  AlertTriangle,
  CheckCircle,
  Users,
  Microscope,
  DollarSign,
  FileText,
  Box,
  Truck,
  Menu,
  X,
  Activity,
  LogOut,
  Settings,
  Download,
  Printer,
  Report,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  Building2,
} from 'lucide-react';
import styled, { keyframes } from 'styled-components';

// API Gateway URL - Centralized
const API_GATEWAY_URL = 'http://localhost:8000';
const BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased`;

// Colors - Enhanced modern palette with gradients (Unified across all components)
const Colors = {
  primaryDark: '#0f172a',
  primaryGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  accentRed: '#ef4444',
  accentRedGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  accentBlue: '#3b82f6',
  accentBlueGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  accentPurple: '#8b5cf6',
  accentPurpleGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  lightGray: '#f8fafc',
  mediumGray: '#e2e8f0',
  darkGray: '#1e293b',
  chargeSetting: '#6b21a5',
  chargeSettingGradient: 'linear-gradient(135deg, #6b21a5 0%, #7c3aed 100%)',
  successGreen: '#10b981',
  successGreenGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  dangerRed: '#dc2626',
  warningYellow: '#f59e0b',
  warningYellowGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  infoBlue: '#0ea5e9',
  infoBluGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  textMuted: '#64748b',
  cardBg: '#ffffff',
  cardShadow: '0 4px 20px rgba(0,0,0,0.08)',
  cardShadowHover: '0 12px 35px rgba(0,0,0,0.12)',
  borderColor: '#e2e8f0',
  borderColorLight: '#f1f5f9',
};

// Keyframes animations for smooth transitions
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${Colors.lightGray} 0%, #f1f5f9 100%);
  padding: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${Colors.darkGray};
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const ContentGrid = styled.div`
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 992px) {
    grid-template-columns: 60% 40%;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderCard = styled.div`
  background: ${Colors.primaryGradient};
  color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: ${Colors.cardShadow};
  animation: ${slideInLeft} 0.5s ease-out;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: ${Colors.cardShadowHover};
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: ${Colors.dangerRed};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.375rem;

  &:hover {
    color: ${Colors.infoBlue};
  }
`;

const Card = styled.div`
  background: ${Colors.cardBg};
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: ${Colors.cardShadow};
  border: 1px solid ${Colors.borderColorLight};
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: ${Colors.cardShadowHover};
    border-color: ${Colors.accentBlue}20;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const CardTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${Colors.accentBlue}20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${Colors.primaryDark};
  letter-spacing: -0.3px;

  svg {
    stroke-width: 2;
    width: 18px;
    height: 18px;
    color: ${Colors.accentBlue};
  }
`;

const ClickableBadge = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background: ${(props) => props.bgColor};
  border: none;
  cursor: pointer;
  flex: 1;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-transform: capitalize;
  letter-spacing: 0.3px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    stroke-width: 2.5;
    width: 14px;
    height: 14px;
  }

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

const BadgesContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  width: 100%;
  margin-top: 1.25rem;
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 0.75rem;
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const HeaderTopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
`;

const NameChargesContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const MobileNavButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  background: ${Colors.accentBlue};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.375rem;
  cursor: pointer;

  &:hover {
    background: ${Colors.infoBlue};
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileNavOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, ${(props) => (props.isOpen ? '0.5' : '0')});
  z-index: 9998;
  display: ${(props) => (props.isOpen ? 'block' : 'none')};
  transition: background 0.3s ease;
`;

const MobileNavContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${(props) => (props.isOpen ? '0' : '-100%')};
  width: 85%;
  max-width: 300px;
  height: 100vh;
  background: ${Colors.primaryGradient};
  z-index: 9999;
  transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  padding: 1rem;
  box-shadow: 2px 0 10px rgba(0,0,0,0.2);
`;

const MobileNavHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${Colors.borderColor};
  margin-bottom: 0.75rem;

  h3 {
    color: white;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
`;

const MobileNavSection = styled.div`
  margin-bottom: 1rem;

  h4 {
    color: ${Colors.infoBlue};
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
  }
`;

const MobileNavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 0.25rem;
  color: white;
  cursor: pointer;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  svg {
    width: 14px;
    height: 14px;
  }

  .badge {
    margin-left: auto;
    background: ${(props) => props.badgeColor || Colors.successGreen};
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.625rem;
    font-weight: 600;
  }
`;

// Report Modal Styles
const ReportModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ReportModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.3s ease-out;
`;

const ReportHeader = styled.div`
  background: ${Colors.primaryGradient};
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 1rem 1rem 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ReportBody = styled.div`
  padding: 2rem;
`;

const ReportSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: ${Colors.lightGray};
  border-radius: 0.75rem;
  border-left: 4px solid ${Colors.accentBlue};

  h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: ${Colors.primaryDark};
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ReportRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px dashed ${Colors.borderColor};
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: ${Colors.textMuted};
    font-weight: 500;
  }

  span:last-child {
    color: ${Colors.primaryDark};
    font-weight: 600;
  }
`;

const ReportFooter = styled.div`
  padding: 1.5rem 2rem;
  background: ${Colors.lightGray};
  border-radius: 0 0 1rem 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid ${Colors.borderColor};
`;

const ReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  background: ${(props) => props.primary ? Colors.accentBlue : Colors.mediumGray};
  color: ${(props) => props.primary ? 'white' : Colors.darkGray};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const LoadingSpinner = styled.div`
  border: 3px solid ${Colors.borderColor};
  border-top: 3px solid ${Colors.accentBlue};
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: ${spin} 1s linear infinite;
`;

// Helper function to get tenant slug
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

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add tenant slug header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const tenantSlug = getTenantSlug();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantSlug && tenantSlug !== 'default') {
      config.headers['x-tenant-slug'] = tenantSlug;
    }
    
    console.log('📡 API Request:', config.method, config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// LAZY LOADED COMPONENTS - Organized by feature area
// ============================================================================

// Core UI Components
const Loader = lazy(() =>
  import('../../components/loader/loader').catch(() => ({
    default: () => <div>Loading...</div>,
  }))
);

// Deceased Information Components
const DeceasedInfoSection = lazy(() =>
  import('../deceasedinfo/deceasedInfoSection').catch(() => ({
    default: () => <div>Deceased Info component not available</div>,
  }))
);
const PostmortemInfoSection = lazy(() =>
  import('../autopsy/postmortemSection').catch(() => ({
    default: () => <div>Postmortem Info component not available</div>,
  }))
);

// Next of Kin Components
const NextOfKinSection = lazy(() =>
  import('../next-kin/nextOfKIn').catch(() => ({
    default: () => <div>Next of Kin component not available</div>,
  }))
);

// Mortuary Operations Components
const MortuaryProgress = lazy(() =>
  import('../user/mortuaryProgress').catch(() => ({
    default: () => <div>Progress component not available</div>,
  }))
);
const CoffinAssignment = lazy(() =>
  import('../coffins/coffinAssignment').catch(() => ({
    default: () => <div>Coffin Assignment component not available</div>,
  }))
);
const DispatchSection = lazy(() =>
  import('../dispatch/dispatchSection')
);

// Documents & Financial Components
const DocumentUpload = lazy(() =>
  import('../documents/DocumentUpload').catch(() => ({
    default: () => <div>Document Upload component not available</div>,
  }))
);

// Modal Components
const DeceasedInfoModal = lazy(() =>
  import('../user/modals/deceasedinfomodal').catch(() => ({
    default: () => null,
  }))
);
const NextOfKinModal = lazy(() =>
  import('../user/modals/nextofKinModal').catch(() => ({
    default: () => null,
  }))
);
const FinancialDetailsModal = lazy(() =>
  import('../user/modals/financialdetailsmodal').catch(() => ({
    default: () => null,
  }))
);
const PaymentHistoryModal = lazy(() =>
  import('../user/modals/paymenthistoryModals').catch(() => ({
    default: () => null,
  }))
);
const ChargeSettingsModal = lazy(() =>
  import('./ChargeSettingsModal').catch(() => ({
    default: () => null,
  }))
);

const LoadingFallback = () => (
  <div
    style={{
      padding: '0.75rem',
      color: Colors.textMuted,
      textAlign: 'center',
      fontSize: '0.875rem',
    }}
  >
    <RefreshCw size={16} className="animate-spin" style={{ marginRight: '0.25rem' }} />
    Loading...
  </div>
);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          color: Colors.dangerRed,
          textAlign: 'center'
        }}>
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {this.props.errorMessage || 'Something went wrong loading this component.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// REPORT GENERATION COMPONENT
// ============================================================================

const DeceasedReport = ({ deceased, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const calculateAge = (dob, dod) => {
    if (!dob || !dod) return '-';
    const birth = new Date(dob);
    const death = new Date(dod);
    if (isNaN(birth.getTime()) || isNaN(death.getTime())) return '-';
    let years = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) years--;
    return `${years} years`;
  };

  const getDaysInMortuary = (admissionDate) => {
    if (!admissionDate) return 0;
    const admitted = new Date(admissionDate);
    const today = new Date();
    return Math.max(0, Math.floor((today - admitted) / (1000 * 60 * 60 * 24)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Use browser's print to PDF functionality
      handlePrint();
      toast.success('Use "Save as PDF" in the print dialog');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!deceased) return null;

  return (
    <ReportModalOverlay>
      <ReportModalContent id="report-content">
        <ReportHeader>
          <h2><Report size={20} /> Deceased Summary Report</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </ReportHeader>

        <ReportBody>
          {/* Header Info */}
          <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `2px solid ${Colors.accentBlue}` }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: Colors.primaryDark }}>{deceased.full_name || 'Unknown'}</h2>
            <p style={{ margin: 0, color: Colors.textMuted, fontSize: '0.9rem' }}>
              Deceased ID: {deceased.deceased_id || deceased.id || '-'} | 
              Generated: {new Date().toLocaleString()}
            </p>
          </div>

          {/* Personal Information */}
          <ReportSection>
            <h3><User size={16} /> Personal Information</h3>
            <ReportRow><span>Full Name</span><span>{deceased.full_name || '-'}</span></ReportRow>
            <ReportRow><span>Gender</span><span>{deceased.gender || '-'}</span></ReportRow>
            <ReportRow><span>Date of Birth</span><span>{formatDate(deceased.date_of_birth)}</span></ReportRow>
            <ReportRow><span>Date of Death</span><span>{formatDate(deceased.date_of_death)}</span></ReportRow>
            <ReportRow><span>Age at Death</span><span>{calculateAge(deceased.date_of_birth, deceased.date_of_death)}</span></ReportRow>
            <ReportRow><span>Cause of Death</span><span>{deceased.cause_of_death || '-'}</span></ReportRow>
            <ReportRow><span>Place of Death</span><span>{deceased.place_of_death || '-'}</span></ReportRow>
          </ReportSection>

          {/* Location Information */}
          <ReportSection>
            <h3><MapPin size={16} /> Location Information</h3>
            <ReportRow><span>County/Region</span><span>{deceased.county || '-'}</span></ReportRow>
            <ReportRow><span>Specific Location</span><span>{deceased.location || '-'}</span></ReportRow>
          </ReportSection>

          {/* Timeline */}
          <ReportSection>
            <h3><Clock size={16} /> Timeline</h3>
            <ReportRow><span>Date Admitted</span><span>{formatDate(deceased.date_admitted)}</span></ReportRow>
            <ReportRow><span>Date Registered</span><span>{formatDate(deceased.date_registered)}</span></ReportRow>
            <ReportRow><span>Days in Mortuary</span><span>{getDaysInMortuary(deceased.date_admitted)} days</span></ReportRow>
            <ReportRow><span>Dispatch Date</span><span>{formatDate(deceased.dispatch_date)}</span></ReportRow>
          </ReportSection>

          {/* Financial Information */}
          <ReportSection>
            <h3><DollarSign size={16} /> Financial Information</h3>
            <ReportRow><span>Total Charges</span><span>{deceased.total_mortuary_charge || 0} {deceased.currency || 'KES'}</span></ReportRow>
            <ReportRow><span>Burial Type</span><span>{deceased.burial_type || '-'}</span></ReportRow>
          </ReportSection>

          {/* Next of Kin */}
          {deceased.next_of_kin && deceased.next_of_kin.length > 0 && (
            <ReportSection>
              <h3><Users size={16} /> Next of Kin ({deceased.next_of_kin.length})</h3>
              {deceased.next_of_kin.map((kin, idx) => (
                <div key={idx} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < deceased.next_of_kin.length - 1 ? '1px dashed ' + Colors.borderColor : 'none' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{kin.full_name}</div>
                  <div style={{ fontSize: '0.85rem', color: Colors.textMuted }}>
                    {kin.relationship} | {kin.contact}
                    {kin.email && ` | ${kin.email}`}
                  </div>
                </div>
              ))}
            </ReportSection>
          )}

          {/* Postmortem Information */}
          {deceased.postmortem && (
            <ReportSection>
              <h3><Microscope size={16} /> Postmortem Information</h3>
              <ReportRow><span>Summary</span><span>{deceased.postmortem.examination_summary || deceased.postmortem.summary || '-'}</span></ReportRow>
              <ReportRow><span>Cause of Death</span><span>{deceased.postmortem.cause_of_death || '-'}</span></ReportRow>
            </ReportSection>
          )}

          {/* Dispatch Information */}
          {deceased.dispatch && (
            <ReportSection>
              <h3><Truck size={16} /> Dispatch Information</h3>
              <ReportRow><span>Dispatch Date</span><span>{formatDate(deceased.dispatch_date)}</span></ReportRow>
            </ReportSection>
          )}

          {/* Status */}
          <ReportSection style={{ borderLeftColor: deceased.status === 'dispatched' ? Colors.successGreen : Colors.warningYellow }}>
            <h3><Activity size={16} /> Current Status</h3>
            <ReportRow><span>Status</span><span style={{ textTransform: 'capitalize' }}>{deceased.status || 'active'}</span></ReportRow>
            <ReportRow><span>Admission Number</span><span>{deceased.admission_number || '-'}</span></ReportRow>
            <ReportRow><span>Registered By</span><span>{deceased.created_by || 'System'}</span></ReportRow>
          </ReportSection>
        </ReportBody>

        <ReportFooter>
          <ReportButton onClick={onClose}>
            <X size={16} /> Close
          </ReportButton>
          <ReportButton onClick={handlePrint}>
            <Printer size={16} /> Print
          </ReportButton>
          <ReportButton primary onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? <LoadingSpinner /> : <Download size={16} />}
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </ReportButton>
        </ReportFooter>
      </ReportModalContent>
    </ReportModalOverlay>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DeceasedDetails = () => {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [deceasedData, setDeceasedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coffins, setCoffins] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showDeceasedInfoModal, setShowDeceasedInfoModal] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [showChargeSettingsModal, setShowChargeSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force re-render of child components

  const showExternalLoader = () => setShowLoader(true);
  const hideExternalLoader = () => setShowLoader(false);

  const navigateToReleaseForm = () => {
    showExternalLoader();
    setTimeout(() => {
      if (deceasedData) {
        hideExternalLoader();
        const tenantSlug = getTenantSlug();
        navigate(`/rptenant/${tenantSlug}/release-form/${currentDeceasedId}`, {
          state: { deceasedData },
        });
      } else {
        hideExternalLoader();
        toast.error('Unable to load deceased data');
      }
    }, 500);
  };

  const openChargeSettingsModal = () => {
    setShowChargeSettingsModal(true);
  };

  const navigateToDocuments = () => {
    navigate(`/documents/${currentDeceasedId}`);
  };

  const openReportModal = () => {
    setShowReportModal(true);
  };

  // FIXED: Correct endpoint - no extra /deceased prefix
  const fetchDeceasedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/deceased-id/${id}`);
      console.log('📦 API Response:', response.data);
      
      const apiData = response.data?.data || response.data || {};

      const normalizedData = {
        ...apiData,
        deceased_id: apiData.deceased_id || apiData.id || apiData._id || id,
        full_name: apiData.full_name || 'Unknown',
        total_mortuary_charge: apiData.total_mortuary_charge || 0,
        currency: apiData.currency || 'KES',
        burial_type: apiData.burial_type || 'Burial',
        next_of_kin: apiData.next_of_kin || [],
        documents: apiData.documents || [],
        charges: apiData.charges || [],
        postmortem: apiData.postmortem || null,
        dispatch: apiData.dispatch || null,
        status: apiData.status || 'active',
      };

      setDeceasedData(normalizedData);
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error('Error fetching deceased details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load details';
      toast.error(errorMessage);
      setDeceasedData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // FIXED: Correct coffins endpoint
  const fetchCoffins = useCallback(async () => {
    try {
      const tenantSlug = getTenantSlug();
      const response = await axios.get(
        `${API_GATEWAY_URL}/api/v1/restpoint/coffins/all-coffins`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
          },
        }
      );
      setCoffins(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching coffins:', error);
      setCoffins([]);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchDeceasedData();
      fetchCoffins();
    }
  }, [id, fetchDeceasedData, fetchCoffins]);

  // Force refresh all child components
  const handleRefresh = () => {
    fetchDeceasedData();
    fetchCoffins();
    setRefreshKey(prev => prev + 1);
    toast.info('Refreshing data...');
  };

  const handleDocumentUploadSuccess = () => {
    toast.success('Document uploaded');
    fetchDeceasedData();
  };

  const calculateAge = (dob, dod) => {
    if (!dob || !dod) return { years: 'N/A', category: 'Unknown' };
    const birthDate = new Date(dob);
    const deathDate = new Date(dod);

    let years = deathDate.getFullYear() - birthDate.getFullYear();
    const m = deathDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && deathDate.getDate() < birthDate.getDate())) years--;

    let category = 'Unknown';
    if (years < 13) category = 'Child';
    else if (years < 18) category = 'Teenager';
    else if (years < 25) category = 'Young Adult';
    else if (years < 40) category = 'Adult';
    else if (years < 60) category = 'Middle-Aged';
    else category = 'Elderly';

    return { years, category };
  };

  const getDaysInMortuary = (admissionDate) => {
    if (!admissionDate) return 0;
    const admitted = new Date(admissionDate);
    const today = new Date();
    const diffTime = today - admitted;
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysInMortuary = getDaysInMortuary(deceasedData?.date_admitted);
  const getDeceasedId = () => deceasedData?.deceased_id || deceasedData?.id || id;
  const currentDeceasedId = getDeceasedId();
  const ageInfo = calculateAge(deceasedData?.date_of_birth, deceasedData?.date_of_death);

  const mobileNavItems = {
    information: [
      {
        icon: <Info size={14} />,
        label: 'Deceased Info',
        action: () => setShowDeceasedInfoModal(true),
        badge: 'View',
      },
      {
        icon: <Users size={14} />,
        label: 'Next of Kin',
        action: () => setShowNextOfKinModal(true),
        badge: deceasedData?.next_of_kin?.length || 0,
      },
    ],
    actions: [
      {
        icon: <QrCode size={14} />,
        label: 'QR Code',
        action: () => navigate(`/qr-code/${currentDeceasedId}`),
        badge: 'View',
      },
      {
        icon: <DollarSign size={14} />,
        label: 'Financial',
        action: () => setShowFinancialModal(true),
        badge: 'View',
      },
      {
        icon: <FileText size={14} />,
        label: 'Documents',
        action: () => navigate(`/documents/${currentDeceasedId}`),
        badge: deceasedData?.documents?.length || 0,
      },
      {
        icon: <LogOut size={14} />,
        label: 'Release Form',
        action: navigateToReleaseForm,
        badge: 'New',
      },
      {
        icon: <Report size={14} />,
        label: 'Generate Report',
        action: openReportModal,
        badge: 'PDF',
      },
    ],
  };

  const primaryBadges = [
    {
      text: `Status: ${deceasedData?.status || 'Active'}`,
      color: daysInMortuary > 30 ? Colors.dangerRed : Colors.successGreen,
      icon: daysInMortuary > 30 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />,
      onClick: () => setShowDeceasedInfoModal(true),
    },
    {
      text: `Days: ${daysInMortuary}`,
      color: Colors.accentBlue,
      icon: <Activity size={12} />,
      onClick: () => setShowDeceasedInfoModal(true),
    },
    {
      text: `Charges: ${deceasedData?.total_mortuary_charge || 0} ${deceasedData?.currency || 'KES'}`,
      color: Colors.accentBlue,
      icon: <DollarSign size={12} />,
      onClick: () => setShowFinancialModal(true),
    },
  ];

  const secondaryBadges = [
    {
      text: 'Charge Settings',
      color: Colors.chargeSetting,
      icon: <Settings size={12} />,
      onClick: openChargeSettingsModal,
    },
    {
      text: 'Documents',
      color: Colors.warningYellow,
      icon: <FileText size={12} />,
      onClick: navigateToDocuments,
    },
    {
      text: 'Release Form',
      color: Colors.successGreen,
      icon: <LogOut size={12} />,
      onClick: navigateToReleaseForm,
    },
    {
      text: 'Generate Report',
      color: Colors.accentPurple,
      icon: <Report size={12} />,
      onClick: openReportModal,
    },
  ];

  if (isLoading && !showLoader) {
    return (
      <AppContainer
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <RefreshCw size={32} color={Colors.accentBlue} className="animate-spin" />
      </AppContainer>
    );
  }

  if (!deceasedData && !isLoading) {
    return (
      <AppContainer style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color={Colors.dangerRed} />
          <h3 style={{ margin: '1rem 0 0.5rem' }}>Failed to load details</h3>
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: Colors.textMuted }}>
            ID: {id}
          </p>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Go Back
          </BackButton>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ToastContainer position="top-right" autoClose={2000} />

      {showLoader && (
        <Suspense fallback={null}>
          <Loader message="Loading..." />
        </Suspense>
      )}

      <MobileNavOverlay isOpen={mobileNavOpen} onClick={() => setMobileNavOpen(false)} />
      <MobileNavContainer isOpen={mobileNavOpen}>
        <MobileNavHeader>
          <h3>Quick Actions</h3>
          <MobileNavButton onClick={() => setMobileNavOpen(false)}>
            <X size={18} />
          </MobileNavButton>
        </MobileNavHeader>
        {Object.entries(mobileNavItems).map(([section, items]) => (
          <MobileNavSection key={section}>
            <h4>{section === 'information' ? 'Information' : 'Actions'}</h4>
            {items.map((item, index) => (
              <MobileNavItem
                key={index}
                onClick={() => {
                  item.action();
                  setMobileNavOpen(false);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <span className="badge">{item.badge}</span>}
              </MobileNavItem>
            ))}
          </MobileNavSection>
        ))}
      </MobileNavContainer>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem', gap: '0.25rem' }}>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </BackButton>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <BackButton onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </BackButton>
          <MobileNavButton onClick={() => setMobileNavOpen(true)}>
            <Menu size={18} />
          </MobileNavButton>
        </div>
      </div>

      <HeaderCard>
        <HeaderTopSection>
          <NameChargesContainer>
            <h2 style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.1rem' }}>
              <User size={16} /> {deceasedData?.full_name}
            </h2>
            <div style={{ fontSize: '0.875rem' }}>
              Total: {deceasedData?.total_mortuary_charge} {deceasedData?.currency}
            </div>
          </NameChargesContainer>
        </HeaderTopSection>

        <BadgesContainer>
          <BadgeRow>
            <ClickableBadge bgColor={Colors.warningYellow} style={{ minWidth: '60px' }}>
              🪦 {deceasedData?.burial_type}
            </ClickableBadge>
            {primaryBadges.map((badge, index) => (
              <ClickableBadge key={index} bgColor={badge.color} onClick={badge.onClick}>
                {badge.icon} {badge.text}
              </ClickableBadge>
            ))}
          </BadgeRow>
          <BadgeRow>
            {secondaryBadges.map((badge, index) => (
              <ClickableBadge key={index} bgColor={badge.color} onClick={badge.onClick}>
                {badge.icon} {badge.text}
              </ClickableBadge>
            ))}
          </BadgeRow>
        </BadgesContainer>
      </HeaderCard>

      <ContentGrid>
        <MainContent>
          <Card>
            <CardTitle><Info size={14} /> Deceased Information</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <DeceasedInfoSection
                key={`deceased-${refreshKey}`}
                deceasedId={currentDeceasedId}
                deceased={deceasedData}
                ageInfo={ageInfo}
                onUpdate={fetchDeceasedData}
              />
            </Suspense>
          </Card>

          <Card>
            <CardTitle><Microscope size={14} /> Postmortem Information</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <PostmortemInfoSection
                key={`postmortem-${refreshKey}`}
                deceasedId={currentDeceasedId}
                deceased={deceasedData}
                onUpdate={fetchDeceasedData}
              />
            </Suspense>
          </Card>

          <Card>
            <CardTitle><Users size={14} /> Next of Kin</CardTitle>
            <div style={{ 
              marginBottom: '1rem', 
              padding: '0.75rem', 
              background: Colors.chargeSettingGradient,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
              boxShadow: '0 2px 8px rgba(107, 33, 165, 0.3)'
            }}
            onClick={openChargeSettingsModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 33, 165, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 33, 165, 0.3)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={16} />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Configure Charges</span>
              </div>
              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Click to open</span>
            </div>
            <Suspense fallback={<LoadingFallback />}>
              <NextOfKinSection
                key={`nextofkin-${refreshKey}`}
                deceasedId={currentDeceasedId}
                nextOfKin={deceasedData?.next_of_kin}
                onUpdate={fetchDeceasedData}
              />
            </Suspense>
          </Card>

          <Card>
            <CardTitle><FileText size={14} /> Documents</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <DocumentUpload
                key={`documents-${refreshKey}`}
                deceasedId={currentDeceasedId}
                deceasedData={deceasedData}
                onUploadSuccess={handleDocumentUploadSuccess}
              />
            </Suspense>
          </Card>
        </MainContent>

        <SidebarContent>
          <Card>
            <CardTitle><Activity size={14} /> Progress</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <MortuaryProgress
                key={`progress-${refreshKey}`}
                daysInMortuary={daysInMortuary}
                dispatchDate={deceasedData?.dispatch_date}
                isOverdue={daysInMortuary > 30}
              />
            </Suspense>
          </Card>

          <Card>
            <CardTitle><Box size={14} /> Coffin Assignment</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <CoffinAssignment
                key={`coffin-${refreshKey}`}
                deceasedId={currentDeceasedId}
                deceasedData={deceasedData}
                coffins={coffins}
                onUpdate={fetchDeceasedData}
              />
            </Suspense>
          </Card>

          <Card>
            <CardTitle><Truck size={14} /> Dispatch</CardTitle>
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary fallback={<div>Failed to load Dispatch component</div>}>
                <DispatchSection
                  key={`dispatch-${refreshKey}`}
                  deceasedId={currentDeceasedId}
                  dispatchData={deceasedData?.dispatch}
                  onUpdate={fetchDeceasedData}
                />
              </ErrorBoundary>
            </Suspense>
          </Card>
        </SidebarContent>
      </ContentGrid>

      <Suspense fallback={null}>
        {showDeceasedInfoModal && (
          <DeceasedInfoModal
            isOpen={showDeceasedInfoModal}
            onClose={() => setShowDeceasedInfoModal(false)}
            deceased={deceasedData}
            ageInfo={ageInfo}
          />
        )}
        {showNextOfKinModal && (
          <NextOfKinModal
            isOpen={showNextOfKinModal}
            onClose={() => setShowNextOfKinModal(false)}
            nextOfKin={deceasedData?.next_of_kin}
          />
        )}
        {showFinancialModal && (
          <FinancialDetailsModal
            isOpen={showFinancialModal}
            onClose={() => setShowFinancialModal(false)}
            deceasedData={deceasedData}
          />
        )}
        {showPaymentHistoryModal && (
          <PaymentHistoryModal
            isOpen={showPaymentHistoryModal}
            onClose={() => setShowPaymentHistoryModal(false)}
            deceasedData={deceasedData}
            deceasedId={currentDeceasedId}
          />
        )}
        {showChargeSettingsModal && (
          <ChargeSettingsModal
            isOpen={showChargeSettingsModal}
            onClose={() => setShowChargeSettingsModal(false)}
            deceasedId={currentDeceasedId}
            deceasedData={deceasedData}
            onUpdate={fetchDeceasedData}
          />
        )}
        {showReportModal && deceasedData && (
          <DeceasedReport
            deceased={deceasedData}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </Suspense>
    </AppContainer>
  );
};

export default DeceasedDetails;