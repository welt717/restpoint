import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Battery,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Search,
  BarChart3,
  Warehouse,
  Beaker,
  Eye,
  Calendar,
  FileText,
  X,
  Save,
  History,
  Users,
  PieChart,
  BarChart,
  FileUp,
  FileDown,
  Printer,
  DollarSign,
  Edit3,
  Trash2,
  User,
  Syringe,
  Shield,
  RefreshCw,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { toast } from 'react-toastify';

// Using your specified colors
const COLORS = {
  primaryDark: '#1E293B',
  accentRed: '#EF4444',
  accentBlue: '#3B82F6',
  successGreen: '#10B981',
  dangerRed: '#DC2626',
  warningYellow: '#F59E0B',
  infoBlue: '#0EA5E9',
  darkGray: '#334155',
  light: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B'
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const modalIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const DashboardContainer = styled.div`
  padding: 24px;
  background: ${COLORS.light};
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  color: ${COLORS.primaryDark};
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  background: ${({ variant }) => 
    variant === 'primary' ? COLORS.accentBlue : 
    variant === 'success' ? COLORS.successGreen : 
    variant === 'warning' ? COLORS.warningYellow : COLORS.cardBg};
  color: ${({ variant }) => variant ? 'white' : COLORS.textPrimary};
  border: ${({ variant }) => variant ? 'none' : `1px solid ${COLORS.border}`};
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: ${COLORS.cardBg};
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${COLORS.border};
  animation: ${fadeIn} 0.6s ease-out;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatTitle = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.div`
  color: ${COLORS.textPrimary};
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 6px;
`;

const StatTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ trend }) => trend === 'up' ? COLORS.successGreen : COLORS.accentRed};
`;

const ContentSection = styled.div`
  background: ${COLORS.cardBg};
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${COLORS.border};
  margin-bottom: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: ${COLORS.textPrimary};
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChemicalTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background: ${COLORS.light};
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${COLORS.textSecondary};
  border-bottom: 1px solid ${COLORS.border};
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid ${COLORS.border};
  font-size: 14px;
  color: ${COLORS.textPrimary};
`;

const TableRow = styled.tr`
  transition: background 0.2s ease;
  
  &:hover {
    background: ${COLORS.light};
  }
  
  &:last-child ${TableCell} {
    border-bottom: none;
  }
`;

const StockLevel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BatteryBar = styled.div`
  width: 60px;
  height: 6px;
  background: ${COLORS.border};
  border-radius: 3px;
  overflow: hidden;
`;

const BatteryFill = styled.div`
  height: 100%;
  background: ${({ level }) => 
    level > 70 ? COLORS.successGreen :
    level > 30 ? COLORS.warningYellow : COLORS.accentRed};
  border-radius: 3px;
  width: ${({ level }) => level}%;
  transition: width 0.5s ease;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const IconButton = styled.button`
  background: transparent;
  color: ${COLORS.textSecondary};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${COLORS.light};
    color: ${COLORS.accentBlue};
    transform: translateY(-1px);
  }
  
  &.danger:hover {
    color: ${COLORS.accentRed};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Circular Chart Components
const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 20px;
`;

const AnalyticsCard = styled.div`
  background: ${COLORS.cardBg};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

const ChartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
`;

const CircularChart = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.color} 0% ${props => props.percentage}%,
    ${COLORS.border} ${props => props.percentage}% 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    width: 90px;
    height: 90px;
    background: ${COLORS.cardBg};
    border-radius: 50%;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ChartValue = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  font-weight: 800;
  font-size: 20px;
  color: ${props => props.color};
`;

const ChartLabel = styled.div`
  font-size: 12px;
  color: ${COLORS.textSecondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const AnalyticsContent = styled.div`
  flex: 1;
`;

const ChemicalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ChemicalName = styled.h4`
  color: ${COLORS.textPrimary};
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.lowStock ? '#FEF2F2' : '#F0F9FF'};
  color: ${props => props.lowStock ? '#DC2626' : '#0369A1'};
  border: 1px solid ${props => props.lowStock ? '#FECACA' : '#BAE6FD'};
`;

const AnalyticsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid ${COLORS.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const AnalyticsLabel = styled.div`
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AnalyticsValue = styled.div`
  color: ${COLORS.accentBlue};
  font-size: 14px;
  font-weight: 700;
`;

const UsageTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const UsageRow = styled.tr`
  &:hover {
    background: ${COLORS.light};
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: ${COLORS.cardBg};
  border-radius: 16px;
  padding: 0;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  animation: ${modalIn} 0.3s ease-out;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  color: ${COLORS.textPrimary};
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalContent = styled.div`
  padding: 0 24px 24px;
  overflow-y: auto;
  flex: 1;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const FormTitle = styled.h4`
  color: ${COLORS.textPrimary};
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  color: ${COLORS.textPrimary};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${COLORS.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const PrimaryButton = styled.button`
  background: ${COLORS.accentBlue};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9CA3AF;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: ${COLORS.light};
  color: ${COLORS.textPrimary};
  border: 1px solid ${COLORS.border};
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${COLORS.border};
  }
`;

// Search Component
const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${COLORS.cardBg};
  border: 1px solid ${COLORS.border};
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  
  &::placeholder {
    color: ${COLORS.textSecondary};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: ${COLORS.textSecondary};
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api/v1/restpoint';

// Main Component
const ChemicalManagementDashboard = () => {
  const [chemicals, setChemicals] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [ppeRequests, setPpeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPPERequestModal, setShowPPERequestModal] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get branch ID from localStorage or use default
  const getBranchId = () => {
    const branchId = localStorage.getItem('branch_id');
    return branchId || '1';
  };

  // Fetch chemicals from API
  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/chemicals`);
      const result = await response.json();
      
      if (result.success) {
        setChemicals(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch chemicals');
      }
    } catch (error) {
      console.error('Error fetching chemicals:', error);
      toast.error('Failed to load chemicals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch usage data from API
  const fetchUsageData = async () => {
    try {
      const branchId = getBranchId();
      const response = await fetch(`${API_BASE_URL}/usage/${branchId}`);
      const result = await response.json();
      
      if (result.success) {
        setUsageData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch usage data');
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error('Failed to load usage data');
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      const branchId = getBranchId();
      const response = await fetch(`${API_BASE_URL}/chemical-analytics/${branchId}`);
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    }
  };

  // Fetch PPE requests
  const fetchPpeRequests = async () => {
    try {
      const branchId = getBranchId();
      const response = await fetch(`${API_BASE_URL}/ppe-requests/${branchId}`);
      const result = await response.json();
      
      if (result.success) {
        setPpeRequests(result.data);
      } else {
        // If endpoint doesn't exist, use empty array
        setPpeRequests([]);
      }
    } catch (error) {
      console.error('Error fetching PPE requests:', error);
      setPpeRequests([]);
    }
  };

  // Add new chemical
  const handleAddChemical = async (chemicalData) => {
    try {
      setActionLoading(true);
      const branchId = getBranchId();
      
      const payload = {
        name: chemicalData.name,
        category: chemicalData.category.toLowerCase(),
        unit: chemicalData.unit,
        hazard_level: chemicalData.hazardLevel.toLowerCase(),
        reorder_level: parseFloat(chemicalData.reorderLevel),
        branch_id: parseInt(branchId),
        initial_quantity: parseFloat(chemicalData.initialQuantity) || 0
      };

      const response = await fetch(`${API_BASE_URL}/chemicals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Chemical added successfully');
        setShowAddModal(false);
        await fetchChemicals();
        await fetchAnalyticsData();
      } else {
        throw new Error(result.message || 'Failed to add chemical');
      }
    } catch (error) {
      console.error('Error adding chemical:', error);
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update chemical
  const handleUpdateChemical = async (chemicalId, updateData) => {
    try {
      setActionLoading(true);
      
      const payload = {
        name: updateData.name,
        category: updateData.category,
        unit: updateData.unit,
        hazard_level: updateData.hazard_level,
        reorder_level: parseFloat(updateData.reorder_level)
      };

      const response = await fetch(`${API_BASE_URL}/chemicals/${chemicalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Chemical updated successfully');
        setShowEditModal(false);
        await fetchChemicals();
        await fetchAnalyticsData();
      } else {
        throw new Error(result.message || 'Failed to update chemical');
      }
    } catch (error) {
      console.error('Error updating chemical:', error);
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Receive stock
  const handleReceiveStock = async (chemicalId, quantity) => {
    try {
      const chemical = chemicals.find(c => c.chemical_id === chemicalId);
      if (!chemical) return;

      const newQuantity = parseFloat(chemical.quantity_available) + parseFloat(quantity);
      
      await handleUpdateChemical(chemicalId, {
        ...chemical,
        quantity_available: newQuantity
      });
      
      setShowReceiveModal(false);
      toast.success(`Successfully received ${quantity}${chemical.unit} of ${chemical.chemical_name}`);
    } catch (error) {
      toast.error('Failed to receive stock');
    }
  };

  // Submit PPE request
  const handlePPERequest = async (ppeData) => {
    try {
      setActionLoading(true);
      const branchId = getBranchId();
      
      const payload = {
        branch_id: parseInt(branchId),
        item_name: ppeData.itemName,
        quantity_requested: parseInt(ppeData.quantity),
        requested_by: ppeData.requestedBy
      };

      const response = await fetch(`${API_BASE_URL}/ppe-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('PPE request submitted successfully');
        setShowPPERequestModal(false);
        await fetchPpeRequests();
      } else {
        throw new Error(result.message || 'Failed to submit PPE request');
      }
    } catch (error) {
      console.error('Error submitting PPE request:', error);
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate stock level percentage
  const calculateStockLevel = (chemical) => {
    const currentStock = parseFloat(chemical.quantity_available);
    const reorderLevel = parseFloat(chemical.reorder_level);
    const percentage = (currentStock / (reorderLevel * 3)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  // Calculate chart percentage for analytics
  const calculateChartPercentage = (analytic) => {
    const currentStock = parseFloat(analytic.current_stock);
    const reorderLevel = parseFloat(analytic.reorder_level);
    const maxLevel = reorderLevel * 3;
    const percentage = (currentStock / maxLevel) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  // Get chart color based on stock level
  const getChartColor = (percentage, isLowStock) => {
    if (isLowStock) return COLORS.accentRed;
    if (percentage > 70) return COLORS.successGreen;
    if (percentage > 30) return COLORS.warningYellow;
    return COLORS.accentRed;
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchChemicals(),
        fetchUsageData(),
        fetchAnalyticsData(),
        fetchPpeRequests()
      ]);
    };
    
    loadData();
  }, []);

  // Filter chemicals based on search
  const filteredChemicals = chemicals.filter(chemical =>
    chemical.chemical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics from analytics data
  const totalChemicals = chemicals.length;
  const lowStockCount = analyticsData.filter(item => item.is_low_stock === 1).length;
  const totalUsageToday = analyticsData.reduce((sum, item) => 
    sum + parseFloat(item.used_today), 0
  );

  const totalEmbalmingsToday = analyticsData.length > 0 ? analyticsData[0].embalming_today : 0;

  const renderAddModal = () => (
    <ModalOverlay onClick={() => setShowAddModal(false)}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Plus size={20} />
            Add New Chemical
          </ModalTitle>
          <IconButton onClick={() => setShowAddModal(false)} disabled={actionLoading}>
            <X size={18} />
          </IconButton>
        </ModalHeader>

        <ModalContent>
          <FormGrid>
            <div>
              <FormSection>
                <FormTitle>
                  <Search size={16} />
                  Basic Information
                </FormTitle>
                <FormGroup>
                  <Label>Chemical Name *</Label>
                  <Input 
                    placeholder="Enter chemical name" 
                    id="chemName" 
                    required 
                    disabled={actionLoading}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Category *</Label>
                  <Select id="chemCategory" required disabled={actionLoading}>
                    <option value="">Select Category</option>
                    <option value="preservative">Preservative</option>
                    <option value="disinfectant">Disinfectant</option>
                    <option value="humectant">Humectant</option>
                    <option value="solvent">Solvent</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Unit *</Label>
                  <Select id="chemUnit" required disabled={actionLoading}>
                    <option value="">Select Unit</option>
                    <option value="L">Liters (L)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="units">Units</option>
                  </Select>
                </FormGroup>
              </FormSection>
            </div>

            <div>
              <FormSection>
                <FormTitle>
                  <AlertTriangle size={16} />
                  Safety & Stock
                </FormTitle>
                <FormGroup>
                  <Label>Hazard Level *</Label>
                  <Select id="chemHazard" required disabled={actionLoading}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Reorder Level *</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Enter reorder level" 
                    id="chemReorder" 
                    required 
                    disabled={actionLoading}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Initial Quantity</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Enter initial quantity" 
                    id="initialQuantity" 
                    disabled={actionLoading}
                  />
                </FormGroup>
              </FormSection>
            </div>
          </FormGrid>

          <ButtonGroup>
            <SecondaryButton onClick={() => setShowAddModal(false)} disabled={actionLoading}>
              <X size={16} />
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={() => {
              const name = document.getElementById('chemName').value;
              const category = document.getElementById('chemCategory').value;
              const unit = document.getElementById('chemUnit').value;
              const hazard = document.getElementById('chemHazard').value;
              const reorder = document.getElementById('chemReorder').value;
              const initialQuantity = document.getElementById('initialQuantity').value || '0';

              if (name && category && unit && hazard && reorder) {
                handleAddChemical({
                  name,
                  category,
                  unit,
                  hazardLevel: hazard,
                  reorderLevel: reorder,
                  initialQuantity
                });
              } else {
                toast.error('Please fill in all required fields');
              }
            }} disabled={actionLoading}>
              <Save size={16} />
              {actionLoading ? 'Adding...' : 'Add Chemical'}
            </PrimaryButton>
          </ButtonGroup>
        </ModalContent>
      </Modal>
    </ModalOverlay>
  );

  const renderEditModal = () => (
    <ModalOverlay onClick={() => setShowEditModal(false)}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Edit3 size={20} />
            Edit Chemical
          </ModalTitle>
          <IconButton onClick={() => setShowEditModal(false)} disabled={actionLoading}>
            <X size={18} />
          </IconButton>
        </ModalHeader>

        <ModalContent>
          {selectedChemical && (
            <FormGrid>
              <div>
                <FormSection>
                  <FormTitle>
                    <Search size={16} />
                    Basic Information
                  </FormTitle>
                  <FormGroup>
                    <Label>Chemical Name *</Label>
                    <Input 
                      placeholder="Enter chemical name" 
                      id="editChemName" 
                      defaultValue={selectedChemical.chemical_name}
                      required 
                      disabled={actionLoading}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Category *</Label>
                    <Select id="editChemCategory" required disabled={actionLoading} defaultValue={selectedChemical.category}>
                      <option value="preservative">Preservative</option>
                      <option value="disinfectant">Disinfectant</option>
                      <option value="humectant">Humectant</option>
                      <option value="solvent">Solvent</option>
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Unit *</Label>
                    <Select id="editChemUnit" required disabled={actionLoading} defaultValue={selectedChemical.unit}>
                      <option value="L">Liters (L)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="units">Units</option>
                    </Select>
                  </FormGroup>
                </FormSection>
              </div>

              <div>
                <FormSection>
                  <FormTitle>
                    <AlertTriangle size={16} />
                    Safety & Stock
                  </FormTitle>
                  <FormGroup>
                    <Label>Hazard Level *</Label>
                    <Select id="editChemHazard" required disabled={actionLoading} defaultValue={selectedChemical.hazard_level}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Reorder Level *</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="Enter reorder level" 
                      id="editChemReorder" 
                      defaultValue={selectedChemical.reorder_level}
                      required 
                      disabled={actionLoading}
                    />
                  </FormGroup>
                </FormSection>
              </div>
            </FormGrid>
          )}

          <ButtonGroup>
            <SecondaryButton onClick={() => setShowEditModal(false)} disabled={actionLoading}>
              <X size={16} />
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={() => {
              const name = document.getElementById('editChemName').value;
              const category = document.getElementById('editChemCategory').value;
              const unit = document.getElementById('editChemUnit').value;
              const hazard = document.getElementById('editChemHazard').value;
              const reorder = document.getElementById('editChemReorder').value;

              if (name && category && unit && hazard && reorder && selectedChemical) {
                handleUpdateChemical(selectedChemical.chemical_id, {
                  name,
                  category,
                  unit,
                  hazard_level: hazard,
                  reorder_level: reorder
                });
              } else {
                toast.error('Please fill in all required fields');
              }
            }} disabled={actionLoading}>
              <Save size={16} />
              {actionLoading ? 'Updating...' : 'Update Chemical'}
            </PrimaryButton>
          </ButtonGroup>
        </ModalContent>
      </Modal>
    </ModalOverlay>
  );

  const renderPPERequestModal = () => (
    <ModalOverlay onClick={() => setShowPPERequestModal(false)}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Shield size={20} />
            Request PPE Equipment
          </ModalTitle>
          <IconButton onClick={() => setShowPPERequestModal(false)} disabled={actionLoading}>
            <X size={18} />
          </IconButton>
        </ModalHeader>

        <ModalContent>
          <FormSection>
            <FormTitle>
              <User size={16} />
              Request Details
            </FormTitle>
            <FormGroup>
              <Label>Item Name *</Label>
              <Input 
                placeholder="Enter PPE item name" 
                id="ppeItemName" 
                required 
                disabled={actionLoading}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Quantity Requested *</Label>
              <Input 
                type="number"
                placeholder="Enter quantity" 
                id="ppeQuantity" 
                required 
                disabled={actionLoading}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Requested By *</Label>
              <Input 
                placeholder="Enter your name" 
                id="ppeRequestedBy" 
                required 
                disabled={actionLoading}
              />
            </FormGroup>
          </FormSection>

          <ButtonGroup>
            <SecondaryButton onClick={() => setShowPPERequestModal(false)} disabled={actionLoading}>
              <X size={16} />
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={() => {
              const itemName = document.getElementById('ppeItemName').value;
              const quantity = document.getElementById('ppeQuantity').value;
              const requestedBy = document.getElementById('ppeRequestedBy').value;

              if (itemName && quantity && requestedBy) {
                handlePPERequest({
                  itemName,
                  quantity,
                  requestedBy
                });
              } else {
                toast.error('Please fill in all required fields');
              }
            }} disabled={actionLoading}>
              <Save size={16} />
              {actionLoading ? 'Submitting...' : 'Submit Request'}
            </PrimaryButton>
          </ButtonGroup>
        </ModalContent>
      </Modal>
    </ModalOverlay>
  );

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>
          <RefreshCw size={24} />
          <span style={{ marginLeft: '12px' }}>Loading chemical inventory...</span>
        </LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>
          <Beaker size={28} />
          Chemical Inventory Management
        </Title>
        <HeaderActions>
          <ActionButton onClick={() => {
            fetchChemicals();
            fetchAnalyticsData();
            fetchUsageData();
          }} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </ActionButton>
          <ActionButton onClick={() => setShowPPERequestModal(true)} variant="warning">
            <Shield size={16} />
            Request PPE
          </ActionButton>
          <ActionButton onClick={() => setShowAddModal(true)} variant="success" disabled={actionLoading}>
            <Plus size={16} />
            Add Chemical
          </ActionButton>
        </HeaderActions>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Total Chemicals</StatTitle>
            <Package size={20} color={COLORS.accentBlue} />
          </StatHeader>
          <StatValue>{totalChemicals}</StatValue>
          <StatTrend trend="up">
            <TrendingUp size={14} />
            Active
          </StatTrend>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Low Stock Items</StatTitle>
            <AlertTriangle size={20} color={COLORS.warningYellow} />
          </StatHeader>
          <StatValue>{lowStockCount}</StatValue>
          <StatTrend trend={lowStockCount > 0 ? 'down' : 'up'}>
            {lowStockCount > 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {lowStockCount > 0 ? 'Need attention' : 'All good'}
          </StatTrend>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatTitle>Today's Usage</StatTitle>
            <Syringe size={20} color={COLORS.infoBlue} />
          </StatHeader>
          <StatValue>{totalUsageToday}L</StatValue>
          <StatTrend trend="up">
            <TrendingUp size={14} />
            {totalEmbalmingsToday} procedures
          </StatTrend>
        </StatCard>
      </StatsGrid>

      <ContentSection>
        <SectionHeader>
          <SectionTitle>
            <Package size={18} />
            Chemical Inventory
          </SectionTitle>
          <SearchBar>
            <Search size={16} color={COLORS.textSecondary} />
            <SearchInput
              placeholder="Search chemicals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
        </SectionHeader>
        
        <ChemicalTable>
          <thead>
            <tr>
              <TableHeader>Chemical</TableHeader>
              <TableHeader>Category</TableHeader>
              <TableHeader>Stock</TableHeader>
              <TableHeader>Level</TableHeader>
              <TableHeader>Reorder Level</TableHeader>
              <TableHeader>Hazard Level</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.map(chemical => (
              <TableRow key={chemical.chemical_id}>
                <TableCell>
                  <div style={{ fontWeight: '600' }}>{chemical.chemical_name}</div>
                  <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                    ID: {chemical.chemical_uid}
                  </div>
                </TableCell>
                <TableCell>
                  <span style={{ 
                    textTransform: 'capitalize',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: chemical.category === 'preservative' ? '#FEF3C7' : 
                                   chemical.category === 'disinfectant' ? '#DBEAFE' : '#F3E8FF',
                    color: chemical.category === 'preservative' ? '#92400E' : 
                          chemical.category === 'disinfectant' ? '#1E40AF' : '#6B21A8'
                  }}>
                    {chemical.category}
                  </span>
                </TableCell>
                <TableCell>
                  {chemical.quantity_available} {chemical.unit}
                </TableCell>
                <TableCell>
                  <StockLevel>
                    <BatteryBar>
                      <BatteryFill level={calculateStockLevel(chemical)} />
                    </BatteryBar>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: calculateStockLevel(chemical) > 30 ? COLORS.successGreen : COLORS.accentRed,
                      minWidth: '30px'
                    }}>
                      {Math.round(calculateStockLevel(chemical))}%
                    </span>
                  </StockLevel>
                </TableCell>
                <TableCell>{chemical.reorder_level} {chemical.unit}</TableCell>
                <TableCell>
                  <span style={{ 
                    textTransform: 'capitalize',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: chemical.hazard_level === 'high' ? '#FEE2E2' : 
                                   chemical.hazard_level === 'medium' ? '#FEF3C7' : '#D1FAE5',
                    color: chemical.hazard_level === 'high' ? '#DC2626' : 
                          chemical.hazard_level === 'medium' ? '#92400E' : '#059669'
                  }}>
                    {chemical.hazard_level}
                  </span>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <IconButton 
                      onClick={() => {
                        setSelectedChemical(chemical);
                        setShowReceiveModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      <Download size={14} />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setSelectedChemical(chemical);
                        setShowEditModal(true);
                      }}
                      disabled={actionLoading}
                    >
                      <Edit3 size={14} />
                    </IconButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </ChemicalTable>
      </ContentSection>

      {analyticsData.length > 0 && (
        <ContentSection>
          <SectionHeader>
            <SectionTitle>
              <BarChart3 size={18} />
              Chemical Analytics
            </SectionTitle>
          </SectionHeader>
          
          <AnalyticsGrid>
            {analyticsData.map(analytic => {
              const chartPercentage = calculateChartPercentage(analytic);
              const chartColor = getChartColor(chartPercentage, analytic.is_low_stock === 1);
              
              return (
                <AnalyticsCard key={analytic.chemical_id}>
                  <ChartContainer>
                    <div style={{ position: 'relative' }}>
                      <CircularChart 
                        percentage={chartPercentage} 
                        color={chartColor}
                      >
                        <ChartValue color={chartColor}>
                          {Math.round(chartPercentage)}%
                        </ChartValue>
                      </CircularChart>
                      <ChartLabel style={{ textAlign: 'center', marginTop: '8px' }}>
                        Stock Level
                      </ChartLabel>
                    </div>
                    
                    <AnalyticsContent>
                      <ChemicalHeader>
                        <ChemicalName>
                          <Beaker size={16} />
                          {analytic.chemical_name}
                        </ChemicalName>
                        <StatusBadge lowStock={analytic.is_low_stock === 1}>
                          {analytic.is_low_stock === 1 ? 'Low Stock' : 'Good Stock'}
                        </StatusBadge>
                      </ChemicalHeader>
                      
                      <AnalyticsItem>
                        <AnalyticsLabel>
                          <Package size={14} />
                          Current Stock
                        </AnalyticsLabel>
                        <AnalyticsValue>
                          {analytic.current_stock} {analytic.unit}
                        </AnalyticsValue>
                      </AnalyticsItem>
                      
                      <AnalyticsItem>
                        <AnalyticsLabel>
                          <Zap size={14} />
                          Used Today
                        </AnalyticsLabel>
                        <AnalyticsValue>
                          {analytic.used_today} {analytic.unit}
                        </AnalyticsValue>
                      </AnalyticsItem>
                      
                      <AnalyticsItem>
                        <AnalyticsLabel>
                          <Target size={14} />
                          Avg per Embalming
                        </AnalyticsLabel>
                        <AnalyticsValue>
                          {parseFloat(analytic.avg_usage_per_embalming).toFixed(2)} {analytic.unit}
                        </AnalyticsValue>
                      </AnalyticsItem>
                      
                      <AnalyticsItem>
                        <AnalyticsLabel>
                          <Clock size={14} />
                          Days Remaining
                        </AnalyticsLabel>
                        <AnalyticsValue style={{ 
                          color: parseFloat(analytic.estimate_days_remaining) < 7 ? COLORS.accentRed : COLORS.successGreen
                        }}>
                          {parseFloat(analytic.estimate_days_remaining).toFixed(1)} days
                        </AnalyticsValue>
                      </AnalyticsItem>
                    </AnalyticsContent>
                  </ChartContainer>
                </AnalyticsCard>
              );
            })}
          </AnalyticsGrid>
        </ContentSection>
      )}

      <ContentSection>
        <SectionHeader>
          <SectionTitle>
            <History size={18} />
            Recent Chemical Usage
          </SectionTitle>
        </SectionHeader>
        
        <UsageTable>
          <thead>
            <tr>
              <TableHeader>Deceased</TableHeader>
              <TableHeader>Chemical</TableHeader>
              <TableHeader>Quantity Used</TableHeader>
              <TableHeader>Used By</TableHeader>
              <TableHeader>Date & Time</TableHeader>
            </tr>
          </thead>
          <tbody>
            {usageData.slice(0, 10).map(usage => (
              <UsageRow key={usage.usage_id}>
                <TableCell>
                  <div style={{ fontWeight: '600' }}>{usage.deceased_name}</div>
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: '600' }}>{usage.chemical_name}</div>
                </TableCell>
                <TableCell>
                  <strong>{usage.quantity_used} {usage.unit}</strong>
                </TableCell>
                <TableCell>{usage.used_by}</TableCell>
                <TableCell>
                  {new Date(usage.used_at).toLocaleString('en-KE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
              </UsageRow>
            ))}
          </tbody>
        </UsageTable>
      </ContentSection>

      {showAddModal && renderAddModal()}
      {showEditModal && renderEditModal()}
      {showPPERequestModal && renderPPERequestModal()}
    </DashboardContainer>
  );
};

export default ChemicalManagementDashboard;