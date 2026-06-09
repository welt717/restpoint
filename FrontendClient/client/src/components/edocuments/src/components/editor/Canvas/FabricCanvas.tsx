// Fabric Canvas Wrapper Component

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import type { CanvasField, CanvasState } from '../../types/index';
import './FabricCanvas.css';

interface FabricCanvasProps {
  onFieldsChange: (fields: CanvasField[]) => void;
  onStateChange: (state: CanvasState) => void;
  onSelectionChange: (selected: CanvasField | CanvasField[] | null) => void;
  pdfUrl?: string;
  initialState?: CanvasState;
}

export const FabricCanvas: React.FC<FabricCanvasProps> = ({
  onFieldsChange,
  onStateChange,
  onSelectionChange,
  pdfUrl,
  initialState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(100);
  const [gridSnap, setGridSnap] = useState(true);
  const gridSize = 10;

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1200,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
    });

    // Configure grid
    if (gridSnap) {
      enableGridSnap(fabricCanvas);
    }

    fabricCanvasRef.current = fabricCanvas;

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvas.getActiveObjects().length) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault();
            fabricCanvas.selectAll();
            break;
          case 'd':
            e.preventDefault();
            fabricCanvas.discardActiveObjects();
            fabricCanvas.renderAll();
            break;
        }
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        const activeObjects = fabricCanvas.getActiveObjects();
        fabricCanvas.remove(...activeObjects);
        fabricCanvas.renderAll();
        notifyChanges(fabricCanvas);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Object events
    fabricCanvas.on('object:modified', () => {
      notifyChanges(fabricCanvas);
    });

    fabricCanvas.on('object:added', () => {
      notifyChanges(fabricCanvas);
    });

    fabricCanvas.on('object:removed', () => {
      notifyChanges(fabricCanvas);
    });

    fabricCanvas.on('selection:created', (e) => {
      if (e.selected?.length === 1) {
        onSelectionChange(getFieldFromObject(e.selected[0]));
      } else if (e.selected?.length) {
        onSelectionChange(e.selected.map(getFieldFromObject));
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (e.selected?.length === 1) {
        onSelectionChange(getFieldFromObject(e.selected[0]));
      } else if (e.selected?.length) {
        onSelectionChange(e.selected.map(getFieldFromObject));
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectionChange(null);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      fabricCanvas.dispose();
    };
  }, [onSelectionChange]);

  // Load PDF background
  useEffect(() => {
    if (!pdfUrl || !fabricCanvasRef.current) return;

    // Implementation for PDF loading would go here
    // This is a placeholder - actual PDF loading handled separately
    console.log('Loading PDF:', pdfUrl);
  }, [pdfUrl]);

  // Zoom controls
  const handleZoom = (percent: number) => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.setZoom(percent / 100);
    setZoom(percent);
  };

  const zoomIn = () => handleZoom(Math.min(zoom + 25, 400));
  const zoomOut = () => handleZoom(Math.max(zoom - 25, 50));
  const fitToScreen = () => handleZoom(100);

  const toggleGridSnap = () => {
    if (!fabricCanvasRef.current) return;
    setGridSnap(!gridSnap);
    if (!gridSnap) {
      enableGridSnap(fabricCanvasRef.current);
    }
  };

  const addField = (field: CanvasField) => {
    if (!fabricCanvasRef.current) return;

    const fabricObject = createFabricObject(field);
    fabricCanvasRef.current.add(fabricObject);
    fabricCanvasRef.current.renderAll();
    notifyChanges(fabricCanvasRef.current);
  };

  const updateField = (field: CanvasField) => {
    if (!fabricCanvasRef.current) return;
    const obj = fabricCanvasRef.current.getObjects().find((o: any) => o.fieldId === field.id);
    if (obj) {
      Object.assign(obj, {
        left: field.x,
        top: field.y,
        width: field.width,
        height: field.height,
        angle: field.rotation,
        fill: field.fontColor,
        stroke: field.borderColor,
        strokeWidth: field.borderWidth,
        opacity: field.opacity,
      });
      fabricCanvasRef.current.renderAll();
    }
  };

  const removeField = (fieldId: string) => {
    if (!fabricCanvasRef.current) return;
    const obj = fabricCanvasRef.current.getObjects().find((o: any) => o.fieldId === fieldId);
    if (obj) {
      fabricCanvasRef.current.remove(obj);
      fabricCanvasRef.current.renderAll();
      notifyChanges(fabricCanvasRef.current);
    }
  };

  const getFields = (): CanvasField[] => {
    if (!fabricCanvasRef.current) return [];
    return fabricCanvasRef.current.getObjects().map(getFieldFromObject);
  };

  return (
    <div className="fabric-canvas-wrapper">
      <div className="canvas-toolbar">
        <button onClick={zoomOut} title="Zoom Out (Ctrl+-)" className="toolbar-btn">
          −
        </button>
        <span className="zoom-display">{zoom}%</span>
        <button onClick={zoomIn} title="Zoom In (Ctrl++)" className="toolbar-btn">
          +
        </button>
        <button onClick={fitToScreen} title="Fit to Screen" className="toolbar-btn">
          Fit
        </button>
        <div className="divider"></div>
        <button
          onClick={toggleGridSnap}
          className={`toolbar-btn ${gridSnap ? 'active' : ''}`}
          title="Toggle Snap to Grid"
        >
          Grid
        </button>
      </div>
      <canvas ref={canvasRef} className="fabric-canvas"></canvas>
    </div>
  );
};

// Helper functions
function createFabricObject(field: CanvasField): fabric.Object {
  const commonOptions = {
    left: field.x,
    top: field.y,
    width: field.width,
    height: field.height,
    angle: field.rotation,
    fill: field.fontColor,
    stroke: field.borderColor,
    strokeWidth: field.borderWidth,
    opacity: field.opacity,
    selectable: true,
    evented: true,
    objectCaching: false,
  } as any;

  commonOptions.fieldId = field.id;
  commonOptions.fieldType = field.type;
  commonOptions.fieldData = field;

  // Create appropriate object based on field type
  switch (field.type) {
    case 'text':
    case 'multiline':
      return new fabric.IText(field.placeholder || field.label, {
        ...commonOptions,
        fontSize: field.fontSize || 12,
        fontFamily: field.fontFamily || 'Arial',
        editable: true,
      });

    case 'checkbox':
    case 'radio':
      return new fabric.Rect({
        ...commonOptions,
        width: field.width,
        height: field.height,
        rx: field.type === 'radio' ? field.width / 2 : 0,
      });

    case 'image':
    case 'signature':
    case 'initials':
      return new fabric.Rect({
        ...commonOptions,
        fill: field.backgroundColor,
        stroke: field.borderColor,
        strokeWidth: field.borderWidth,
      });

    case 'qrcode':
    case 'barcode':
      return new fabric.Rect({
        ...commonOptions,
        fill: field.backgroundColor,
        stroke: field.borderColor,
      });

    default:
      return new fabric.Rect({
        ...commonOptions,
        width: field.width,
        height: field.height,
      });
  }
}

function getFieldFromObject(obj: any): CanvasField {
  return {
    id: obj.fieldId || `field-${Date.now()}`,
    type: obj.fieldType || 'text',
    label: obj.text || 'Field',
    required: false,
    readOnly: false,
    x: Math.round(obj.left || 0),
    y: Math.round(obj.top || 0),
    width: Math.round(obj.width || 100),
    height: Math.round(obj.height || 30),
    rotation: Math.round(obj.angle || 0),
    fontSize: obj.fontSize || 12,
    fontFamily: obj.fontFamily || 'Arial',
    fontColor: obj.fill || '#000000',
    backgroundColor: obj.backgroundColor || '#ffffff',
    borderColor: obj.stroke || '#cccccc',
    borderWidth: obj.strokeWidth || 1,
    opacity: obj.opacity || 1,
    locked: obj.selectable === false,
    grouped: false,
  };
}

function enableGridSnap(canvas: fabric.Canvas) {
  canvas.on('object:moving', (e) => {
    const gridSize = 10;
    if (!e.target) return;
    e.target.set({
      left: Math.round(e.target.left! / gridSize) * gridSize,
      top: Math.round(e.target.top! / gridSize) * gridSize,
    });
  });
}

function notifyChanges(canvas: fabric.Canvas) {
  // Notify parent of changes
  console.log('Canvas changed');
}

export default FabricCanvas;
