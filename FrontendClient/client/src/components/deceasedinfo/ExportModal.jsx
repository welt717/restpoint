import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Download,
  X,
  FileSpreadsheet,
  FileText,
  Clock,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  Columns,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';

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
  warningYellow: '#F39C12',
  infoBlue: '#3498DB',
  purple: '#6a0572',
  purpleLight: '#f3e8ff',
  borderGray: '#E5E7EB',
  textMuted: '#6B7280',
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
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
  max-width: 1200px;
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
  background: linear-gradient(135deg, ${Colors.accentBlue} 0%, ${Colors.purple} 100%);
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
`;

const SectionDivider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, ${Colors.borderGray} 0%, transparent 100%);
  margin: 0.5rem 0;
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
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Colors.primaryDark};
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
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
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
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${Colors.borderGray};
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${Colors.darkGray};
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  
  &:hover {
    border-color: ${Colors.accentBlue};
    background-color: ${Colors.lightGray};
  }
  
  input {
    width: 1rem;
    height: 1rem;
    accent-color: ${Colors.accentBlue};
    cursor: pointer;
  }
  
  ${({ selected }) =>
    selected &&
    `
    border-color: ${Colors.accentBlue};
    background-color: ${Colors.purpleLight};
    color: ${Colors.purple};
  `}
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
  background: linear-gradient(135deg, ${Colors.accentBlue} 0%, ${Colors.purple} 100%);
  color: ${Colors.white};
  box-shadow: 0 4px 15px rgba(106, 5, 114, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(106, 5, 114, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
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
    background-color: ${Colors.purpleLight};
  }
`;

// History Panel Styles
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

const HistoryFileName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HistoryMeta = styled.span`
  font-size: 0.7rem;
  color: ${Colors.textMuted};
`;

const HistoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ status }) =>
    status === 'success'
      ? `background-color: #D1FAE5; color: #065F46;`
      : `background-color: #FEE2E2; color: #991B1B;`
  }
`;

const EmptyHistory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${Colors.textMuted};
  text-align: center;
  gap: 0.5rem;
`;

const FilterTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: ${Colors.purpleLight};
  color: ${Colors.purple};
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
`;

const AnimatedLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

// Main Component
const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  filters,
}) => {
  // Export Options State
  const [reportPeriod, setReportPeriod] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [format, setFormat] = useState('xlsx');
  const [includeCurrentFilters, setIncludeCurrentFilters] = useState(true);
  
  // Column Selection State
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'full_name',
    'admission_number',
    'date_of_death',
    'created_at',
    'status',
    'has_kin',
    'has_autopsy',
  ]);
  
  // Export History State
  const [showHistory, setShowHistory] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  
  // All available columns
  const availableColumns = [
    { id: 'full_name', label: 'Full Name' },
    { id: 'admission_number', label: 'Admission Number' },
    { id: 'date_of_death', label: 'Date of Death' },
    { id: 'created_at', label: 'Created Date' },
    { id: 'status', label: 'Status' },
    { id: 'has_kin', label: 'Next of Kin' },
    { id: 'has_autopsy', label: 'Autopsy' },
    { id: 'gender', label: 'Gender' },
    { id: 'date_of_birth', label: 'Date of Birth' },
    { id: 'age', label: 'Age' },
    { id: 'county', label: 'County' },
    { id: 'cause_of_death', label: 'Cause of Death' },
    { id: 'total_mortuary_charge', label: 'Charges' },
  ];
  
  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('exportHistory');
    if (savedHistory) {
      try {
        setExportHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load export history:', e);
      }
    }
  }, []);
  
  // Get date range based on period
  const getDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    let end = new Date();
    
    switch (period) {
      case 'thisMonth':
        start.setDate(1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start.setMonth(now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'lastQuarter':
        const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
        start.setMonth(lastQuarter * 3, 1);
        end = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0);
        break;
      case 'thisYear':
        start.setMonth(0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start.setFullYear(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'all':
        return { startDate: null, endDate: null };
      default:
        return { startDate: null, endDate: null };
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };
  
  // Handle column toggle
  const toggleColumn = (columnId) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  };
  
  // Select/Deselect all columns
  const toggleSelectAll = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map((c) => c.id));
    }
  };
  
  // Handle export
  const handleExport = () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }
    
    const dateRange = reportPeriod === 'custom'
      ? { startDate: customStartDate, endDate: customEndDate }
      : getDateRange(reportPeriod);
    
    const exportOptions = {
      period: reportPeriod,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      includeFilters: includeCurrentFilters,
      format,
      columns: selectedColumns,
    };
    
    // Add to history
    const historyEntry = {
      id: Date.now().toString(),
      fileName: `deceased_report_${new Date().toISOString().split('T')[0]}_${format}`,
      fileSize: '—',
      recordCount: '—',
      generatedAt: new Date().toISOString(),
      period: reportPeriod,
      format,
      status: 'success',
    };
    
    const updatedHistory = [historyEntry, ...exportHistory].slice(0, 10); // Keep last 10
    setExportHistory(updatedHistory);
    localStorage.setItem('exportHistory', JSON.stringify(updatedHistory));
    
    onExport(exportOptions);
  };
  
  // Clear history
  const clearHistory = () => {
    setExportHistory([]);
    localStorage.removeItem('exportHistory');
  };
  
  // Get period label
  const getPeriodLabel = () => {
    const labels = {
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisQuarter: 'This Quarter',
      lastQuarter: 'Last Quarter',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      all: 'All Time',
      custom: 'Custom Range',
    };
    return labels[reportPeriod] || reportPeriod;
  };
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>
            <FileSpreadsheet size={24} />
            Export Data Center
          </h2>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {/* Left Panel - Export Options */}
          <LeftPanel>
            {/* Report Period Section */}
            <Section>
              <SectionTitle>
                <Calendar size={16} />
                Report Period
              </SectionTitle>
              <Grid cols="1fr 1fr">
                <FormGroup>
                  <Label>Time Range</Label>
                  <Select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisQuarter">This Quarter</option>
                    <option value="lastQuarter">Last Quarter</option>
                    <option value="thisYear">This Year</option>
                    <option value="lastYear">Last Year</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Export Format</Label>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                  </Select>
                </FormGroup>
              </Grid>
              
              {reportPeriod === 'custom' && (
                <Grid cols="1fr 1fr">
                  <FormGroup>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </FormGroup>
                </Grid>
              )}
            </Section>
            
            <SectionDivider />
            
            {/* Column Selection Section */}
            <Section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>
                  <Columns size={16} />
                  Data Columns
                </SectionTitle>
                <OutlineButton onClick={() => setShowColumnSelector(!showColumnSelector)}>
                  {showColumnSelector ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {selectedColumns.length} selected
                </OutlineButton>
              </div>
              
              {showColumnSelector && (
                <div style={{
                  border: `1px solid ${Colors.borderGray}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  backgroundColor: Colors.lightGray,
                }}>
                  <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: Colors.textMuted }}>
                      Select columns to include in export
                    </span>
                    <OutlineButton onClick={toggleSelectAll}>
                      {selectedColumns.length === availableColumns.length ? 'Deselect All' : 'Select All'}
                    </OutlineButton>
                  </div>
                  <CheckboxGroup>
                    {availableColumns.map((column) => (
                      <CheckboxItem
                        key={column.id}
                        selected={selectedColumns.includes(column.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column.id)}
                          onChange={() => toggleColumn(column.id)}
                        />
                        {column.label}
                      </CheckboxItem>
                    ))}
                  </CheckboxGroup>
                </div>
              )}
            </Section>
            
            <SectionDivider />
            
            {/* Filter Options Section */}
            <Section>
              <SectionTitle>
                <Filter size={16} />
                Filter Options
              </SectionTitle>
              
              <CheckboxItem
                selected={includeCurrentFilters}
                style={{ width: 'fit-content' }}
              >
                <input
                  type="checkbox"
                  checked={includeCurrentFilters}
                  onChange={(e) => setIncludeCurrentFilters(e.target.checked)}
                />
                Apply current list filters to export
              </CheckboxItem>
              
              {includeCurrentFilters && filters && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: Colors.lightGray,
                  borderRadius: '0.5rem',
                  border: `1px solid ${Colors.borderGray}`,
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: Colors.primaryDark }}>
                    Active Filters:
                  </span>
                  {filters.status !== 'all' && (
                    <FilterTag>Status: {filters.status}</FilterTag>
                  )}
                  {filters.autopsy !== 'all' && (
                    <FilterTag>Autopsy: {filters.autopsy}</FilterTag>
                  )}
                  {filters.year !== 'all' && (
                    <FilterTag>Year: {filters.year}</FilterTag>
                  )}
                  {filters.search && (
                    <FilterTag>Search: {filters.search}</FilterTag>
                  )}
                  {filters.status === 'all' &&
                    filters.autopsy === 'all' &&
                    filters.year === 'all' &&
                    !filters.search && (
                      <span style={{ fontSize: '0.75rem', color: Colors.textMuted }}>
                        No active filters
                      </span>
                    )}
                </div>
              )}
            </Section>
          </LeftPanel>
          
          {/* Right Panel - Export History */}
          <RightPanel>
            <SectionTitle style={{ marginBottom: '0.5rem' }}>
              <Clock size={16} />
              Recently Exported
            </SectionTitle>
            
            <HistoryPanel style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <HistoryHeader onClick={() => setShowHistory(!showHistory)}>
                <h4>
                  Export History
                  {exportHistory.length > 0 && (
                    <span style={{
                      backgroundColor: Colors.purple,
                      color: Colors.white,
                      padding: '0.1rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                    }}>
                      {exportHistory.length}
                    </span>
                  )}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {exportHistory.length > 0 && (
                    <OutlineButton
                      onClick={(e) => {
                        e.stopPropagation();
                        clearHistory();
                      }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                    >
                      <Trash2 size={12} />
                      Clear
                    </OutlineButton>
                  )}
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </HistoryHeader>
              
              <HistoryList isOpen={showHistory} style={{ flex: 1, overflow: 'auto' }}>
                {exportHistory.length === 0 ? (
                  <EmptyHistory>
                    <Clock size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '0.85rem' }}>No export history yet</span>
                    <span style={{ fontSize: '0.75rem' }}>Your exported files will appear here</span>
                  </EmptyHistory>
                ) : (
                  exportHistory.map((item) => (
                    <HistoryItem key={item.id}>
                      <HistoryItemInfo>
                        <HistoryFileName>
                          <FileText size={14} />
                          {item.fileName}
                        </HistoryFileName>
                        <HistoryMeta>
                          {new Date(item.generatedAt).toLocaleString()} • {item.format?.toUpperCase() || 'XLSX'} • Period: {item.period}
                        </HistoryMeta>
                      </HistoryItemInfo>
                      <HistoryActions>
                        <StatusBadge status={item.status}>
                          <Check size={10} />
                          {item.status}
                        </StatusBadge>
                      </HistoryActions>
                    </HistoryItem>
                  ))
                )}
              </HistoryList>
            </HistoryPanel>
          </RightPanel>
        </ModalBody>
        
        <ModalFooter>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <SecondaryButton onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
            >
              {isExporting ? (
                <>
                  <AnimatedLoader size={18} />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export {format.toUpperCase()}
                </>
              )}
            </PrimaryButton>
          </div>
          
          <div style={{ fontSize: '0.75rem', color: Colors.textMuted }}>
            {selectedColumns.length} columns selected • {getPeriodLabel()}
          </div>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ExportModal;