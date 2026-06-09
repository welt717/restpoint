import type { ChangeEvent } from 'react'
import type { FieldType } from '../../types'

interface SidebarLeftProps {
  onUpload: (file: File) => void
  onAddField: (type: FieldType) => void
}

const FIELD_BUTTONS: { type: FieldType; label: string }[] = [
  { type: 'text',      label: 'Text Field' },
  { type: 'signature', label: 'Signature Field' },
  { type: 'checkbox',  label: 'Checkbox' },
  { type: 'radio',     label: 'Radio Group' },
  { type: 'dropdown',  label: 'Dropdown' },
  { type: 'date',      label: 'Date Field' },
]

export const SidebarLeft = ({ onUpload, onAddField }: SidebarLeftProps) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    onUpload(file)
    event.target.value = ''
  }

  return (
    <aside className="panel panel--left">
      <h2>Template Builder</h2>
      <label className="upload-button">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        Upload PDF
      </label>
      <div className="button-group">
        {FIELD_BUTTONS.map(({ type, label }) => (
          <button key={type} type="button" onClick={() => onAddField(type)}>
            + {label}
          </button>
        ))}
      </div>
    </aside>
  )
}
