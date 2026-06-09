// BillingSummaryPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
 import styled from 'styled-components';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
  Download,
  Printer,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const BASE_API = "http://localhost:5000/api/v1/restpoint";

const Container = styled.div`
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #6b46c1;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #6b46c1;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(107, 70, 193, 0.3);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const StatBox = styled.div`
  padding: 1.5rem;
  border-radius: 16px;
  background: ${props => props.background || '#f8fafc'};
  border: 2px solid ${props => props.borderColor || '#e5e7eb'};
`;

const StatTitle = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${props => props.color || '#1f2937'};
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f8fafc;
  }
  
  &:hover {
    background: #f1f5f9;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.background};
  color: ${props => props.color};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${props => props.variant === 'primary' ? '#6b46c1' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#6b46c1'};
  border: 2px solid ${props => props.variant === 'primary' ? '#6b46c1' : '#6b46c1'};
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(107, 70, 193, 0.3);
  }
`;

const BillingSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingSummary();
  }, [id]);

  const fetchBillingSummary = async () => {
    try {
      const response = await axios.get(`${BASE_API}/billing-summary/${id}`);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load billing summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    // Handle null, undefined, or invalid values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return currency === 'USD' ? '$0.00' : 'KES 0.00';
    }
    
    const num = parseFloat(amount);
    
    if (currency === 'USD') {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Implement export functionality
    toast.info('Export functionality coming soon');
  };

  if (loading) {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="animate-spin" style={{ color: '#6b46c1' }}>
            <Clock size={32} />
          </div>
        </div>
      </Container>
    );
  }

  if (!summary) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <AlertCircle size={48} color="#ef4444" />
          <h3>No billing data found</h3>
          <p>Unable to load billing summary for this deceased.</p>
        </div>
      </Container>
    );
  }

  const { deceased, totals, chargeHistory = [], paymentHistory = [] } = summary || {};
  const isBalanceDue = (totals?.balance || 0) > 0;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back to Settings
        </BackButton>
        <Title>Billing Summary</Title>
        <ActionButtons>
          <ActionButton onClick={handleExport}>
            <Download size={20} /> Export
          </ActionButton>
          <ActionButton variant="primary" onClick={handlePrint}>
            <Printer size={20} /> Print
          </ActionButton>
        </ActionButtons>
      </Header>

      {/* Client Summary */}
      <SummaryCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6b46c1 0%, #4c327a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.5rem'
          }}>
            {deceased?.full_name?.charAt(0) || 'C'}
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.75rem', fontWeight: '700' }}>
              {deceased?.full_name}
            </h2>
            <p style={{ margin: '0', color: '#6b7280' }}>
              Deceased ID: {deceased?.deceased_id} • {deceased?.currency} • {deceased?.rate_category}
            </p>
          </div>
        </div>

        <SummaryGrid>
          <StatBox background="#f0f9ff" borderColor="#06b6d4">
            <StatTitle>
              <DollarSign size={16} /> Total Charges
            </StatTitle>
            <StatValue color="#06b6d4">
              {formatCurrency(totals?.charges || 0, deceased?.currency || 'KES')}
            </StatValue>
          </StatBox>

          <StatBox background="#f0fdf4" borderColor="#10b981">
            <StatTitle>
              <CreditCard size={16} /> Total Payments
            </StatTitle>
            <StatValue color="#10b981">
              {formatCurrency(totals?.payments || 0, deceased?.currency || 'KES')}
            </StatValue>
          </StatBox>

          <StatBox 
            background={isBalanceDue ? "#fef2f2" : "#f0fdf4"} 
            borderColor={isBalanceDue ? "#ef4444" : "#10b981"}
          >
            <StatTitle>
              {isBalanceDue ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {isBalanceDue ? 'Balance Due' : 'Balance Paid'}
            </StatTitle>
            <StatValue color={isBalanceDue ? "#ef4444" : "#10b981"}>
              {formatCurrency(totals?.balance || 0, deceased?.currency || 'KES')}
            </StatValue>
          </StatBox>
        </SummaryGrid>
      </SummaryCard>

      {/* Charge History */}
      <HistorySection>
        <SectionTitle>
          <Calendar size={24} /> Charge History
        </SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {chargeHistory.map((charge, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(charge.charge_date)}</TableCell>
                <TableCell>
                  <StatusBadge 
                    background={charge.charge_type === 'daily' ? '#dbeafe' : '#f3e8ff'} 
                    color={charge.charge_type === 'daily' ? '#1d4ed8' : '#7c3aed'}
                  >
                    {charge.charge_type}
                  </StatusBadge>
                </TableCell>
                <TableCell>{charge.description}</TableCell>
                <TableCell style={{ fontWeight: '600' }}>
                  {formatCurrency(charge.amount, charge.currency)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </HistorySection>

      {/* Payment History */}
      <HistorySection>
        <SectionTitle>
          <FileText size={24} /> Payment History
        </SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Method</TableHeaderCell>
              <TableHeaderCell>Reference</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {paymentHistory.map((payment, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell>
                  <StatusBadge background="#f0fdf4" color="#059669">
                    {payment.payment_method || 'N/A'}
                  </StatusBadge>
                </TableCell>
                <TableCell>{payment.reference || 'N/A'}</TableCell>
                <TableCell style={{ fontWeight: '600', color: '#10b981' }}>
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </HistorySection>
    </Container>
  );
};

export default BillingSummaryPage;