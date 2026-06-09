import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  User,
  Calendar,
  Heart,
  MapPin,
  Clock,
  UserCheck,
  Building2,
  FileText,
  Map,
  CreditCard,
  Activity,
  Info,
  Edit,
  Save,
  X,
  ChevronRight,
  Hash,
  Users,
  Globe,
  CalendarDays,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// API Gateway URL
const API_GATEWAY_URL =  'http://localhost:8000';
const API_BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased`;



// Helper function to get tenant slug
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

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add tenant slug header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const tenantSlug = getTenantSlug();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (tenantSlug && tenantSlug !== 'default') {
      config.headers['x-tenant-slug'] = tenantSlug;
    }
    
    console.log('📡 DeceasedInfoSection API Request:', {
      url: config.url,
      method: config.method,
      tenantSlug,
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Sleek Styled Components with Larger Boxes ---
const Container = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  border: 1px solid #eef2f6;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  animation: ${fadeIn} 0.5s ease-out;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-color: #d9e2ef;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Badge = styled.span`
  background: ${(props) => props.color || '#4361ee'};
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.3px;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;

  &.primary {
    background: #4361ee;
    color: white;
    box-shadow: 0 2px 8px rgba(67, 97, 238, 0.2);

    &:hover {
      background: #3a56d4;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  &.secondary {
    background: #f8fafc;
    color: #1e293b;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #f1f5f9;
    }
  }

  &.success {
    background: #10b981;
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

    &:hover {
      background: #0ea271;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const DataGroup = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e9edf2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 200px;
  animation: ${slideRight} 0.5s ease-out;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  &:hover {
    background: linear-gradient(135deg, white 0%, #f8fafc 100%);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    min-height: auto;
  }
`;

const GroupTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e9edf2;
  padding-bottom: 0.75rem;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2;
  }
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  font-size: 0.95rem;
  border-bottom: 1px dashed #e9edf2;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const Label = styled.span`
  color: #64748b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
`;

const Value = styled.span`
  color: #0f172a;
  font-weight: ${(props) => (props.bold ? '600' : '500')};
  text-align: right;
  word-break: break-word;
  max-width: 200px;
  font-size: 0.95rem;

  .status-badge {
    background: ${(props) => props.statusColor || '#64748b'};
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 30px;
    font-size: 0.8rem;
    font-weight: 500;
    display: inline-block;
    margin-left: 0.5rem;
  }
`;

const EditForm = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid #eef2f6;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.4rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
  }
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  font-size: 1rem;
  gap: 0.75rem;

  .spinner {
    border: 3px solid #f1f5f9;
    border-top: 3px solid #4361ee;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const NoData = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-size: 1rem;
`;

// Field groups with larger layout
const fieldGroups = [
  {
    title: 'Personal Information',
    icon: User,
    color: '#4361ee',
    fields: [
      { key: 'full_name', label: 'Full Name', bold: true },
      { key: 'gender', label: 'Gender' },
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'date_of_death', label: 'Date of Death' },
    ],
  },
  {
    title: 'Death Details',
    icon: Heart,
    color: '#f43f5e',
    fields: [
      { key: 'cause_of_death', label: 'Cause of Death', bold: true },
      { key: 'place_of_death', label: 'Place of Death' },
      { key: 'admission_number', label: 'Admission Number' },
    ],
  },
  {
    title: 'Timeline',
    icon: CalendarDays,
    color: '#f59e0b',
    fields: [
      { key: 'date_admitted', label: 'Admitted On' },
      { key: 'date_registered', label: 'Registered On' },
      { key: 'dispatch_date', label: 'Dispatch Date' },
    ],
  },
  {
    title: 'Location',
    icon: Map,
    color: '#10b981',
    fields: [
      { key: 'county', label: 'County/Region' },
      { key: 'location', label: 'Specific Location' },
    ],
  },
  {
    title: 'Status & Registry',
    icon: Activity,
    color: '#8b5cf6',
    fields: [
      { key: 'status', label: 'Current Status', bold: true },
      { key: 'created_by', label: 'Registered By' },
    ],
  },
  {
    title: 'Additional Info',
    icon: Info,
    color: '#64748b',
    fields: [
      { key: 'age', label: 'Age at Death', bold: true },
      { key: 'deceased_id', label: 'Deceased ID' },
    ],
  },
];

// Form configuration
const formFields = [
  {
    section: 'Personal Information',
    icon: User,
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
      { name: 'date_of_death', label: 'Date of Death', type: 'date' },
    ],
  },
  {
    section: 'Death & Location',
    icon: Map,
    fields: [
      { name: 'cause_of_death', label: 'Cause of Death', type: 'text' },
      { name: 'place_of_death', label: 'Place of Death', type: 'text' },
      { name: 'county', label: 'County/Region', type: 'text' },
      { name: 'location', label: 'Specific Location', type: 'text' },
    ],
  },
  {
    section: 'Status & Details',
    icon: Activity,
    fields: [
      { name: 'admission_number', label: 'Admission Number', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['active', 'completed', 'pending', 'dispatched'],
      },
    ],
  },
];

// --- Main Component ---
const DeceasedInfoSection = ({ deceasedId: propDeceasedId, deceased: propDeceased, ageInfo, onUpdate }) => {
  const { id: paramId } = useParams();
  const deceasedId = propDeceasedId || paramId;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeceasedData = useCallback(async () => {
    if (!deceasedId) {
      setIsLoading(false);
      setError('No deceased ID provided');
      return;
    }

    setIsLoading(true);
    setError(null);mor
    
    try {
      // Use the correct endpoint with the ID in the path
      const response = await apiClient.get(`/deceased-id/${deceasedId}`);
      console.log('📦 DeceasedInfoSection API Response:', response.data);
      
      const deceasedData = response.data?.data || response.data;

      if (deceasedData && Object.keys(deceasedData).length > 0) {
        const cleanedData = {
          ...deceasedData,
          date_of_birth: deceasedData.date_of_birth
            ? new Date(deceasedData.date_of_birth).toISOString().split('T')[0]
            : '',
          date_of_death: deceasedData.date_of_death
            ? new Date(deceasedData.date_of_death).toISOString().split('T')[0]
            : '',
          date_admitted: deceasedData.date_admitted
            ? new Date(deceasedData.date_admitted).toISOString().split('T')[0]
            : '',
          dispatch_date: deceasedData.dispatch_date
            ? new Date(deceasedData.dispatch_date).toISOString().split('T')[0]
            : '',
        };
        setFormData(cleanedData);
        setOriginalData(cleanedData);
      } else {
        setError('No data found for this deceased record');
        setFormData(null);
        setOriginalData(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load deceased information';
      setError(errorMessage);
      toast.error(errorMessage);
      setFormData(null);
      setOriginalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [deceasedId]);

  useEffect(() => {
    if (propDeceased) {
      // If data is passed as prop, use it directly
      const cleanedData = {
        ...propDeceased,
        date_of_birth: propDeceased.date_of_birth
          ? new Date(propDeceased.date_of_birth).toISOString().split('T')[0]
          : '',
        date_of_death: propDeceased.date_of_death
          ? new Date(propDeceased.date_of_death).toISOString().split('T')[0]
          : '',
      };
      setFormData(cleanedData);
      setOriginalData(cleanedData);
      setIsLoading(false);
    } else {
      fetchDeceasedData();
    }
  }, [propDeceased, fetchDeceasedData, deceasedId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData || !deceasedId) {
      toast.error('No data to save');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.put(`/update-deceased/${deceasedId}`, formData);

      if (response.data.success) {
        toast.success('Details updated successfully');
        setIsEditMode(false);
        await fetchDeceasedData();
        onUpdate?.();
      } else {
        toast.error(response.data.message || 'Failed to update details');
      }
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update details';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditMode(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? '-'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? '-'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const calculateAge = (dob, dod) => {
    if (!dob || !dod) return '-';
    const birth = new Date(dob);
    const death = new Date(dod);
    if (isNaN(birth.getTime()) || isNaN(death.getTime())) return '-';

    let years = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      years--;
    }
    return `${years} years`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#4361ee';
      case 'pending':
        return '#f59e0b';
      case 'dispatched':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const renderFieldValue = (field, data) => {
    let value = data[field.key];

    if (!value && value !== 0) {
      return <Value>-</Value>;
    }

    if (field.key.includes('date') || field.key === 'date_registered') {
      value = field.key === 'date_registered' ? formatDateTime(value) : formatDate(value);
    } else if (field.key === 'status') {
      const color = getStatusColor(value);
      return (
        <Value bold>
          <span className="status-badge" style={{ backgroundColor: color }}>
            {value}
          </span>
        </Value>
      );
    } else if (field.key === 'created_by') {
      return (
        <Value bold style={{ color: value?.toLowerCase() === 'system' ? '#f43f5e' : '#10b981' }}>
          {value || 'System'}
        </Value>
      );
    } else if (field.key === 'age' && (!value || value === '-')) {
      value = calculateAge(data.date_of_birth, data.date_of_death);
    }

    return <Value bold={field.bold}>{value}</Value>;
  };

  const renderFormSection = (section, sectionIndex) => (
    <DataGroup key={sectionIndex}>
      <GroupTitle>
        {React.createElement(section.icon, { size: 18 })}
        {section.title}
      </GroupTitle>
      {section.fields.map((field, fieldIndex) => {
        let displayValue = formData[field.key];
        
        // Special handling for age
        if (field.key === 'age' && (!displayValue || displayValue === '-')) {
          displayValue = calculateAge(formData.date_of_birth, formData.date_of_death);
        }
        
        return (
          <DataRow key={fieldIndex}>
            <Label>{field.label}:</Label>
            {field.key === 'age' ? (
              <Value bold>{displayValue}</Value>
            ) : (
              renderFieldValue(field, formData)
            )}
          </DataRow>
        );
      })}
    </DataGroup>
  );

  if (isLoading) {
    return (
      <Container>
        <Loading>
          <div className="spinner"></div>
          Loading deceased information...
        </Loading>
      </Container>
    );
  }

  if (error || !formData) {
    return (
      <Container>
        <NoData>
          <Info size={32} strokeWidth={1.5} />
          <div style={{ marginTop: '1rem', color: '#dc2626' }}>{error || 'No data found for this deceased record'}</div>
          <Button className="secondary" onClick={fetchDeceasedData} style={{ marginTop: '1rem' }}>
            <RefreshCw size={16} />
            Retry
          </Button>
        </NoData>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Header>
          <Title>
            <User size={22} />
            Deceased Information
            <Badge color="#4361ee">ID: {formData.deceased_id || formData.id || deceasedId}</Badge>
          </Title>

          <Actions>
            {isEditMode ? (
              <>
                <Button className="success" onClick={handleSave} disabled={isLoading}>
                  <Save size={16} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button className="secondary" onClick={handleCancel} disabled={isLoading}>
                  <X size={16} />
                  Cancel
                </Button>
              </>
            ) : (
              <Button className="primary" onClick={() => setIsEditMode(true)}>
                <Edit size={16} />
                Edit Information
              </Button>
            )}
          </Actions>
        </Header>

        {!isEditMode ? (
          <DataGrid>{fieldGroups.map(renderFormSection)}</DataGrid>
        ) : (
          <EditForm>
            <FormGrid>
              {formFields.map((section, sectionIndex) => (
                <DataGroup key={sectionIndex}>
                  <GroupTitle>
                    {React.createElement(section.icon, { size: 18 })}
                    {section.section}
                  </GroupTitle>
                  {section.fields.map((field, fieldIndex) => (
                    <FormGroup key={fieldIndex}>
                      <FormLabel>{field.label}</FormLabel>
                      {field.type === 'select' ? (
                        <FormSelect
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </FormSelect>
                      ) : (
                        <FormInput
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          required={field.required}
                        />
                      )}
                    </FormGroup>
                  ))}
                </DataGroup>
              ))}
            </FormGrid>
          </EditForm>
        )}
      </Container>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

// Import RefreshCw for the retry button
import { RefreshCw } from 'lucide-react';

export default DeceasedInfoSection;