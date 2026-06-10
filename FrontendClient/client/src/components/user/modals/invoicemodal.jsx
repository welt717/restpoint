import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
// The user requested to stop importing styled components and define them here
import styled, { keyframes, css } from 'styled-components'; 
import { FileText, Printer, Download, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

// =========================================================================
// 1. STYLED COMPONENTS DEFINITIONS
// =========================================================================

// Keyframes for the spinner
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Shared styles for buttons
const BaseButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
  font-size: 0.95rem;

  &:hover {
    filter: brightness(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    filter: none;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 90%;
  position: relative;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;

  svg {
    margin-right: 0.75rem;
    color: #3b82f6;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 0.5rem;
  border-radius: 50%;
  transition: color 0.2s;

  &:hover {
    color: #1e293b;
    background-color: #f1f5f9;
  }
`;

// Form/Checkbox Components
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #334155;
`;

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input`
  /* Hide the default checkbox */
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #94a3b8;
  border-radius: 0.25rem;
  margin-right: 0.75rem;
  position: relative;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;

  &:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }

  &:checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0.3rem;
    height: 0.6rem;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: translate(-50%, -60%) rotate(45deg);
  }
`;

const CheckboxLabel = styled.span`
  color: #475569;
  font-size: 0.95rem;
`;

// Button Components
const GenerateButton = styled.button`
  ${BaseButton}
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4), 0 2px 4px -2px rgba(59, 130, 246, 0.4);
  }
`;

const SubmitButton = styled.button`
  ${BaseButton}
  background-color: #e2e8f0;
  color: #475569;

  &:hover {
    background-color: #cbd5e1;
  }
`;

// Utility for animating the Lucide icon
const AnimatedLoader2 = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;


// =========================================================================
// 2. INVOICE MODAL COMPONENT
// =========================================================================

const InvoiceModal = ({ isOpen, onClose, deceasedData }) => {
  const { id } = useParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [options, setOptions] = useState({
    includeColdRoom: true,
    includeServices: true,
    includePaymentHistory: true,
    includeTaxDetails: true
  });

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const generateInvoice = async () => {
    if (!id) {
      toast.error('No deceased ID found');
      return;
    }

    setIsGenerating(true);
    setInvoiceData(null);

    try {
      const response = await fetch(`http://localhost:5000/api/v1/restpoint/invoice/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok) {
        setInvoiceData(result);
        toast.success(result.message || 'Invoice generated successfully');
      } else {
        throw new Error(result.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!invoiceData?.simulated_print) {
      toast.error('No invoice data available for printing');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${deceasedData?.full_name || 'Deceased'}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 20px;
              line-height: 1.4;
            }
            .invoice-content {
              white-space: pre-wrap;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-content">${invoiceData.simulated_print}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!invoiceData?.simulated_print) {
      toast.error('No invoice data available for download');
      return;
    }

    // Create a downloadable text file
    const blob = new Blob([invoiceData.simulated_print], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${id}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Invoice downloaded successfully');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <ModalHeader>
          <ModalTitle>
            <FileText size={24} />
            Generate Invoice
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <div style={{ padding: '1rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: '#64748B' }}>
            Generate a detailed invoice for **{deceasedData?.full_name || 'the deceased'}** including all charges, payments, and balance.
          </p>
          
          {/* Invoice Options */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '1.5rem', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              color: '#1e293b',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              Invoice Options
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="includeColdRoom"
                  checked={options.includeColdRoom}
                  onChange={() => handleOptionChange('includeColdRoom')}
                />
                <CheckboxLabel htmlFor="includeColdRoom">
                  Include cold room charges
                </CheckboxLabel>
              </CheckboxContainer>
              
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="includeServices"
                  checked={options.includeServices}
                  onChange={() => handleOptionChange('includeServices')}
                />
                <CheckboxLabel htmlFor="includeServices">
                  Include other services
                </CheckboxLabel>
              </CheckboxContainer>
              
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="includePaymentHistory"
                  checked={options.includePaymentHistory}
                  onChange={() => handleOptionChange('includePaymentHistory')}
                />
                <CheckboxLabel htmlFor="includePaymentHistory">
                  Include payment history
                </CheckboxLabel>
              </CheckboxContainer>
              
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="includeTaxDetails"
                  checked={options.includeTaxDetails}
                  onChange={() => handleOptionChange('includeTaxDetails')}
                />
                <CheckboxLabel htmlFor="includeTaxDetails">
                  Include tax details
                </CheckboxLabel>
              </CheckboxContainer>
            </div>
          </div>

          {/* Invoice Preview */}
          {invoiceData && (
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1.5rem', 
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              border: '1px solid #bae6fd'
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                color: '#0369a1',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Invoice Preview
              </h4>
              
              <div style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {invoiceData.simulated_print}
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginTop: '1rem',
                fontSize: '0.875rem'
              }}>
                <div>
                  <strong>Invoice ID:</strong> {invoiceData.invoiceId}
                </div>
                <div>
                  <strong>Total Balance:</strong> {invoiceData.preview?.balance || 0} {invoiceData.preview?.currency || 'KES'}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '2rem',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <AnimatedLoader2 size={32} color="#3b82f6" />
              <p style={{ margin: 0, color: '#64748B' }}>Generating invoice...</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {invoiceData && (
              <>
                <GenerateButton onClick={handlePrint}>
                  <Printer size={16} style={{ marginRight: '0.5rem' }} />
                  Print
                </GenerateButton>
                <GenerateButton 
                  onClick={handleDownload}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                >
                  <Download size={16} style={{ marginRight: '0.5rem' }} />
                  Download
                </GenerateButton>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <GenerateButton 
              onClick={generateInvoice} 
              disabled={isGenerating}
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              {isGenerating ? (
                <>
                  <AnimatedLoader2 size={16} style={{ marginRight: '0.5rem' }} />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={16} style={{ marginRight: '0.5rem' }} />
                  Generate Invoice
                </>
              )}
            </GenerateButton>
            
            <SubmitButton onClick={onClose}>
              Close
            </SubmitButton>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{ 
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '0.5rem',
          border: '1px solid #fcd34d',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          **Note:** The invoice will include all current charges, payments, and outstanding balance for {deceasedData?.full_name || 'the deceased'}.
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};

export default InvoiceModal;