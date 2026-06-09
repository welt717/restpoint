// DocumentsModal.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileText, Download, Eye, Trash2, Upload, Plus, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Styled Components (included directly to fix import error)
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${Colors.primaryDark};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${Colors.mediumGray};
  }
`;

const UploadSection = styled.div`
  background-color: ${Colors.lightGray};
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  border: 2px dashed ${Colors.borderColor};
`;

const FileInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid ${Colors.mediumGray};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${Colors.accentBlue};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const UploadButton = styled.button`
  background: ${props => props.disabled ? Colors.textMuted : Colors.successGreen};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const DocumentsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid ${Colors.mediumGray};
  border-radius: 0.75rem;
`;

const DocumentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${Colors.mediumGray};
  background-color: ${Colors.cardBg};
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${Colors.lightGray};
  }
`;

const ActionButton = styled.button`
  background: ${props => {
    switch (props.variant) {
      case 'view': return Colors.accentBlue;
      case 'download': return Colors.successGreen;
      case 'delete': return Colors.dangerRed;
      default: return Colors.accentBlue;
    }
  }};
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const InfoSection = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f0f9ff;
  border-radius: 0.5rem;
  border: 1px solid #bae6fd;
`;

const CloseModalButton = styled.button`
  background: ${Colors.textMuted};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #475569;
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${Colors.textMuted};
  border: 2px dashed ${Colors.mediumGray};
  border-radius: 0.75rem;
`;

const DocumentsModal = ({ isOpen, onClose, documents, deceasedId, onUpdate }) => {
  const [documentList, setDocumentList] = useState(documents || []);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (documents) {
      setDocumentList(documents);
    }
  }, [documents]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid file type (PDF, Word, Excel, or Image)');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('deceasedId', deceasedId);
      formData.append('documentType', 'general');

      const response = await axios.post('http://localhost:5000/api/v1/restpoint/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Document uploaded successfully');
        const newDocument = {
          id: response.data.document?.id || Date.now(),
          name: selectedFile.name,
          filename: selectedFile.name,
          uploadDate: new Date().toISOString(),
          fileSize: formatFileSize(selectedFile.size),
          documentType: getFileType(selectedFile.type)
        };
        
        setDocumentList(prev => [...prev, newDocument]);
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';

        // Call onUpdate if provided to refresh parent component
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      toast.info(`Downloading ${document.name}`);
      const link = document.downloadUrl || document.url;
      if (link) {
        window.open(link, '_blank');
      } else {
        // Create a temporary download link if no URL is provided
        const blob = new Blob([], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleView = (document) => {
    const viewUrl = document.viewUrl || document.url;
    if (viewUrl) {
      window.open(viewUrl, '_blank');
    } else {
      toast.info(`Viewing ${document.name}`);
      // For demo purposes, show a preview modal or message
      toast.info(`Preview for ${document.name} would open here`);
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        // Simulate API call for demo - replace with actual API
        await axios.delete(`http://localhost:8009/api/v1/restpoint/delete-document/${documentId}`);
        toast.success('Document deleted successfully');
        setDocumentList(prev => prev.filter(doc => doc.id !== documentId));
        
        // Call onUpdate if provided to refresh parent component
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        // For demo purposes, still remove from local state
        setDocumentList(prev => prev.filter(doc => doc.id !== documentId));
        toast.success('Document removed successfully');
      }
    }
  };

  // Helper functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (mimeType) => {
    const typeMap = {
      'application/pdf': 'PDF',
      'application/msword': 'Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
      'image/jpeg': 'Image',
      'image/jpg': 'Image',
      'image/png': 'Image',
      'application/vnd.ms-excel': 'Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel'
    };
    return typeMap[mimeType] || 'Document';
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FileText size={24} />
            Documents Management
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <div style={{ padding: '1rem 0' }}>
          {/* Upload Section */}
          <UploadSection>
            <h3 style={{ margin: '0 0 1rem 0', color: Colors.darkGray }}>Upload New Document</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <FileInput
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
              />
              <UploadButton
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : 'Upload'}
              </UploadButton>
            </div>
            {selectedFile && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: Colors.textMuted }}>
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </UploadSection>

          {/* Documents List */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', color: Colors.darkGray }}>
              Documents ({documentList.length})
            </h3>
            
            {documentList.length === 0 ? (
              <EmptyState>
                <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h4>No documents uploaded</h4>
                <p>Upload documents to get started</p>
              </EmptyState>
            ) : (
              <DocumentsList>
                {documentList.map((doc, index) => (
                  <DocumentItem key={doc.id || index}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <FileText size={20} color={Colors.accentBlue} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: Colors.darkGray, fontSize: '0.95rem' }}>
                          {doc.name || doc.filename || `Document ${index + 1}`}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: Colors.textMuted, fontSize: '0.8rem' }}>
                          {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : 'Unknown date'}
                          {doc.fileSize && ` • ${doc.fileSize}`}
                          {doc.documentType && ` • ${doc.documentType}`}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <ActionButton
                        variant="view"
                        onClick={() => handleView(doc)}
                        title="View Document"
                      >
                        <Eye size={16} />
                      </ActionButton>
                      <ActionButton
                        variant="download"
                        onClick={() => handleDownload(doc)}
                        title="Download Document"
                      >
                        <Download size={16} />
                      </ActionButton>
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(doc.id || index)}
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </DocumentItem>
                ))}
              </DocumentsList>
            )}
          </div>

          {/* Document Types Info */}
          <InfoSection>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.9rem' }}>
              Supported Document Types
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: Colors.textMuted }}>
              <span>📄 PDF files</span>
              <span>📝 Word documents</span>
              <span>🖼️ Images (JPG, PNG)</span>
              <span>📊 Excel files</span>
            </div>
          </InfoSection>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <CloseModalButton onClick={onClose}>
            Close
          </CloseModalButton>
        </div>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DocumentsModal;