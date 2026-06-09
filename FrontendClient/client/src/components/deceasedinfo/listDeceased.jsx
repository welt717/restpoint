import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Loader2,
  PlusCircle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Users,
  Microscope,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Calendar,
  Filter,
  FileText,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExportModal from './ExportModal';

// API Configuration
const API_GATEWAY_URL = 'http://localhost:8000';
const DECEASED_BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased`;

// Use API client that handles auth and tenant slug
import api from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

// Colors
const Colors = {
  primaryDark: '#2C3E50',
  accentBlue: '#1e293b',
  white: '#FFFFFF',
  lightGray: '#F7F9FB',
  mediumGray: '#E9ECEF',
  darkGray: '#1e293b',
  successGreen: '#1DB954',
  dangerRed: '#C0392B',
  kinSuccess: '#00A896',
  kinDanger: '#E71D36',
  autopsySuccess: '#6A0572',
  autopsyDanger: '#FF9F1C',
  warningYellow: '#F39C12',
  infoBlue: '#1e293b',
  tableBorder: '#E9ECEF',
  headerBg: '#1e293b',
  hoverGray: '#F0F3F5',
  statusReceived: '#6A0572',
  statusUnderCare: '#F39C12',
  statusReady: '#1DB954',
  statusCompleted: '#C0392B',
};

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${Colors.lightGray};
  padding: 0rem 0rem;
  font-family: 'Inter', sans-serif;
  animation: ${fadeIn} 0.6s ease-out;
`;

const ContentWrapper = styled.div`
  max-width: 1800px;
  width: 98%;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${Colors.primaryDark};
  letter-spacing: -0.05em;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;

  svg {
    color: ${Colors.accentBlue};
    font-size: 2rem;
  }

  @media (max-width: 768px) {
    font-size: 1.3rem;
    svg {
      font-size: 1.8rem;
    }
  }
`;

// NEW: Search Bar Container - Replaces the old title position
const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 500px;
  
  @media (max-width: 768px) {
    max-width: 100%;
    width: 100%;
    order: 2;
    margin-top: 0.5rem;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  
  input {
    width: 100%;
    padding: 0.7rem 1rem 0.7rem 2.5rem;
    border: 1px solid ${Colors.mediumGray};
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color: ${Colors.darkGray};
    transition: all 0.3s ease;
    background-color: ${Colors.white};
    
    &:focus {
      outline: none;
      border-color: ${Colors.accentBlue};
      box-shadow: 0 0 0 3px rgba(5, 102, 141, 0.15);
    }
    
    &::placeholder {
      color: #9ca3af;
      font-size: 0.8rem;
    }
  }
  
  svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${Colors.darkGray};
    font-size: 1.1rem;
    pointer-events: none;
  }
`;

const ClearSearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Colors.darkGray};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${Colors.mediumGray};
    color: ${Colors.dangerRed};
  }
`;

const PrimaryButton = styled.button`
  ${({ refresh }) =>
    refresh &&
    css`
      background-color: ${Colors.dangerRed};
      box-shadow: 0 2px 5px rgba(192, 57, 43, 0.2);
      &:hover {
        background-color: #a93226;
        box-shadow: 0 4px 8px rgba(192, 57, 43, 0.3);
      }
    `}
  ${({ primary }) =>
    primary &&
    css`
      background-color: ${Colors.accentBlue};
      box-shadow: 0 2px 5px rgba(5, 102, 141, 0.2);
      &:hover {
        background-color: #04597b;
        box-shadow: 0 4px 8px rgba(5, 102, 141, 0.3);
      }
    `}

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${Colors.white};
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translateY(0);

  &:hover {
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  svg {
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    padding: 0.6rem 0.8rem;
    font-size: 0.8rem;
    svg {
      margin-right: 0.3rem;
      font-size: 1rem;
    }
  }
`;

const ReportButton = styled(PrimaryButton)`
  background-color: #6a0572;
  box-shadow: 0 2px 5px rgba(106, 5, 114, 0.2);
  &:hover {
    background-color: #5a0462;
    box-shadow: 0 4px 8px rgba(106, 5, 114, 0.3);
  }
`;

const StyledCard = styled.div`
  background-color: ${Colors.white};
  border-radius: 0.8rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid ${Colors.tableBorder};
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  background-color: ${Colors.white};
  border-radius: 0.8rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  flex-wrap: nowrap;
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-track {
    background: ${Colors.mediumGray};
  }
  &::-webkit-scrollbar-thumb {
    background: ${Colors.accentBlue};
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
    padding: 0.8rem;
    ${({ showFilters }) =>
      !showFilters &&
      css`
        display: none;
      `}
  }
`;

const MobileFilterToggle = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    background-color: ${Colors.white};
    border-radius: 0.8rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    font-weight: 600;
    color: ${Colors.primaryDark};
    svg {
      color: ${Colors.accentBlue};
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  @media (max-width: 768px) {
    justify-content: space-between;
    &:not(:first-child) {
      border-top: 1px solid ${Colors.mediumGray};
      padding-top: 0.8rem;
    }
  }
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  white-space: nowrap;
  svg {
    color: ${Colors.accentBlue};
    font-size: 1rem;
  }
  @media (max-width: 768px) {
    min-width: 80px;
    font-size: 0.8rem;
  }
`;

const InputStyle = css`
  padding: 0.6rem 0.8rem;
  border: 1px solid ${Colors.mediumGray};
  border-radius: 0.4rem;
  font-size: 0.85rem;
  color: ${Colors.darkGray};
  transition: all 0.3s ease-in-out;
  background-color: ${Colors.white};
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(5, 102, 141, 0.15);
  }
  @media (max-width: 768px) {
    padding: 0.5rem 0.7rem;
    font-size: 0.8rem;
  }
`;

const YearFilterInput = styled.div`
  position: relative;
  min-width: 120px;
  max-width: 140px;
  input {
    ${InputStyle}
    width: 100%;
    padding-right: 0.75rem;
  }
  .year-select-container {
    position: relative;
    display: flex;
  }
  select {
    ${InputStyle}
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
    appearance: none;
  }
  @media (max-width: 768px) {
    min-width: 100px;
    max-width: 120px;
  }
`;

const FilterSelect = styled.select`
  ${InputStyle}
  padding-right: 2rem;
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  min-width: 120px;
  @media (max-width: 768px) {
    min-width: 100px;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  thead th {
    background-color: ${Colors.headerBg};
    color: ${Colors.white};
    padding: 0.8rem 1rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
    border-bottom: 2px solid ${Colors.accentBlue};
    &:first-child {
      border-top-left-radius: 0.8rem;
    }
    &:last-child {
      border-top-right-radius: 0.8rem;
    }
    &.text-center {
      text-align: center;
    }
  }
  tbody tr {
    background-color: ${Colors.white};
    transition: all 0.2s ease-in-out;
    border-bottom: 1px solid ${Colors.tableBorder};
    &:hover {
      background-color: ${Colors.hoverGray};
    }
    td {
      padding: 0.8rem 1rem;
      color: ${Colors.darkGray};
      font-size: 0.85rem;
      font-weight: 500;
      vertical-align: middle;
      &:nth-child(2) {
        color: #6c757d;
        font-weight: 400;
      }
    }
  }
  @media (max-width: 768px) {
    thead {
      display: none;
    }
    tbody tr {
      display: block;
      margin-bottom: 1rem;
      border: 1px solid ${Colors.tableBorder};
      border-radius: 0.6rem;
      padding: 1rem;
    }
    tbody td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border: none;
      font-size: 0.8rem;
      &:before {
        content: attr(data-label);
        font-weight: 700;
        color: ${Colors.primaryDark};
        text-transform: uppercase;
        font-size: 0.75rem;
        min-width: 80px;
      }
      &.mobile-full {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        &:before {
          align-self: flex-start;
        }
      }
    }
  }
`;

const StatusIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  margin: auto;
  background-color: ${(props) => {
    const statusColor =
      props.status === 'success'
        ? props.type === 'kin'
          ? Colors.kinSuccess
          : props.type === 'autopsy'
            ? Colors.autopsySuccess
            : Colors.successGreen
        : props.type === 'kin'
          ? Colors.kinDanger
          : props.type === 'autopsy'
            ? Colors.autopsyDanger
            : Colors.dangerRed;
    return `${statusColor}1A`;
  }};
  svg {
    color: ${(props) => {
      return props.status === 'success'
        ? props.type === 'kin'
          ? Colors.kinSuccess
          : props.type === 'autopsy'
            ? Colors.autopsySuccess
            : Colors.successGreen
        : props.type === 'kin'
          ? Colors.kinDanger
          : props.type === 'autopsy'
            ? Colors.autopsyDanger
            : Colors.dangerRed;
    }};
    font-size: 1.2rem;
    font-weight: 900;
  }
  @media (max-width: 768px) {
    width: 1.8rem;
    height: 1.8rem;
    svg {
      font-size: 1rem;
    }
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.02em;
  white-space: nowrap;
  ${({ status }) => {
    let bgColor, textColor;
    switch (status ? status.toLowerCase() : '') {
      case 'received':
      case 'new':
        bgColor = Colors.statusReceived;
        textColor = Colors.white;
        break;
      case 'undercare':
      case 'pending':
      case 'inprogress':
        bgColor = Colors.statusUnderCare;
        textColor = Colors.darkGray;
        break;
      case 'ready':
      case 'awaitingcollection':
        bgColor = Colors.statusReady;
        textColor = Colors.white;
        break;
      case 'completed':
      case 'released':
      case 'discharged':
        bgColor = Colors.statusCompleted;
        textColor = Colors.white;
        break;
      default:
        bgColor = Colors.mediumGray;
        textColor = Colors.darkGray;
    }
    return css`
      background-color: ${bgColor};
      color: ${textColor};
    `;
  }}
  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
  }
`;

const AnimatedLoader2 = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const ViewDetailsButton = styled(PrimaryButton)`
  padding: 0.5rem 0.8rem;
  font-size: 0.75rem;
  border-radius: 0.4rem;
  background-color: ${Colors.infoBlue};
  box-shadow: 0 1px 5px rgba(52, 152, 219, 0.15);
  &:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(52, 152, 219, 0.25);
  }
  svg {
    margin-right: 0.3rem;
    font-size: 0.9rem;
  }
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 0.6rem;
    font-size: 0.8rem;
  }
`;

const WarningMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background-color: ${Colors.warningYellow}20;
  border-left: 4px solid ${Colors.warningYellow};
  padding: 0.5rem 1rem;
  border-radius: 0.4rem;
  color: ${Colors.darkGray};
  font-weight: 500;
  animation: ${fadeIn} 0.5s ease-out;
  white-space: nowrap;
  font-size: 0.85rem;
  svg {
    color: ${Colors.warningYellow};
    font-size: 1.2rem;
  }
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  gap: 1.5rem;
  color: ${Colors.darkGray};
`;

const Paginator = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background-color: ${Colors.white};
  border-radius: 0.8rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid ${Colors.tableBorder};
  border-bottom: 2px solid ${Colors.accentBlue};
  flex-wrap: nowrap;
  gap: 1rem;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.8rem;
    align-items: stretch;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const PaginationButton = styled.button`
  background-color: ${(props) => (props.active ? Colors.accentBlue : Colors.white)};
  color: ${(props) => (props.active ? Colors.white : Colors.darkGray)};
  border: 1px solid ${(props) => (props.active ? Colors.accentBlue : Colors.mediumGray)};
  border-radius: 0.3rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background-color: ${Colors.accentBlue}20;
    color: ${Colors.accentBlue};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ItemsPerPageSelect = styled(FilterSelect)`
  min-width: 70px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
`;

const MobileCard = styled.div`
  background-color: ${Colors.white};
  border-radius: 0.8rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid ${Colors.tableBorder};
  animation: ${fadeIn} 0.3s ease-out;
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid ${Colors.mediumGray};
`;

const MobileCardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
  margin: 0;
  flex: 1;
`;

const MobileCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const MobileDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  .label {
    font-weight: 600;
    color: ${Colors.primaryDark};
    min-width: 80px;
  }
  .value {
    color: ${Colors.darkGray};
    font-weight: 500;
    text-align: right;
    flex: 1;
  }
`;

const MobileStatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.8rem 0;
`;

// Utility Functions
const extractYear = (dateString) => {
  if (!dateString) return null;
  try {
    const year = new Date(dateString).getFullYear().toString();
    return year === 'NaN' ? null : year;
  } catch (e) {
    return null;
  }
};

// Helper to get tenant slug
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
const AllDeceasedPage = () => {
  const navigate = useNavigate();
  const [allDeceasedRecords, setAllDeceasedRecords] = useState([]);
  const [filteredDeceasedRecords, setFilteredDeceasedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [autopsyFilter, setAutopsyFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized unique years
  const uniqueYears = useMemo(() => {
    const years = allDeceasedRecords
      .map((record) => extractYear(record.created_at))
      .filter((year) => year !== null);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [allDeceasedRecords]);

  // Fetch data
  const fetchDeceased = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const tenantSlug = getTenantSlug();
      
      const response = await axios.get(`${DECEASED_BASE_URL}/deceased-all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
      });
      
      const result = response.data;
      const records = result.data;
      
      if (Array.isArray(records)) {
        const normalizedRecords = records
          .map((record) => ({
            ...record,
            current_status: record.status,
            has_kin: Boolean(record.has_kin),
            has_autopsy: Boolean(record.has_autopsy),
            deceased_id: record.deceased_id || record.id,
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllDeceasedRecords(normalizedRecords);
        setFilteredDeceasedRecords(normalizedRecords);
      } else {
        setError(result.message || 'No deceased records found.');
        setAllDeceasedRecords([]);
        setFilteredDeceasedRecords([]);
      }
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching deceased records:', err);
      setError('Failed to load deceased records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeceased();
  }, []);

  // Export Function
  const handleExport = async (exportOptions) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('authToken');
      const tenantSlug = getTenantSlug();
      
      const queryParams = new URLSearchParams();
      queryParams.append('period', exportOptions.period);
      if (exportOptions.startDate) queryParams.append('startDate', exportOptions.startDate);
      if (exportOptions.endDate) queryParams.append('endDate', exportOptions.endDate);
      if (exportOptions.includeFilters) {
        if (statusFilter !== 'all') queryParams.append('status', statusFilter);
        if (autopsyFilter !== 'all') queryParams.append('autopsy', autopsyFilter);
        if (yearFilter !== 'all') queryParams.append('year', yearFilter);
        if (searchTerm) queryParams.append('search', searchTerm);
      }
      queryParams.append('format', exportOptions.format);

      const url = `${DECEASED_BASE_URL}/export-excel?${queryParams.toString()}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: exportOptions.format === 'csv' 
          ? 'text/csv' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `deceased_report_${new Date().toISOString().split('T')[0]}.${exportOptions.format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report exported successfully!');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(error.response?.data?.message || 'Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Filtering Logic
  useEffect(() => {
    let currentFiltered = allDeceasedRecords;
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (record) =>
          (record.full_name && record.full_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
          (record.admission_number && record.admission_number.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    if (autopsyFilter === 'performed') {
      currentFiltered = currentFiltered.filter((record) => record.has_autopsy === true);
    } else if (autopsyFilter === 'notPerformed') {
      currentFiltered = currentFiltered.filter((record) => record.has_autopsy === false);
    }
    if (yearFilter !== 'all' && yearFilter.length === 4 && /^\d+$/.test(yearFilter)) {
      currentFiltered = currentFiltered.filter((record) => {
        const recordYear = extractYear(record.created_at);
        return recordYear === yearFilter;
      });
    }
    if (statusFilter !== 'all') {
      currentFiltered = currentFiltered.filter((record) => {
        const status = (record.status || '').toLowerCase();
        switch (statusFilter) {
          case 'received':
            return status.includes('received') || status.includes('new');
          case 'underCare':
            return status.includes('undercare') || status.includes('pending') || status.includes('inprogress');
          case 'ready':
            return status.includes('ready') || status.includes('awaitingcollection');
          case 'completed':
            return status.includes('completed') || status.includes('released') || status.includes('discharged');
          default:
            return true;
        }
      });
    }
    setFilteredDeceasedRecords(currentFiltered);
    setCurrentPage(1);
  }, [searchTerm, autopsyFilter, yearFilter, statusFilter, allDeceasedRecords]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredDeceasedRecords.length / itemsPerPage);
  const indexOfLastRecord = currentPage * itemsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
  const currentRecords = filteredDeceasedRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleNewRegistrationClick = () => {
    const tenantSlug = getTenantSlug();
    navigate(`/rptenant/${tenantSlug}/deceased/register`);
  };

  const handleViewDetailsClick = (record) => {
    const tenantSlug = getTenantSlug();
    const deceasedId = record.deceased_id || record.id;
    navigate(`/rptenant/${tenantSlug}/deceased/${deceasedId}`);
  };

  const handleYearChange = (value) => {
    if (value === 'all' || (value.length <= 4 && /^\d*$/.test(value))) {
      setYearFilter(value);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setAutopsyFilter('all');
    setYearFilter('all');
    setStatusFilter('all');
  };

  const toggleFilters = () => setShowFilters(!showFilters);

  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <PaginationButton key={i} active={currentPage === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationButton>
        );
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          buttons.push(
            <PaginationButton key={i} active={currentPage === i} onClick={() => handlePageChange(i)}>
              {i}
            </PaginationButton>
          );
        }
        buttons.push(<span key="ellipsis1" style={{ padding: '0.4rem' }}>...</span>);
        buttons.push(
          <PaginationButton key={totalPages} active={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationButton>
        );
      } else if (currentPage >= totalPages - 2) {
        buttons.push(
          <PaginationButton key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>1</PaginationButton>
        );
        buttons.push(<span key="ellipsis2" style={{ padding: '0.4rem' }}>...</span>);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          buttons.push(
            <PaginationButton key={i} active={currentPage === i} onClick={() => handlePageChange(i)}>
              {i}
            </PaginationButton>
          );
        }
      } else {
        buttons.push(
          <PaginationButton key={1} active={currentPage === 1} onClick={() => handlePageChange(1)}>1</PaginationButton>
        );
        buttons.push(<span key="ellipsis3" style={{ padding: '0.4rem' }}>...</span>);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          buttons.push(
            <PaginationButton key={i} active={currentPage === i} onClick={() => handlePageChange(i)}>
              {i}
            </PaginationButton>
          );
        }
        buttons.push(<span key="ellipsis4" style={{ padding: '0.4rem' }}>...</span>);
        buttons.push(
          <PaginationButton key={totalPages} active={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationButton>
        );
      }
    }
    return buttons;
  };

  const renderMobileCard = (record) => (
    <MobileCard key={record.id}>
      <MobileCardHeader>
        <MobileCardTitle>{record.full_name || 'Unknown'}</MobileCardTitle>
        <StatusPill status={record.status}>{record.status || 'Unknown'}</StatusPill>
      </MobileCardHeader>
      <MobileCardDetails>
        <MobileDetailRow>
          <span className="label">Admission No:</span>
          <span className="value">{record.admission_number || 'N/A'}</span>
        </MobileDetailRow>
        <MobileDetailRow>
          <span className="label">Date of Death:</span>
          <span className="value">{record.date_of_death ? new Date(record.date_of_death).toLocaleDateString() : 'N/A'}</span>
        </MobileDetailRow>
        <MobileDetailRow>
          <span className="label">Created:</span>
          <span className="value">{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}</span>
        </MobileDetailRow>
      </MobileCardDetails>
      <MobileStatusRow>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Next of Kin:</span>
          <StatusIcon type="kin" status={record.has_kin ? 'success' : 'danger'}>
            {record.has_kin ? <CheckCircle size={16} /> : <XCircle size={16} />}
          </StatusIcon>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Autopsy:</span>
          <StatusIcon type="autopsy" status={record.has_autopsy ? 'success' : 'danger'}>
            {record.has_autopsy ? <CheckCircle size={16} /> : <XCircle size={16} />}
          </StatusIcon>
        </div>
      </MobileStatusRow>
      <ViewDetailsButton onClick={() => handleViewDetailsClick(record)}>
        <Eye size={16} /> View Details
      </ViewDetailsButton>
    </MobileCard>
  );

  const renderTableRow = (record) => (
    <tr key={record.id}>
      <td data-label="Full Name">{record.full_name || 'Unknown'}</td>
      <td data-label="Admission No">{record.admission_number || 'N/A'}</td>
      <td data-label="Date of Death">{record.date_of_death ? new Date(record.date_of_death).toLocaleDateString() : 'N/A'}</td>
      <td data-label="Created">{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}</td>
      <td data-label="Status" className="text-center"><StatusPill status={record.status}>{record.status || 'Unknown'}</StatusPill></td>
      <td data-label="Next of Kin" className="text-center">
        <StatusIcon type="kin" status={record.has_kin ? 'success' : 'danger'}>
          {record.has_kin ? <CheckCircle size={18} /> : <XCircle size={18} />}
        </StatusIcon>
      </td>
      <td data-label="Autopsy" className="text-center">
        <StatusIcon type="autopsy" status={record.has_autopsy ? 'success' : 'danger'}>
          {record.has_autopsy ? <CheckCircle size={18} /> : <XCircle size={18} />}
        </StatusIcon>
      </td>
      <td data-label="Actions" className="text-center">
        <ViewDetailsButton onClick={() => handleViewDetailsClick(record)}>
          <Eye size={16} /> View Details
        </ViewDetailsButton>
      </td>
    </tr>
  );

  return (
    <AppContainer>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <ContentWrapper>
        {/* Header Section - Now with Title + Search Bar + Buttons */}
        <HeaderSection>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, flexWrap: 'wrap' }}>
           
            
            {/* Search Bar - Now placed here */}
            <SearchBarContainer>
              <SearchInputWrapper>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name or admission number..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <ClearSearchButton onClick={clearSearch} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <X size={14} />
                  </ClearSearchButton>
                )}
              </SearchInputWrapper>
            </SearchBarContainer>
          </div>
          
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <PrimaryButton refresh onClick={fetchDeceased} disabled={loading}>
              {loading ? <AnimatedLoader2 size={18} /> : <RefreshCw size={18} />}Refresh
            </PrimaryButton>
            <ReportButton onClick={() => setShowExportModal(true)} disabled={loading || filteredDeceasedRecords.length === 0}>
              <FileText size={18} />Export
            </ReportButton>
            <PrimaryButton primary onClick={handleNewRegistrationClick}>
              <PlusCircle size={18} />Add New
            </PrimaryButton>
          </div>
        </HeaderSection>

        {!loading && !error && filteredDeceasedRecords.length > 0 && (
          <Paginator>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: Colors.darkGray }}>
                Page {currentPage} of {totalPages} • Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredDeceasedRecords.length)} of {filteredDeceasedRecords.length} records
              </span>
              <ItemsPerPageSelect value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </ItemsPerPageSelect>
            </div>
            <PaginationControls>
              <PaginationButton onClick={() => handlePageChange(1)} disabled={currentPage === 1}>First</PaginationButton>
              <PaginationButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={14} /></PaginationButton>
              {generatePaginationButtons()}
              <PaginationButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={14} /></PaginationButton>
              <PaginationButton onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>Last</PaginationButton>
            </PaginationControls>
          </Paginator>
        )}

        <MobileFilterToggle onClick={toggleFilters}>
          <span>Filters</span><Filter size={18} />
        </MobileFilterToggle>

        <FilterContainer showFilters={showFilters}>
          <FilterGroup>
            <FilterLabel><Microscope size={16} />Autopsy:</FilterLabel>
            <FilterSelect value={autopsyFilter} onChange={(e) => setAutopsyFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="performed">Performed</option>
              <option value="notPerformed">Not Performed</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel><Calendar size={16} />Year:</FilterLabel>
            <YearFilterInput>
              <div className="year-select-container">
                <input type="text" placeholder="YYYY" value={yearFilter === 'all' ? '' : yearFilter} onChange={(e) => handleYearChange(e.target.value)} maxLength={4} />
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <option value="all">All Years</option>
                  {uniqueYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </YearFilterInput>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel><AlertTriangle size={16} />Status:</FilterLabel>
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="received">Received</option>
              <option value="underCare">Under Care</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <PrimaryButton onClick={clearAllFilters} style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}>Clear Filters</PrimaryButton>
          </FilterGroup>
        </FilterContainer>

        {!loading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: Colors.darkGray }}>
              Showing {filteredDeceasedRecords.length} of {allDeceasedRecords.length} records
            </span>
            {filteredDeceasedRecords.length === 0 && allDeceasedRecords.length > 0 && (
              <WarningMessage><AlertTriangle size={18} />No records match your current filters</WarningMessage>
            )}
          </div>
        )}

        {loading && (
          <CenteredContainer>
            <AnimatedLoader2 size={40} color={Colors.accentBlue} />
            <div>Loading deceased records...</div>
          </CenteredContainer>
        )}

        {error && !loading && (
          <CenteredContainer>
            <AlertTriangle size={40} color={Colors.dangerRed} />
            <div>{error}</div>
            <PrimaryButton onClick={fetchDeceased}><RefreshCw size={18} />Try Again</PrimaryButton>
          </CenteredContainer>
        )}

        {!loading && !error && (
          <>
            {!isMobile && filteredDeceasedRecords.length > 0 && (
              <StyledCard>
                <TableContainer>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th>Full Name</th><th>Admission No</th><th>Date of Death</th><th>Created</th>
                        <th className="text-center">Status</th><th className="text-center">Next of Kin</th>
                        <th className="text-center">Autopsy</th><th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>{currentRecords.map(renderTableRow)}</tbody>
                  </StyledTable>
                </TableContainer>
              </StyledCard>
            )}
            {isMobile && filteredDeceasedRecords.length > 0 && <div>{currentRecords.map(renderMobileCard)}</div>}
            {!loading && filteredDeceasedRecords.length === 0 && allDeceasedRecords.length > 0 && (
              <CenteredContainer>
                <ClipboardList size={40} color={Colors.mediumGray} />
                <div>No records found matching your filters</div>
                <PrimaryButton onClick={clearAllFilters}>Clear Filters</PrimaryButton>
              </CenteredContainer>
            )}
            {!loading && allDeceasedRecords.length === 0 && (
              <CenteredContainer>
                <Users size={40} color={Colors.mediumGray} />
                <div>No deceased records found</div>
                <PrimaryButton primary onClick={handleNewRegistrationClick}><PlusCircle size={18} />Add First Record</PrimaryButton>
              </CenteredContainer>
            )}
          </>
        )}

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          isExporting={exporting}
          filters={{
            status: statusFilter,
            autopsy: autopsyFilter,
            year: yearFilter,
            search: searchTerm,
          }}
        />
      </ContentWrapper>
    </AppContainer>
  );
};

export default AllDeceasedPage;