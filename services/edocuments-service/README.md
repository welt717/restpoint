# E-Documents Service

A comprehensive document management system for funeral homes using Fabric.js for canvas-based editing, similar to QuickBooks document handling.

## Features

### 🎨 **Canvas-Based Document Editor**
- **Fabric.js Integration**: Full-featured canvas editor for document manipulation
- **PDF Support**: Upload and edit PDF documents (rendered as images)
- **Image Support**: JPEG, PNG, GIF file support
- **Drawing Tools**: Pen, eraser, shapes (rectangles, circles)
- **Text Editing**: Add and edit text boxes directly on documents
- **Digital Signatures**: Draw and apply signatures to documents
- **Undo/Redo**: Full history management with undo/redo capabilities
- **Zoom Controls**: Zoom in/out for detailed editing

### 📋 **Template Management**
- **Pre-built Templates**: 9 default templates for funeral home operations:
  - Invoice
  - Receipt
  - Funeral Service Agreement
  - Authorization Form
  - Deceased Information Form
  - Cremation Certificate
  - Burial Permit
  - Embalming Consent
  - Death Certificate
- **Custom Templates**: Create custom templates with defined fields
- **Template Fields**: Support for text, number, date, textarea, and select fields

### 📝 **AutoFill & Form Generation**
- **Quick Fill**: Fill template fields and generate documents instantly
- **Field Mapping**: Automatic field mapping from templates to documents
- **Data Persistence**: Save filled field values with documents

### 📁 **Document Management**
- **Multi-tenant Support**: Each tenant's documents are isolated
- **Search & Filter**: Search documents by title/description, filter by type
- **Grid/List View**: Toggle between grid and list views
- **Download**: Download original documents
- **Export PDF**: Export documents with filled fields as PDF
- **Delete**: Remove documents when no longer needed

## Architecture

### Backend (Node.js/Express)
```
apps/edocuments-service/
├── server.js           # Main server file with all routes
├── package.json        # Dependencies
├── uploads/
│   ├── _templates/     # Template files storage
│   └── _documents/     # Document files storage
└── .env               # Environment configuration
```

### Frontend (React)
```
FrontendClient/client/src/components/edocuments/
├── EDocumentsPage.jsx          # Main page with document list & templates
├── DocumentEditor.jsx          # Fabric.js canvas editor
├── EnhancedDocumentEditor.jsx  # Alternative editor with field panels
├── EnhancedDocumentEditor.css  # Editor styling
└── README.md                   # Component documentation
```

## API Endpoints

### Health Check
```
GET /health
```

### Templates
```
GET    /api/v1/restpoint/edocuments/templates          # List all templates
GET    /api/v1/restpoint/edocuments/templates/:id      # Get specific template
POST   /api/v1/restpoint/edocuments/templates          # Create new template
PUT    /api/v1/restpoint/edocuments/templates/:id      # Update template
DELETE /api/v1/restpoint/edocuments/templates/:id      # Delete template
GET    /api/v1/restpoint/edocuments/templates/download/:filename  # Download template file
```

### Documents
```
GET    /api/v1/restpoint/edocuments                    # List all documents
GET    /api/v1/restpoint/edocuments/:id                # Get specific document
POST   /api/v1/restpoint/edocuments                    # Create/upload document
PUT    /api/v1/restpoint/edocuments/:id                # Update document
DELETE /api/v1/restpoint/edocuments/:id                # Delete document
GET    /api/v1/restpoint/edocuments/download/:filename # Download document
POST   /api/v1/restpoint/edocuments/generate           # Generate from template
POST   /api/v1/restpoint/edocuments/:id/export-pdf     # Export as PDF
GET    /api/v1/restpoint/edocuments/:id/content        # Get generated content
GET    /api/v1/restpoint/edocuments/deceased/:id       # Get documents by deceased
GET    /api/v1/restpoint/edocuments/invoice/:id        # Get documents by invoice
POST   /api/v1/restpoint/edocuments/search             # Search documents
```

## Multi-Tenancy

All endpoints require the `x-tenant-slug` header for tenant identification:

```javascript
headers: {
  'x-tenant-slug': 'tenant-name'
}
```

## Usage Examples

### 1. Upload and Edit a Document

```javascript
// Frontend: Upload file and open in editor
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  // Open DocumentEditor with file
  setEditingFile(file);
  setShowEditor(true);
};

// DocumentEditor will:
// 1. Render PDF as image background (using PDF.js)
// 2. Allow editing with Fabric.js tools
// 3. Save canvas state and export as PNG
```

### 2. Create a Template with Fields

```javascript
const template = {
  name: 'Service Invoice',
  type: 'invoice',
  description: 'Standard funeral service invoice',
  fields: [
    { key: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
    { key: 'clientName', label: 'Client Name', type: 'text' },
    { key: 'serviceDate', label: 'Service Date', type: 'date' },
    { key: 'totalAmount', label: 'Total Amount', type: 'number' }
  ]
};

// POST to /templates endpoint
```

### 3. AutoFill Template and Generate Document

```javascript
const fieldValues = {
  invoiceNumber: 'INV-2024-001',
  clientName: 'John Doe',
  serviceDate: '2024-01-15',
  totalAmount: 5000
};

// POST to /generate endpoint with templateId and fieldValues
// Returns a new document with filled fields
```

### 4. Edit Document on Canvas

```javascript
// In DocumentEditor component:
// 1. Load document background (PDF/Image)
// 2. Add text boxes, shapes, signatures
// 3. Save canvas state (JSON) and export image
// 4. PUT to /:id endpoint with canvasState and image
```

## Default Templates

The service includes 9 pre-built templates for funeral home operations:

1. **Invoice** - For billing funeral services
2. **Receipt** - Payment confirmation
3. **Funeral Service Agreement** - Contract with client
4. **Authorization Form** - Family authorization
5. **Deceased Information Form** - Personal details
6. **Cremation Certificate** - Cremation authorization
7. **Burial Permit** - Burial authorization
8. **Embalming Consent** - Embalming permission
9. **Death Certificate** - Official death record

Each template includes relevant fields with proper input types (text, date, number, select, textarea).

## Canvas Editor Features

### Tools
- **Select/Move**: Select and reposition elements
- **Text**: Add editable text boxes
- **Pen**: Freehand drawing
- **Eraser**: White brush for erasing on white background
- **Rectangle**: Draw rectangles
- **Circle**: Draw circles
- **Signature**: Draw and apply digital signatures
- **Logo**: Upload and insert images

### Properties
- **Brush Color**: Choose from color palette
- **Brush Size**: Adjust stroke width
- **Zoom**: 50% - 200% zoom levels
- **Undo/Redo**: Full history support

### Export Options
- **Save**: Persist to server with canvas state
- **Download PNG**: Export as image file
- **Print**: Print document directly
- **Export PDF**: Generate PDF with field values

## Installation

### Backend
```bash
cd apps/edocuments-service
npm install
npm start
```

### Frontend
```bash
cd FrontendClient/client
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=8116
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1/restpoint
```

## Database Integration (Future)

Currently uses in-memory storage (Map). For production:

1. Replace Map storage with database calls
2. Use MySQL/PostgreSQL for document metadata
3. Use S3/Azure Blob for file storage
4. Implement proper authentication
5. Add document versioning
6. Add audit logging

## Security Considerations

1. **File Upload Limits**: 50MB max file size
2. **File Type Validation**: Only allow specific MIME types
3. **Tenant Isolation**: Documents isolated by tenant slug
4. **Path Traversal Protection**: Validate file paths
5. **CORS Configuration**: Restrict allowed origins

## Performance Optimizations

1. **Image Compression**: Compress uploaded images
2. **Canvas Optimization**: Limit canvas size for performance
3. **Lazy Loading**: Load documents on demand
4. **Caching**: Cache frequently accessed templates
5. **Pagination**: Limit documents per page

## Future Enhancements

1. **OCR Integration**: Extract text from scanned documents
2. **Digital Signatures**: PKI-based signatures
3. **Document Versioning**: Track document changes
4. **Collaborative Editing**: Real-time multi-user editing
5. **Workflow Approval**: Document approval workflows
6. **E-Signature Integration**: DocuSign/HelloSign integration
7. **Barcode/QR Codes**: Generate barcodes on documents
8. **Batch Processing**: Process multiple documents
9. **Document Analytics**: Usage statistics
10. **Mobile Optimization**: Better mobile editing experience

## Troubleshooting

### PDF Not Rendering
- Check PDF.js worker is loaded correctly
- Verify PDF file is not corrupted
- Check browser console for errors

### Canvas Not Saving
- Verify tenant slug is set in headers
- Check file permissions on uploads directory
- Ensure canvas state is valid JSON

### Templates Not Loading
- Verify templates are initialized on server start
- Check tenant slug matches template ownership
- Ensure database connection (if using DB)

## Support

For issues and questions:
1. Check the README.md files in each component
2. Review the API endpoint documentation
3. Check browser/server console logs
4. Contact the development team

## License

Proprietary - Montezuma Mortuary SaaS Platform