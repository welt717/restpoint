import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Document, Page } from 'react-pdf'
import { getTemplate, generatePdf } from '../services/pdfService'
import { SignatureModal } from '../components/esign/SignatureModal'

interface ApiField {
  id: number
  field_name: string
  type: 'text' | 'signature' | 'checkbox' | 'radio' | 'dropdown' | 'date'
  options?: string[]
  page: number
  x: number
  y: number
  width: number
  height: number
}

interface TemplateData {
  id: number
  name: string
  file_url: string
  fields: ApiField[]
}

const MAX_WIDTH = 900

export function ESignPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // page px dimensions keyed by page number
  const [pageDims, setPageDims] = useState<Record<number, { width: number; height: number }>>({})

  // field values: field_name → text value
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  // signatures: field_name → base64 png
  const [signatures, setSignatures] = useState<Record<string, string>>({})

  const [activeSignatureField, setActiveSignatureField] = useState<ApiField | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getTemplate(id)
      .then((res) => setTemplate(res.data.data))
      .catch(() => setError('Failed to load template.'))
      .finally(() => setLoading(false))
  }, [id])

  const allPages = template
    ? [...new Set(template.fields.map((f) => f.page))].sort((a, b) => a - b)
    : []

  // If template has no fields, we still render page 1
  const pagesToRender = allPages.length > 0 ? allPages : [1]

  const handleSubmit = async () => {
    if (!template) return
    setSubmitting(true)
    try {
      // Use the first signature value found (or empty)
      const firstSig = Object.values(signatures)[0] ?? ''
      const response = await generatePdf({
        template_id: template.id,
        data: fieldValues,
        signature: firstSig,
      })
      setDownloadUrl(response.data.download_url)
    } catch {
      setError('Failed to generate signed PDF. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="esign-loading">Loading template…</div>
  }

  if (error && !template) {
    return <div className="esign-loading" style={{ color: '#dc2626' }}>{error}</div>
  }

  return (
    <div className="esign-shell">
      {/* Top bar */}
      <div className="esign-topbar">
        <button onClick={() => navigate('/')}>← Back</button>
        <h2 style={{ margin: 0 }}>{template?.name}</h2>
        {downloadUrl ? (
          <a href={downloadUrl} download="signed.pdf">
            <button className="primary">Download Signed PDF</button>
          </a>
        ) : (
          <button className="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Generating…' : 'Submit & Sign'}
          </button>
        )}
      </div>

      {downloadUrl && (
        <div className="esign-success">
          Signed PDF ready.{' '}
          <a href={downloadUrl} target="_blank" rel="noreferrer">Open in browser</a>
        </div>
      )}

      {error && <div className="esign-error">{error}</div>}

      {/* PDF pages with overlaid fields */}
      <div className="esign-scroll" ref={containerRef}>
        {template && pagesToRender.map((pageNum) => {
          const dims = pageDims[pageNum]
          const pageFields = template.fields.filter((f) => f.page === pageNum)

          return (
            <div key={pageNum} className="esign-page-wrap">
              <div className="esign-page-inner" style={{ position: 'relative', display: 'inline-block' }}>
                <Document file={template.file_url} loading="">
                  <Page
                    pageNumber={pageNum}
                    width={MAX_WIDTH}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onRenderSuccess={(page) => {
                      setPageDims((prev) => ({
                        ...prev,
                        [pageNum]: { width: page.originalWidth, height: page.originalHeight },
                      }))
                    }}
                  />
                </Document>

                {/* Field overlays — only render once we know page dimensions */}
                {dims && pageFields.map((field) => {
                  const scale = MAX_WIDTH / dims.width
                  const px = {
                    left: field.x * dims.width * scale,
                    top: field.y * dims.height * scale,
                    width: field.width * dims.width * scale,
                    height: field.height * dims.height * scale,
                  }

                  // ── Signature ──────────────────────────────────────
                  if (field.type === 'signature') {
                    const hasSig = !!signatures[field.field_name]
                    return (
                      <div
                        key={field.id}
                        className="esign-sig-field"
                        style={{ ...px, position: 'absolute' }}
                        onClick={() => setActiveSignatureField(field)}
                        title="Click to sign"
                      >
                        {hasSig ? (
                          <img
                            src={signatures[field.field_name]}
                            alt="signature"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span className="esign-sig-placeholder">✎ Click to sign</span>
                        )}
                      </div>
                    )
                  }

                  // ── Checkbox ────────────────────────────────────────
                  if (field.type === 'checkbox') {
                    const checked = fieldValues[field.field_name] === 'true'
                    return (
                      <div
                        key={field.id}
                        style={{ ...px, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onClick={() =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [field.field_name]: checked ? 'false' : 'true',
                          }))
                        }
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={checked}
                          style={{ width: px.height * 0.7, height: px.height * 0.7, cursor: 'pointer', accentColor: '#2563eb' }}
                        />
                      </div>
                    )
                  }

                  // ── Radio group ─────────────────────────────────────
                  if (field.type === 'radio') {
                    const opts = field.options ?? []
                    return (
                      <div
                        key={field.id}
                        style={{ ...px, position: 'absolute', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '2px 4px', boxSizing: 'border-box' }}
                      >
                        {opts.map((opt) => (
                          <label
                            key={opt}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: Math.max(9, px.height / opts.length * 0.55), cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            <input
                              type="radio"
                              name={field.field_name}   // same name = single-select group
                              value={opt}
                              checked={fieldValues[field.field_name] === opt}
                              onChange={() =>
                                setFieldValues((prev) => ({ ...prev, [field.field_name]: opt }))
                              }
                              style={{ accentColor: '#2563eb', flexShrink: 0 }}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )
                  }

                  // ── Dropdown ────────────────────────────────────────
                  if (field.type === 'dropdown') {
                    return (
                      <select
                        key={field.id}
                        className="esign-text-field"
                        style={{ ...px, position: 'absolute', cursor: 'pointer' }}
                        value={fieldValues[field.field_name] ?? ''}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.field_name]: e.target.value }))
                        }
                      >
                        <option value="">Select…</option>
                        {(field.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )
                  }

                  // ── Date ────────────────────────────────────────────
                  if (field.type === 'date') {
                    return (
                      <input
                        key={field.id}
                        type="date"
                        className="esign-text-field"
                        style={{ ...px, position: 'absolute' }}
                        value={fieldValues[field.field_name] ?? ''}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.field_name]: e.target.value }))
                        }
                      />
                    )
                  }

                  // ── Text (default) ──────────────────────────────────
                  return (
                    <input
                      key={field.id}
                      type="text"
                      className="esign-text-field"
                      style={{ ...px, position: 'absolute' }}
                      placeholder={field.field_name}
                      value={fieldValues[field.field_name] ?? ''}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.field_name]: e.target.value }))
                      }
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Signature capture modal */}
      {activeSignatureField && (
        <SignatureModal
          fieldName={activeSignatureField.field_name}
          onSave={(dataUrl) =>
            setSignatures((prev) => ({ ...prev, [activeSignatureField.field_name]: dataUrl }))
          }
          onClose={() => setActiveSignatureField(null)}
        />
      )}
    </div>
  )
}
