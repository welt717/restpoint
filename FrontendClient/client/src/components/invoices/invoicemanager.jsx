// components/InvoiceDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { safeMap, hasData, safeNumber } from '../../utils/safeRender';
import DeceasedFinancialTable from './deceasedFainancialTable';
import DeceasedFinancialDetails from './deceasedFainancialDetails';
import InvoiceForm from './invoiceForm';
import PaymentForm from './paymentForm';
import ExtraChargeForm from './extraChargesForm';
import Swal from 'sweetalert2';
import { 
  DollarSign, FileText, CreditCard, Receipt, Users, 
  PlusCircle, Download, Eye, Info, Edit, Trash2, Filter,
  Search, Calendar, ArrowLeft, BarChart3, CheckCircle,
  AlertCircle, RefreshCw, Printer, FilePlus, TrendingUp
} from 'lucide-react';

const InvoiceManager = () => {
  const [view, setView] = useState('overview');
  const [deceasedList, setDeceasedList] = useState([]);
  const [selectedDeceased, setSelectedDeceased] = useState(null);
  const [financialDetails, setFinancialDetails] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDeceased: 0,
    totalRevenue: 0,
    totalBalance: 0,
    paidInvoices: 0,
    pendingInvoices: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sweet Alert configuration
  const showToast = (icon, title, position = 'top-end') => {
    const Toast = Swal.mixin({
      toast: true,
      position: position,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });
    
    Toast.fire({
      icon: icon,
      title: title
    });
  };

  useEffect(() => {
    loadDeceasedWithFinancials();
  }, []);

  const loadDeceasedWithFinancials = async () => {
    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.INVOICE.LIST + '/all-deceased');
      const deceasedData = response.data?.data || [];
      setDeceasedList(Array.isArray(deceasedData) ? deceasedData : []);

      const totalRevenue = deceasedData.reduce((sum, d) => sum + safeNumber(d.total_payments, 0), 0);
      const totalBalance = deceasedData.reduce((sum, d) => sum + safeNumber(d.balance, 0), 0);
      
      setStats({
        totalDeceased: deceasedData.length,
        totalRevenue,
        totalBalance,
        paidInvoices: deceasedData.filter(d => safeNumber(d.balance, 0) <= 0).length,
        pendingInvoices: deceasedData.filter(d => safeNumber(d.balance, 0) > 0).length
      });
    } catch (error) {
      console.error('Error loading deceased financials:', error);
      showToast('error', 'Error loading data: ' + (error.message || 'Unknown error'));
      // Set empty state on error to prevent crashes
      setDeceasedList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (deceased) => {
    setSelectedDeceased(deceased);
    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.INVOICE.DETAIL(deceased.id));
      setFinancialDetails(response.data?.data || null);
      setView('details');
    } catch (error) {
      console.error('Error loading financial details:', error);
      showToast('error', 'Error loading details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.INVOICE.DETAIL(invoiceId));
      setSelectedInvoice(response.data?.data || null);
      setView('view-invoice');
      showToast('info', 'Invoice loaded');
    } catch (error) {
      console.error('Error loading invoice:', error);
      showToast('error', 'Error loading invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.INVOICE.DETAIL(invoiceId));
      setSelectedInvoice(response.data?.data || null);
      setView('edit-invoice');
      showToast('info', 'Ready to edit invoice');
    } catch (error) {
      console.error('Error loading invoice for editing:', error);
      showToast('error', 'Error loading invoice: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async (invoiceData) => {
    try {
      await api.put(ENDPOINTS.INVOICE.UPDATE(invoiceData.id), invoiceData);
      showToast('success', 'Invoice updated successfully!');
      
      // Refresh the financial details if we're in details view
      if (selectedDeceased) {
        const response = await api.get(ENDPOINTS.INVOICE.DETAIL(selectedDeceased.id));
        setFinancialDetails(response.data?.data || null);
      }
      
      setView('details');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      showToast('error', 'Error updating invoice: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await api.delete(ENDPOINTS.INVOICE.DELETE(invoiceId));
        showToast('success', 'Invoice deleted successfully!');
        
        // Refresh the financial details
        if (selectedDeceased) {
          const response = await api.get(ENDPOINTS.INVOICE.DETAIL(selectedDeceased.id));
          setFinancialDetails(response.data?.data || null);
        }
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('error', 'Error deleting invoice: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreatePayment = async (paymentData) => {
    try {
      await api.post(ENDPOINTS.INVOICE.PAY(paymentData.invoiceId), paymentData);
      await loadDeceasedWithFinancials();
      if (selectedDeceased) {
        const response = await api.get(ENDPOINTS.INVOICE.DETAIL(selectedDeceased.id));
        setFinancialDetails(response.data?.data || null);
      }
      setView('details');
      showToast('success', 'Payment recorded successfully!');
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('error', 'Error recording payment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddExtraCharge = async (chargeData) => {
    try {
      await api.post(ENDPOINTS.INVOICE.CREATE, chargeData);
      await loadDeceasedWithFinancials();
      if (selectedDeceased) {
        const response = await api.get(ENDPOINTS.INVOICE.DETAIL(selectedDeceased.id));
        setFinancialDetails(response.data?.data || null);
      }
      setView('details');
      showToast('success', 'Extra charge added successfully!');
    } catch (error) {
      console.error('Error adding charge:', error);
      showToast('error', 'Error adding charge: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBackToOverview = () => {
    setView('overview');
    setSelectedDeceased(null);
    setFinancialDetails(null);
    setSelectedInvoice(null);
  };

  const handleBackToDetails = () => {
    setView('details');
    setSelectedInvoice(null);
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(ENDPOINTS.INVOICE.PDF(invoiceId), {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('error', 'Error downloading invoice: ' + (error.message || 'Unknown error'));
    }
  };

  const handleExportToExcel = async () => {
    setExportLoading(true);
    console.log('Exporting to Excel...');
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setExportLoading(false);
    showToast('success', 'Export to Excel completed');
  };

  const filteredDeceased = deceasedList.filter(deceased => {
    const matchesSearch = deceased.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deceased.id?.toString().includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'paid') return matchesSearch && parseFloat(deceased.balance || 0) <= 0;
    if (filterStatus === 'unpaid') return matchesSearch && parseFloat(deceased.balance || 0) > 0;
    
    return matchesSearch;
  });

  const InvoiceDetailView = ({ invoice, onBack, onEdit, onDownload, onDelete }) => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            transition: 'background-color 0.2s'
          }}
        >
          <ArrowLeft size={20} />
          Back to Details
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={18} />
            Download
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={exportLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#6A0572',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: exportLoading ? 'not-allowed' : 'pointer',
              opacity: exportLoading ? 0.6 : 1
            }}
          >
            {exportLoading ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            onClick={onEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Edit size={18} />
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
              INVOICE
            </h2>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>
              #{invoice.invoice_number} • {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Mortuary Services
            </h3>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>Professional Funeral Services</p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
            Bill To:
          </h4>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <p style={{ fontWeight: '500', color: '#374151', margin: 0 }}>{invoice.deceased_name}</p>
            {invoice.nok && (
              <p style={{ color: '#6b7280', marginTop: '4px' }}>Next of Kin: {invoice.nok}</p>
            )}
            {invoice.phone && (
              <p style={{ color: '#6b7280', marginTop: '4px' }}>Phone: {invoice.phone}</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Description
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Quantity
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Unit Price
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>{item.service}</td>
                  <td style={{ padding: '12px 16px' }}>{item.qty}</td>
                  <td style={{ padding: '12px 16px' }}>KES {parseFloat(item.amount).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                    KES {(item.qty * item.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderTop: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Total:</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                KES {parseFloat(invoice.total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>Notes:</h4>
            <p style={{ color: '#6b7280' }}>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0
            }}>
              <DollarSign style={{ color: '#2563eb' }} size={32} />
              Financial Management Dashboard
            </h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Manage invoices, payments, and financial records
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={loadDeceasedWithFinancials}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            
            {view === 'overview' && (
              <button
                onClick={() => setView('create-invoice')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <FilePlus size={18} />
                Create Invoice
              </button>
            )}
            
            {view === 'details' && (
              <button
                onClick={handleBackToOverview}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={18} />
                Back to Overview
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {view === 'overview' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #2563eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: 0 }}>Total Deceased</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {stats.totalDeceased}
                  </p>
                </div>
                <Users style={{ color: '#2563eb' }} size={24} />
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #059669'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: 0 }}>Total Revenue</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '4px 0 0 0' }}>
                    KES {stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign style={{ color: '#059669' }} size={24} />
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
         borderLeft: "4px solid #dc2626"

            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: 0 }}>Outstanding Balance</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '4px 0 0 0' }}>
                    KES {stats.totalBalance.toLocaleString()}
                  </p>
                </div>
                <CreditCard style={{ color: '#dc2626' }} size={24} />
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              borderLeft: "4px solid '#d97706"
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', margin: 0 }}>Paid Invoices</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '4px 0 0 0' }}>
                    {stats.paidInvoices} / {stats.totalDeceased}
                  </p>
                </div>
                <FileText style={{ color: '#d97706' }} size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        {view === 'overview' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} size={20} />
                <input
                  type="text"
                  placeholder="Search deceased by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 32px 10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="paid">Fully Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '24px',
        minHeight: '400px'
      }}>
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px' 
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={32} color="#2563eb" />
              <p style={{ color: '#6b7280' }}>Loading...</p>
            </div>
          </div>
        )}

        {!loading && view === 'overview' && (
          <div>
            {filteredDeceased.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <Users size={48} color="#d1d5db" />
                <p style={{ color: '#6b7280', marginTop: '16px' }}>No deceased records found</p>
                {searchTerm && (
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Deceased
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Total Amount
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Paid
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Balance
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeceased.map(deceased => (
                      <tr key={deceased.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '16px' }}>
                          <div>
                            <p style={{ fontWeight: '500', color: '#1f2937' }}>{deceased.full_name}</p>
                            <p style={{ fontSize: '13px', color: '#6b7280' }}>ID: {deceased.id}</p>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ fontWeight: '500' }}>KES {parseFloat(deceased.total_amount || 0).toLocaleString()}</p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ color: '#059669', fontWeight: '500' }}>
                            KES {parseFloat(deceased.total_payments || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{
                            fontWeight: '500',
                            color: parseFloat(deceased.balance || 0) > 0 ? '#dc2626' : '#059669'
                          }}>
                            KES {parseFloat(deceased.balance || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: parseFloat(deceased.balance || 0) <= 0 
                              ? '#d1fae5'
                              : '#fee2e2',
                            color: parseFloat(deceased.balance || 0) <= 0 
                              ? '#065f46'
                              : '#991b1b'
                          }}>
                            {parseFloat(deceased.balance || 0) <= 0 ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            onClick={() => handleViewDetails(deceased)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: '#dbeafe',
                              color: '#2563eb',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <Eye size={14} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && view === 'details' && financialDetails && (
          <DeceasedFinancialDetails
            financialDetails={financialDetails}
            selectedDeceased={selectedDeceased}
            onBack={handleBackToOverview}
            onCreatePayment={() => setView('create-payment')}
            onAddCharge={() => setView('add-charge')}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onDownloadInvoice={handleDownloadInvoice}
          />
        )}

        {!loading && view === 'view-invoice' && selectedInvoice && (
          <InvoiceDetailView
            invoice={selectedInvoice}
            onBack={handleBackToDetails}
            onEdit={() => handleEditInvoice(selectedInvoice.id)}
            onDownload={() => handleDownloadInvoice(selectedInvoice.id)}
            onDelete={() => handleDeleteInvoice(selectedInvoice.id)}
          />
        )}

        {!loading && view === 'edit-invoice' && selectedInvoice && (
          <InvoiceForm
            invoice={selectedInvoice}
            isEditing={true}
            onCancel={handleBackToDetails}
            onSubmit={handleUpdateInvoice}
          />
        )}

        {!loading && view === 'create-invoice' && (
          <InvoiceForm
            deceasedList={deceasedList}
            onCancel={handleBackToOverview}
            onSubmit={async (invoiceData) => {
              try {
                await api.post(ENDPOINTS.INVOICE.CREATE, invoiceData);
                await loadDeceasedWithFinancials();
                setView('overview');
                showToast('success', 'Invoice created successfully!');
              } catch (error) {
                console.error('Error creating invoice:', error);
                showToast('error', 'Error creating invoice: ' + (error.message || 'Unknown error'));
              }
            }}
          />
        )}

        {!loading && view === 'create-payment' && selectedDeceased && (
          <PaymentForm
            deceased={selectedDeceased}
            onCancel={() => setView('details')}
            onSubmit={handleCreatePayment}
          />
        )}

        {!loading && view === 'add-charge' && selectedDeceased && (
          <ExtraChargeForm
            deceased={selectedDeceased}
            onCancel={() => setView('details')}
            onSubmit={handleAddExtraCharge}
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceManager;