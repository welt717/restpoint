const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8116;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const templatesDir = path.join(uploadsDir, '_templates');
const documentsDir = path.join(uploadsDir, '_documents');

[uploadsDir, templatesDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// In-memory storage for demo (in production, use database)
const documentsStore = new Map(); // key: tenantSlug-docId
const templatesStore = new Map(); // key: tenantSlug-templateId

// Initialize default templates with placeholder fields for autofill
const initializeTemplates = () => {
  const defaultTemplates = [
    {
      id: 'invoice-template',
      name: 'Invoice',
      type: 'invoice',
      description: 'Funeral service invoice template',
      fields: [
        { key: 'invoiceNumber', label: 'Invoice Number', placeholder: '{{invoiceNumber}}', type: 'text' },
        { key: 'clientName', label: 'Client Name', placeholder: '{{clientName}}', type: 'text' },
        { key: 'clientPhone', label: 'Client Phone', placeholder: '{{clientPhone}}', type: 'text' },
        { key: 'serviceDate', label: 'Service Date', placeholder: '{{serviceDate}}', type: 'date' },
        { key: 'totalAmount', label: 'Total Amount', placeholder: '{{totalAmount}}', type: 'number' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'items', label: 'Items/Services', placeholder: '{{items}}', type: 'textarea' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'receipt-template',
      name: 'Receipt',
      type: 'receipt',
      description: 'Payment receipt document template',
      fields: [
        { key: 'receiptNumber', label: 'Receipt Number', placeholder: '{{receiptNumber}}', type: 'text' },
        { key: 'payerName', label: 'Payer Name', placeholder: '{{payerName}}', type: 'text' },
        { key: 'amount', label: 'Amount', placeholder: '{{amount}}', type: 'number' },
        { key: 'paymentDate', label: 'Payment Date', placeholder: '{{paymentDate}}', type: 'date' },
        { key: 'paymentMethod', label: 'Payment Method', placeholder: '{{paymentMethod}}', type: 'select', options: ['Cash', 'M-Pesa', 'Bank Transfer', 'Card'] },
        { key: 'transactionRef', label: 'Transaction Reference', placeholder: '{{transactionRef}}', type: 'text' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'agreement-template',
      name: 'Funeral Service Agreement',
      type: 'agreement',
      description: 'Service agreement form template',
      fields: [
        { key: 'agreementDate', label: 'Agreement Date', placeholder: '{{agreementDate}}', type: 'date' },
        { key: 'clientName', label: 'Client Name', placeholder: '{{clientName}}', type: 'text' },
        { key: 'clientIDNumber', label: 'Client ID Number', placeholder: '{{clientIDNumber}}', type: 'text' },
        { key: 'clientAddress', label: 'Client Address', placeholder: '{{clientAddress}}', type: 'textarea' },
        { key: 'clientPhone', label: 'Client Phone', placeholder: '{{clientPhone}}', type: 'text' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'serviceType', label: 'Service Type', placeholder: '{{serviceType}}', type: 'select', options: ['Burial', 'Cremation', 'Memorial Service', 'Full Package'] },
        { key: 'serviceDate', label: 'Service Date', placeholder: '{{serviceDate}}', type: 'date' },
        { key: 'totalCost', label: 'Total Cost', placeholder: '{{totalCost}}', type: 'number' },
        { key: 'specialRequests', label: 'Special Requests', placeholder: '{{specialRequests}}', type: 'textarea' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'authorization-template',
      name: 'Authorization Form',
      type: 'form',
      description: 'Family authorization form template',
      fields: [
        { key: 'authorizationDate', label: 'Date', placeholder: '{{authorizationDate}}', type: 'date' },
        { key: 'authorizedName', label: 'Authorized Person Name', placeholder: '{{authorizedName}}', type: 'text' },
        { key: 'authorizedIDNumber', label: 'ID Number', placeholder: '{{authorizedIDNumber}}', type: 'text' },
        { key: 'authorizedAction', label: 'Authorized Action', placeholder: '{{authorizedAction}}', type: 'textarea' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'relationship', label: 'Relationship to Deceased', placeholder: '{{relationship}}', type: 'select', options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other Relative', 'Legal Representative'] }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'deceased-info-template',
      name: 'Deceased Information Form',
      type: 'form',
      description: 'Deceased details form template',
      fields: [
        { key: 'fullName', label: 'Full Name', placeholder: '{{fullName}}', type: 'text' },
        { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '{{dateOfBirth}}', type: 'date' },
        { key: 'dateOfDeath', label: 'Date of Death', placeholder: '{{dateOfDeath}}', type: 'date' },
        { key: 'placeOfBirth', label: 'Place of Birth', placeholder: '{{placeOfBirth}}', type: 'text' },
        { key: 'placeOfDeath', label: 'Place of Death', placeholder: '{{placeOfDeath}}', type: 'text' },
        { key: 'occupation', label: 'Occupation', placeholder: '{{occupation}}', type: 'text' },
        { key: 'nextOfKin', label: 'Next of Kin', placeholder: '{{nextOfKin}}', type: 'text' },
        { key: 'nextOfKinPhone', label: 'Next of Kin Phone', placeholder: '{{nextOfKinPhone}}', type: 'text' },
        { key: 'causeOfDeath', label: 'Cause of Death', placeholder: '{{causeOfDeath}}', type: 'textarea' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'cremation-cert-template',
      name: 'Cremation Certificate',
      type: 'certificate',
      description: 'Cremation authorization template',
      fields: [
        { key: 'certificateNumber', label: 'Certificate Number', placeholder: '{{certificateNumber}}', type: 'text' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'dateOfDeath', label: 'Date of Death', placeholder: '{{dateOfDeath}}', type: 'date' },
        { key: 'cremationDate', label: 'Cremation Date', placeholder: '{{cremationDate}}', type: 'date' },
        { key: 'crematorium', label: 'Crematorium', placeholder: '{{crematorium}}', type: 'text' },
        { key: 'authorizedBy', label: 'Authorized By', placeholder: '{{authorizedBy}}', type: 'text' },
        { key: 'witnessName', label: 'Witness Name', placeholder: '{{witnessName}}', type: 'text' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'burial-permit-template',
      name: 'Burial Permit',
      type: 'permit',
      description: 'Burial permit form template',
      fields: [
        { key: 'permitNumber', label: 'Permit Number', placeholder: '{{permitNumber}}', type: 'text' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'dateOfDeath', label: 'Date of Death', placeholder: '{{dateOfDeath}}', type: 'date' },
        { key: 'burialDate', label: 'Burial Date', placeholder: '{{burialDate}}', type: 'date' },
        { key: 'cemeteryName', label: 'Cemetery Name', placeholder: '{{cemeteryName}}', type: 'text' },
        { key: 'plotNumber', label: 'Plot Number', placeholder: '{{plotNumber}}', type: 'text' },
        { key: 'graveDepth', label: 'Grave Depth (ft)', placeholder: '{{graveDepth}}', type: 'number' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'embalming-consent-template',
      name: 'Embalming Consent',
      type: 'consent',
      description: 'Embalming consent form template',
      fields: [
        { key: 'consentDate', label: 'Consent Date', placeholder: '{{consentDate}}', type: 'date' },
        { key: 'deceasedName', label: 'Deceased Name', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'nextOfKinName', label: 'Next of Kin Name', placeholder: '{{nextOfKinName}}', type: 'text' },
        { key: 'relationship', label: 'Relationship', placeholder: '{{relationship}}', type: 'select', options: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other Relative'] },
        { key: 'embalmerName', label: 'Embalmer Name', placeholder: '{{embalmerName}}', type: 'text' },
        { key: 'consentGiven', label: 'Consent Given', placeholder: '{{consentGiven}}', type: 'select', options: ['Yes', 'No'] },
        { key: 'specialInstructions', label: 'Special Instructions', placeholder: '{{specialInstructions}}', type: 'textarea' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'death-certificate-template',
      name: 'Death Certificate Template',
      type: 'certificate',
      description: 'Official death certificate template',
      fields: [
        { key: 'certificateNumber', label: 'Certificate Number', placeholder: '{{certificateNumber}}', type: 'text' },
        { key: 'deceasedName', label: 'Full Name of Deceased', placeholder: '{{deceasedName}}', type: 'text' },
        { key: 'dateOfBirth', label: 'Date of Birth', placeholder: '{{dateOfBirth}}', type: 'date' },
        { key: 'dateOfDeath', label: 'Date of Death', placeholder: '{{dateOfDeath}}', type: 'date' },
        { key: 'placeOfDeath', label: 'Place of Death', placeholder: '{{placeOfDeath}}', type: 'text' },
        { key: 'causeOfDeath', label: 'Cause of Death', placeholder: '{{causeOfDeath}}', type: 'textarea' },
        { key: 'registeredBy', label: 'Registered By', placeholder: '{{registeredBy}}', type: 'text' },
        { key: 'registrationDate', label: 'Registration Date', placeholder: '{{registrationDate}}', type: 'date' }
      ],
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ];

  // Store default templates with 'system' tenant prefix
  defaultTemplates.forEach(t => {
    templatesStore.set(`system-${t.id}`, t);
  });
};

initializeTemplates();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantDir = path.join(documentsDir, req.tenantSlug);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    cb(null, tenantDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_');
    cb(null, `${req.tenantSlug}-doc-${name}-${uniqueSuffix}${ext}`);
  }
});

// Template-specific storage
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantDir = path.join(templatesDir, req.tenantSlug);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    cb(null, tenantDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_');
    cb(null, `${req.tenantSlug}-template-${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid template file type: ${file.mimetype}`));
    }
  }
});

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token', 'x-tenant-slug', 'x-tenant-id'],
}));

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(uploadsDir));

// Tenant Resolution Middleware - CRITICAL for multi-tenancy
app.use((req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'];
  
  if (!tenantSlug) {
    return res.status(400).json({
      success: false,
      message: 'Missing required header: x-tenant-slug'
    });
  }
  
  req.tenantSlug = tenantSlug;
  req.tenantId = req.headers['x-tenant-id'];
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Tenant: ${req.tenantSlug}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'UP',
      service: 'edocuments-service',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message
    });
  }
});

// ===== TEMPLATE MANAGEMENT ROUTES =====

// Get all templates (default + tenant-specific)
app.get('/templates', (req, res) => {
  try {
    const { search, type } = req.query;
    
    // Get default system templates
    const systemTemplates = Array.from(templatesStore.entries())
      .filter(([key]) => key.startsWith('system-'))
      .map(([, template]) => template);
    
    // Get tenant-specific templates
    const tenantTemplates = Array.from(templatesStore.entries())
      .filter(([key]) => key.startsWith(`${req.tenantSlug}-`))
      .map(([, template]) => template);
    
    let allTemplates = [...systemTemplates, ...tenantTemplates];
    
    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      allTemplates = allTemplates.filter(t => 
        t.name.toLowerCase().includes(searchTerm) ||
        (t.description && t.description.toLowerCase().includes(searchTerm)) ||
        t.type.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply type filter
    if (type && type !== 'all') {
      allTemplates = allTemplates.filter(t => t.type === type);
    }
    
    // Sort by creation date
    allTemplates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      message: 'Document templates retrieved successfully',
      data: {
        templates: allTemplates || [],
        count: allTemplates.length,
        filters: { search: search || '', type: type || 'all' },
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[TEMPLATES] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve templates'
    });
  }
});

// Get specific template
app.get('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Try tenant-specific first, then system
    let template = templatesStore.get(`${req.tenantSlug}-${templateId}`);
    if (!template) {
      template = templatesStore.get(`system-${templateId}`);
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template retrieved successfully',
      data: {
        ...template,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[TEMPLATE GET] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template'
    });
  }
});

// Upload/Create new template
app.post('/templates', templateUpload.single('templateFile'), (req, res) => {
  try {
    const { name, description, type, fields, canvasState } = req.body;
    
    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: name'
      });
    }

    if (!type || !type.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: type'
      });
    }

    // Parse fields if provided as JSON string
    let parsedFields = [];
    if (fields) {
      try {
        parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields;
      } catch (e) {
        parsedFields = [];
      }
    }

    // Parse canvas state if provided
    let parsedCanvasState = null;
    if (canvasState) {
      try {
        parsedCanvasState = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;
      } catch (e) {
        parsedCanvasState = null;
      }
    }

    const templateId = `custom-${Date.now()}`;
    const storeKey = `${req.tenantSlug}-${templateId}`;
    
    const template = {
      id: templateId,
      name: name.trim(),
      description: description ? description.trim() : '',
      type: type.trim(),
      fields: parsedFields,
      canvasState: parsedCanvasState,
      fileName: req.file ? req.file.filename : null,
      originalName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null,
      mimeType: req.file ? req.file.mimetype : null,
      url: req.file ? `/api/v1/restpoint/edocuments/templates/download/${req.file.filename}` : null,
      isDefault: false,
      tenant: req.tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templatesStore.set(storeKey, template);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    console.error('[TEMPLATE CREATE] Error:', error.message);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to cleanup file:', e.message);
      }
    }

    if (error.message.includes('Invalid template file type')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create template'
    });
  }
});

// Update template
app.put('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, description, type, fields, canvasState } = req.body;
    
    // Try tenant-specific first
    let storeKey = `${req.tenantSlug}-${templateId}`;
    let template = templatesStore.get(storeKey);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or not authorized to modify'
      });
    }

    // Don't allow modifying default templates
    if (template.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify default system templates'
      });
    }

    // Update only provided fields
    if (name !== undefined) template.name = name.trim();
    if (description !== undefined) template.description = description.trim();
    if (type !== undefined) template.type = type.trim();
    if (fields !== undefined) {
      template.fields = typeof fields === 'string' ? JSON.parse(fields) : fields;
    }
    if (canvasState !== undefined) {
      template.canvasState = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;
    }
    template.updatedAt = new Date().toISOString();

    templatesStore.set(storeKey, template);

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('[TEMPLATE UPDATE] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update template'
    });
  }
});

// Delete template
app.delete('/templates/:templateId', (req, res) => {
  try {
    const { templateId } = req.params;
    const storeKey = `${req.tenantSlug}-${templateId}`;
    
    const template = templatesStore.get(storeKey);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or not authorized to delete'
      });
    }

    // Don't allow deleting default templates
    if (template.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default system templates'
      });
    }

    // Try to delete the actual file
    if (template.fileName) {
      try {
        const filePath = path.join(templatesDir, req.tenantSlug, template.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn(`Failed to delete template file: ${e.message}`);
      }
    }

    templatesStore.delete(storeKey);

    res.json({
      success: true,
      message: 'Template deleted successfully',
      data: {
        id: templateId,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[TEMPLATE DELETE] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
});

// Download template file
app.get('/templates/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // First try tenant-specific templates directory
    let filePath = path.join(templatesDir, req.tenantSlug, filename);
    
    // Security check - ensure filename contains tenant slug
    if (!filename.startsWith(req.tenantSlug)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    res.download(filePath, (err) => {
      if (err && err.code !== 'ERR_HTTP_REQUEST_TIMEOUT') {
        console.error('Download error:', err.message);
      }
    });
  } catch (error) {
    console.error('[TEMPLATE DOWNLOAD] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
});

// ===== DOCUMENT AUTOFFILL ROUTE =====

// Generate document from template with autofill
app.post('/generate', (req, res) => {
  try {
    const { templateId, fieldValues, title, description } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: templateId'
      });
    }

    if (!fieldValues || typeof fieldValues !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: fieldValues'
      });
    }

    // Get template
    let template = templatesStore.get(`${req.tenantSlug}-${templateId}`);
    if (!template) {
      template = templatesStore.get(`system-${templateId}`);
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Generate document content with autofill
    let generatedContent = '';
    const filledFields = [];
    
    if (template.fields && template.fields.length > 0) {
      generatedContent += `${template.name}\n`;
      generatedContent += `${'='.repeat(50)}\n\n`;
      
      template.fields.forEach(field => {
        const value = fieldValues[field.key] || field.placeholder;
        generatedContent += `${field.label}: ${value}\n`;
        filledFields.push({
          key: field.key,
          label: field.label,
          value: value,
          wasPlaceholder: !fieldValues[field.key]
        });
      });
      
      generatedContent += `\n${'='.repeat(50)}\n`;
      generatedContent += `Generated: ${new Date().toISOString()}\n`;
    }

    // Create document record
    const docId = `gen-${Date.now()}`;
    const storeKey = `${req.tenantSlug}-${docId}`;
    
    const document = {
      id: docId,
      title: title || `${template.name} - Auto-generated`,
      description: description || `Generated from template: ${template.name}`,
      documentType: template.type,
      category: 'generated',
      templateId: template.id,
      templateName: template.name,
      generatedContent: generatedContent,
      filledFields: filledFields,
      fieldValues: fieldValues,
      status: 'active',
      tenant: req.tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    documentsStore.set(storeKey, document);

    res.status(201).json({
      success: true,
      message: 'Document generated successfully from template',
      data: document
    });
  } catch (error) {
    console.error('[DOCUMENT GENERATE] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate document from template'
    });
  }
});

// ===== EDOCUMENTS ROUTES =====

// Get all documents for tenant
app.get('/', (req, res) => {
  try {
    const { type, status, templateId, limit = '10', offset = '0' } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 100);
    const offsetNum = parseInt(offset) || 0;

    // Filter documents for this tenant only
    const allDocs = Array.from(documentsStore.entries())
      .filter(([key]) => key.startsWith(req.tenantSlug))
      .map(([, doc]) => doc);

    // Apply filters
    let filtered = allDocs;
    if (type && type !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === type);
    }
    if (status) {
      filtered = filtered.filter(doc => doc.status === status);
    }
    if (templateId && templateId !== 'all') {
      filtered = filtered.filter(doc => doc.templateId === templateId);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const total = filtered.length;
    const documents = filtered.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      message: 'Electronic documents retrieved successfully',
      data: {
        documents: documents || [],
        total: total,
        count: documents.length,
        filters: { type: type || 'all', status: status || 'all', templateId: templateId || 'all' },
        pagination: { limit: limitNum, offset: offsetNum, hasMore: offsetNum + limitNum < total },
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[DOCUMENTS GET] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// Get specific document
app.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const key = `${req.tenantSlug}-${id}`;
    const doc = documentsStore.get(key);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Electronic document retrieved successfully',
      data: doc
    });
  } catch (error) {
    console.error('[DOCUMENT GET] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document'
    });
  }
});

// Create/Upload new document
app.post('/', upload.single('document'), (req, res) => {
  try {
    const { title, description, documentType, category, deceasedId, invoiceId, canvasState, fieldValues } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: title'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: document file'
      });
    }

    const docId = Date.now().toString();
    const storeKey = `${req.tenantSlug}-${docId}`;
    
    // Parse canvas state and field values
    let parsedCanvasState = null;
    if (canvasState) {
      try {
        parsedCanvasState = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;
      } catch (e) {
        parsedCanvasState = null;
      }
    }

    let parsedFieldValues = {};
    if (fieldValues) {
      try {
        parsedFieldValues = typeof fieldValues === 'string' ? JSON.parse(fieldValues) : fieldValues;
      } catch (e) {
        parsedFieldValues = {};
      }
    }

    const document = {
      id: docId,
      title: title.trim(),
      description: description ? description.trim() : '',
      documentType: documentType || 'general',
      category: category || 'general',
      deceasedId: deceasedId || null,
      invoiceId: invoiceId || null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: `/api/v1/restpoint/edocuments/download/${req.file.filename}`,
      status: 'active',
      tenant: req.tenantSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasState: parsedCanvasState,
      fieldValues: parsedFieldValues
    };

    documentsStore.set(storeKey, document);

    res.status(201).json({
      success: true,
      message: 'Electronic document created successfully',
      data: document
    });
  } catch (error) {
    console.error('[DOCUMENT CREATE] Error:', error.message);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to cleanup file:', e.message);
      }
    }

    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// Update document metadata and content
app.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, documentType, category, status, fieldValues, canvasState, image } = req.body;
    const key = `${req.tenantSlug}-${id}`;
    
    const doc = documentsStore.get(key);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update only provided fields
    if (title !== undefined) doc.title = title.trim();
    if (description !== undefined) doc.description = description.trim();
    if (documentType !== undefined) doc.documentType = documentType;
    if (category !== undefined) doc.category = category;
    if (status !== undefined) doc.status = status;
    if (fieldValues !== undefined) doc.fieldValues = typeof fieldValues === 'string' ? JSON.parse(fieldValues) : fieldValues;
    if (canvasState !== undefined) doc.canvasState = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;

    // Handle image update (from canvas export)
    if (image) {
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const dataBuffer = Buffer.from(base64Data, 'base64');
        
        let fileName = doc.fileName;
        if (!fileName) {
          fileName = `${req.tenantSlug}-doc-${id}-${Date.now()}.png`;
          doc.fileName = fileName;
        }

        // If the original file was a PDF, rename it to PNG
        if (fileName.toLowerCase().endsWith('.pdf')) {
          try {
            const oldPath = path.join(documentsDir, req.tenantSlug, doc.fileName);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          } catch (e) {
            console.warn('Failed to delete old PDF:', e.message);
          }
          fileName = fileName.replace(/\.pdf$/i, '.png');
          doc.fileName = fileName;
          doc.mimeType = 'image/png';
          doc.url = `/api/v1/restpoint/edocuments/download/${fileName}`;
        }
        
        const filePath = path.join(documentsDir, req.tenantSlug, fileName);
        fs.writeFileSync(filePath, dataBuffer);
        doc.fileSize = dataBuffer.length;
      } catch (err) {
        console.error('Failed to write image file:', err.message);
      }
    }
    doc.updatedAt = new Date().toISOString();

    documentsStore.set(key, doc);

    res.json({
      success: true,
      message: 'Electronic document updated successfully',
      data: doc
    });
  } catch (error) {
    console.error('[DOCUMENT UPDATE] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
});

// Delete document
app.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const key = `${req.tenantSlug}-${id}`;
    
    const doc = documentsStore.get(key);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Try to delete the actual file
    if (doc.fileName) {
      try {
        const filePath = path.join(documentsDir, req.tenantSlug, doc.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn(`Failed to delete file: ${e.message}`);
      }
    }

    documentsStore.delete(key);

    res.json({
      success: true,
      message: 'Electronic document deleted successfully',
      data: {
        id,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[DOCUMENT DELETE] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// Download document
app.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(documentsDir, req.tenantSlug, filename);

    // Security check - ensure filename contains tenant slug
    if (!filename.startsWith(req.tenantSlug)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }

    res.download(filePath, (err) => {
      if (err && err.code !== 'ERR_HTTP_REQUEST_TIMEOUT') {
        console.error('Download error:', err.message);
      }
    });
  } catch (error) {
    console.error('[DOCUMENT DOWNLOAD] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// Get documents by deceased
app.get('/deceased/:deceasedId', (req, res) => {
  try {
    const { deceasedId } = req.params;

    const allDocs = Array.from(documentsStore.entries())
      .filter(([key]) => key.startsWith(req.tenantSlug))
      .map(([, doc]) => doc)
      .filter(doc => doc.deceasedId === deceasedId);

    res.json({
      success: true,
      message: 'Documents for deceased retrieved successfully',
      data: {
        deceasedId,
        documents: allDocs || [],
        count: allDocs.length,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[DECEASED DOCS] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// Get documents by invoice
app.get('/invoice/:invoiceId', (req, res) => {
  try {
    const { invoiceId } = req.params;

    const allDocs = Array.from(documentsStore.entries())
      .filter(([key]) => key.startsWith(req.tenantSlug))
      .map(([, doc]) => doc)
      .filter(doc => doc.invoiceId === invoiceId);

    res.json({
      success: true,
      message: 'Documents for invoice retrieved successfully',
      data: {
        invoiceId,
        documents: allDocs || [],
        count: allDocs.length,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[INVOICE DOCS] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// Search documents
app.post('/search', (req, res) => {
  try {
    const { query, type, status, templateId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchTerm = query.toLowerCase();
    const allDocs = Array.from(documentsStore.entries())
      .filter(([key]) => key.startsWith(req.tenantSlug))
      .map(([, doc]) => doc);

    let results = allDocs.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
      (doc.generatedContent && doc.generatedContent.toLowerCase().includes(searchTerm))
    );

    if (type && type !== 'all') {
      results = results.filter(doc => doc.documentType === type);
    }
    if (status && status !== 'all') {
      results = results.filter(doc => doc.status === status);
    }
    if (templateId && templateId !== 'all') {
      results = results.filter(doc => doc.templateId === templateId);
    }

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        results: results,
        count: results.length,
        query,
        tenant: req.tenantSlug
      }
    });
  } catch (error) {
    console.error('[SEARCH] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents'
    });
  }
});

// Get generated document content as text
app.get('/:id/content', (req, res) => {
  try {
    const { id } = req.params;
    const key = `${req.tenantSlug}-${id}`;
    const doc = documentsStore.get(key);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (!doc.generatedContent) {
      return res.status(400).json({
        success: false,
        message: 'This document does not have generated content'
      });
    }

    res.type('text/plain');
    res.send(doc.generatedContent);
  } catch (error) {
    console.error('[DOCUMENT CONTENT] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document content'
    });
  }
});

// Export document as PDF with filled fields
app.post('/:id/export-pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const key = `${req.tenantSlug}-${id}`;
    const doc = documentsStore.get(key);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Add title
    page.drawText(doc.title || 'Document', {
      x: 50,
      y: 800,
      size: 20,
      font: font,
      color: rgb(0, 0, 0)
    });

    // Add filled fields
    let yPosition = 750;
    if (doc.fieldValues) {
      Object.entries(doc.fieldValues).forEach(([key, value]) => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = 800;
        }
        
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        page.drawText(`${label}: ${value}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 25;
      });
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Send the PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.title || 'document'}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('[EXPORT PDF] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export PDF',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    path: req.originalUrl
  });
});

// Error handler - CRITICAL for production
app.use((err, req, res, next) => {
  console.error(`\n[ERROR] ${new Date().toISOString()}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}\n`);

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds 50MB limit'
    });
  }

  if (err.code === 'LIMIT_PART_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many parts in form'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ EDocuments Service Started (v2.0.0 - Full Features)');
  console.log('='.repeat(60));
  console.log(`📌 Service: edocuments-service v2.0.0`);
  console.log(`🔗 URL: http://0.0.0.0:${PORT}`);
  console.log(`📖 Health: http://localhost:${PORT}/health`);
  console.log(`📄 Endpoints:`);
  console.log(`   GET    /api/v1/restpoint/edocuments`);
  console.log(`   POST   /api/v1/restpoint/edocuments`);
  console.log(`   GET    /api/v1/restpoint/edocuments/:id`);
  console.log(`   PUT    /api/v1/restpoint/edocuments/:id`);
  console.log(`   DELETE /api/v1/restpoint/edocuments/:id`);
  console.log(`   POST   /api/v1/restpoint/edocuments/generate (autofill from template)`);
  console.log(`   POST   /api/v1/restpoint/edocuments/:id/export-pdf`);
  console.log(`   GET    /api/v1/restpoint/edocuments/templates`);
  console.log(`   POST   /api/v1/restpoint/edocuments/templates`);
  console.log(`   GET    /api/v1/restpoint/edocuments/templates/:id`);
  console.log(`   PUT    /api/v1/restpoint/edocuments/templates/:id`);
  console.log(`   DELETE /api/v1/restpoint/edocuments/templates/:id`);
  console.log(`   POST   /api/v1/restpoint/edocuments/search`);
  console.log(`📊 Upload Limit: 50MB`);
  console.log(`👥 Multi-tenant: Enabled (requires x-tenant-slug header)`);
  console.log(`📝 Templates: Default templates with autofill fields included`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;