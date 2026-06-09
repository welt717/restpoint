import { useState } from 'react'
import { SignaturePadEditor } from '../forms/SignaturePadEditor'

interface SignatureModalProps {
  fieldName: string
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function SignatureModal({ fieldName, onSave, onClose }: SignatureModalProps) {
  const [value, setValue] = useState('')

  const handleSave = () => {
    if (!value) return
    onSave(value)
    onClose()
  }

  return (
    <div className="sig-modal-backdrop" onClick={onClose}>
      <div className="sig-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sig-modal-header">
          <h3>Sign: {fieldName}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <p className="muted">Draw your signature below</p>
        <SignaturePadEditor value={value} onChange={setValue} />
        <div className="sig-modal-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!value} onClick={handleSave}>
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  )
}
