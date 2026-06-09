import { useEffect, useRef, useState } from 'react'
import * as fabricLib from 'fabric'
import type { TemplateField } from '../../types'
import './FabricCanvasEditor.css'

type FabricCanvas = fabricLib.Canvas

interface FabricCanvasEditorProps {
  onSave?: (canvas: FabricCanvas) => void
  onFieldAdded?: (field: TemplateField) => void
  readOnly?: boolean
}

export function FabricCanvasEditor({
  onSave,
  onFieldAdded,
  readOnly = false
}: FabricCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<FabricCanvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [tool, setTool] = useState<'pointer' | 'text' | 'rectangle' | 'circle' | 'line'>('pointer')

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabricLib.Canvas(canvasRef.current, {
      width: 800,
      height: 1000,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: !readOnly,
    })

    fabricCanvasRef.current = canvas

    canvas.on('object:added', (e: any) => {
      if (e.target && onFieldAdded && !readOnly) {
        const obj = e.target
        const field: TemplateField = {
          id: `field-${Date.now()}`,
          name: (obj as any).text || obj.type || 'object',
          type: 'text',
          page: 1,
          x: (obj.left || 0) / canvas.width,
          y: (obj.top || 0) / canvas.height,
          width: ((obj as any).width || 100) / canvas.width,
          height: ((obj as any).height || 30) / canvas.height,
        }
        onFieldAdded(field)
      }
    })

    canvas.on('selection:created', (e: any) => {
      if (!readOnly) {
        setSelectedObject(e.selected?.[0] || null)
      }
    })

    canvas.on('selection:updated', (e: any) => {
      if (!readOnly) {
        setSelectedObject(e.selected?.[0] || null)
      }
    })

    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    return () => {
      canvas.dispose()
    }
  }, [onFieldAdded, readOnly])

  const addText = () => {
    if (!fabricCanvasRef.current || readOnly) return
    const text = new fabricLib.Textbox('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 16,
      width: 200,
      editable: true,
      fill: '#000000',
    })
    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
  }

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    if (!fabricCanvasRef.current || readOnly) return
    let shape: fabricLib.Object

    if (shapeType === 'rectangle') {
      shape = new fabricLib.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 100,
        fill: 'rgba(100, 150, 255, 0.3)',
        stroke: '#3b82f6',
        strokeWidth: 2,
      })
    } else {
      shape = new fabricLib.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'rgba(100, 150, 255, 0.3)',
        stroke: '#3b82f6',
        strokeWidth: 2,
      })
    }

    fabricCanvasRef.current.add(shape)
    fabricCanvasRef.current.setActiveObject(shape)
    fabricCanvasRef.current.renderAll()
  }

  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject || readOnly) return
    fabricCanvasRef.current.remove(selectedObject)
    fabricCanvasRef.current.renderAll()
    setSelectedObject(null)
  }

  const exportCanvas = () => {
    if (!fabricCanvasRef.current) return
    return fabricCanvasRef.current.toJSON()
  }

  const saveTemplate = () => {
    if (!fabricCanvasRef.current || !onSave) return
    onSave(fabricCanvasRef.current)
  }

  return (
    <div className="fabric-editor-container">
      {!readOnly && (
        <div className="fabric-toolbar">
          <button
            onClick={() => setTool('pointer')}
            className={tool === 'pointer' ? 'active' : ''}
            title="Pointer (P)"
          >
            ➤
          </button>
          <button onClick={addText} title="Add Text (T)">
            T
          </button>
          <button
            onClick={() => addShape('rectangle')}
            title="Add Rectangle (R)"
          >
            ▭
          </button>
          <button
            onClick={() => addShape('circle')}
            title="Add Circle (C)"
          >
            ●
          </button>
          <div className="toolbar-divider" />
          <button
            onClick={deleteSelected}
            disabled={!selectedObject}
            title="Delete Selected (DEL)"
          >
            🗑
          </button>
          <button onClick={saveTemplate} title="Save Template">
            💾
          </button>
          <button
            onClick={() => {
              if (fabricCanvasRef.current) {
                const json = exportCanvas()
                console.log('Canvas JSON:', json)
                alert('Canvas exported to console')
              }
            }}
            title="Export JSON"
          >
            📋
          </button>
        </div>
      )}

      <div className="fabric-canvas-wrapper">
        <canvas ref={canvasRef} className="fabric-canvas" />
      </div>

      {selectedObject && !readOnly && (
        <div className="fabric-properties">
          <h4>Selected Element Properties</h4>
          <div className="prop-item">
            <label>Left (px):</label>
            <input
              type="number"
              value={Math.round(selectedObject.left || 0)}
              onChange={(e) => {
                if (selectedObject) {
                  selectedObject.set({ left: parseInt(e.target.value) })
                  fabricCanvasRef.current?.renderAll()
                }
              }}
            />
          </div>
          <div className="prop-item">
            <label>Top (px):</label>
            <input
              type="number"
              value={Math.round(selectedObject.top || 0)}
              onChange={(e) => {
                if (selectedObject) {
                  selectedObject.set({ top: parseInt(e.target.value) })
                  fabricCanvasRef.current?.renderAll()
                }
              }}
            />
          </div>
          <div className="prop-item">
            <label>Width (px):</label>
            <input
              type="number"
              value={Math.round((selectedObject as any).width || 100)}
              onChange={(e) => {
                if (selectedObject) {
                  selectedObject.set({ width: parseInt(e.target.value) })
                  fabricCanvasRef.current?.renderAll()
                }
              }}
            />
          </div>
          <div className="prop-item">
            <label>Height (px):</label>
            <input
              type="number"
              value={Math.round((selectedObject as any).height || 100)}
              onChange={(e) => {
                if (selectedObject) {
                  selectedObject.set({ height: parseInt(e.target.value) })
                  fabricCanvasRef.current?.renderAll()
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
