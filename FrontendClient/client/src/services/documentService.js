import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('tenant_id');
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  
  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-User-ID': userId,
  };
};

/**
 * Document Management API Service
 */
const DocumentService = {
  /**
   * Get all documents
   */
  async getDocuments(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.template_id) params.append('template_id', filters.template_id);

      const response = await axios.get(
        `${API_BASE_URL}/documents${params ? '?' + params : ''}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  /**
   * Get a single document
   */
  async getDocument(documentId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/documents/${documentId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  /**
   * Create a new document
   */
  async createDocument(data) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/documents`,
        {
          title: data.title,
          description: data.description || null,
          template_id: data.template_id || null,
          initial_fields: data.initial_fields || {}
        },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  },

  /**
   * Update a document
   */
  async updateDocument(documentId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          title: data.title,
          description: data.description,
          content: data.content,
          canvas_state: data.canvas_state,
          fields: data.fields,
          reason: data.reason || 'Document updated'
        },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  /**
   * Publish a document
   */
  async publishDocument(documentId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/documents/${documentId}/publish`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error publishing document:', error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/documents/${documentId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Get document versions
   */
  async getVersions(documentId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/documents/${documentId}/versions`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    }
  },

  /**
   * Restore a document version
   */
  async restoreVersion(documentId, versionId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/documents/${documentId}/versions/${versionId}/restore`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }
};

/**
 * Template Management API Service
 */
const TemplateService = {
  /**
   * Get all templates
   */
  async getTemplates(includePublic = true) {
    try {
      const params = new URLSearchParams();
      params.append('include_public', includePublic);

      const response = await axios.get(
        `${API_BASE_URL}/templates?${params}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Get a single template
   */
  async getTemplate(templateId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/templates/${templateId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  /**
   * Create a new template
   */
  async createTemplate(data) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/templates`,
        {
          name: data.name,
          description: data.description,
          type: data.type,
          template_json: data.template_json,
          fields: data.fields,
          default_fields: data.default_fields,
          is_public: data.is_public || false
        },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  /**
   * Update a template
   */
  async updateTemplate(templateId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/templates/${templateId}`,
        {
          name: data.name,
          description: data.description,
          type: data.type,
          template_json: data.template_json,
          fields: data.fields,
          default_fields: data.default_fields,
          is_public: data.is_public
        },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(templateId) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/templates/${templateId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Create a document from template
   */
  async createDocumentFromTemplate(templateId, data) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/templates/${templateId}/create-document`,
        {
          title: data.title,
          initial_fields: data.initial_fields || {}
        },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating document from template:', error);
      throw error;
    }
  }
};

export { DocumentService, TemplateService };
export default { DocumentService, TemplateService };
