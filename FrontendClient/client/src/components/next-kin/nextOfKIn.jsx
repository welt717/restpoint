import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Users, SquareUser, Handshake, Phone, PlusCircle, Trash2, X, Loader2, Mail, Edit3, UserPlus } from 'lucide-react';
import { useParams } from 'react-router-dom';

// Sleek Color Palette
const Colors = {
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    borderColor: '#E5E7EB',
    shadow: '0 1px 3px rgba(0,0,0,0.05)',
    shadowHover: '0 4px 6px rgba(0,0,0,0.07)',
    
    accentBlue: '#3B82F6',
    accentBlueLight: '#EFF6FF',
    
    dangerRed: '#EF4444',
    dangerRedLight: '#FEF2F2',
    
    successGreen: '#10B981',
    successGreenLight: '#F0FDF4',
    
    editPurple: '#8B5CF6',
    editPurpleLight: '#F5F3FF'
};

// --- Styled Components ---

const Container = styled.div`
    background: ${Colors.cardBg};
    border-radius: 8px;
    padding: 1.25rem;
    border: 1px solid ${Colors.borderColor};
    box-shadow: ${Colors.shadow};
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid ${Colors.borderColor};
`;

const Title = styled.h3`
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: ${Colors.textPrimary};
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const Counter = styled.span`
    background: ${Colors.accentBlueLight};
    color: ${Colors.accentBlue};
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    margin-left: 0.375rem;
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: ${Colors.accentBlue};
    color: white;

    &:hover {
        background: #2563EB;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const KinGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
`;

const KinCard = styled.div`
    padding: 0.875rem;
    border: 1px solid ${Colors.borderColor};
    border-radius: 6px;
    position: relative;
    background: ${Colors.cardBg};
    transition: all 0.2s ease;

    &:hover {
        border-color: ${Colors.accentBlue};
        box-shadow: ${Colors.shadowHover};
    }
`;

const KinHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
`;

const KinName = styled.div`
    font-weight: 600;
    color: ${Colors.textPrimary};
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
`;

const Relationship = styled.span`
    background: ${Colors.accentBlueLight};
    color: ${Colors.accentBlue};
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    margin-left: 0.375rem;
`;

const DeleteButton = styled.button`
    background: transparent;
    border: none;
    color: ${Colors.textSecondary};
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;

    &:hover {
        color: ${Colors.dangerRed};
        background: ${Colors.dangerRedLight};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const KinDetails = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    font-size: 0.8rem;
`;

const DetailItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: ${Colors.textSecondary};

    svg {
        width: 12px;
        height: 12px;
        color: ${Colors.textSecondary};
    }
`;

const DetailText = styled.span`
    color: ${Colors.textPrimary};
    font-weight: 500;
`;

const NoKin = styled.div`
    text-align: center;
    padding: 2rem 1rem;
    color: ${Colors.textSecondary};
    font-size: 0.875rem;
    border: 1px dashed ${Colors.borderColor};
    border-radius: 6px;
    margin-bottom: 1rem;
`;

const Message = styled.div`
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
    margin-bottom: 0.75rem;
    background: ${props => 
        props.type === 'error' ? Colors.dangerRedLight : 
        Colors.successGreenLight};
    color: ${props => 
        props.type === 'error' ? Colors.dangerRed : 
        Colors.successGreen};
    border: 1px solid ${props => 
        props.type === 'error' ? '#FECACA' : 
        '#BBF7D0'};
`;

// Modal Components
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
    backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
    background: ${Colors.cardBg};
    border-radius: 8px;
    width: 100%;
    max-width: 400px;
    padding: 1.25rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid ${Colors.borderColor};
`;

const ModalTitle = styled.h4`
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${Colors.textPrimary};
    display: flex;
    align-items: center;
    gap: 0.375rem;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const Label = styled.label`
    font-size: 0.75rem;
    font-weight: 500;
    color: ${Colors.textPrimary};
    display: flex;
    align-items: center;
    gap: 0.25rem;
`;

const Required = styled.span`
    color: ${Colors.dangerRed};
`;

const Input = styled.input`
    padding: 0.5rem 0.75rem;
    border: 1px solid ${Colors.borderColor};
    border-radius: 4px;
    font-size: 0.8rem;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: ${Colors.accentBlue};
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
`;

const ModalActions = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
`;

const SecondaryButton = styled(Button)`
    background: ${Colors.textSecondary};

    &:hover {
        background: #4B5563;
    }
`;

// Main Component
const NextOfKinSection = ({ nextOfKin, onUpdate }) => {
    const { id: deceasedId } = useParams();

    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [localKin, setLocalKin] = useState([]);

    const [fullName, setFullName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');

  // Centralized API base URL
  const API_BASE_URL = 'http://localhost:8000/api/v1/restpoint';
  const API_REGISTER_KIN_URL = `${API_BASE_URL}/deceased/${deceasedId}/next-of-kin`;
  
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

  // Helper to get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

    useEffect(() => {
        if (nextOfKin && Array.isArray(nextOfKin)) {
            setLocalKin(nextOfKin);
        }
    }, [nextOfKin]);

    const resetForm = () => {
        setFullName('');
        setRelationship('');
        setContact('');
        setEmail('');
    };

    const clearMessage = () => {
        setTimeout(() => {
            setMessage(null);
        }, 3000);
    };

    const handleDelete = async (kinId) => {
      if (!window.confirm('Remove this next of kin?')) {
        return;
      }

      setMessage(null);
      try {
        const tenantSlug = getTenantSlug();
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/deceased/${deceasedId}/next-of-kin/${kinId}`, {
          method: 'DELETE',
          headers: {
            'x-tenant-slug': tenantSlug,
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete next of kin');
        }
        
        setLocalKin(prev => prev.filter(kin => kin.id !== kinId));
        setMessage({ text: 'Kin removed', type: 'success' });
        
        if (onUpdate) {
          onUpdate();
        }
        
        clearMessage();
      } catch (error) {
        console.error('Delete kin error:', error);
        setMessage({ text: 'Error removing kin: ' + error.message, type: 'error' });
        clearMessage();
      }
    };

    const handleAddKin = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setMessage(null);

      if (!fullName.trim() || !relationship.trim() || !contact.trim()) {
        setMessage({ text: 'Please fill in required fields', type: 'error' });
        setIsLoading(false);
        clearMessage();
        return;
      }

      const payload = {
        deceased_id: deceasedId, 
        full_name: fullName.trim(),
        relationship: relationship.trim(),
        contact: contact.trim(),
        email: email.trim() === '' ? null : email.trim(),
      };

      try {
        const tenantSlug = getTenantSlug();
        const token = getAuthToken();
        
        console.log('Adding next of kin to:', API_REGISTER_KIN_URL);
        console.log('Payload:', payload);
        
        const response = await fetch(API_REGISTER_KIN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug,
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(errorData.message || `Failed to add next of kin (${response.status})`);
        }

        const result = await response.json();
        console.log('Success:', result);
        
        setShowModal(false);
        resetForm();
        setMessage({ text: 'Kin added successfully', type: 'success' });
        
        if (onUpdate) {
          onUpdate();
        }
        
        clearMessage();
      } catch (error) {
        console.error('Add kin error:', error);
        setMessage({ text: 'Error adding kin: ' + error.message, type: 'error' });
        clearMessage();
      } finally {
        setIsLoading(false);
      }
    };

    const handleModalClose = () => {
        setShowModal(false);
        resetForm();
        setMessage(null);
    };

    const hasNextOfKin = localKin && Array.isArray(localKin) && localKin.length > 0;

    return (
        <Container>
            <Header>
                <Title>
                    <Users size={16} /> Next of Kin
                    {hasNextOfKin && <Counter>{localKin.length}</Counter>}
                </Title>
                
                <Button 
                    onClick={() => {
                        setShowModal(true);
                        resetForm();
                    }}
                    disabled={isLoading}
                >
                    <UserPlus size={14} /> Add
                </Button>
            </Header>

            {message && (
                <Message type={message.type}>
                    {message.text}
                </Message>
            )}

            {hasNextOfKin ? (
                <KinGrid>
                    {localKin.map(kin => (
                        <KinCard key={kin.id}>
                            <KinHeader>
                                <KinName>
                                    <SquareUser size={14} />
                                    {kin.full_name}
                                    <Relationship>{kin.relationship}</Relationship>
                                </KinName>
                                <DeleteButton 
                                    onClick={() => handleDelete(kin.id)}
                                    title="Delete"
                                > 
                                    <Trash2 size={12} />
                                </DeleteButton>
                            </KinHeader>
                            <KinDetails>
                                <DetailItem>
                                    <Phone size={12} />
                                    <DetailText>{kin.contact}</DetailText>
                                </DetailItem>
                                {kin.email && (
                                    <DetailItem>
                                        <Mail size={12} />
                                        <DetailText>{kin.email}</DetailText>
                                    </DetailItem>
                                )}
                            </KinDetails>
                        </KinCard>
                    ))}
                </KinGrid>
            ) : (
                <NoKin>
                    <Users size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <div>No next of kin added</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Click "Add" to add first kin
                    </div>
                </NoKin>
            )}

            {showModal && (
                <ModalOverlay onClick={handleModalClose}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>
                                <UserPlus size={16} /> Add Next of Kin
                            </ModalTitle>
                            <DeleteButton onClick={handleModalClose}>
                                <X size={16} />
                            </DeleteButton>
                        </ModalHeader>
                        <Form onSubmit={handleAddKin}>
                            <FormGroup>
                                <Label>
                                    Full Name <Required>*</Required>
                                </Label>
                                <Input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full name"
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    Relationship <Required>*</Required>
                                </Label>
                                <Input
                                    type="text"
                                    value={relationship}
                                    onChange={(e) => setRelationship(e.target.value)}
                                    placeholder="e.g., Father, Mother"
                                    required
                                    disabled={isLoading}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    Contact <Required>*</Required>
                                </Label>
                                <Input
                                    type="tel"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Phone number"
                                    required
                                    disabled={isLoading}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>
                                    Email (Optional)
                                </Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    disabled={isLoading}
                                />
                            </FormGroup>
                            <ModalActions>
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    style={{ flex: 1 }}
                                >
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                                    {isLoading ? 'Adding...' : 'Add Kin'}
                                </Button>
                                <SecondaryButton 
                                    type="button"
                                    onClick={handleModalClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </SecondaryButton>
                            </ModalActions>
                        </Form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Container>
    );
};

export default NextOfKinSection;