import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Download, User, FileText, CheckCircle, Search, Eye, List, Edit, Trash2, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import SignaturePad from 'react-signature-pad-wrapper';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

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
  borderColor: '#CBD5E1'
};

const Container = styled.div`
  min-height: 100vh;
  padding: 0.5rem;
  background: ${Colors.lightGray};
  font-family: 'Inter', sans-serif;
  
  @media (max-width: 768px) {
    padding: 0.25rem;
  }
`;

const Card = styled.div`
  background: ${Colors.cardBg};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: ${Colors.cardShadow};
  margin-bottom: 1rem;
  border: 1px solid ${Colors.borderColor};
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 0.75rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  color: ${Colors.primaryDark};
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${Colors.textMuted};
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 600;
  color: ${Colors.primaryDark};
  font-size: 0.85rem;
`;

const Button = styled.button`
  background: ${props => props.variant === 'secondary' ? 'transparent' : Colors.accentBlue};
  color: ${props => props.variant === 'secondary' ? Colors.accentBlue : 'white'};
  border: ${props => props.variant === 'secondary' ? `1px solid ${Colors.accentBlue}` : 'none'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'secondary' ? Colors.accentBlue : '#2563EB'};
    color: white;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SignatureBox = styled.div`
  border: 1px dashed ${Colors.borderColor};
  border-radius: 0.5rem;
  height: 150px;
  background: ${Colors.lightGray};
  position: relative;
  margin: 0.75rem 0;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${Colors.accentBlue};
  }
  
  canvas {
    width: 100%;
    height: 100%;
    border-radius: 0.5rem;
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const TopActionBar = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  color: ${Colors.primaryDark};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const SignatureActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const ClearButton = styled.button`
  background: transparent;
  border: 1px solid ${Colors.dangerRed};
  color: ${Colors.dangerRed};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  
  &:hover {
    background: ${Colors.dangerRed};
    color: white;
  }
`;

const SaveButton = styled.button`
  background: ${Colors.successGreen};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  
  &:hover:not(:disabled) {
    background: #059669;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: ${Colors.lightGray};
  border-radius: 0.5rem;
  border: 1px solid ${Colors.borderColor};
  
  input[type="checkbox"] {
    transform: scale(1.1);
    margin-top: 0.25rem;
  }
  
  span {
    font-weight: 600;
    color: ${Colors.primaryDark};
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const ViewFormsButton = styled.button`
  background: ${Colors.successGreen};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const SearchBar = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid ${Colors.borderColor};
    border-radius: 0.5rem;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: ${Colors.accentBlue};
    }
  }
`;

const FormsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${Colors.borderColor};
  }
  
  th {
    background: ${Colors.lightGray};
    font-weight: 600;
    color: ${Colors.primaryDark};
    font-size: 0.85rem;
  }
  
  td {
    font-size: 0.85rem;
    color: ${Colors.darkGray};
  }
  
  tr:hover {
    background: ${Colors.lightGray};
  }
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.variant === 'danger' ? Colors.dangerRed : Colors.accentBlue};
  color: ${props => props.variant === 'danger' ? Colors.dangerRed : Colors.accentBlue};
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? Colors.dangerRed : Colors.accentBlue};
    color: white;
  }
`;

const PDFViewer = styled.iframe`
  width: 100%;
  height: 600px;
  border: 1px solid ${Colors.borderColor};
  border-radius: 0.5rem;
`;

const ReleaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sigPad = useRef(null);

  const [form, setForm] = useState({
    deceasedName: '',
    recipientName: '',
    recipientRelation: '',
    recipientPhone: '',
    recipientId: '',
    paymentConfirmed: false,
    liabilityAccepted: false
  });

  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [releaseForms, setReleaseForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingForm, setEditingForm] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load signature from localStorage on component mount
  useEffect(() => {
    const savedSignature = localStorage.getItem('releaseForm_signature');
    if (savedSignature) {
      setSignature(savedSignature);
    }
  }, []);

  // Initialize signature pad after component mounts
  useEffect(() => {
    if (sigPad.current && signature) {
      const img = new Image();
      img.src = signature;
      img.onload = () => {
        const ctx = sigPad.current._canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, sigPad.current._canvas.width, sigPad.current._canvas.height);
      };
    }
  }, [signature]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSignature = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      try {
        const signatureData = sigPad.current.toDataURL();
        setSignature(signatureData);
        localStorage.setItem('releaseForm_signature', signatureData);
        toast.success('Signature saved successfully');
      } catch (error) {
        console.error('Error saving signature:', error);
        toast.error('Failed to save signature');
      }
    } else {
      toast.error('Please provide your signature first');
    }
  };

  const clearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setSignature(null);
      localStorage.removeItem('releaseForm_signature');
    }
  };

  const generatePDF = async () => {
    if (!signature) {
      toast.error('Please provide your signature');
      return;
    }

    if (!form.paymentConfirmed) {
      toast.error('Please confirm payment');
      return;
    }

    if (!form.liabilityAccepted) {
      toast.error('Please accept the liability declaration');
      return;
    }

    if (!form.deceasedName || !form.recipientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deceasedName: form.deceasedName,
        recipientName: form.recipientName,
        recipientRelation: form.recipientRelation,
        recipientPhone: form.recipientPhone,
        recipientId: form.recipientId,
        recipientSignature: signature,
        liabilityAccepted: form.liabilityAccepted,
        releaseDate: new Date().toLocaleDateString(),
        releaseTime: new Date().toLocaleTimeString()
      };

      const response = await axios.post(
        'http://localhost:5000/api/v1/restpoint/generate-pdf',
        payload,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `release-form-${form.deceasedName.replace(/\s+/g, '-') || 'deceased'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Release form generated successfully!');
      localStorage.removeItem('releaseForm_signature');
      
      // Reset form
      setForm({
        deceasedName: '',
        recipientName: '',
        recipientRelation: '',
        recipientPhone: '',
        recipientId: '',
        paymentConfirmed: false,
        liabilityAccepted: false
      });
      clearSignature();
      
    } catch (error) {
      toast.error('Failed to generate release form');
      console.error('PDF Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReleaseForms = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/v1/restpoint/release-forms',
        {
          params: { 
            search: searchTerm, 
            limit: 20,
            deceasedId: id // Send deceased ID when loading forms
          }
        }
      );
      
      if (response.data.success) {
        setReleaseForms(response.data.data.forms);
      }
    } catch (error) {
      toast.error('Failed to load release forms');
      console.error('Load Forms Error:', error);
    }
  };

  const viewPDF = (formId) => {
    setViewingPdf(formId);
  };

  const downloadPDF = async (formId, deceasedName, documentId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/restpoint/release-forms/${formId}/download`,
        {
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `release_${deceasedName.replace(/\s+/g, '_')}_${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF');
      console.error('Download Error:', error);
    }
  };

  const editForm = async (formData) => {
    setEditingForm(formData);
    setForm({
      deceasedName: formData.deceased_name,
      recipientName: formData.recipient_name,
      recipientRelation: formData.recipient_relation || '',
      recipientPhone: formData.recipient_phone || '',
      recipientId: formData.recipient_id || '',
      paymentConfirmed: true,
      liabilityAccepted: formData.liability_accepted
    });
    if (formData.recipient_signature) {
      setSignature(formData.recipient_signature);
    }
    setShowForms(false);
  };

  const updateFormData = async () => {
    if (!signature) {
      toast.error('Please provide your signature');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deceasedName: form.deceasedName,
        recipientName: form.recipientName,
        recipientRelation: form.recipientRelation,
        recipientPhone: form.recipientPhone,
        recipientId: form.recipientId,
        recipientSignature: signature,
        liabilityAccepted: form.liabilityAccepted
      };

      await axios.put(
        `http://localhost:5000/api/v1/restpoint/release-forms/${editingForm.id}`,
        payload
      );

      toast.success('Release form updated successfully!');
      setEditingForm(null);
      resetForm();
      
    } catch (error) {
      toast.error('Failed to update release form');
      console.error('Update Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/v1/restpoint/release-forms/${formId}`
      );

      toast.success('Release form deleted successfully!');
      setDeleteConfirm(null);
      loadReleaseForms();
      
    } catch (error) {
      toast.error('Failed to delete release form');
      console.error('Delete Error:', error);
    }
  };

  const resetForm = () => {
    setForm({
      deceasedName: '',
      recipientName: '',
      recipientRelation: '',
      recipientPhone: '',
      recipientId: '',
      paymentConfirmed: false,
      liabilityAccepted: false
    });
    clearSignature();
    setEditingForm(null);
  };

  useEffect(() => {
    if (showForms) {
      loadReleaseForms();
    }
  }, [showForms, searchTerm]);

  const isFormValid = signature && form.paymentConfirmed && form.liabilityAccepted && form.deceasedName && form.recipientName;

  return (
    <Container>
      <ToastContainer 
        position="top-right"
        toastStyle={{
          fontSize: '0.85rem',
          padding: '0.75rem'
        }}
      />
      
      <Card>
        <Header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'left' }}>
              <Title>
                {editingForm ? 'Edit Release Form' : 'Body Release Authorization'}
              </Title>
              <Subtitle>
                {editingForm ? 'Update the release form details' : 'Complete the form to authorize body release'}
              </Subtitle>
            </div>
            
            {!editingForm && (
              <ViewFormsButton onClick={() => setShowForms(true)}>
                <List size={16} />
                View Generated Forms
              </ViewFormsButton>
            )}
          </div>
        </Header>
      </Card>

      <Card>
        <SectionTitle>
          <User size={20} />
          Essential Information
        </SectionTitle>
        <FormGrid>
          <div>
            <Label>Deceased Full Name *</Label>
            <Input 
              value={form.deceasedName}
              onChange={(e) => updateForm('deceasedName', e.target.value)}
              placeholder="Enter deceased full name"
              required
            />
          </div>
          <div>
            <Label>Recipient Full Name *</Label>
            <Input 
              value={form.recipientName}
              onChange={(e) => updateForm('recipientName', e.target.value)}
              placeholder="Person collecting the body"
              required
            />
          </div>
          <div>
            <Label>Relationship to Deceased</Label>
            <Input 
              value={form.recipientRelation}
              onChange={(e) => updateForm('recipientRelation', e.target.value)}
              placeholder="Next of kin, family member, etc."
            />
          </div>
          <div>
            <Label>Recipient Phone Number</Label>
            <Input 
              type="tel"
              value={form.recipientPhone}
              onChange={(e) => updateForm('recipientPhone', e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div>
            <Label>ID Number</Label>
            <Input 
              value={form.recipientId}
              onChange={(e) => updateForm('recipientId', e.target.value)}
              placeholder="National ID or Passport"
            />
          </div>
        </FormGrid>
      </Card>

      <Card>
        <SectionTitle>
          <FileText size={20} />
          Payment Confirmation
        </SectionTitle>
        <CheckboxContainer>
          <input
            type="checkbox"
            checked={form.paymentConfirmed}
            onChange={(e) => updateForm('paymentConfirmed', e.target.checked)}
          />
          <span>
            I confirm that all funeral services have been paid in full for {form.deceasedName || 'the deceased'}
          </span>
        </CheckboxContainer>
      </Card>

      <Card>
        <SectionTitle>Recipient Authorization Signature</SectionTitle>
        <p style={{ color: Colors.textMuted, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          Sign below to authorize the release of the body
        </p>
        
        <SignatureBox>
          <SignaturePad
            ref={sigPad}
            options={{ 
              penColor: Colors.primaryDark,
              minWidth: 1,
              maxWidth: 2,
              velocityFilterWeight: 0.7,
              backgroundColor: Colors.lightGray
            }}
          />
        </SignatureBox>

        <SignatureActions>
          <ClearButton onClick={clearSignature}>
            Clear Signature
          </ClearButton>
          <SaveButton onClick={saveSignature} disabled={!sigPad.current || sigPad.current.isEmpty()}>
            <CheckCircle size={14} />
            Save Signature
          </SaveButton>
        </SignatureActions>

        {signature && (
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.75rem', 
            background: '#F0FDF4', 
            borderRadius: '0.375rem', 
            border: `1px solid ${Colors.successGreen}`,
            fontSize: '0.85rem'
          }}>
            <p style={{ 
              margin: 0, 
              color: Colors.successGreen, 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <CheckCircle size={14} />
              Signature saved successfully
            </p>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Liability Declaration</SectionTitle>
        <CheckboxContainer>
          <input
            type="checkbox"
            checked={form.liabilityAccepted}
            onChange={(e) => updateForm('liabilityAccepted', e.target.checked)}
          />
          <span>
            I authorize the release and removal of the remains of {form.deceasedName || 'the deceased'} to the authorized recipient. 
            I confirm that I am the next of kin or an authorized representative and have 
            the legal authority to sign this form and make all related decisions.
          </span>
        </CheckboxContainer>
      </Card>

      <ActionBar>
        <Button variant="secondary" onClick={() => editingForm ? resetForm() : navigate(-1)}>
          <ArrowLeft size={16} />
          {editingForm ? 'Cancel Edit' : 'Go Back'}
        </Button>
        
        <Button 
          onClick={editingForm ? updateFormData : generatePDF} 
          disabled={loading || !isFormValid}
        >
          {loading ? (
            'Processing...'
          ) : editingForm ? (
            <>
              <CheckCircle size={16} />
              Update Release Form
            </>
          ) : (
            <>
              <Download size={16} />
              Generate Release Form
            </>
          )}
        </Button>
      </ActionBar>

      {/* Modal for viewing forms */}
      {showForms && (
        <ModalOverlay onClick={() => setShowForms(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: Colors.primaryDark }}>Generated Release Forms</h3>
              <Button variant="secondary" onClick={() => setShowForms(false)}>
                <X size={16} />
                Close
              </Button>
            </div>

            <SearchBar>
              <Search size={20} color={Colors.textMuted} />
              <input
                type="text"
                placeholder="Search by name or document ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchBar>

            {releaseForms.length > 0 ? (
              <FormsTable>
                <thead>
                  <tr>
                    <th>Document ID</th>
                    <th>Deceased Name</th>
                    <th>Recipient Name</th>
                    <th>Relationship</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releaseForms.map((form) => (
                    <tr key={form.id}>
                      <td>{form.document_id}</td>
                      <td>{form.deceased_name}</td>
                      <td>{form.recipient_name}</td>
                      <td>{form.recipient_relation || 'N/A'}</td>
                      <td>{new Date(form.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <ActionButton onClick={() => viewPDF(form.id)}>
                            <Eye size={14} />
                            View
                          </ActionButton>
                          <ActionButton onClick={() => downloadPDF(form.id, form.deceased_name, form.document_id)}>
                            <Download size={14} />
                            PDF
                          </ActionButton>
                          <ActionButton onClick={() => editForm(form)}>
                            <Edit size={14} />
                            Edit
                          </ActionButton>
                          <ActionButton variant="danger" onClick={() => setDeleteConfirm(form.id)}>
                            <Trash2 size={14} />
                            Delete
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </FormsTable>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: Colors.textMuted }}>
                No release forms found
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <ModalOverlay onClick={() => setViewingPdf(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: Colors.primaryDark }}>PDF Document</h3>
              <Button variant="secondary" onClick={() => setViewingPdf(null)}>
                <X size={16} />
                Close
              </Button>
            </div>
            <PDFViewer 
              src={`http://localhost:8009/api/v1/restpoint/release-forms/${viewingPdf}/view`}
              title="Release Form PDF"
            />
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ModalOverlay onClick={() => setDeleteConfirm(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: Colors.dangerRed, marginBottom: '1rem' }}>Confirm Deletion</h3>
              <p style={{ color: Colors.textMuted, marginBottom: '2rem' }}>
                Are you sure you want to delete this release form? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <ActionButton variant="danger" onClick={() => deleteForm(deleteConfirm)}>
                  <Trash2 size={14} />
                  Delete
                </ActionButton>
              </div>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default ReleaseForm;