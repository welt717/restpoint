import { Rnd } from 'react-rnd'
import type { TemplateField } from '../../types'

interface FieldOverlayProps {
  field: TemplateField
  containerWidth: number
  containerHeight: number
  isSelected: boolean
  onSelect: (field: TemplateField) => void
  onMove: (update: TemplateField) => void
}

export const FieldOverlay = ({
  field,
  containerWidth,
  containerHeight,
  isSelected,
  onSelect,
  onMove,
}: FieldOverlayProps) => {
  if (!containerWidth || !containerHeight) return null

  const toPixels = (value: number, axis: 'width' | 'height') => {
    const base = axis === 'width' ? containerWidth : containerHeight
    return Math.max(30, value * base)
  }

  return (
    <Rnd
      size={{
        width: toPixels(field.width, 'width'),
        height: toPixels(field.height, 'height'),
      }}
      position={{
        x: Math.round(field.x * containerWidth),
        y: Math.round(field.y * containerHeight),
      }}
      bounds="parent"
      minWidth={40}
      minHeight={30}
      onDragStop={(_, data) => {
        const normalizedX = Math.min(Math.max(data.x / containerWidth, 0), 1)
        const normalizedY = Math.min(Math.max(data.y / containerHeight, 0), 1)
        onMove({ ...field, x: normalizedX, y: normalizedY })
      }}
      onResizeStop={(_, __, ref) => {
        const newWidth = ref.offsetWidth
        const newHeight = ref.offsetHeight
        const normalizedWidth = Math.min(Math.max(newWidth / containerWidth, 0.05), 1)
        const normalizedHeight = Math.min(Math.max(newHeight / containerHeight, 0.05), 1)
        const normalizedX = Math.min(Math.max(ref.offsetLeft / containerWidth, 0), 1)
        const normalizedY = Math.min(Math.max(ref.offsetTop / containerHeight, 0), 1)
        onMove({
          ...field,
          width: normalizedWidth,
          height: normalizedHeight,
          x: normalizedX,
          y: normalizedY,
        })
      }}
      onClick={() => onSelect(field)}
      className={`field-box ${isSelected ? 'field--selected' : ''} field--${field.type}`}
    >
      <div className="field-label">
        {field.name}
        <span className="field-type">{field.type}</span>
      </div>
    </Rnd>
  )
}
