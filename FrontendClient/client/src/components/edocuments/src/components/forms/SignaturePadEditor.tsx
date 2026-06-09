import { useEffect, useRef } from 'react'
import SignaturePad from 'signature_pad'

interface SignaturePadEditorProps {
  value: string
  onChange: (value: string) => void
}

export const SignaturePadEditor = ({ value, onChange }: SignaturePadEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const context = canvas.getContext('2d')
      if (context) {
        context.scale(ratio, ratio)
      }
      padRef.current?.clear()
      if (value) {
        padRef.current?.fromDataURL(value)
      }
    }

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#1f2937',
      minWidth: 1,
      maxWidth: 2.5,
    })

    const handleStrokeEnd = () => {
      if (pad.isEmpty()) {
        onChange('')
        return
      }
      onChange(pad.toDataURL('image/png'))
    }

    const events: Array<{ name: string; listener: (event: Event) => void }> = [
      { name: 'pointerup', listener: handleStrokeEnd },
      { name: 'pointerleave', listener: handleStrokeEnd },
      { name: 'mouseup', listener: handleStrokeEnd },
      { name: 'touchend', listener: handleStrokeEnd },
    ]

    events.forEach(({ name, listener }) => canvas.addEventListener(name, listener))
    padRef.current = pad
    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    events.forEach(({ name, listener }) => canvas.removeEventListener(name, listener))
    padRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!padRef.current) return
    if (!value) {
      padRef.current.clear()
      return
    }
    padRef.current.fromDataURL(value)
  }, [value])

  const handleClear = () => {
    padRef.current?.clear()
    onChange('')
  }

  return (
    <div className="signature-editor">
      <canvas ref={canvasRef} className="signature-canvas" />
      <div className="signature-actions">
        <button type="button" onClick={handleClear}>
          Clear
        </button>
        {value && (
          <span className="signature-status">Saved</span>
        )}
      </div>
    </div>
  )
}
