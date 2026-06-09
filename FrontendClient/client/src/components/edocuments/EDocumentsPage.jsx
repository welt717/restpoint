import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileUp, Download, Trash2, File, Search, Plus, AlertCircle, Loader, 
  Eye, Pencil, X, FileText, Template, Edit3, Save, Upload, Copy,
  ChevronDown, ChevronUp, Filter, Grid, List
} from 'lucide-react';
import Swal from 'sweetalert2';
import DocumentEditor from './DocumentEditor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/restpoint';

const EDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingInitial, setFetchingInitial] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Template management state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', type: 'form', fields: [] });
  
  // Autofill data
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [autofillTemplate, setAutofillTemplate] = useState(null);
  const [autofillData, setAutofillData] = useState({});

  const tenantSlug = localStorage.getItem('tenantSlug') || 'default';

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/edocuments`, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      setDocuments(response.data?.data?.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setFetchingInitial(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/edocuments/templates`, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      setTemplates(response.data?.data?.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchTemplates();
  }, []);

  // Handle file upload - immediately open in editor
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Immediately open editor with the file
    setEditingFile(file);
    setEditingDocument(null);
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  // Open template in editor
  const openTemplateInEditor = (template) => {
    setSelectedTemplate(template);
    setEditingDocument(null);
    setEditingFile(null);
    setShowEditor(true);
  };

  // Open existing document in editor
  const openInEditor = (doc) => {
    setEditingDocument(doc);
    setEditingFile(null);
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  // Handle editor save
  const handleEditorSave = async (savedDoc) => {
    fetchDocuments();
    setShowEditor(false);
    setEditingDocument(null);
    setEditingFile(null);
    setSelectedTemplate(null);
  };

  // Delete document
  const handleDelete = async (doc) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Document?',
      text: `Delete "${doc.title}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/edocuments/${doc.id}`, {
          headers: { 'x-tenant-slug': tenantSlug }
        });
        fetchDocuments();
        Swal.fire('Deleted!', 'Document deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete', 'error');
      }
    }
  };

  // Download document
  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/edocuments/download/${doc.fileName}`, {
        headers: { 'x-tenant-slug': tenantSlug },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalName || doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire('Error', 'Failed to download document', 'error');
    }
  };

  // Export document as PDF
  const handleExportPDF = async (doc) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/edocuments/${doc.id}/export-pdf`, {}, {
        headers: { 'x-tenant-slug': tenantSlug },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire('Error', 'Failed to export PDF', 'error');
    }
  };

  // Show autofill modal for template
  const showAutofillForTemplate = (template) => {
    setAutofillTemplate(template);
    setAutofillData({});
    setShowAutofillModal(true);
  };

  // Generate document from template with autofill data
  const handleAutofillGenerate = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/edocuments/generate`, {
        templateId: autofillTemplate.id,
        fieldValues: autofillData,
        title: `${autofillTemplate.name} - ${new Date().toLocaleDateString()}`
      }, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      
      fetchDocuments();
      setShowAutofillModal(false);
      Swal.fire('Success', 'Document generated successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to generate document', 'error');
    }
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      Swal.fire('Error', 'Template name is required', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('description', newTemplate.description || '');
      formData.append('type', newTemplate.type);
      formData.append('fields', JSON.stringify(newTemplate.fields || []));

      await axios.post(`${API_BASE_URL}/edocuments/templates`, formData, {
        headers: { 'x-tenant-slug': tenantSlug, 'Content-Type': 'multipart/form-data' }
      });

      fetchTemplates();
      setShowCreateTemplateModal(false);
      setNewTemplate({ name: '', description: '', type: 'form', fields: [] });
      Swal.fire('Success', 'Template created successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to create template', 'error');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template) => {
    if (template.isDefault) {
      Swal.fire('Error', 'Cannot delete default templates', 'error');
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Template?',
      text: `Delete "${template.name}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/edocuments/templates/${template.id}`, {
          headers: { 'x-tenant-slug': tenantSlug }
        });
        fetchTemplates();
        Swal.fire('Deleted!', 'Template deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete template', 'error');
      }
    }
  };

  // Add field to new template
  const addTemplateField = () => {
    setNewTemplate({
      ...newTemplate,
      fields: [...newTemplate.fields, { key: '', label: '', type: 'text', placeholder: '' }]
    });
  };

  // Update template field
  const updateTemplateField = (index, field, value) => {
    const updatedFields = [...newTemplate.fields];
    updatedFields[index][field] = value;
    setNewTemplate({ ...newTemplate, fields: updatedFields });
  };

  // Remove template field
  const removeTemplateField = (index) => {
    const updatedFields = newTemplate.fields.filter((_, i) => i !== index);
    setNewTemplate({ ...newTemplate, fields: updatedFields });
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Get unique document types for filter
  const documentTypes = [...new Set(documents.map(d => d.documentType).filter(Boolean))];

  if (showEditor) {
    return (
      <DocumentEditor
        document={editingDocument}
        template={selectedTemplate}
        file={editingFile}
        onClose={() => {
          setShowEditor(false);
          setEditingDocument(null);
          setEditingFile(null);
          setSelectedTemplate(null);
        }}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: 0 }}>
            📄 E-Documents Manager
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
            Create, edit, and manage documents with Fabric.js canvas editor
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Templates Toggle */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: showTemplates ? '#C9A84C' : '#6B7280',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            <Template size={18} />
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>

          {/* Upload Button */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#C9A84C',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 600
          }}>
            <FileUp size={18} />
            Upload & Edit Document
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <div style={{ 
          backgroundColor: '#fff', 
          borderRadius: '12px', 
          padding: '1.5rem', 
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              📋 Document Templates
            </h2>
            <button
              onClick={() => setShowCreateTemplateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#C9A84C',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                      {template.name}
                    </h3>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '2px 8px', 
                      backgroundColor: '#E5E7EB', 
                      borderRadius: '12px',
                      color: '#6B7280'
                    }}>
                      {template.type}
                    </span>
                    {template.isDefault && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        backgroundColor: '#FEF3C7', 
                        borderRadius: '12px',
                        color: '#D97706',
                        marginLeft: '4px'
                      }}>
                        Default
                      </span>
                    )}
                  </div>
                  {!template.isDefault && (
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      style={{ 
                        padding: '4px', 
                        backgroundColor: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: '#DC2626'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                
                {template.description && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: '#6B7280' }}>
                    {template.description}
                  </p>
                )}

                {template.fields && template.fields.length > 0 && (
                  <p style={{ margin: '0.5rem 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {template.fields.length} fields
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                  <button
                    onClick={() => openTemplateInEditor(template)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => showAutofillForTemplate(template)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    <FileText size={14} />
                    Fill & Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '40px',
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: '#6B7280' }} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.95rem',
              minWidth: '150px'
            }}
          >
            <option value="all">All Types</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px',
              backgroundColor: viewMode === 'grid' ? '#C9A84C' : '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px',
              backgroundColor: viewMode === 'list' ? '#C9A84C' : '#E5E7EB',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {fetchingInitial ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>
          <Loader size={48} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
          <p>Loading documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '2px dashed #D1D5DB'
        }}>
          <File size={64} style={{ margin: '0 auto 1rem', color: '#D1D5DB' }} />
          <h3 style={{ color: '#6B7280', margin: '0 0 0.5rem 0' }}>No documents found</h3>
          <p style={{ color: '#9CA3AF', margin: 0 }}>Upload a document or use a template to get started</p>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? gridStyle : listStyle}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              style={viewMode === 'grid' ? gridCardStyle : listCardStyle}
              onClick={() => openInEditor(doc)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#EEF2FF', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6366F1',
                  flexShrink: 0
                }}>
                  <File size={24} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openInEditor(doc)}
                    style={{ 
                      padding: '6px', 
                      backgroundColor: '#F0F9FF', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      color: '#0284C7'
                    }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    style={{ 
                      padding: '6px', 
                      backgroundColor: '#F0FDF4', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      color: '#16A34A'
                    }}
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleExportPDF(doc)}
                    style={{ 
                      padding: '6px', 
                      backgroundColor: '#FEF3C7', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      color: '#D97706'
                    }}
                    title="Export PDF"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    style={{ 
                      padding: '6px', 
                      backgroundColor: '#FEF2F2', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer',
                      color: '#DC2626'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                {doc.title || 'Untitled'}
              </h3>
              
              {doc.description && (
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.description}
                </p>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#9CA3AF' }}>
                <span>{doc.documentType || 'Document'}</span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Create New Template</h2>
              <button onClick={() => setShowCreateTemplateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Template Name *</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="e.g., Service Agreement"
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Brief description of this template"
                rows={2}
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Type</label>
              <select
                value={newTemplate.type}
                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
              >
                <option value="form">Form</option>
                <option value="invoice">Invoice</option>
                <option value="receipt">Receipt</option>
                <option value="agreement">Agreement</option>
                <option value="certificate">Certificate</option>
                <option value="permit">Permit</option>
                <option value="consent">Consent</option>
                <option value="general">General</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 500 }}>Fields</label>
                <button
                  onClick={addTemplateField}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#C9A84C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  + Add Field
                </button>
              </div>

              {newTemplate.fields.map((field, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Field Key"
                    value={field.key}
                    onChange={(e) => updateTemplateField(index, 'key', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) => updateTemplateField(index, 'label', e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '0.85rem' }}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateTemplateField(index, 'type', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '0.85rem' }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                  </select>
                  <button
                    onClick={() => removeTemplateField(index)}
                    style={{ padding: '6px', backgroundColor: '#FEE2E2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#DC2626' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#C9A84C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autofill Modal */}
      {showAutofillModal && autofillTemplate && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Fill Template: {autofillTemplate.name}</h2>
              <button onClick={() => setShowAutofillModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {autofillTemplate.fields.map((field) => (
                <div key={field.key} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    {field.label} {field.type === 'select' && '(Select one)'}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={autofillData[field.key] || ''}
                      onChange={(e) => setAutofillData({ ...autofillData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={3}
                      style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={autofillData[field.key] || ''}
                      onChange={(e) => setAutofillData({ ...autofillData, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={autofillData[field.key] || ''}
                      onChange={(e) => setAutofillData({ ...autofillData, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={autofillData[field.key] || ''}
                      onChange={(e) => setAutofillData({ ...autofillData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={autofillData[field.key] || ''}
                      onChange={(e) => setAutofillData({ ...autofillData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowAutofillModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAutofillGenerate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Generate Document
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Grid view styles
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem'
};

const gridCardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'pointer'
};

// List view styles
const listStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const listCardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'pointer'
};

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default EDocumentsPage;