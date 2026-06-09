import React, { useRef, useState } from 'react'
import SignaturePad from 'signature_pad'
import './SignatureCapture.css'

interface SignatureCaptureProps {
  onSave?: (signatureDataUrl: string) => void
  onCancel?: () => void
  title?: string
}

export function SignatureCapture({
  onSave,
  onCancel,
  title = 'Capture Signature'
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  React.useEffect(() => {
    if (!canvasRef.current) return

    // Set canvas size to match container
    const canvas = canvasRef.current
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    }

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
    })

    signaturePadRef.current = signaturePad

    // Add event listener instead of property assignment
    const handleDrawEnd = () => {
      setIsEmpty(signaturePad.isEmpty())
    }

    canvas.addEventListener('mouseup', handleDrawEnd)
    canvas.addEventListener('touchend', handleDrawEnd)

    return () => {
      canvas.removeEventListener('mouseup', handleDrawEnd)
      canvas.removeEventListener('touchend', handleDrawEnd)
      signaturePad.off()
    }
  }, [])

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
      setIsEmpty(true)
    }
  }

  const handleSave = () => {
    if (!signaturePadRef.current || isEmpty) {
      alert('Please sign before saving')
      return
    }

    const dataUrl = signaturePadRef.current.toDataURL('image/png')
    if (onSave) {
      onSave(dataUrl)
    }
  }

  return (
    <div className="signature-capture-modal">
      <div className="signature-capture-content">
        <h2>{title}</h2>
        
        <div className="signature-pad-container">
          <canvas
            ref={canvasRef}
            className="signature-pad-canvas"
          />
        </div>

        <p className="signature-instructions">
          Sign in the box above using your mouse or touch
        </p>

        <div className="signature-buttons">
          <button
            onClick={handleClear}
            className="btn btn-secondary"
            disabled={isEmpty}
          >
            Clear
          </button>
          <button
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isEmpty}
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignatureCapture
