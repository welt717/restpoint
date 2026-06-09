import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft,
  FileText,
  User,
  Users,
  Calendar,
  MapPin,
  Phone,
  IdCard,
  Signature,
  Download,
  Print,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
} from 'lucide-react';
import styled from 'styled-components';

const API_GATEWAY_URL = 'http://localhost:8000';
const BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased`;

const Colors = {
  primary: '#1e293b',
  primaryGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  accent: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  lightGray: '#f8fafc',
  mediumGray: '#e2e8f0',
  darkGray: '#1e293b',
  textMuted: '#64748b',
  cardBg: '#ffffff',
  borderColor: '#e2e8f0',
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  background: ${Colors.lightGray};
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${Colors.accent};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${Colors.darkGray};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Card = styled.div`
  background: ${Colors.cardBg};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid ${Colors.borderColor};
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${Colors.darkGray};
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${Colors.accent}20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${Colors.darkGray};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${Colors.accent};
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
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${Colors.accent};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${Colors.accent};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${Colors.borderColor};
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  ${(props) =>
    props.variant === 'primary'
      ? `
    background: ${Colors.accent};
    color: white;
    &:hover { background: #2563eb; }
  `
      : props.variant === 'success'
      ? `
    background: ${Colors.success};
    color: white;
    &:hover { background: #059669; }
  `
      : `
    background: ${Colors.mediumGray};
    color: ${Colors.darkGray};
    &:hover { background: #cbd5e1; }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${Colors.borderColor};

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: ${Colors.textMuted};
  font-size: 0.875rem;
`;

const InfoValue = styled.span`
  font-weight: 500;
  color: ${Colors.darkGray};
  font-size: 0.95rem;
`;

const SignatureBox = styled.div`
  border: 2px dashed ${Colors.borderColor};
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  margin-top: 1rem;
  background: ${Colors.lightGray};
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(props) =>
    props.status === 'dispatched'
      ? '#dcfce7'
      : props.status === 'pending'
      ? '#fef3c7'
      : '#fee2e2'};
  color: ${(props) =>
    props.status === 'dispatched'
      ? '#166534'
      : props.status === 'pending'
      ? '#92400e'
      : '#991b1b'};
`;

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

const ReleaseFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [deceasedData, setDeceasedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    releasedTo: '',
    relationship: '',
    idNumber: '',
    phoneNumber: '',
    releaseDate: new Date().toISOString().split('T')[0],
    releaseTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    itemsReturned: '',
    notes: '',
    receivedBy: '',
    witnessName: '',
  });

  useEffect(() => {
    // Check if data was passed via navigation state
    if (location.state?.deceasedData) {
      setDeceasedData(location.state.deceasedData);
      setIsLoading(false);
    } else {
      fetchDeceasedData();
    }
  }, [id]);

  const fetchDeceasedData = async () => {
    try {
      const tenantSlug = getTenantSlug();
      if (!tenantSlug) {
        toast.error('Tenant information not found');
        setIsLoading(false);
        return;
      }

      console.log('Fetching deceased data for ID:', id, 'Tenant:', tenantSlug);
      const response = await axios.get(`${BASE_URL}/deceased-id/${id}`, {
        headers: { 'x-tenant-slug': tenantSlug },
      });
      const data = response.data?.data || response.data || {};
      console.log('Deceased data fetched:', data);
      setDeceasedData(data);
    } catch (error) {
      console.error('Error fetching deceased data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load deceased information';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.releasedTo.trim()) errors.push('Released To name is required');
    if (!formData.relationship) errors.push('Relationship to Deceased is required');
    if (!formData.idNumber.trim()) errors.push('ID Number is required');
    if (!formData.phoneNumber.trim()) errors.push('Phone Number is required');
    if (!formData.releaseDate) errors.push('Release Date is required');
    if (!formData.releaseTime) errors.push('Release Time is required');
    if (!formData.receivedBy.trim()) errors.push('Received By name is required');

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const tenantSlug = getTenantSlug();
      if (!tenantSlug) {
        toast.error('Tenant information not found');
        setIsSubmitting(false);
        return;
      }

      const releaseData = {
        ...formData,
        deceasedId: id,
        status: 'dispatched',
        releasedAt: new Date().toISOString(),
      };

      console.log('Submitting release form:', releaseData);

      const response = await axios.post(
        `${API_GATEWAY_URL}/api/v1/restpoint/dispatch/${id}`,
        releaseData,
        {
          headers: { 
            'x-tenant-slug': tenantSlug,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log('Release successful:', response.data);
      toast.success('Deceased released successfully!');
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      console.error('Error releasing deceased:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to release deceased. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('PDF download feature coming soon');
      // TODO: Implement PDF generation and download
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: Colors.textMuted }}>Loading release form...</p>
        </div>
      </Container>
    );
  }

  if (!deceasedData) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={48} color={Colors.danger} style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: Colors.darkGray, marginBottom: '0.5rem' }}>Deceased Not Found</h2>
            <p style={{ color: Colors.textMuted, marginBottom: '1.5rem' }}>Unable to load deceased information</p>
            <Button variant="primary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Go Back
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </BackButton>
        <Title>
          <FileText size={24} /> Release Form
        </Title>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" onClick={handlePrint}>
            <Print size={16} /> Print
          </Button>
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download size={16} /> Download PDF
          </Button>
        </div>
      </Header>

      <Card>
        <CardTitle><User size={18} /> Deceased Information</CardTitle>
        <Grid>
          <InfoRow>
            <InfoLabel>Full Name</InfoLabel>
            <InfoValue>{deceasedData.full_name || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Deceased ID</InfoLabel>
            <InfoValue>{deceasedData.deceased_id || id}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Date of Death</InfoLabel>
            <InfoValue>{deceasedData.date_of_death ? new Date(deceasedData.date_of_death).toLocaleDateString() : 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Gender</InfoLabel>
            <InfoValue>{deceasedData.gender || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>County</InfoLabel>
            <InfoValue>{deceasedData.county || 'N/A'}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Status</InfoLabel>
            <StatusBadge status={deceasedData.status || 'pending'}>
              {deceasedData.status || 'Pending'}
            </StatusBadge>
          </InfoRow>
        </Grid>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardTitle><Users size={18} /> Release Details</CardTitle>
          <Grid>
            <FormGroup>
              <Label><User size={14} /> Released To (Full Name) *</Label>
              <Input
                type="text"
                name="releasedTo"
                value={formData.releasedTo}
                onChange={handleInputChange}
                placeholder="Enter full name of person receiving the deceased"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label><Users size={14} /> Relationship to Deceased *</Label>
              <Select
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                required
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="other-family">Other Family</option>
                <option value="funeral-director">Funeral Director</option>
                <option value="legal-representative">Legal Representative</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label><IdCard size={14} /> ID Number *</Label>
              <Input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                placeholder="Enter ID/Passport number"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label><Phone size={14} /> Phone Number *</Label>
              <Input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label><Calendar size={14} /> Release Date *</Label>
              <Input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label><Clock size={14} /> Release Time *</Label>
              <Input
                type="time"
                name="releaseTime"
                value={formData.releaseTime}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </Grid>

          <FormGroup>
            <Label><Truck size={14} /> Items Returned</Label>
            <TextArea
              name="itemsReturned"
              value={formData.itemsReturned}
              onChange={handleInputChange}
              placeholder="List any personal effects, documents, or items being returned with the deceased..."
              rows={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>Additional Notes</Label>
            <TextArea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional notes or comments..."
              rows={3}
            />
          </FormGroup>
        </Card>

        <Card>
          <CardTitle><Signature size={18} /> Signatures</CardTitle>
          <Grid>
            <FormGroup>
              <Label>Received By (Name) *</Label>
              <Input
                type="text"
                name="receivedBy"
                value={formData.receivedBy}
                onChange={handleInputChange}
                placeholder="Name of person receiving"
                required
              />
              <SignatureBox>
                <p style={{ color: Colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  Signature will be captured digitally or on print
                </p>
              </SignatureBox>
            </FormGroup>
            <FormGroup>
              <Label>Witness Name</Label>
              <Input
                type="text"
                name="witnessName"
                value={formData.witnessName}
                onChange={handleInputChange}
                placeholder="Witness name (optional)"
              />
              <SignatureBox>
                <p style={{ color: Colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  Witness signature
                </p>
              </SignatureBox>
            </FormGroup>
          </Grid>
        </Card>

        <ButtonGroup>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> Confirm Release
              </>
            )}
          </Button>
        </ButtonGroup>
      </form>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          button { display: none !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default ReleaseFormPage;