# Enterprise Document Editor & Template Designer
## Complete Document Management System for Mortuary Operations

### 🎯 Overview

This is a comprehensive, enterprise-grade document editing system designed for the Restpoint Mortuary Management Platform. It provides:

- **Template Designer** with Fabric.js canvas-based UI
- **Document Editor** with form fields and dynamic data
- **PDF Generation** with multi-page support
- **Digital Signatures** with capture and validation
- **Barcode Generation** (CODE128, QR, EAN13)
- **Document Versioning** & History tracking
- **Multi-field Support** (Text, Signature, Checkbox, Radio, Dropdown, Date)

---

### 📦 Installed Dependencies

#### PDF & Canvas
- `fabric` - Canvas drawing library for template design
- `pdf-lib` - Advanced PDF manipulation and generation
- `pdfjs-dist` - PDF rendering

#### Signatures
- `signature_pad` - Digital signature capture
- `react-signature-canvas` - React wrapper for signature pad

#### Barcodes
- `bwip-js` - Barcode generation (CODE128, QR, EAN, etc.)
- `jsbarcode` - Alternative barcode generator

#### Other
- `jspdf` - PDF creation utility
- `axios` - HTTP client for API calls
- `react-router-dom` - Routing
- `react-pdf` - PDF viewer component

---

### 🏗️ Architecture

```
edocuments/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── FabricCanvasEditor.tsx       # Main Fabric.js canvas
│   │   │   └── FabricCanvasEditor.css
│   │   ├── signature/
│   │   │   ├── SignatureCapture.tsx         # Signature pad modal
│   │   │   └── SignatureCapture.css
│   │   ├── layout/
│   │   ├── forms/
│   │   └── pdf/
│   ├── services/
│   │   ├── pdf/
│   │   │   └── PDFGenerationService.ts      # PDF generation
│   │   ├── barcode/
│   │   │   └── BarcodeGeneratorService.ts   # Barcode generation
│   │   ├── pdfService.ts
│   │   └── apiClient.ts
│   ├── pages/
│   │   ├── BuilderPage.tsx                  # Template designer
│   │   ├── TemplateList.tsx                 # Template library
│   │   ├── ESignPage.tsx                    # eSignature page
│   │   └── document/
│   │       ├── DocumentEditor.tsx           # Document editor
│   │       ├── DocumentHistory.tsx          # Version history
│   │       └── DocumentEditor.css
│   ├── types.ts                             # Type definitions
│   ├── config/
│   │   └── mockFields.ts
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts
```

---

### 🚀 Quick Start

#### Installation
```bash
cd FrontendClient/client/src/components/edocuments
npm install
```

#### Development
```bash
npm run dev
```

#### Build
```bash
npm run build
```

---

### 📋 Component Guide

#### 1. FabricCanvasEditor
Canvas-based template design interface with Fabric.js.

**Features:**
- Add text, shapes (rectangle, circle)
- Drag and drop positioning
- Property editor for selected elements
- Export/import canvas state as JSON
- Field creation and management

**Usage:**
```tsx
import { FabricCanvasEditor } from '../components/editor/FabricCanvasEditor'

<FabricCanvasEditor
  templateId="template-123"
  fields={fields}
  onFieldAdded={(field) => console.log(field)}
  onSave={(canvas) => saveTemplate(canvas)}
  readOnly={false}
/>
```

---

#### 2. DocumentEditor
Complete document editing interface with field binding and PDF generation.

**Features:**
- Load templates and bind data fields
- Signature capture integration
- Barcode generation
- Real-time PDF preview
- Document saving

**Usage:**
```tsx
import { DocumentEditor } from '../pages/document/DocumentEditor'

<DocumentEditor
  templateId="template-123"
  documentId="doc-456"
  onSave={(doc) => console.log(doc)}
  readOnly={false}
/>
```

---

#### 3. SignatureCapture
Modal for capturing digital signatures with touch support.

**Features:**
- Mouse and touch input support
- Clear/reset functionality
- PNG export
- Canvas-based drawing

**Usage:**
```tsx
import { SignatureCapture } from '../components/signature/SignatureCapture'

<SignatureCapture
  title="Capture Your Signature"
  onSave={(dataUrl) => console.log(dataUrl)}
  onCancel={() => setShowSignature(false)}
/>
```

---

#### 4. PDFGenerationService
Comprehensive PDF generation and manipulation.

**Methods:**
- `createFromTemplate()` - Create blank PDF
- `loadPDF()` - Load existing PDF
- `addText()` - Add text to PDF
- `addImage()` - Embed images
- `addSignature()` - Add signature image
- `addBarcode()` - Add barcode/QR code
- `addFormField()` - Add interactive form field
- `generateFromTemplateAndData()` - Generate with data
- `mergePDFs()` - Combine multiple PDFs
- `getPageCount()` - Get page information
- `downloadPDF()` - Download file

**Usage:**
```tsx
import { PDFGenerationService } from '../services/pdf/PDFGenerationService'

const pdfBytes = await PDFGenerationService.generateFromTemplateAndData(
  templateData,
  fields,
  { name: 'John Doe', date: '2026-06-07' },
  {
    signature: signatureDataUrl,
    barcode: barcodeDataUrl
  }
)

PDFGenerationService.downloadPDF(pdfBytes, 'document.pdf')
```

---

#### 5. BarcodeGeneratorService
Barcode and QR code generation.

**Methods:**
- `generateBarcode()` - Generate barcode with options
- `generateQRCode()` - Quick QR code
- `generateCODE128()` - CODE128 barcode
- `generateEAN13()` - EAN13 barcode
- `generateBatch()` - Multiple barcodes
- `generateDocumentBarcode()` - Document-specific barcode
- `validateBarcode()` - Validate format
- `createBarcodeWithLabel()` - Barcode with text label

**Usage:**
```tsx
import { BarcodeGeneratorService } from '../services/barcode/BarcodeGeneratorService'

const qrCode = BarcodeGeneratorService.generateQRCode('https://example.com')
const barcode = BarcodeGeneratorService.generateCODE128('DOC-12345')
const docBarcode = BarcodeGeneratorService.generateDocumentBarcode(
  'doc-123',
  'TENANT_001'
)
```

---

#### 6. DocumentHistory
Track document versions with rollback capability.

**Features:**
- Version timeline
- Status filtering (draft, signed, archived)
- Version metadata
- Signature preview
- Restore/download actions

**Usage:**
```tsx
import { DocumentHistory } from '../pages/document/DocumentHistory'

<DocumentHistory
  documentId="doc-123"
  versions={versionArray}
  onVersionRestore={(versionId) => restoreVersion(versionId)}
  onVersionDownload={(versionId) => downloadVersion(versionId)}
/>
```

---

### 🎨 Styling

All components use CSS modules with responsive design.

- **Colors**: Primary (#3b82f6), Success (#10b981), Error (#ef4444), Warning (#f59e0b)
- **Typography**: Inter/system font stack
- **Grid**: Flexbox and CSS Grid
- **Mobile**: Optimized for tablets and phones (breakpoints at 1024px, 768px)

---

### 📊 Data Models

#### TemplateField
```typescript
interface TemplateField {
  id: string
  name: string
  type: 'text' | 'signature' | 'checkbox' | 'radio' | 'dropdown' | 'date'
  page: number
  x: number           // Relative position (0-1)
  y: number
  width: number       // Relative size (0-1)
  height: number
  options?: string[]  // For radio/dropdown
}
```

#### DocumentVersion
```typescript
interface DocumentVersion {
  id: string | number
  versionNumber: number
  createdAt: Date
  createdBy: string
  changeDescription: string
  status: 'draft' | 'signed' | 'archived' | 'revoked'
  signature?: string
  tags?: string[]
}
```

---

### 🔌 API Integration

The system integrates with:

- **Template API** (`/api/templates`) - CRUD templates
- **Document API** (`/api/documents`) - CRUD documents  
- **PDF Generation API** (`/api/pdf/generate`) - Server-side PDF generation
- **Upload API** (`/api/upload`) - File uploads

Base URL configured in `apiClient.ts`:
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
})
```

---

### 📱 Features in Detail

#### Template Designer (BuilderPage)
- Drag-and-drop canvas interface
- Field type selection (text, signature, checkbox, etc.)
- Property editor (position, size, styling)
- Template naming and organization
- Preview generation
- Save to local storage or API

#### Document Editor
- Load existing template
- Bind data to fields
- Signature capture
- Barcode generation (unique per document)
- Real-time PDF preview
- Download as PDF
- Save document state

#### PDF Generation
- Multi-page support
- Dynamic field filling
- Signature embedding
- Barcode placement
- Text formatting
- Image embedding
- Form field creation

#### Barcode System
- CODE128 (general purpose)
- CODE39 (alphanumeric)
- EAN13/EAN8 (retail)
- QR codes (links, data)
- Document-specific codes
- Custom labels and checksums

#### Signature Management
- Canvas-based drawing
- Touch support (tablets, phones)
- Clear/reset functionality
- PNG export
- Timestamp metadata
- Version tracking

#### Document Versioning
- Automatic version numbering
- Change descriptions
- Status tracking (draft, signed, etc.)
- Restore to previous version
- Download specific version
- Filter by status

---

### 🔒 Security Considerations

- Signatures are stored as base64 PNG images
- Document data stored securely on server
- API endpoints should require authentication
- Barcode/QR codes can be validated server-side
- PDF generation can be done server-side for sensitive data

---

### 🚨 Error Handling

All services include try-catch error handling:

```typescript
try {
  const pdfBytes = await PDFGenerationService.generateFromTemplateAndData(...)
} catch (error) {
  console.error('PDF generation failed:', error)
  setStatus(`Error: ${error.message}`)
}
```

---

### 🧪 Testing

Components are ready for unit testing with Jest/Vitest:

```typescript
// Example test
test('FabricCanvasEditor adds field correctly', () => {
  const mockOnFieldAdded = vi.fn()
  render(
    <FabricCanvasEditor onFieldAdded={mockOnFieldAdded} />
  )
  // ... assertions
})
```

---

### 📈 Performance Optimizations

- Canvas rendering optimized for large documents
- PDF generation runs asynchronously
- Lazy loading for templates and documents
- Image optimization before embedding
- Efficient field mapping and data binding

---

### 🔄 Routing

```
/                   → Template List
/builder            → Template Designer
/document/:id       → Document Editor
/document/:id/history → Document Version History
/sign/:id           → eSignature Page
/editor             → Quick Document Editor
```

---

### 🆘 Troubleshooting

**Canvas not rendering:**
- Check Fabric.js is installed
- Ensure canvas element has dimensions
- Verify browser supports HTML5 Canvas

**PDF generation fails:**
- Ensure pdf-lib is installed
- Check field dimensions are valid
- Verify image URLs are accessible

**Barcode not generating:**
- Install jsbarcode or bwip-js
- Check barcode value matches format requirements
- Validate format string (CODE128, QR, etc.)

**Signature not capturing:**
- Ensure signature_pad is installed
- Check canvas dimensions
- Verify touch/mouse events are not blocked

---

### 📝 License

MIT - See LICENSE file

---

### 🤝 Contributing

Please ensure all new components:
1. Follow TypeScript types
2. Include CSS modules
3. Have prop documentation
4. Are responsive design
5. Include error handling

---

### 📞 Support

For issues or questions, contact the development team or check documentation at `/docs`.

---

**Version**: 1.0.0  
**Last Updated**: June 7, 2026  
**Status**: Production Ready ✅
