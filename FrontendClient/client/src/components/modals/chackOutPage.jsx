// CheckoutPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import {
  ArrowLeft, DollarSign, CreditCard, Smartphone, CheckCircle,
  User, Calendar, Tag, FileText, Receipt, Truck, CheckSquare,
  XSquare, Loader2
} from 'lucide-react';

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

// Styled Components
const AppContainer = styled.div`
  min-height: 100vh;
  padding: 2rem 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: ${Colors.lightGray};
  color: ${Colors.darkGray};
  line-height: 1.6;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${Colors.accentBlue};
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 2rem;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    color: ${Colors.infoBlue};
    transform: translateX(-5px);
  }
`;

const Card = styled.div`
  background: ${Colors.cardBg};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: ${Colors.cardShadow};
  border: 1px solid ${Colors.borderColor};
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${Colors.primaryDark};
  
  svg {
    stroke-width: 2.5;
  }
`;

const PaymentForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${Colors.darkGray};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid ${Colors.mediumGray};
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: ${Colors.lightGray};
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const PaymentOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin: 0.5rem 0;
`;

const PaymentOption = styled.div`
  border: 2px solid ${props => props.selected ? Colors.accentBlue : Colors.mediumGray};
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.selected ? 'rgba(59, 130, 246, 0.05)' : 'transparent'};
  
  &:hover {
    border-color: ${Colors.accentBlue};
  }
`;

const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const OptionLabel = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${props => props.selected ? Colors.accentBlue : Colors.darkGray};
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

const STKButton = styled.button`
  padding: 1rem 1.5rem;
  background: transparent;
  color: ${Colors.successGreen};
  border: 2px solid ${Colors.successGreen};
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  
  &:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.1);
  }
  
  &:disabled {
    border-color: ${Colors.textMuted};
    color: ${Colors.textMuted};
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  
  ${props => props.success && `
    background-color: rgba(16, 185, 129, 0.1);
    color: ${Colors.successGreen};
    border: 1px solid rgba(16, 185, 129, 0.2);
  `}
  
  ${props => props.error && `
    background-color: rgba(220, 38, 38, 0.1);
    color: ${Colors.dangerRed};
    border: 1px solid rgba(220, 38, 38, 0.2);
  `}
`;

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [deceasedData, setDeceasedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checklist, setChecklist] = useState({
    documentsVerified: false,
    paymentsCleared: false,
    familyConsent: false,
    releaseAuthorized: false
  });
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    idNumber: '',
    email: '',
    amount: 0,
    paymentReference: '',
    relationship: '',
    releaseReason: ''
  });

  useEffect(() => {
    fetchDeceasedDetails();
  }, [id]);

  const fetchDeceasedDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/deceased/${id}`);
      setDeceasedData(response.data);
      
      // Set default amount
      const totalCharges = response.data.financial_details?.total_charges || 0;
      setFormData(prev => ({
        ...prev,
        amount: totalCharges
      }));
    } catch (error) {
      toast.error('Failed to fetch deceased details');
      console.error('Error fetching deceased details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChecklistChange = (item) => {
    setChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const allChecklistItemsComplete = Object.values(checklist).every(item => item);

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phoneNumber || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!allChecklistItemsComplete) {
      toast.error('Please complete all checklist items before proceeding');
      return;
    }

    setProcessing(true);
    setPaymentStatus(null);

    try {
      const paymentData = {
        deceasedId: id,
        paymentMethod,
        ...formData,
        deceasedName: `${deceasedData.first_name} ${deceasedData.last_name}`,
        checklistCompleted: checklist
      };

      const response = await axios.post('/api/payments/process', paymentData);
      
      setPaymentStatus({
        success: true,
        message: 'Payment processed successfully! Body released for dispatch.',
        transactionId: response.data.transactionId
      });
      
      toast.success('Payment completed successfully! Body has been released.');
      
      // Redirect after successful payment
      setTimeout(() => {
        navigate(`/deceased/${id}`);
      }, 3000);
      
    } catch (error) {
      setPaymentStatus({
        success: false,
        message: error.response?.data?.message || 'Payment failed. Please try again.'
      });
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSTKPush = async () => {
    if (!formData.phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setProcessing(true);
    
    try {
      const stkData = {
        deceasedId: id,
        phoneNumber: formData.phoneNumber,
        amount: formData.amount
      };

      await axios.post('/api/payments/stk-push', stkData);
      toast.success('STK Push sent to your phone. Please complete the payment.');
      
    } catch (error) {
      toast.error('Failed to send STK Push. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader2 size={32} className="animate-spin" />
          <span style={{ marginLeft: '1rem' }}>Loading checkout details...</span>
        </div>
      </AppContainer>
    );
  }

  if (!deceasedData) {
    return (
      <AppContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Deceased details not found.</p>
          <BackButton onClick={() => navigate('/deceased')}>
            <ArrowLeft size={16} />
            Back to List
          </BackButton>
        </div>
      </AppContainer>
    );
  }

  const totalCharges = deceasedData.financial_details?.total_charges || 0;
  const daysSpent = deceasedData.financial_details?.days_spent || 0;

  return (
    <AppContainer>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <BackButton onClick={() => navigate(`/deceased/${id}`)}>
          <ArrowLeft size={16} />
          Back to Deceased Details
        </BackButton>

        <h1 style={{ margin: '0 0 2rem 0', color: Colors.primaryDark, fontSize: '2rem' }}>
          Checkout & Body Release
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Column - Payment & Forms */}
          <div>
            {/* Release Checklist */}
            <Card>
              <CardTitle>
                <CheckSquare size={18} />
                Release Checklist
              </CardTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(checklist).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleChecklistChange(key)}
                      style={{
                        width: '24px',
                        height: '24px',
                        border: `2px solid ${value ? Colors.successGreen : Colors.mediumGray}`,
                        borderRadius: '4px',
                        backgroundColor: value ? Colors.successGreen : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {value && <CheckSquare size={16} color="white" />}
                    </button>
                    <span style={{ 
                      fontWeight: value ? '600' : '400',
                      color: value ? Colors.successGreen : Colors.darkGray
                    }}>
                      {key.split(/(?=[A-Z])/).join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardTitle>
                <DollarSign size={18} />
                Payment Details
              </CardTitle>

              <PaymentForm onSubmit={handlePayment}>
                <FormGroup>
                  <Label>
                    <User size={16} />
                    Full Name *
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <Smartphone size={16} />
                    Phone Number *
                  </Label>
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="07XXXXXXXX"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <User size={16} />
                    Relationship to Deceased *
                  </Label>
                  <Input
                    type="text"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    placeholder="e.g., Son, Daughter, Spouse"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FileText size={16} />
                    ID Number *
                  </Label>
                  <Input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder="Enter ID number"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <DollarSign size={16} />
                    Amount (Ksh) *
                  </Label>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FileText size={16} />
                    Release Reason *
                  </Label>
                  <textarea
                    name="releaseReason"
                    value={formData.releaseReason}
                    onChange={handleInputChange}
                    placeholder="Reason for body release..."
                    required
                    style={{
                      padding: '0.75rem 1rem',
                      border: `2px solid ${Colors.mediumGray}`,
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      backgroundColor: Colors.lightGray,
                      transition: 'all 0.3s ease',
                      resize: 'vertical',
                      minHeight: '80px',
                      fontFamily: 'inherit',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <CreditCard size={16} />
                    Payment Method *
                  </Label>
                  <PaymentOptions>
                    <PaymentOption
                      selected={paymentMethod === 'cash'}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <OptionContent>
                        <DollarSign size={24} />
                        <OptionLabel selected={paymentMethod === 'cash'}>
                          Cash
                        </OptionLabel>
                      </OptionContent>
                    </PaymentOption>

                    <PaymentOption
                      selected={paymentMethod === 'card'}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <OptionContent>
                        <CreditCard size={24} />
                        <OptionLabel selected={paymentMethod === 'card'}>
                          Card
                        </OptionLabel>
                      </OptionContent>
                    </PaymentOption>

                    <PaymentOption
                      selected={paymentMethod === 'mpesa'}
                      onClick={() => setPaymentMethod('mpesa')}
                    >
                      <OptionContent>
                        <Smartphone size={24} />
                        <OptionLabel selected={paymentMethod === 'mpesa'}>
                          M-Pesa
                        </OptionLabel>
                      </OptionContent>
                    </PaymentOption>

                    <PaymentOption
                      selected={paymentMethod === 'bank'}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <OptionContent>
                        <Receipt size={24} />
                        <OptionLabel selected={paymentMethod === 'bank'}>
                          Bank Transfer
                        </OptionLabel>
                      </OptionContent>
                    </PaymentOption>
                  </PaymentOptions>
                </FormGroup>

                {paymentMethod === 'bank' && (
                  <FormGroup>
                    <Label>Payment Reference</Label>
                    <Input
                      type="text"
                      name="paymentReference"
                      value={formData.paymentReference}
                      onChange={handleInputChange}
                      placeholder="Enter bank reference number"
                      required
                    />
                  </FormGroup>
                )}

                {paymentMethod === 'mpesa' && (
                  <STKButton
                    type="button"
                    onClick={handleSTKPush}
                    disabled={processing || !allChecklistItemsComplete}
                  >
                    <Smartphone size={16} />
                    {processing ? 'Sending...' : 'Pay with M-Pesa'}
                  </STKButton>
                )}

                <SubmitButton
                  type="submit"
                  disabled={processing || !allChecklistItemsComplete}
                  style={{ marginTop: '1.5rem' }}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%' }}></div>
                      Processing Release...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Complete Release Process
                    </>
                  )}
                </SubmitButton>
              </PaymentForm>

              {paymentStatus && (
                <StatusMessage success={paymentStatus.success} error={!paymentStatus.success}>
                  {paymentStatus.success ? <CheckCircle size={16} /> : <XSquare size={16} />}
                  {paymentStatus.message}
                </StatusMessage>
              )}
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div>
            <Card>
              <CardTitle>
                <FileText size={18} />
                Release Summary
              </CardTitle>

              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${Colors.mediumGray}` }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: Colors.primaryDark }}>
                      {deceasedData.first_name} {deceasedData.last_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: Colors.textMuted, fontSize: '0.9rem' }}>
                      <Tag size={14} />
                      {deceasedData.deceased_id}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: Colors.textMuted, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      <Calendar size={14} />
                      Admitted: {new Date(deceasedData.date_admitted).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: Colors.darkGray }}>Charges Breakdown</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Cold Room Storage ({daysSpent} days):</span>
                    <span>Ksh {(daysSpent * 800).toLocaleString()}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Embalming Services:</span>
                    <span>Ksh {deceasedData.financial_details?.embalming_charges?.toLocaleString() || '0'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Other Charges:</span>
                    <span>Ksh {deceasedData.financial_details?.other_charges?.toLocaleString() || '0'}</span>
                  </div>
                  
                  <hr style={{ margin: '1rem 0', borderColor: Colors.mediumGray }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: Colors.accentBlue }}>Ksh {totalCharges.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: Colors.lightGray, padding: '1rem', borderRadius: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: Colors.darkGray, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={16} />
                    Release Information
                  </h4>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: Colors.textMuted }}>
                    Upon successful payment and checklist completion, the body will be released for dispatch. Please ensure all documentation is in order.
                  </p>
                </div>
              </div>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardTitle>
                <FileText size={18} />
                Important Notes
              </CardTitle>
              <div style={{ padding: '1rem 0' }}>
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: Colors.textMuted }}>
                  <li>Original ID required for body release</li>
                  <li>All outstanding payments must be cleared</li>
                  <li>Release authorization must be signed</li>
                  <li>Body must be collected within 24 hours of payment</li>
                  <li>Additional documentation may be required</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </AppContainer>
  );
};

export default CheckoutPage;