import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FlaskConical, Save, X, FileText, User, AlertCircle, Plus, Trash2, Edit, Eye, Loader, ChevronDown, ChevronUp, Download } from 'lucide-react';

const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const POSTMORTEM_BASE_URL = `${API_GATEWAY_URL}/api/v1/restpoint/deceased/postmortem`;

const getTenantSlug = () => {
  const localSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
  if (localSlug) return localSlug;

  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.tenantSlug || user?.tenant?.slug || user?.tenant_slug || 'system_shared';
  } catch {
    return 'system_shared';
  }
};

// Animation for opening/closing
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Main Container with collapsible design
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto 24px;
  font-family: 'Inter', sans-serif;
`;

// Card Header - Clickable to expand
const CardHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px ${props => props.isOpen ? '0 0' : '12px 12px'};
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
`;

const HeaderIcon = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const HeaderText = styled.div`
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }
  
  p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 400;
  }
`;

const Badge = styled.span`
  background: ${props => props.type === 'recorded' ? '#10b981' : props.type === 'pending' ? '#f59e0b' : '#3b82f6'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 1rem;
`;

const ChevronIcon = styled.div`
  color: white;
  opacity: 0.8;
  transition: transform 0.3s ease;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
`;

// Card Content - Slides down when opened
const CardContent = styled.div`
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: ${slideDown} 0.3s ease;
  border: 1px solid #e5e7eb;
  border-top: none;
`;

const FormContainer = styled.div`
  padding: 2rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f3f4f6;

  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  svg {
    color: #4f46e5;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => props.error ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: ${props => props.disabled ? '#f9fafb' : 'white'};
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid ${props => props.error ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s ease;
  background: ${props => props.disabled ? '#f9fafb' : 'white'};
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    border: none;
    
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background: white;
    color: #6b7280;
    border: 2px solid #e5e7eb;
    
    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
  }
  
  &.danger {
    background: white;
    color: #ef4444;
    border: 2px solid #fecaca;
    
    &:hover {
      background: #fef2f2;
    }
  }
`;

const Alert = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  
  &.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  
  &.info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinningLoader = styled(Loader)`
  animation: ${spin} 1s linear infinite;
  color: #4f46e5;
`;

const FindingsContainer = styled.div`
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
`;

const FindingItem = styled.div`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FindingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  
  &:hover {
    background: #fef2f2;
  }
  
  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const QuickAddButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const QuickAddButton = styled.button`
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #4f46e5;
    color: #4f46e5;
    background: #f5f3ff;
  }
`;

const PathologistSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SelectorButton = styled.button`
  flex: 1;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: ${props => props.selected ? '#4f46e5' : 'white'};
  color: ${props => props.selected ? 'white' : '#4b5563'};
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  z-index: 10;
  border-radius: 12px;
`;

const DownloadStatusAlert = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  animation: ${slideDown} 0.3s ease;
  
  &.success {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46;
    border: 1px solid #6ee7b7;
  }
  
  &.error {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    border: 1px solid #fca5a5;
  }
`;

const PostmortemInfoSection = ({ onSave, onCancel }) => {
  const { id: deceasedId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    deceased_id: deceasedId,
    summary: '',
    findings: [],
    cause_of_death: '',
    immediate_cause_of_death: '',
    underlying_cause_of_death: '',
    contributing_conditions: '',
    manner_of_death: '',
    requesting_authority: '',
    pathologist_type: 'staff',
    staff_username: '',
    external_name: '',
    external_mobile: '',
    external_id_number: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [existingPostmortem, setExistingPostmortem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [currentOperation, setCurrentOperation] = useState('');

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username && !existingPostmortem) {
      setFormData(prev => ({
        ...prev,
        staff_username: currentUser.username
      }));
    }
  }, [existingPostmortem]);

  const fetchExistingPostmortem = async () => {
    if (!deceasedId) {
      console.error("❌ No deceased ID available");
      return;
    }

    try {
      setIsLoading(true);
      setCurrentOperation("Loading postmortem data...");
      const tenantSlug = getTenantSlug();

      const response = await fetch(
        `${POSTMORTEM_BASE_URL}/${deceasedId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const postmortemData = data?.data || data?.postmortem || null;

        if (postmortemData) {
          console.log("✅ Found postmortem data:", postmortemData);
          setExistingPostmortem(postmortemData);
          populateFormWithExistingData(postmortemData);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching postmortem:", error);
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const populateFormWithExistingData = (postmortem) => {
    const findingsArray = [];
    
    if (postmortem.findings) {
      if (typeof postmortem.findings === 'string') {
        try {
          const parsedFindings = JSON.parse(postmortem.findings);
          if (typeof parsedFindings === 'object' && parsedFindings !== null) {
            Object.entries(parsedFindings).forEach(([title, description]) => {
              findingsArray.push({ 
                title: title || 'Untitled Finding', 
                description: description || '' 
              });
            });
          }
        } catch (e) {
          findingsArray.push({ 
            title: 'Examination Findings', 
            description: postmortem.findings 
          });
        }
      } else if (typeof postmortem.findings === 'object') {
        Object.entries(postmortem.findings).forEach(([title, description]) => {
          findingsArray.push({ 
            title: title || 'Untitled Finding', 
            description: description || '' 
          });
        });
      }
    }

    let pathologistType = 'staff';
    if (postmortem.external_pathologist_name || postmortem.external_name) {
      pathologistType = 'external';
    }

    const summary = postmortem.examination_summary || postmortem.summary || '';
    const causeOfDeath = postmortem.cause_of_death || '';
    const staffUsername = postmortem.pathologist_name || postmortem.staff_username || '';
    const externalName = postmortem.external_pathologist_name || postmortem.external_name || '';
    const externalMobile = postmortem.external_pathologist_mobile || postmortem.external_mobile || '';
    const externalIdNumber = postmortem.external_pathologist_id || postmortem.external_id_number || '';

    setFormData({
      deceased_id: deceasedId,
      summary,
      findings: findingsArray,
      cause_of_death: causeOfDeath,
      immediate_cause_of_death: postmortem.immediate_cause_of_death || '',
      underlying_cause_of_death: postmortem.underlying_cause_of_death || '',
      contributing_conditions: postmortem.contributing_conditions || '',
      manner_of_death: postmortem.manner_of_death || '',
      requesting_authority: postmortem.requesting_authority || '',
      pathologist_type: pathologistType,
      staff_username: staffUsername,
      external_name: externalName,
      external_mobile: externalMobile,
      external_id_number: externalIdNumber
    });
  };

  const handleInputChange = (e) => {
    if (existingPostmortem && !isEditMode) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const setPathologistType = (type) => {
    if (existingPostmortem && !isEditMode) return;
    
    setFormData(prev => ({
      ...prev,
      pathologist_type: type,
      staff_username: type === 'staff' ? prev.staff_username : '',
      external_name: type === 'external' ? prev.external_name : '',
      external_mobile: type === 'external' ? prev.external_mobile : '',
      external_id_number: type === 'external' ? prev.external_id_number : ''
    }));
  };

  const handleFindingTitleChange = (index, value) => {
    if (existingPostmortem && !isEditMode) return;
    
    const updatedFindings = [...formData.findings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      title: value
    };
    setFormData(prev => ({
      ...prev,
      findings: updatedFindings
    }));
  };

  const handleFindingDescriptionChange = (index, value) => {
    if (existingPostmortem && !isEditMode) return;
    
    const updatedFindings = [...formData.findings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      description: value
    };
    setFormData(prev => ({
      ...prev,
      findings: updatedFindings
    }));
  };

  const addFinding = () => {
    if (existingPostmortem && !isEditMode) return;
    
    setFormData(prev => ({
      ...prev,
      findings: [...prev.findings, { title: '', description: '' }]
    }));
  };

  const removeFinding = (index) => {
    if (existingPostmortem && !isEditMode) return;
    if (formData.findings.length <= 0) return;
    
    const updatedFindings = [...formData.findings];
    updatedFindings.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      findings: updatedFindings
    }));
  };

  const addCommonFinding = (type) => {
    if (existingPostmortem && !isEditMode) return;
    
    const commonFindings = {
      head: { title: 'Head & Brain Findings', description: '' },
      chest: { title: 'Chest & Thoracic Organs', description: '' },
      abdomen: { title: 'Abdomen & Pelvic Organs', description: '' },
      extremities: { title: 'Extremities & Musculoskeletal', description: '' },
      toxicology: { title: 'Toxicology & Lab Results', description: '' }
    };
    
    setFormData(prev => ({
      ...prev,
      findings: [...prev.findings, commonFindings[type]]
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
    if (!formData.cause_of_death.trim()) newErrors.cause_of_death = 'Cause of death is required';
    
    if (formData.pathologist_type === 'staff') {
      if (!formData.staff_username.trim()) {
        newErrors.staff_username = 'Staff username is required';
      }
    } else {
      if (!formData.external_name.trim()) newErrors.external_name = 'External pathologist name is required';
      if (!formData.external_id_number.trim()) newErrors.external_id_number = 'External pathologist ID number is required';
    }
    
    formData.findings.forEach((finding, index) => {
      if (!finding.title.trim()) {
        newErrors[`finding_title_${index}`] = `Finding title #${index + 1} is required`;
      }
      if (!finding.description.trim()) {
        newErrors[`finding_description_${index}`] = `Finding description #${index + 1} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    setCurrentOperation(existingPostmortem && isEditMode ? 'Updating...' : 'Saving...');
    
    try {
      const findingsObject = {};
      formData.findings.forEach(finding => {
        findingsObject[finding.title] = finding.description;
      });
      
      const tenantSlug = getTenantSlug();
      const submissionData = {
        deceased_id: formData.deceased_id,
        examination_summary: formData.summary,
        findings: findingsObject,
        cause_of_death: formData.cause_of_death,
        immediate_cause_of_death: formData.immediate_cause_of_death,
        underlying_cause_of_death: formData.underlying_cause_of_death,
        contributing_conditions: formData.contributing_conditions,
        manner_of_death: formData.manner_of_death,
        requesting_authority: formData.requesting_authority,
        ...(formData.pathologist_type === 'staff' 
          ? { pathologist_name: formData.staff_username }
          : {
              external_pathologist_name: formData.external_name,
              external_pathologist_id: formData.external_id_number
            }
        )
      };
      
      const response = await fetch(`${POSTMORTEM_BASE_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify(submissionData)
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setSubmitStatus('success');
        
        if (!existingPostmortem) {
          setFormData({
            deceased_id: deceasedId,
            summary: '',
            findings: [],
            cause_of_death: '',
            pathologist_type: 'staff',
            staff_username: getCurrentUser()?.username || '',
            external_name: '',
            external_mobile: '',
            external_id_number: ''
          });
        }
        
        setTimeout(async () => {
          await fetchExistingPostmortem();
          setIsEditMode(false);
        }, 1500);
        
        if (onSave) onSave();
      } else {
        throw new Error(responseData.message || 'Failed to save postmortem data');
      }
    } catch (error) {
      console.error('Error saving postmortem data:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setCurrentOperation(''), 3000);
    }
  };

  const downloadPostmortemPdf = async () => {
    if (!deceasedId) return;
    setIsDownloadingPdf(true);
    setDownloadStatus(null);

    try {
      const tenantSlug = getTenantSlug();
      const response = await fetch(`${POSTMORTEM_BASE_URL}/${deceasedId}/pdf`, {
        headers: {
          'Accept': 'application/pdf',
          'x-tenant-slug': tenantSlug
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `postmortem-${deceasedId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadStatus('success');
    } catch (error) {
      console.error('Error downloading postmortem PDF:', error);
      setDownloadStatus('error');
    } finally {
      setIsDownloadingPdf(false);
      setTimeout(() => setDownloadStatus(null), 4000);
    }
  };

  const enableEditMode = () => {
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    fetchExistingPostmortem();
  };

  const isFormDisabled = existingPostmortem && !isEditMode;

  // Toggle card open/close
  const toggleCard = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !existingPostmortem) {
      fetchExistingPostmortem();
    }
  };

  return (
    <Container>
      {/* Card Header - Always visible, clickable */}
      <CardHeader isOpen={isOpen} onClick={toggleCard}>
        <HeaderContent>
          <HeaderIcon>
            <FlaskConical size={24} />
          </HeaderIcon>
          <HeaderText>
            <h2>Postmortem Examination</h2>
            <p>Medical autopsy and examination findings</p>
          </HeaderText>
          {existingPostmortem && (
            <Badge type="recorded">✓ Recorded</Badge>
          )}
        </HeaderContent>
        <ChevronIcon isOpen={isOpen}>
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </ChevronIcon>
      </CardHeader>

      {/* Card Content - Only shows when open */}
      {isOpen && (
        <CardContent>
          {isLoading && (
            <LoadingOverlay>
              <SpinningLoader size={32} />
              <p>Loading postmortem data...</p>
            </LoadingOverlay>
          )}

          <FormContainer>
            {submitStatus === 'success' && (
              <Alert className="success">
                <AlertCircle size={18} /> 
                {existingPostmortem && isEditMode ? 'Postmortem updated successfully!' : 'Postmortem saved successfully!'}
              </Alert>
            )}
            
            {submitStatus === 'error' && (
              <Alert className="error">
                <AlertCircle size={18} /> Error saving postmortem data. Please try again.
              </Alert>
            )}
            
            {downloadStatus === 'success' && (
              <DownloadStatusAlert className="success">
                <AlertCircle size={18} /> PDF downloaded successfully!
              </DownloadStatusAlert>
            )}
            
            {downloadStatus === 'error' && (
              <DownloadStatusAlert className="error">
                <AlertCircle size={18} /> Error downloading PDF. Please try again.
              </DownloadStatusAlert>
            )}
            
            {existingPostmortem && !isEditMode && (
              <Alert className="info">
                <Eye size={18} /> Viewing existing postmortem. Click "Edit Record" to make changes.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FormSection>
                <SectionHeader>
                  <FileText size={20} />
                  <h3>Examination Details</h3>
                </SectionHeader>

                <FormGroup>
                  <Label>Deceased ID</Label>
                  <Input
                    value={formData.deceased_id}
                    disabled
                    readOnly
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Examination Summary</Label>
                  {isFormDisabled ? (
                    <div style={{ 
                      background: '#f9fafb', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}>
                      {formData.summary || 'No summary provided'}
                    </div>
                  ) : (
                    <>
                      <TextArea
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        placeholder="Provide a comprehensive summary of the postmortem examination..."
                        error={errors.summary}
                      />
                      {errors.summary && <ErrorText>{errors.summary}</ErrorText>}
                    </>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Cause of Death</Label>
                  {isFormDisabled ? (
                    <div style={{ 
                      background: '#f9fafb', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}>
                      {formData.cause_of_death || 'No cause of death specified'}
                    </div>
                  ) : (
                    <>
                      <Input
                        name="cause_of_death"
                        value={formData.cause_of_death}
                        onChange={handleInputChange}
                        placeholder="Primary cause of death..."
                        error={errors.cause_of_death}
                      />
                      {errors.cause_of_death && <ErrorText>{errors.cause_of_death}</ErrorText>}
                    </>
                  )}
                </FormGroup>

                <FormGrid>
                  <FormGroup>
                    <Label>Immediate Cause</Label>
                    {isFormDisabled ? (
                      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                        {formData.immediate_cause_of_death || 'Not specified'}
                      </div>
                    ) : (
                      <Input
                        name="immediate_cause_of_death"
                        value={formData.immediate_cause_of_death}
                        onChange={handleInputChange}
                        placeholder="Immediate cause of death"
                      />
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>Underlying Cause</Label>
                    {isFormDisabled ? (
                      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                        {formData.underlying_cause_of_death || 'Not specified'}
                      </div>
                    ) : (
                      <Input
                        name="underlying_cause_of_death"
                        value={formData.underlying_cause_of_death}
                        onChange={handleInputChange}
                        placeholder="Underlying cause of death"
                      />
                    )}
                  </FormGroup>
                </FormGrid>

                <FormGroup>
                  <Label>Contributing Conditions</Label>
                  {isFormDisabled ? (
                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                      {formData.contributing_conditions || 'Not specified'}
                    </div>
                  ) : (
                    <TextArea
                      name="contributing_conditions"
                      value={formData.contributing_conditions}
                      onChange={handleInputChange}
                      placeholder="Any contributing conditions or comorbidities"
                    />
                  )}
                </FormGroup>

                <FormGrid>
                  <FormGroup>
                    <Label>Manner of Death</Label>
                    {isFormDisabled ? (
                      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                        {formData.manner_of_death || 'Not specified'}
                      </div>
                    ) : (
                      <Input
                        name="manner_of_death"
                        value={formData.manner_of_death}
                        onChange={handleInputChange}
                        placeholder="Natural, accidental, homicide, suicide, undetermined"
                      />
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label>Requesting Authority</Label>
                    {isFormDisabled ? (
                      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                        {formData.requesting_authority || 'Not specified'}
                      </div>
                    ) : (
                      <Input
                        name="requesting_authority"
                        value={formData.requesting_authority}
                        onChange={handleInputChange}
                        placeholder="Name of requesting doctor or authority"
                      />
                    )}
                  </FormGroup>
                </FormGrid>
              </FormSection>

              <FormSection>
                <SectionHeader>
                  <FileText size={20} />
                  <h3>Examination Findings</h3>
                </SectionHeader>

                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  {formData.findings.length > 0 
                    ? `${formData.findings.length} finding(s) recorded` 
                    : 'Add examination findings by organ/system'}
                </p>

                {!isFormDisabled && (
                  <QuickAddButtons>
                    <QuickAddButton type="button" onClick={() => addCommonFinding('head')}>
                      Head & Brain
                    </QuickAddButton>
                    <QuickAddButton type="button" onClick={() => addCommonFinding('chest')}>
                      Chest & Thoracic
                    </QuickAddButton>
                    <QuickAddButton type="button" onClick={() => addCommonFinding('abdomen')}>
                      Abdomen & Pelvic
                    </QuickAddButton>
                    <QuickAddButton type="button" onClick={() => addCommonFinding('extremities')}>
                      Extremities
                    </QuickAddButton>
                    <QuickAddButton type="button" onClick={() => addCommonFinding('toxicology')}>
                      Toxicology
                    </QuickAddButton>
                  </QuickAddButtons>
                )}

                <FindingsContainer>
                  {formData.findings.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                      No findings added yet.
                    </div>
                  ) : (
                    formData.findings.map((finding, index) => (
                      <FindingItem key={index}>
                        <FindingHeader>
                          <div style={{ flex: 1 }}>
                            {isFormDisabled ? (
                              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                {finding.title || 'Untitled Finding'}
                              </div>
                            ) : (
                              <Input
                                value={finding.title}
                                onChange={(e) => handleFindingTitleChange(index, e.target.value)}
                                placeholder="Finding category (e.g., Head & Brain)"
                                error={errors[`finding_title_${index}`]}
                                style={{ marginBottom: '0.5rem' }}
                              />
                            )}
                          </div>
                          
                          {!isFormDisabled && (
                            <RemoveButton 
                              type="button" 
                              onClick={() => removeFinding(index)}
                              title="Remove this finding"
                            >
                              <Trash2 size={16} />
                            </RemoveButton>
                          )}
                        </FindingHeader>
                        
                        {isFormDisabled ? (
                          <div style={{ 
                            background: '#f9fafb', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: '#4b5563'
                          }}>
                            {finding.description || 'No description provided'}
                          </div>
                        ) : (
                          <TextArea
                            value={finding.description}
                            onChange={(e) => handleFindingDescriptionChange(index, e.target.value)}
                            placeholder="Enter detailed findings..."
                            error={errors[`finding_description_${index}`]}
                          />
                        )}
                      </FindingItem>
                    ))
                  )}
                  
                  {!isFormDisabled && (
                    <Button 
                      type="button" 
                      className="secondary" 
                      onClick={addFinding}
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      <Plus size={16} /> Add Custom Finding
                    </Button>
                  )}
                </FindingsContainer>
              </FormSection>

              <FormSection>
                <SectionHeader>
                  <User size={20} />
                  <h3>Pathologist Information</h3>
                </SectionHeader>

                <PathologistSelector>
                  <SelectorButton 
                    type="button"
                    selected={formData.pathologist_type === 'staff'}
                    onClick={() => setPathologistType('staff')}
                    disabled={isFormDisabled}
                  >
                    Staff Pathologist
                  </SelectorButton>
                  <SelectorButton 
                    type="button"
                    selected={formData.pathologist_type === 'external'}
                    onClick={() => setPathologistType('external')}
                    disabled={isFormDisabled}
                  >
                    External Pathologist
                  </SelectorButton>
                </PathologistSelector>

                {formData.pathologist_type === 'staff' ? (
                  <div>
                    {isFormDisabled ? (
                      <div style={{ 
                        background: '#f9fafb', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb'
                      }}>

                        <div style={{ fontWeight: '500', color: '#374151' }}>
                          {formData.staff_username || 'No pathologist specified'}
                        </div>
                      </div>
                    ) : (
                      <FormGroup>
                        <Label>Pathologist Name</Label>
                        <Input
                          name="staff_username"
                          value={formData.staff_username}
                          onChange={handleInputChange}
                          placeholder="Enter pathologist name"
                          error={errors.staff_username}
                        />
                        {errors.staff_username && <ErrorText>{errors.staff_username}</ErrorText>}
                      </FormGroup>
                    )}
                  </div>
                ) : (
                  <FormGrid>
                    <FormGroup>
                      <Label>External Pathologist Name</Label>
                      {isFormDisabled ? (
                        <div style={{ 
                          background: '#f9fafb', 
                          padding: '1rem', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}>
                          {formData.external_name || 'Not specified'}
                        </div>
                      ) : (
                        <>
                          <Input
                            name="external_name"
                            value={formData.external_name}
                            onChange={handleInputChange}
                            placeholder="Full name"
                            error={errors.external_name}
                          />
                          {errors.external_name && <ErrorText>{errors.external_name}</ErrorText>}
                        </>
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>Mobile Number (Optional)</Label>
                      {isFormDisabled ? (
                        <div style={{ 
                          background: '#f9fafb', 
                          padding: '1rem', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}>
                          {formData.external_mobile || 'Not specified'}
                        </div>
                      ) : (
                        <Input
                          name="external_mobile"
                          value={formData.external_mobile}
                          onChange={handleInputChange}
                          placeholder="Phone number (optional)"
                        />
                      )}
                    </FormGroup>
                    
                    <FormGroup>
                      <Label>ID Number</Label>
                      {isFormDisabled ? (
                        <div style={{ 
                          background: '#f9fafb', 
                          padding: '1rem', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }}>
                          {formData.external_id_number || 'Not specified'}
                        </div>
                      ) : (
                        <>
                          <Input
                            name="external_id_number"
                            value={formData.external_id_number}
                            onChange={handleInputChange}
                            placeholder="National ID number"
                            error={errors.external_id_number}
                          />
                          {errors.external_id_number && <ErrorText>{errors.external_id_number}</ErrorText>}
                        </>
                      )}
                    </FormGroup>
                  </FormGrid>
                )}
              </FormSection>

              <ButtonGroup>
                {existingPostmortem && !isEditMode && (
                  <Button type="button" className="secondary" onClick={downloadPostmortemPdf} disabled={isDownloadingPdf}>
                    {isDownloadingPdf ? (
                      <>
                        <SpinningLoader size={16} /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={16} /> Download PDF
                      </>
                    )}
                  </Button>
                )}

                {existingPostmortem && isEditMode ? (
                  <>
                    <Button type="button" className="secondary" onClick={cancelEdit}>
                      <X size={16} /> Cancel Edit
                    </Button>
                    <Button type="submit" className="primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <SpinningLoader size={16} /> Updating...
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Update Postmortem
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" className="secondary" onClick={toggleCard}>
                      <X size={16} /> Close
                    </Button>
                    {existingPostmortem && !isEditMode ? (
                      <Button type="button" className="primary" onClick={enableEditMode}>
                        <Edit size={16} /> Edit Record
                      </Button>
                    ) : (
                      <Button type="submit" className="primary" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <SpinningLoader size={16} /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} /> Save Postmortem
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </ButtonGroup>
            </form>
          </FormContainer>
        </CardContent>
      )}
    </Container>
  );
}

export default PostmortemInfoSection;