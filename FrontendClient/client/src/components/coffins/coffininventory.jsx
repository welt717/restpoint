import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Spinner, Row, Col, Badge, Button, Modal, Form,
  ListGroup, ListGroupItem, Alert, Carousel, InputGroup,
  Table, Container
} from 'react-bootstrap';
import api from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import {
  Search, Plus, Edit, Trash2, Eye, Package,
  AlertTriangle, Filter, Download, Upload, Box,
  Database, RotateCw, Settings, TriangleAlert, 
  Flame, XCircle, Trophy, ChevronLeft, ChevronRight,
  BarChart3, Users, Tag, DollarSign, Warehouse,
  Image as ImageIcon, Calendar, User, Truck, Layers,
  Clock, PersonStanding, Save, Users as UsersIcon,
  FileSpreadsheet, Grid3x3, List
} from 'lucide-react';

// Define custom styles
const styles = `
  :root {
    --primary-red: #FF4532;
    --secondary-green: #00C853;
    --dark-text: #1A202C;
    --light-background: #F0F2F5;
    --card-background: #FFFFFF;
    --border-color: #D1D9E6;
    --error-text: #EF4444;
    --purple-gradient: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    --primary-gradient: linear-gradient(135deg, var(--primary-red) 0%, color-mix(in srgb, var(--primary-red) 80%, black) 100%);
    --success-gradient: linear-gradient(135deg, var(--secondary-green) 0%, color-mix(in srgb, var(--secondary-green) 80%, black) 100%);
    --danger-gradient: linear-gradient(135deg, var(--error-text) 0%, color-mix(in srgb, var(--error-text) 80%, black) 100%);
    --shadow-light: 0 2px 8px rgba(0,0,0,0.04);
    --shadow-medium: 0 4px 16px rgba(0,0,0,0.08);
    --shadow-heavy: 0 8px 32px rgba(0,0,0,0.12);
  }

  .inventory-container {
    background: var(--light-background);
    min-height: 100vh;
    padding: 1rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .stylish-card {
    background: var(--card-background);
    border-radius: 1rem;
    box-shadow: var(--shadow-light);
    border: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .stylish-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }

  .modern-button {
    border-radius: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    padding: 0.5rem 0.75rem;
    border: none;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
  }

  .modern-button.btn-primary {
    background: var(--primary-gradient);
    color: white;
  }

  .modern-button.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 69, 50, 0.25);
  }

  .modern-button.btn-light {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--dark-text);
  }

  .modern-button.btn-light:hover {
    background: var(--light-background);
    border-color: var(--primary-red);
    color: var(--primary-red);
  }

  .card-header-styled {
    background: var(--primary-gradient);
    color: white;
    padding: 1rem 1.25rem;
    border-bottom: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .card-header-styled h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .stat-card {
    border-radius: 0.875rem;
    padding: 1rem;
    color: white;
    box-shadow: var(--shadow-light);
    height: 100%;
    min-height: 0;
    transition: all 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-medium);
  }

  .stat-card.bg-gradient-primary { background: var(--primary-gradient); }
  .stat-card.bg-gradient-purple { background: var(--purple-gradient); }
  .stat-card.bg-gradient-success { background: var(--success-gradient); }
  .stat-card.bg-gradient-danger { background: var(--danger-gradient); }

  .stat-card .icon-container {
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
  }

  .stat-card h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0.25rem 0;
  }

  .stat-card small {
    font-size: 0.75rem;
    opacity: 0.9;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .alert-styled {
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    animation: fadeIn 0.5s ease-out;
  }

  .alert-styled.alert-danger {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
    border-left: 4px solid var(--error-text);
  }

  .table-modern {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    background: var(--card-background);
  }

  .table-modern thead th {
    background: var(--light-background);
    border-bottom: 2px solid var(--border-color);
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--dark-text);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-modern tbody td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    transition: background-color 0.2s ease;
  }

  .table-modern tbody tr:hover td {
    background-color: rgba(255, 69, 50, 0.03);
  }

  .search-input-modern {
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    padding: 0.625rem 1rem 0.625rem 2.5rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    width: 100%;
  }

  .search-input-modern:focus {
    border-color: var(--primary-red);
    box-shadow: 0 0 0 3px rgba(255, 69, 50, 0.1);
    outline: none;
  }

  .coffin-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 0.75rem;
  }

  .stock-bar {
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.25rem;
  }

  .stock-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .stock-high { background: var(--secondary-green); }
  .stock-medium { background: #F59E0B; }
  .stock-low { background: var(--error-text); }

  .coffin-card {
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: var(--shadow-light);
    transition: all 0.3s ease;
    height: 100%;
    border: 1px solid var(--border-color);
    background: var(--card-background);
  }

  .coffin-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-medium);
  }

  .coffin-card-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }

  .coffin-card-body {
    padding: 1rem;
  }

  .coffin-card-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--dark-text);
  }

  .coffin-card-text {
    font-size: 0.875rem;
    color: #64748B;
    margin-bottom: 0.25rem;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: white;
    padding: 0.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
  }

  .view-toggle-button {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--dark-text);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .view-toggle-button.active {
    background: var(--primary-red);
    color: white;
  }

  /* Mobile Optimizations */
  @media (max-width: 768px) {
    .inventory-container {
      padding: 0.75rem;
    }

    .card-header-styled {
      padding: 1rem;
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .card-header-styled h4 {
      font-size: 1.125rem;
    }

    .card-header-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      width: 100%;
    }

    .stat-card {
      padding: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .stat-card h2 {
      font-size: 1.25rem;
    }

    .stat-card .icon-container {
      width: 36px;
      height: 36px;
      margin-bottom: 0.5rem;
    }

    .table-modern thead th,
    .table-modern tbody td {
      padding: 0.75rem;
      font-size: 0.8125rem;
    }

    .modern-button {
      padding: 0.5rem 0.625rem;
      font-size: 0.8125rem;
    }

    .search-input-modern {
      padding: 0.5625rem 0.875rem 0.5625rem 2.25rem;
      font-size: 0.8125rem;
    }

    .coffin-card {
      margin-bottom: 1rem;
    }

    .coffin-card-image {
      height: 140px;
    }

    .coffin-card-body {
      padding: 0.875rem;
    }

    .modal-dialog {
      margin: 0.5rem;
    }

    .modal-content {
      border-radius: 1rem;
    }
  }

  @media (max-width: 576px) {
    .inventory-container {
      padding: 0.5rem;
    }

    .stat-card {
      padding: 0.75rem;
    }

    .stat-card h2 {
      font-size: 1.125rem;
    }

    .card-header-styled {
      padding: 0.875rem;
    }

    .table-responsive {
      margin: 0 -0.5rem;
      padding: 0 0.5rem;
    }

    .table-modern {
      font-size: 0.75rem;
    }

    .table-modern thead th,
    .table-modern tbody td {
      padding: 0.5rem;
    }

    .coffin-card-image {
      height: 120px;
    }

    .view-toggle {
      display: none;
    }
  }

  /* Smallest screens */
  @media (max-width: 375px) {
    .stat-card .icon-container {
      width: 32px;
      height: 32px;
    }

    .stat-card h2 {
      font-size: 1rem;
    }

    .modern-button {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }

    .coffin-card-title {
      font-size: 0.875rem;
    }

    .coffin-card-text {
      font-size: 0.75rem;
    }
  }

  /* Animation */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  .sound-alert {
    animation: pulse 1.5s infinite;
  }
`;

// Toast Notification Component
function Toast({ message, type, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const bgColor = type === 'success' ? '#10B981' : '#EF4444';
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: bgColor,
      color: 'white',
      padding: '12px 16px',
      borderRadius: '0.75rem',
      boxShadow: 'var(--shadow-heavy)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.875rem',
      maxWidth: '320px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {type === 'success' ? '✅' : '⚠️'} {message}
      <button
        onClick={() => { setVisible(false); onClose(); }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.2em',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        &times;
      </button>
    </div>
  );
}

function CoffinInventory() {
  const navigate = useNavigate();
  const [coffins, setCoffins] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [lowStockCoffins, setLowStockCoffins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCoffin, setSelectedCoffin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const audioRef = useRef(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  // Load beep sound
  useEffect(() => {
    audioRef.current = new Audio('../../../../public/audio/notification-bells.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  // Statistics
  const totalCoffins = useMemo(() => coffins.length, [coffins]);
  const totalStock = useMemo(() => coffins.reduce((sum, c) => sum + (c.quantity || 0), 0), [coffins]);
  const outOfStockCoffins = useMemo(() => coffins.filter(c => (c.quantity || 0) <= 0), [coffins]);
  const totalInventoryValue = useMemo(() => (
    coffins.reduce((sum, c) => sum + ((c.quantity || 0) * (parseFloat(c.exact_price) || 0)), 0)
  ), [coffins]);

  const stats = useMemo(() => [
    {
      title: "Total Models",
      value: totalCoffins,
      icon: <Box size={20} />,
      color: "bg-gradient-primary",
      description: "Unique coffin models"
    },
    {
      title: "Total Valuation",
      value: `Ksh ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <Trophy size={20} />,
      color: "bg-gradient-purple",
      description: "Inventory value"
    },
    {
      title: "Total Stock",
      value: totalStock,
      icon: <Database size={20} />,
      color: "bg-gradient-success",
      description: "Units in inventory"
    },
    {
      title: "Out of Stock",
      value: outOfStockCoffins.length,
      icon: <XCircle size={20} />,
      color: "bg-gradient-danger",
      description: "Need restocking"
    }
  ], [totalCoffins, totalInventoryValue, totalStock, outOfStockCoffins.length]);

  // Filter coffins
  const filteredCoffins = useMemo(() => {
    let filtered = coffins;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(coffin =>
        coffin.type?.toLowerCase().includes(term) ||
        coffin.custom_id?.toLowerCase().includes(term) ||
        coffin.material?.toLowerCase().includes(term) ||
        coffin.color?.toLowerCase().includes(term) ||
        coffin.supplier?.toLowerCase().includes(term)
      );
    }

    if (statusFilter === 'low') {
      filtered = filtered.filter(coffin => (coffin.quantity || 0) > 0 && (coffin.quantity || 0) <= 5);
    } else if (statusFilter === 'out') {
      filtered = filtered.filter(coffin => (coffin.quantity || 0) <= 0);
    } else if (statusFilter === 'in-stock') {
      filtered = filtered.filter(coffin => (coffin.quantity || 0) > 5);
    }

    return filtered;
  }, [coffins, searchTerm, statusFilter]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCoffins = filteredCoffins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCoffins.length / itemsPerPage);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    }
  }, []);

  // Check low stock with sound alert
  const checkLowStock = useCallback(() => {
    const alerts = coffins.filter(coffin => {
      const stock = coffin.quantity || 0;
      return stock > 0 && stock <= 5;
    });

    setLowStockCoffins(alerts);
    
    if (alerts.length > 0 && !hasPlayedSound) {
      playAlertSound();
      setHasPlayedSound(true);
      showToast('Low stock detected for some coffins!', 'error');
      setTimeout(() => setHasPlayedSound(false), 30000);
    }
  }, [coffins, showToast, playAlertSound, hasPlayedSound]);

  // Fetch coffins data
  const fetchCoffins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.COFFINS.LIST, { timeout: 10000 });
      
      if (response.data.success) {
        const processedCoffins = (response.data.data || []).map(coffin => {
          let images = [];
          
          if (Array.isArray(coffin.image_urls)) {
            images = coffin.image_urls;
          } else if (typeof coffin.image_urls === 'string') {
            images = coffin.image_urls.split(',').map(url => url.trim());
          }
          
          if (coffin.images && Array.isArray(coffin.images)) {
            images = [...images, ...coffin.images];
          }
          
          images = [...new Set(images)].filter(url => url && url.trim() !== '');
          
          return {
            ...coffin,
            images: images,
            primary_image: coffin.primary_image || images[0] || null
          };
        });
        
        setCoffins(processedCoffins);
        setLastUpdated(new Date());
        showToast('Data loaded successfully!', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to fetch coffins');
      }
    } catch (error) {
      console.error('Failed to load coffin data:', error);
      showToast('Failed to load data from server', 'error');
      setCoffins([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch recent assignments
  const fetchRecentAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const response = await api.get(ENDPOINTS.COFFINS.ASSIGNMENTS);
      if (response.data.success) {
        setRecentAssignments(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Failed to load recent assignments:', error);
      showToast('Failed to load recent assignments', 'error');
      setRecentAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [showToast]);

  // Export to Excel
  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      const response = await api.get(ENDPOINTS.COFFINS.EXPORT, {
        responseType: 'blob'
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coffin-inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Excel report downloaded successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export Excel report', 'error');
    } finally {
      setExporting(false);
    }
  };

  const forceRefresh = useCallback(async () => {
    setCoffins([]);
    setLowStockCoffins([]);
    setHasPlayedSound(false);
    await fetchCoffins();
    await fetchRecentAssignments();
  }, [fetchCoffins, fetchRecentAssignments]);

  useEffect(() => {
    fetchCoffins();
    fetchRecentAssignments();
  }, [fetchCoffins, fetchRecentAssignments]);

  useEffect(() => {
    if (coffins.length > 0) {
      checkLowStock();
    }
  }, [coffins, checkLowStock]);

  // Handlers
  const handleAddCoffin = () => navigate('/register-coffin');
  const handleDelete = async (coffin) => {
    setSelectedCoffin(coffin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await api.delete(ENDPOINTS.COFFINS.DELETE(selectedCoffin.coffin_id));
      if (response.data.success) {
        setCoffins(coffins.filter(c => c.coffin_id !== selectedCoffin.coffin_id));
        showToast('Coffin deleted successfully!', 'success');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.response?.data?.message || 'Delete failed', 'error');
    }
    setShowDeleteModal(false);
    setSelectedCoffin(null);
  };

  const handleEdit = (coffin) => {
    setSelectedCoffin(coffin);
    setEditFormData({
      type: coffin.type || '',
      material: coffin.material || '',
      exact_price: coffin.exact_price || '',
      quantity: coffin.quantity || '',
      supplier: coffin.supplier || '',
      color: coffin.color || '',
      size: coffin.size || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(ENDPOINTS.COFFINS.UPDATE(selectedCoffin.coffin_id), editFormData);
      if (response.data.success) {
        setCoffins(coffins.map(c => 
          c.coffin_id === selectedCoffin.coffin_id 
            ? { ...c, ...editFormData }
            : c
        ));
        showToast('Coffin updated successfully!', 'success');
        setShowEditModal(false);
        setSelectedCoffin(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Update failed:', error);
      showToast('Update failed', 'error');
    }
  };

  const handleViewDetails = (coffin) => {
    setSelectedCoffin(coffin);
    setShowDetailsModal(true);
  };

  const getStockPercentage = (stock) => Math.min((stock / 20) * 100, 100);
  const getStockVariant = (stock) => {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warning';
    return 'success';
  };

  // Render coffin images
  const renderCoffinImages = (coffin) => {
    let images = [];
    
    if (Array.isArray(coffin.image_urls)) {
      images = coffin.image_urls;
    } else if (typeof coffin.image_urls === 'string') {
      images = coffin.image_urls.split(',').map(url => url.trim());
    }
    
    if (coffin.images && Array.isArray(coffin.images)) {
      images = [...images, ...coffin.images];
    }

    images = [...new Set(images)].filter(url => url && url.trim() !== '');

    if (images.length === 0) {
      return (
        <div className="coffin-image bg-light d-flex align-items-center justify-content-center">
          <Package size={48} color="#94a3b8" />
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <img 
          src={`http://localhost:5000${images[0]}`}
          alt={coffin.type}
          className="coffin-image"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop';
          }}
        />
      );
    }

    return (
      <Carousel>
        {images.map((image, index) => (
          <Carousel.Item key={index}>
            <img
              className="d-block w-100 coffin-image"
              src={`http://localhost:5000${image}`}
              alt={`${coffin.type} - ${index + 1}`}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop';
              }}
            />
          </Carousel.Item>
        ))}
      </Carousel>
    );
  };

  // Render grid view item
  const renderGridItem = (coffin) => {
    const stock = coffin.quantity || 0;
    const stockVariant = getStockVariant(stock);
    
    return (
      <Col xs={12} sm={6} md={4} lg={3} key={coffin.coffin_id}>
        <div className="coffin-card">
          <div style={{ height: '160px', overflow: 'hidden' }}>
            {renderCoffinImages(coffin)}
          </div>
          <div className="coffin-card-body">
            <h5 className="coffin-card-title">{coffin.type}</h5>
            <p className="coffin-card-text">
              <Tag size={12} className="me-1" />
              ID: {coffin.custom_id || `COFF-${coffin.coffin_id}`}
            </p>
            <p className="coffin-card-text">
              <Layers size={12} className="me-1" />
              {coffin.material}
            </p>
            <p className="coffin-card-text">
              <DollarSign size={12} className="me-1" />
              Ksh {parseInt(coffin.exact_price || 0).toLocaleString()}
            </p>
            
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Badge bg={stockVariant} className="rounded-pill">
                {stock} units
              </Badge>
              <div className="d-flex gap-1">
                <Button 
                  variant="light" 
                  size="sm" 
                  className="p-1"
                  onClick={() => handleViewDetails(coffin)}
                >
                  <Eye size={14} />
                </Button>
                <Button 
                  variant="light" 
                  size="sm" 
                  className="p-1"
                  onClick={() => handleEdit(coffin)}
                >
                  <Edit size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Col>
    );
  };

  return (
    <div className="inventory-container">
      <style>{styles}</style>
      
      <Card className="stylish-card mb-4">
        <Card.Header className="card-header-styled">
          <div className="d-flex align-items-center">
            <Package className="me-2" />
            <h4>⚰️ Coffin Inventory</h4>
          </div>
          <div className="card-header-actions d-flex align-items-center flex-wrap gap-2">
            <div className="view-toggle d-none d-md-flex">
              <button 
                className={`view-toggle-button ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={16} />
              </button>
              <button 
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 size={16} />
              </button>
            </div>
            <Button 
              variant="light" 
              size="sm" 
              className="modern-button"
              onClick={forceRefresh}
            >
              <RotateCw size={14} /> Refresh
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              className="modern-button"
              onClick={() => setShowAssignmentsModal(true)}
            >
              <UsersIcon size={14} /> Assigned
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="modern-button"
              onClick={handleAddCoffin}
            >
              <Plus size={14} /> Add Coffin
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-3">
          {/* Low Stock Alert */}
          {lowStockCoffins.length > 0 && (
            <Alert variant="danger" className="mb-4 alert-styled sound-alert" dismissible onClose={() => setLowStockCoffins([])}>
              <div className="d-flex align-items-center">
                <TriangleAlert className="me-3" size={20} />
                <div>
                  <strong className="d-block mb-1">Low Stock Alert</strong>
                  <small className="d-block">{lowStockCoffins.length} coffin(s) need attention</small>
                </div>
              </div>
            </Alert>
          )}

          {/* Statistics Cards */}
          <Row className="g-3 mb-4">
            {stats.map((stat, index) => (
              <Col key={index} xs={6} sm={6} md={3} lg={3}>
                <div className={`stat-card ${stat.color}`}>
                  <div className="icon-container">
                    {stat.icon}
                  </div>
                  <h2>{stat.value}</h2>
                  <small>{stat.title}</small>
                </div>
              </Col>
            ))}
          </Row>

          {/* Search and Filters */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="position-relative">
                <Search className="position-absolute top-50 start-3 translate-middle-y" size={16} color="#94a3b8" />
                <Form.Control
                  type="text"
                  placeholder="Search coffins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-modern"
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="search-input-modern"
                style={{ paddingLeft: '1rem' }}
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button 
                variant="light"
                className="modern-button w-100"
                onClick={handleExportToExcel}
                disabled={exporting || coffins.length === 0}
              >
                {exporting ? (
                  <Spinner animation="border" size="sm" className="me-1" />
                ) : (
                  <FileSpreadsheet size={14} className="me-1" />
                )}
                Export
              </Button>
            </Col>
          </Row>

          {/* View Toggle for Mobile */}
          <div className="d-flex justify-content-between align-items-center mb-3 d-md-none">
            <small className="text-muted">
              Showing {filteredCoffins.length} coffins
            </small>
            <div className="view-toggle">
              <button 
                className={`view-toggle-button ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={16} />
              </button>
              <button 
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 size={16} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: 'var(--primary-red)' }} />
              <p className="mt-2 text-muted">Loading inventory...</p>
            </div>
          ) : filteredCoffins.length === 0 ? (
            <div className="text-center py-5">
              <Package size={48} className="mb-3 text-muted" />
              <h5 className="mb-2">No coffins found</h5>
              <p className="text-muted mb-3">Try adjusting your search or filters</p>
              <Button 
                variant="primary" 
                className="modern-button"
                onClick={handleAddCoffin}
              >
                <Plus size={14} className="me-1" /> Add First Coffin
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <Row className="g-3">
              {currentCoffins.map(renderGridItem)}
            </Row>
          ) : (
            // Table View
            <>
              <div className="table-responsive">
                <Table className="table-modern">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>ID</th>
                      <th className="d-none d-md-table-cell">Material</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCoffins.map((coffin) => {
                      const stock = coffin.quantity || 0;
                      const stockPercentage = getStockPercentage(stock);
                      const stockVariant = getStockVariant(stock);
                      
                      return (
                        <tr key={coffin.coffin_id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-light rounded me-2 d-flex align-items-center justify-content-center" 
                                   style={{width: '40px', height: '40px'}}>
                                <Package size={16} color="#64748B" />
                              </div>
                              <div>
                                <div className="fw-semibold">{coffin.type}</div>
                                <small className="text-muted d-md-none">{coffin.material}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code className="text-muted">{coffin.custom_id || `COFF-${coffin.coffin_id}`}</code>
                          </td>
                          <td className="d-none d-md-table-cell">{coffin.material}</td>
                          <td className="fw-semibold">
                            Ksh {parseInt(coffin.exact_price || 0).toLocaleString()}
                          </td>
                          <td>
                            <div>
                              <div className="d-flex justify-content-between">
                                <span>{stock}</span>
                                <small>{Math.round(stockPercentage)}%</small>
                              </div>
                              <div className="stock-bar">
                                <div 
                                  className={`stock-fill ${
                                    stockPercentage > 50 ? 'stock-high' : 
                                    stockPercentage > 20 ? 'stock-medium' : 'stock-low'
                                  }`}
                                  style={{width: `${stockPercentage}%`}}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge bg={stockVariant} className="rounded-pill">
                              {stockVariant === 'danger' ? 'Out' :
                               stockVariant === 'warning' ? 'Low' : 'In Stock'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="p-1"
                                onClick={() => handleViewDetails(coffin)}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="p-1"
                                onClick={() => handleEdit(coffin)}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="p-1"
                                onClick={() => handleDelete(coffin)}
                                disabled={stock > 0}
                                style={{ opacity: stock > 0 ? 0.5 : 1 }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top flex-wrap gap-2">
                  <div className="text-muted">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCoffins.length)} of {filteredCoffins.length}
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="light"
                      className="modern-button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <div className="d-flex align-items-center px-3 text-muted">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="light"
                      className="modern-button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modals (same as before) */}
      <Modal show={showAssignmentsModal} onHide={() => setShowAssignmentsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <UsersIcon className="me-2" />
            Recently Assigned Coffins
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {assignmentsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading assignments...</p>
            </div>
          ) : recentAssignments.length === 0 ? (
            <div className="text-center py-4">
              <Package size={48} className="mb-3 text-muted" />
              <h5>No recent assignments</h5>
            </div>
          ) : (
            <ListGroup variant="flush">
              {recentAssignments.map((assignment) => (
                <ListGroup.Item key={assignment.assignment_id}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">{assignment.deceased_name}</h6>
                      <small className="text-muted">{assignment.coffin_type} • {assignment.material}</small>
                    </div>
                    <Badge bg="primary">Assigned</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowAssignmentsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Delete <strong>{selectedCoffin?.type}</strong>? This action cannot be undone.</p>
          {selectedCoffin?.quantity > 0 && (
            <Alert variant="warning">
              Cannot delete - coffin still has stock remaining
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={selectedCoffin?.quantity > 0}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Coffin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model Type</Form.Label>
                  <Form.Control
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Material</Form.Label>
                  <Form.Control
                    value={editFormData.material}
                    onChange={(e) => setEditFormData({...editFormData, material: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    value={editFormData.exact_price}
                    onChange={(e) => setEditFormData({...editFormData, exact_price: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Coffin
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Coffin Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCoffin && (
            <>
              {renderCoffinImages(selectedCoffin)}
              <Row className="mt-3">
                <Col md={6}>
                  <p><strong>Model:</strong> {selectedCoffin.type}</p>
                  <p><strong>ID:</strong> {selectedCoffin.custom_id || `COFF-${selectedCoffin.coffin_id}`}</p>
                  <p><strong>Material:</strong> {selectedCoffin.material}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Price:</strong> Ksh {parseInt(selectedCoffin.exact_price || 0).toLocaleString()}</p>
                  <p><strong>Stock:</strong> {selectedCoffin.quantity || 0} units</p>
                  <p><strong>Supplier:</strong> {selectedCoffin.supplier || 'Not specified'}</p>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowDetailsModal(false);
            handleEdit(selectedCoffin);
          }}>
            Edit Coffin
          </Button>
        </Modal.Footer>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CoffinInventory;