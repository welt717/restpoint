import type { TemplateField } from '../../types'
import { SignaturePadEditor } from './SignaturePadEditor'

interface FieldPropertiesPanelProps {
  selectedField: TemplateField | null
  mapping: Record<string, string>
  mockFields: readonly string[]
  dataInputs: Record<string, string>
  signatureValue: string
  onFieldNameChange: (value: string) => void
  onMappingChange: (fieldName: string, column: string) => void
  onDataInputChange: (column: string, value: string) => void
  onSignatureChange: (value: string) => void
  onOptionsChange: (options: string[]) => void
  onDeleteField: () => void
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text:      'Text Field',
  signature: 'Signature Field',
  checkbox:  'Checkbox',
  radio:     'Radio Group',
  dropdown:  'Dropdown',
  date:      'Date Field',
}

export const FieldPropertiesPanel = ({
  selectedField,
  mapping,
  mockFields,
  dataInputs,
  signatureValue,
  onFieldNameChange,
  onMappingChange,
  onDataInputChange,
  onSignatureChange,
  onOptionsChange,
  onDeleteField,
}: FieldPropertiesPanelProps) => {
  if (!selectedField) {
    return (
      <aside className="panel panel--right">
        <h2>Field Properties</h2>
        <p className="muted">Click a field on the document to configure it.</p>
      </aside>
    )
  }

  const mappedColumn = mapping[selectedField.name] ?? ''
  const typeLabel = FIELD_TYPE_LABELS[selectedField.type] ?? selectedField.type

  const handleOptionsTextChange = (raw: string) => {
    onOptionsChange(raw.split('\n').map((s) => s.trim()).filter(Boolean))
  }

  return (
    <aside className="panel panel--right">
      <h2>{typeLabel}</h2>

      <div className="form-row">
        <label>Name</label>
        <input
          value={selectedField.name}
          onChange={(event) => onFieldNameChange(event.target.value)}
        />
      </div>

      {/* Options editor for radio and dropdown */}
      {(selectedField.type === 'radio' || selectedField.type === 'dropdown') && (
        <div className="form-row">
          <label>Options (one per line)</label>
          <textarea
            rows={4}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', padding: '0.4rem', border: '1px solid #cbd5f5', borderRadius: '6px' }}
            value={(selectedField.options ?? []).join('\n')}
            onChange={(e) => handleOptionsTextChange(e.target.value)}
          />
        </div>
      )}

      <div className="form-row">
        <label>Database Mapping</label>
        <select
          value={mappedColumn}
          onChange={(event) => onMappingChange(selectedField.name, event.target.value)}
        >
          <option value="">Pick a column</option>
          {mockFields.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>Mapping preview</label>
        <div className="mapping-preview">
          {selectedField.name} → {mappedColumn || 'not mapped'}
        </div>
      </div>

      <div className="data-input-grid">
        <p>Mock data payload</p>
        {mockFields.map((column) => (
          <div key={column} className="data-row">
            <span>{column}</span>
            <input
              type="text"
              placeholder={`Enter ${column}`}
              value={dataInputs[column] ?? ''}
              onChange={(event) => onDataInputChange(column, event.target.value)}
            />
          </div>
        ))}
      </div>

      {selectedField.type === 'signature' && (
        <div className="signature-panel">
          <p>Signature pad</p>
          <SignaturePadEditor value={signatureValue} onChange={onSignatureChange} />
          {signatureValue ? (
            <p className="muted">Signature ready to embed.</p>
          ) : (
            <p className="muted">Draw to capture the signature.</p>
          )}
        </div>
      )}

      <button type="button" className="destructive" onClick={onDeleteField}>
        Delete field
      </button>
    </aside>
  )
}
