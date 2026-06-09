import { useState } from 'react'
import { FabricCanvasEditor } from '../../components/editor/FabricCanvasEditor'
import { SignatureCapture } from '../../components/signature/SignatureCapture'
import { PDFGenerationService } from '../../services/pdf/PDFGenerationService'
import { BarcodeGeneratorService } from '../../services/barcode/BarcodeGeneratorService'
import type { TemplateField } from '../../types'
import './DocumentEditor.css'

interface DocumentEditorProps {
  documentId?: number | string
  onSave?: (doc: any) => void
  readOnly?: boolean
}

export function DocumentEditor({
  documentId,
  onSave,
  readOnly = false
}: DocumentEditorProps) {
  const [fields, setFields] = useState<TemplateField[]>([])
  const [data, setData] = useState<Record<string, string>>({})
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [barcode, setBarcode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('Ready')

  const handleFieldAdded = (field: TemplateField) => {
    setFields(prev => [...prev, field])
    setData(prev => ({ ...prev, [field.id]: '' }))
  }

  const handleDataChange = (fieldId: string, value: string) => {
    setData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSignatureCapture = (signatureDataUrl: string) => {
    setSignature(signatureDataUrl)
    setShowSignaturePad(false)
    setStatus('Signature captured successfully')
  }

  const handleGenerateBarcode = () => {
    if (!documentId) {
      setStatus('Document ID required for barcode generation')
      return
    }
    try {
      const barcodeUrl = BarcodeGeneratorService.generateDocumentBarcode(
        documentId.toString(),
        'TENANT_001'
      )
      setBarcode(barcodeUrl)
      setStatus('Barcode generated successfully')
    } catch (error) {
      setStatus(`Error generating barcode: ${error}`)
    }
  }

  const handleGeneratePDF = async () => {
    setIsSaving(true)
    setStatus('Generating PDF...')
    try {
      const pdfBytes = await PDFGenerationService.generateFromTemplateAndData(
        null,
        fields,
        data,
        {
          signature: signature || undefined,
          barcode: barcode || undefined,
        }
      )

      // Download PDF
      PDFGenerationService.downloadPDF(
        pdfBytes,
        `document-${documentId || 'draft'}.pdf`
      )

      setStatus('PDF generated and downloaded')
      
      if (onSave) {
        onSave({
          documentId,
          fields,
          data,
          signature,
          barcode,
          pdfBytes,
        })
      }
    } catch (error) {
      setStatus(`Error generating PDF: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="document-editor">
      <div className="document-editor-header">
        <h1>Document Editor</h1>
        <div className="document-status">
          <span className="status-indicator" />
          {status}
        </div>
      </div>

      <div className="document-editor-layout">
        <div className="document-main">
          <FabricCanvasEditor
            onFieldAdded={handleFieldAdded}
            readOnly={readOnly}
          />
        </div>

        <div className="document-sidebar">
          <div className="sidebar-section">
            <h3>Document Fields</h3>
            <div className="fields-list">
              {fields.map(field => (
                <div key={field.id} className="field-input">
                  <label>{field.name}</label>
                  <input
                    type="text"
                    value={data[field.id] || ''}
                    onChange={e => handleDataChange(field.id, e.target.value)}
                    placeholder={`Enter ${field.name}`}
                    disabled={readOnly}
                  />
                </div>
              ))}
              {fields.length === 0 && (
                <p className="no-fields">No fields added yet</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Signature</h3>
            {signature ? (
              <div className="signature-preview">
                <img src={signature} alt="Signature" />
                <button
                  onClick={() => setSignature(null)}
                  className="btn-small"
                  disabled={readOnly}
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSignaturePad(true)}
                className="btn-primary"
                disabled={readOnly}
              >
                Add Signature
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Barcode</h3>
            {barcode ? (
              <div className="barcode-preview">
                <img src={barcode} alt="Barcode" />
                <button
                  onClick={() => setBarcode(null)}
                  className="btn-small"
                  disabled={readOnly}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateBarcode}
                className="btn-secondary"
                disabled={readOnly || !documentId}
              >
                Generate Barcode
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Actions</h3>
            <button
              onClick={handleGeneratePDF}
              className="btn-primary"
              disabled={isSaving || readOnly || fields.length === 0}
            >
              {isSaving ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>

      {showSignaturePad && (
        <SignatureCapture
          onSave={handleSignatureCapture}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  )
}

export default DocumentEditor
