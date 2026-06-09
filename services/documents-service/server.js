const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { safeQuery } = require('../../shared/dist/database');
const { validateTenantActive } = require('../../shared/dist/tenancy');

const app = express();
const PORT = process.env.PORT || 8112;

app.use(cors());
app.use(helmet());
app.use(express.json());

// ============ STORAGE CONFIGURATION ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';
    const deceasedId = req.params.deceasedId || req.body.deceasedId || 'unknown';
    const uploadPath = path.join(__dirname, 'uploads', tenantSlug, deceasedId);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// ============ TENANT RESOLUTION MIDDLEWARE ============
app.use(async (req, res, next) => {
  const tenantSlug = req.headers['x-tenant-slug'] || 'system_shared';
  req.tenantSlug = tenantSlug;

  if (tenantSlug !== 'system_shared') {
    const tenantStatus = await validateTenantActive(tenantSlug);
    if (!tenantStatus.active) {
      return res.status(403).json({ success: false, message: tenantStatus.reason });
    }
    req.tenant = tenantStatus.tenant;
  }
  next();
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'documents-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// ============ STATIC FILES ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ============ API ROUTES ============

// Get all documents for a specific deceased
app.get('/api/v1/restpoint/documents/:deceasedId', async (req, res) => {
  try {
    const { deceasedId } = req.params;
    const tenantSlug = req.tenantSlug;
    
    if (!deceasedId) {
      return res.status(400).json({ success: false, message: 'Deceased ID is required' });
    }

    // Query documents from database for this deceased
    const query = `
      SELECT 
        document_id,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size,
        category,
        uploaded_by,
        uploaded_at,
        deceased_id
      FROM documents 
      WHERE deceased_id = ? 
      ORDER BY uploaded_at DESC
    `;
    
    const documents = await safeQuery(query, [deceasedId]);
    
    // Format documents for frontend
    const formattedDocs = documents.map(doc => ({
      documentId: doc.document_id,
      originalName: doc.original_name,
      storedName: doc.stored_name,
      url: `/uploads/${tenantSlug}/${deceasedId}/${doc.stored_name}`,
      mimeType: doc.mime_type,
      sizeKB: Math.round(doc.file_size / 1024),
      category: doc.category || 'General',
      uploadedBy: doc.uploaded_by,
      uploadedAt: doc.uploaded_at,
      deceasedId: doc.deceased_id
    }));

    res.json({
      success: true,
      files: formattedDocs,
      count: formattedDocs.length
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents: ' + error.message
    });
  }
});

// Upload a new document for a deceased
app.post('/api/v1/restpoint/documents/:deceasedId/upload', upload.single('document'), async (req, res) => {
  try {
    const { deceasedId } = req.params;
    const { category, uploadedBy } = req.body;
    const tenantSlug = req.tenantSlug;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!deceasedId) {
      return res.status(400).json({ success: false, message: 'Deceased ID is required' });
    }

    const storedName = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;
    const filePath = `/uploads/${tenantSlug}/${deceasedId}/${storedName}`;

    // Insert document record into database
    const insertQuery = `
      INSERT INTO documents (
        deceased_id,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size,
        category,
        uploaded_by,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await safeQuery(insertQuery, [
      deceasedId,
      originalName,
      storedName,
      filePath,
      mimeType,
      fileSize,
      category || 'General',
      uploadedBy || 'System'
    ]);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        documentId: result.insertId,
        originalName,
        storedName,
        url: filePath,
        mimeType,
        sizeKB: Math.round(fileSize / 1024),
        category: category || 'General',
        uploadedBy: uploadedBy || 'System',
        uploadedAt: new Date().toISOString(),
        deceasedId
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document: ' + error.message
    });
  }
});

// Download/View a document
app.get('/api/v1/restpoint/documents/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const query = `
      SELECT stored_name, original_name, mime_type, file_path, deceased_id
      FROM documents 
      WHERE document_id = ?
    `;
    
    const docs = await safeQuery(query, [documentId]);
    
    if (!docs || docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];
    const tenantSlug = req.tenantSlug;
    const filePath = path.join(__dirname, 'uploads', tenantSlug, doc.deceased_id, doc.stored_name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_name}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document: ' + error.message
    });
  }
});

// Delete a document
app.delete('/api/v1/restpoint/documents/:deceasedId/:documentId', async (req, res) => {
  try {
    const { documentId, deceasedId } = req.params;
    const { deletedBy } = req.body;
    const tenantSlug = req.tenantSlug;

    // Get document info before deleting
    const query = `SELECT stored_name FROM documents WHERE document_id = ? AND deceased_id = ?`;
    const docs = await safeQuery(query, [documentId, deceasedId]);

    if (!docs || docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];
    const filePath = path.join(__dirname, 'uploads', tenantSlug, deceasedId, doc.stored_name);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from database
    const deleteQuery = `DELETE FROM documents WHERE document_id = ?`;
    await safeQuery(deleteQuery, [documentId]);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      deletedBy: deletedBy || 'System'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document: ' + error.message
    });
  }
});

// Share document via email
app.post('/api/v1/restpoint/documents/share', async (req, res) => {
  try {
    const { documentId, recipientEmail, message, documentName } = req.body;
    
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, log the share request
    console.log(`Document share request: ${documentName} to ${recipientEmail}`);
    console.log(`Message: ${message}`);

    res.json({
      success: true,
      message: `Document shared successfully via email to ${recipientEmail}`
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing document: ' + error.message
    });
  }
});

// ============ ERROR HANDLERS ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ============ SERVER STARTUP ============
const startServer = async () => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n📄 Documents Service running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`🌐 API Base: http://localhost:${PORT}/api/v1/restpoint\n`);
    });
  } catch (error) {
    console.error('Failed to start documents service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;