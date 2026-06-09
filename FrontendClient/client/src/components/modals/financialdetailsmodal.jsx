import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  DollarSign,
  CalendarDays,
  Box,
  Receipt,
  CreditCard,
  Scale,
  Printer,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Wallet,
  Package,
  Truck,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Colors
const Colors = {
  primaryBlue: "#3B82F6",
  primaryDark: "#1E293B",
  lightGray: "#F8FAFC",
  mediumGray: "#E2E8F0",
  darkGray: "#334155",
  textMuted: "#64748B",
  successGreen: "#10B981",
  dangerRed: "#EF4444",
  warningYellow: "#F59E0B",
  infoBlue: "#0EA5E9",
  cardBg: "#FFFFFF",
  cardShadow: "0 4px 16px rgba(0,0,0,0.08)",
  borderColor: "#CBD5E1",
};

// Get tenant slug
const getTenantSlug = () => {
  return localStorage.getItem("tenantSlug") || 
         localStorage.getItem("tenant_slug") ||
         (() => {
           try {
             const user = JSON.parse(localStorage.getItem("user") || "{}");
             return user.tenantSlug || user.tenant?.slug || "default";
           } catch {
             return "default";
           }
         })();
};

// API Client
const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1/restpoint/deceased",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    const tenantSlug = getTenantSlug();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (tenantSlug && tenantSlug !== "default") config.headers["x-tenant-slug"] = tenantSlug;
    return config;
  },
  (error) => Promise.reject(error)
);

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: ${Colors.cardBg};
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 750px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${Colors.cardShadow};
  border: 1px solid ${Colors.borderColor};
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${Colors.mediumGray};
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-weight: 700;
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  border: none;
  background: ${Colors.lightGray};
  color: ${Colors.darkGray};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${Colors.mediumGray};
    color: ${Colors.primaryDark};
  }
`;

const FinancialGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FinancialCard = styled.div`
  background: ${Colors.lightGray};
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid ${Colors.borderColor};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const CardTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Colors.textMuted};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const CardValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
`;

const CardSubtitle = styled.div`
  font-size: 0.75rem;
  color: ${Colors.textMuted};
  margin-top: 0.25rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${Colors.mediumGray};

  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: ${Colors.textMuted};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const DetailValue = styled.div`
  color: ${Colors.darkGray};
  font-weight: 600;
  font-size: 0.95rem;
`;

const BalanceStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: ${(props) => props.overdue ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)"};
  border: 1px solid ${(props) => props.overdue ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"};
  margin: 1rem 0;
`;

const StatusText = styled.div`
  color: ${(props) => props.overdue ? Colors.dangerRed : Colors.successGreen};
  font-weight: 600;
  font-size: 0.95rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, ${Colors.primaryBlue} 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
`;

const SecondaryButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  background: ${Colors.lightGray};
  border: 1px solid ${Colors.mediumGray};
  border-radius: 0.75rem;
  color: ${Colors.darkGray};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${Colors.mediumGray};
    transform: translateY(-2px);
  }
`;

const SuccessButton = styled.button`
  flex: 1;
  padding: 1rem 1.5rem;
  background: ${Colors.successGreen};
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #059669;
    transform: translateY(-2px);
  }
`;

const SummarySection = styled.div`
  background: linear-gradient(135deg, ${Colors.primaryDark} 0%, #2c3e50 100%);
  border-radius: 0.75rem;
  padding: 1.5rem;
  color: white;
  margin: 1.5rem 0;
`;

const SummaryTitle = styled.h4`
  color: white;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const SummaryLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
`;

const ChargeItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: ${Colors.lightGray};
  }
`;

const ChargeItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const ChargeIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.bg || Colors.lightGray};
  color: ${(props) => props.color || Colors.darkGray};
`;

const ChargeItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const ChargeItemTitle = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Colors.primaryDark};
`;

const ChargeItemMeta = styled.span`
  font-size: 0.7rem;
  color: ${Colors.textMuted};
`;

const ChargeItemAmount = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
  text-align: right;
`;

const PaymentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
  background: #f0fdf4;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: ${Colors.primaryDark};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${Colors.mediumGray};
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid ${Colors.mediumGray};
  margin-bottom: 1rem;
`;

const Tab = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.active ? Colors.primaryBlue : Colors.textMuted};
  border-bottom: 2px solid ${(props) => props.active ? Colors.primaryBlue : "transparent"};
  transition: all 0.2s;
  
  &:hover {
    color: ${Colors.primaryBlue};
  }
`;

// Payment Modal
const PaymentModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
`;

const PaymentContainer = styled.div`
  background: ${Colors.cardBg};
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${Colors.darkGray};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: ${Colors.primaryBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${Colors.primaryBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const spin = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

// MAIN COMPONENT
const FinancialDetailsModal = ({ isOpen, onClose, deceasedData, deceasedId, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [charges, setCharges] = useState([]);
  const [payments, setPayments] = useState([]);
  const [financialData, setFinancialData] = useState({
    totalCharges: 0,
    daysSpent: 0,
    coldRoomCharges: 0,
    otherCharges: 0,
    coffinCharges: 0,
    payments: 0,
    balance: 0,
    currency: "KES"
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && deceasedId) {
      loadFinancialData();
    } else if (isOpen && deceasedData) {
      // Fallback to deceasedData if no deceasedId
      const financialDetails = deceasedData.financial_details || {};
      const daysInMortuary = deceasedData.days_in_mortuary || 0;
      setFinancialData({
        totalCharges: deceasedData.total_mortuary_charge || financialDetails.total_charges || 0,
        daysSpent: daysInMortuary,
        coldRoomCharges: financialDetails.cold_room_charges || 0,
        otherCharges: financialDetails.other_charges || 0,
        coffinCharges: financialDetails.coffin_charges || 0,
        payments: financialDetails.total_payments || 0,
        balance: deceasedData.total_mortuary_charge || 0,
        currency: financialDetails.currency || "KES"
      });
    }
  }, [isOpen, deceasedData, deceasedId]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/billing-summary/${deceasedId}`);
      if (response.data.success) {
        const data = response.data.data;
        setCharges(data.charges || []);
        setPayments(data.payments || []);
        setFinancialData({
          totalCharges: data.total_charges || 0,
          daysSpent: data.days_in_mortuary || 0,
          coldRoomCharges: data.cold_room_charges || 0,
          otherCharges: data.other_charges || 0,
          coffinCharges: data.coffin_charges || 0,
          payments: data.total_payments || 0,
          balance: data.balance || 0,
          currency: data.currency || "KES"
        });
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isBalanceOverdue = financialData.balance > 0;
  const paymentPercentage = financialData.totalCharges > 0 
    ? (financialData.payments / financialData.totalCharges) * 100 
    : 0;

  const getChargeIcon = (type) => {
    switch (type) {
      case "mortuary": return <Clock size={16} />;
      case "coffin": return <Package size={16} />;
      case "dispatch": return <Truck size={16} />;
      case "document": return <FileText size={16} />;
      case "extra": return <Receipt size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  const getChargeIconColor = (type) => {
    switch (type) {
      case "mortuary": return { bg: "#dbeafe", color: "#1e40af" };
      case "coffin": return { bg: "#dcfce7", color: "#166534" };
      case "dispatch": return { bg: "#fef3c7", color: "#92400e" };
      case "document": return { bg: "#e0e7ff", color: "#3730a3" };
      case "extra": return { bg: "#fce7f3", color: "#9d174d" };
      default: return { bg: Colors.lightGray, color: Colors.darkGray };
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await apiClient.post(`/payments/${deceasedId}`, {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes,
        currency: financialData.currency,
      });

      if (response.data.success) {
        toast.success("Payment recorded successfully!");
        setShowPaymentModal(false);
        setPaymentAmount("");
        setPaymentReference("");
        setPaymentNotes("");
        loadFinancialData();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <DollarSign size={28} />
            Financial Overview
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        {/* Tabs */}
        <Tabs>
          <Tab active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            Overview
          </Tab>
          <Tab active={activeTab === "charges"} onClick={() => setActiveTab("charges")}>
            Charges ({charges.length})
          </Tab>
          <Tab active={activeTab === "payments"} onClick={() => setActiveTab("payments")}>
            Payments ({payments.length})
          </Tab>
        </Tabs>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Summary Cards */}
            <FinancialGrid>
              <FinancialCard>
                <CardTitle>
                  <TrendingUp size={16} />
                  TOTAL CHARGES
                </CardTitle>
                <CardValue>
                  {financialData.currency} {financialData.totalCharges.toLocaleString()}
                </CardValue>
                <CardSubtitle>All accumulated charges</CardSubtitle>
              </FinancialCard>

              <FinancialCard>
                <CardTitle>
                  <CreditCard size={16} />
                  PAYMENTS MADE
                </CardTitle>
                <CardValue>
                  {financialData.currency} {financialData.payments.toLocaleString()}
                </CardValue>
                <CardSubtitle>
                  {paymentPercentage.toFixed(1)}% of total
                </CardSubtitle>
              </FinancialCard>
            </FinancialGrid>

            {/* Balance Status */}
            <BalanceStatus overdue={isBalanceOverdue}>
              {isBalanceOverdue ? (
                <AlertTriangle size={20} color={Colors.dangerRed} />
              ) : (
                <CheckCircle size={20} color={Colors.successGreen} />
              )}
              <StatusText overdue={isBalanceOverdue}>
                {isBalanceOverdue ? "OUTSTANDING BALANCE" : "FULLY PAID"}
              </StatusText>
              <div style={{ marginLeft: "auto", fontWeight: "700" }}>
                {financialData.currency} {Math.abs(financialData.balance).toLocaleString()}
              </div>
            </BalanceStatus>

            {/* Detailed Breakdown */}
            <Section>
              <SectionTitle>
                <Receipt size={16} />
                Charge Breakdown
              </SectionTitle>
              
              <DetailItem>
                <DetailLabel>
                  <CalendarDays size={16} />
                  Days in Mortuary
                </DetailLabel>
                <DetailValue>{financialData.daysSpent} days</DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>
                  <Clock size={16} />
                  Cold Room Charges
                </DetailLabel>
                <DetailValue>
                  {financialData.currency} {financialData.coldRoomCharges.toLocaleString()}
                </DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>
                  <Package size={16} />
                  Coffin Charges
                </DetailLabel>
                <DetailValue>
                  {financialData.currency} {financialData.coffinCharges.toLocaleString()}
                </DetailValue>
              </DetailItem>

              <DetailItem>
                <DetailLabel>
                  <Receipt size={16} />
                  Other Charges
                </DetailLabel>
                <DetailValue>
                  {financialData.currency} {financialData.otherCharges.toLocaleString()}
                </DetailValue>
              </DetailItem>
            </Section>

            {/* Financial Summary */}
            <SummarySection>
              <SummaryTitle>
                <Scale size={20} />
                Financial Summary
              </SummaryTitle>
              <SummaryGrid>
                <SummaryItem>
                  <SummaryValue>
                    {financialData.currency} {financialData.totalCharges.toLocaleString()}
                  </SummaryValue>
                  <SummaryLabel>Total Charges</SummaryLabel>
                </SummaryItem>
                <SummaryItem>
                  <SummaryValue>
                    {financialData.currency} {financialData.payments.toLocaleString()}
                  </SummaryValue>
                  <SummaryLabel>Paid Amount</SummaryLabel>
                </SummaryItem>
              </SummaryGrid>
            </SummarySection>

            {/* Action Buttons */}
            <ActionButtons>
              <SuccessButton onClick={() => setShowPaymentModal(true)}>
                <Plus size={18} />
                Record Payment
              </SuccessButton>
              <PrimaryButton onClick={() => window.print()}>
                <Printer size={18} />
                Print Invoice
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>
                Close Overview
              </SecondaryButton>
            </ActionButtons>
          </>
        )}

        {/* Charges Tab */}
        {activeTab === "charges" && (
          <Section>
            <SectionTitle>
              <Receipt size={16} />
              All Charges
            </SectionTitle>
            
            {charges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: Colors.textMuted }}>
                No charges recorded yet
              </div>
            ) : (
              <div style={{ border: "1px solid " + Colors.borderColor, borderRadius: "0.5rem", overflow: "hidden" }}>
                {charges.map((charge, index) => (
                  <ChargeItem key={index}>
                    <ChargeItemInfo>
                      <ChargeIcon {...getChargeIconColor(charge.type)}>
                        {getChargeIcon(charge.type)}
                      </ChargeIcon>
                      <ChargeItemDetails>
                        <ChargeItemTitle>{charge.description || charge.type}</ChargeItemTitle>
                        <ChargeItemMeta>
                          {charge.date ? new Date(charge.date).toLocaleDateString() : "N/A"}
                          {charge.rate && ` • ${charge.rate} ${financialData.currency}/${charge.unit || "day"}`}
                          {charge.days && ` • ${charge.days} days`}
                        </ChargeItemMeta>
                      </ChargeItemDetails>
                    </ChargeItemInfo>
                    <ChargeItemAmount>{parseFloat(charge.amount || 0).toLocaleString()} {financialData.currency}</ChargeItemAmount>
                  </ChargeItem>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Section>
            <SectionTitle>
              <CreditCard size={16} />
              Payment History
            </SectionTitle>
            
            {payments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: Colors.textMuted }}>
                No payments recorded yet
              </div>
            ) : (
              <div style={{ border: "1px solid " + Colors.borderColor, borderRadius: "0.5rem", overflow: "hidden" }}>
                {payments.map((payment, index) => (
                  <PaymentItem key={index}>
                    <ChargeItemInfo>
                      <ChargeIcon bg="#dcfce7" color="#166534">
                        <Wallet size={16} />
                      </ChargeIcon>
                      <ChargeItemDetails>
                        <ChargeItemTitle>
                          {payment.method ? payment.method.toUpperCase() : "Payment"}
                          {payment.reference && ` - ${payment.reference}`}
                        </ChargeItemTitle>
                        <ChargeItemMeta>
                          {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
                          {payment.notes && ` • ${payment.notes}`}
                        </ChargeItemMeta>
                      </ChargeItemDetails>
                    </ChargeItemInfo>
                    <ChargeItemAmount style={{ color: Colors.successGreen }}>
                      +{parseFloat(payment.amount || 0).toLocaleString()} {financialData.currency}
                    </ChargeItemAmount>
                  </PaymentItem>
                ))}
              </div>
            )}
            
            <SuccessButton onClick={() => setShowPaymentModal(true)} style={{ marginTop: "1rem" }}>
              <Plus size={16} /> Record New Payment
            </SuccessButton>
          </Section>
        )}

        {/* Additional Info */}
        <div style={{ 
          marginTop: "1rem", 
          padding: "1rem", 
          backgroundColor: Colors.lightGray, 
          borderRadius: "0.5rem",
          fontSize: "0.8rem",
          color: Colors.textMuted,
          textAlign: "center"
        }}>
          <strong>Note:</strong> Financial data is updated in real-time. Last updated: {new Date().toLocaleDateString()}
        </div>
      </ModalContent>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal>
          <PaymentContainer>
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Wallet size={20} /> Record Payment
            </h3>
            
            <FormGroup>
              <Label>Amount ({financialData.currency}) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="100"
                autoFocus
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>Reference Number</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., M-Pesa transaction code"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Notes</Label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </FormGroup>
            
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <SecondaryButton onClick={() => setShowPaymentModal(false)} style={{ flex: 1 }}>
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handlePaymentSubmit} disabled={isProcessingPayment} style={{ flex: 1 }}>
                {isProcessingPayment ? (
                  <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Processing...</>
                ) : (
                  <><CheckCircle size={16} /> Confirm</>
                )}
              </PrimaryButton>
            </div>
            <style>{spin}</style>
          </PaymentContainer>
        </PaymentModal>
      )}
    </ModalOverlay>
  );
};

export default FinancialDetailsModal;