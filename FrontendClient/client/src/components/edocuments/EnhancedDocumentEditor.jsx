import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { 
  ArrowLeft, ArrowRight, RotateCcw, RotateCw, Save, X, 
  ZoomIn, ZoomOut, Type, Image, Square, Circle, Eraser,
  Menu, ChevronDown, ChevronUp, Download, Upload, Printer,
  Copy, Scissors, Layers, Grid, Maximize, Minimize,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Check, AlertCircle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './EnhancedDocumentEditor.css';

// API Configuration
const API_GATEWAY = process.env.REACT_APP_API_GATEWAY || 'http://localhost:5000';
const BASE_API = `${API_GATEWAY}/api/v1/restpoint`;

/**
 * Enterprise-Grade Document Editor
 * Features: Canvas editing, field mapping, real-time collaboration, version history
 */
const EnhancedDocumentEditor = ({ 
  documentId, 
  document,
  template,
  deceasedId,
  onSave, 
  onClose
}) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [selectedObject, setSelectedObject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState('select');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [fieldValues, setFieldValues] = useState({});
  const [showFieldsPanel, setShowFieldsPanel] = useState(true);
  const [fields, setFields] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(document?.title || 'Untitled Document');
  const [isConnected, setIsConnected] = useState(true);
  const [collaborators, setCollaborators] = useState([]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1200,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      enableRetinaScaling: true,
      selection: true,
      renderOnAddRemove: true
    });

    // Load template canvas state if available
    if (document?.canvas_state) {
      fabricCanvas.loadFromJSON(document.canvas_state, () => {
        fabricCanvas.renderAll();
        saveHistory(fabricCanvas);
      });
    }

    // Load template if no document state
    if (!document?.canvas_state && template?.template_json) {
      fabricCanvas.loadFromJSON(template.template_json, () => {
        fabricCanvas.renderAll();
        saveHistory(fabricCanvas);
      });
    }

    // Event listeners
    fabricCanvas.on('object:added', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:modified', () => saveHistory(fabricCanvas));
    fabricCanvas.on('object:removed', () => saveHistory(fabricCanvas));
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected[0]);
      setActiveTool('select');
      setShowProperties(true);
    });
    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected[0]);
      setShowProperties(true);
    });
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
      setShowProperties(false);
    });

    // Handle drawing mode
    fabricCanvas.on('mouse:down', (e) => {
      if (activeTool === 'draw') {
        fabricCanvas.isDrawing = true;
      }
    });

    fabricCanvas.on('mouse:move', (e) => {
      if (!fabricCanvas.isDrawing || activeTool !== 'draw') return;
      const pointer = fabricCanvas.getPointer(e.e);
      const points = [pointer.x, pointer.y, pointer.x, pointer.y];
      
      if (fabricCanvas._currentLine) {
        const line = fabricCanvas._currentLine;
        line.set({ x2: pointer.x, y2: pointer.y });
        fabricCanvas.renderAll();
      } else {
        const line = new fabric.Line(points, {
          stroke: brushColor,
          strokeWidth: brushSize,
          selectable: false,
          evented: false,
          strokeLineCap: 'round'
        });
        fabricCanvas.add(line);
        fabricCanvas._currentLine = line;
      }
    });

    fabricCanvas.on('mouse:up', () => {
      if (fabricCanvas._currentLine) {
        fabricCanvas._currentLine.set({ selectable: false, evented: false });
        fabricCanvas._currentLine = null;
        saveHistory(fabricCanvas);
      }
      fabricCanvas.isDrawing = false;
    });

    setCanvas(fabricCanvas);

    // Load document fields
    if (document?.fields) {
      const fieldMap = {};
      document.fields.forEach(f => {
        fieldMap[f.field_key] = f.field_value || '';
      });
      setFieldValues(fieldMap);
      setFields(document.fields);
    }

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            handleSaveDocument();
            break;
          case 'd':
            e.preventDefault();
            toggleGrid();
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        }
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObject && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          handleDelete();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      fabricCanvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Save to history
  const saveHistory = useCallback((c) => {
    const json = c.toJSON();
    setHistory(prev => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep(prev => prev + 1);
  }, [historyStep]);

  // Undo
  const handleUndo = () => {
    if (!canvas || historyStep <= 0) return;
    const newStep = historyStep - 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
    });
    setHistoryStep(newStep);
    toast.info('Undo');
  };

  // Redo
  const handleRedo = () => {
    if (!canvas || historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    canvas.loadFromJSON(history[newStep], () => {
      canvas.renderAll();
    });
    setHistoryStep(newStep);
    toast.info('Redo');
  };

  // Add text
  const addText = (text = 'Text') => {
    if (!canvas) return;
    const fabricText = new fabric.IText(text, {
      left: 100,
      top: 100,
      fontSize: 16,
      fill: '#000000',
      fontFamily: 'Arial',
      editable: true
    });
    canvas.add(fabricText);
    canvas.setActiveObject(fabricText);
    canvas.renderAll();
    saveHistory(canvas);
    toast.success('Text added');
  };

  // Add field
  const addField = (fieldKey = '', fieldLabel = '') => {
    if (!canvas) return;
    const fabricText = new fabric.IText(fieldLabel || `[${fieldKey}]`, {
      left: 100,
      top: 100,
      fontSize: 14,
      fill: '#0066cc',
      fontFamily: 'Arial',
      fontStyle: 'italic',
      editable: true
    });
    fabricText.fieldKey = fieldKey;
    fabricText.isField = true;
    canvas.add(fabricText);
    canvas.setActiveObject(fabricText);
    canvas.renderAll();
    saveHistory(canvas);
    toast.success('Field added');
  };

  // Upload image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        const scale = Math.min(200 / img.width, 200 / img.height);
        img.set({ 
          left: 100, 
          top: 100, 
          scaleX: scale, 
          scaleY: scale,
          cornerStyle: 'circle',
          cornerColor: '#3b82f6',
          cornerStrokeColor: '#2563eb',
          transparentCorners: false
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveHistory(canvas);
        toast.success('Image added');
      });
    };
    reader.readAsDataURL(file);
  };

  // Add shape
  const addShape = (type) => {
    if (!canvas) return;
    let shape;
    
    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 100, top: 100, width: 150, height: 100,
        fill: '#e0e0e0', stroke: '#333', strokeWidth: 2,
        cornerStyle: 'circle',
        cornerColor: '#3b82f6',
        transparentCorners: false
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100, top: 100, radius: 50,
        fill: '#e0e0e0', stroke: '#333', strokeWidth: 2,
        cornerStyle: 'circle',
        cornerColor: '#3b82f6',
        transparentCorners: false
      });
    } else if (type === 'triangle') {
      shape = new fabric.Triangle({
        left: 100, top: 100, width: 100, height: 100,
        fill: '#e0e0e0', stroke: '#333', strokeWidth: 2,
        cornerStyle: 'circle',
        cornerColor: '#3b82f6',
        transparentCorners: false
      });
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveHistory(canvas);
      toast.success('Shape added');
    }
  };

  // Delete selected
  const handleDelete = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
    setShowProperties(false);
    canvas.renderAll();
    saveHistory(canvas);
    toast.info('Object deleted');
  };

  // Duplicate selected
  const handleDuplicate = () => {
    if (!canvas || !selectedObject) return;
    selectedObject.clone((cloned) => {
      cloned.set({
        left: selectedObject.left + 20,
        top: selectedObject.top + 20
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveHistory(canvas);
      toast.success('Object duplicated');
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom * 1.1, 300);
    setZoom(Math.round(newZoom));
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom / 1.1, 25);
    setZoom(Math.round(newZoom));
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  };

  const handleZoomReset = () => {
    if (!canvas) return;
    setZoom(100);
    canvas.setZoom(1);
    canvas.renderAll();
  };

  // Toggle grid
  const toggleGrid = () => {
    setShowGrid(!showGrid);
    if (canvas) {
      // Simple grid implementation
      if (!showGrid) {
        const gridSize = 20;
        const gridColor = '#f0f0f0';
        
        // Remove existing grid
        const existingGrid = canvas.getObjects().filter(obj => obj.isGrid);
        existingGrid.forEach(obj => canvas.remove(obj));
        
        // Add new grid
        for (let i = 0; i < canvas.width / gridSize; i++) {
          const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvas.height], {
            stroke: gridColor,
            strokeWidth: 1,
            selectable: false,
            evented: false,
            isGrid: true
          });
          canvas.add(line);
        }
        for (let i = 0; i < canvas.height / gridSize; i++) {
          const line = new fabric.Line([0, i * gridSize, canvas.width, i * gridSize], {
            stroke: gridColor,
            strokeWidth: 1,
            selectable: false,
            evented: false,
            isGrid: true
          });
          canvas.add(line);
        }
        canvas.sendToBack(canvas.getObjects().find(obj => obj.isGrid));
      } else {
        const existingGrid = canvas.getObjects().filter(obj => obj.isGrid);
        existingGrid.forEach(obj => canvas.remove(obj));
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Export document
  const handleExport = (format) => {
    if (!canvas) return;
    
    if (format === 'png') {
      const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
      const link = document.createElement('a');
      link.download = `${documentTitle}.png`;
      link.href = dataURL;
      link.click();
      toast.success('Exported as PNG');
    } else if (format === 'jpeg') {
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.9 });
      const link = document.createElement('a');
      link.download = `${documentTitle}.jpg`;
      link.href = dataURL;
      link.click();
      toast.success('Exported as JPEG');
    } else if (format === 'json') {
      const json = JSON.stringify(canvas.toJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = `${documentTitle}.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success('Exported as JSON');
    }
  };

  // Print document
  const handlePrint = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Print Document</title></head>
        <body style="margin:0;">
          <img src="${dataURL}" style="width:100%;" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.info('Opening print dialog...');
  };

  // Autofill fields
  const autofillFields = () => {
    if (!canvas) return;
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.isField && obj.fieldKey && fieldValues[obj.fieldKey]) {
        obj.set({ text: fieldValues[obj.fieldKey] });
      }
    });
    canvas.renderAll();
    saveHistory(canvas);
    toast.success('Fields auto-filled');
  };

  // Save document
  const handleSaveDocument = async () => {
    if (!canvas) return;

    setIsSaving(true);
    try {
      const canvasJSON = canvas.toJSON();
      
      const payload = {
        canvas_state: canvasJSON,
        content: JSON.stringify(canvasJSON),
        fields: fieldValues,
        title: documentTitle,
        reason: 'Edited from document editor'
      };

      if (onSave) {
        await onSave(documentId, payload);
      }

      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  // Update selected object
  const updateObject = (property, value) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set({ [property]: value });
    canvas.renderAll();
  };

  // Quick actions
  const quickActions = [
    { icon: <Undo2 size={16} />, label: 'Undo', action: handleUndo, shortcut: 'Ctrl+Z' },
    { icon: <Redo2 size={16} />, label: 'Redo', action: handleRedo, shortcut: 'Ctrl+Y' },
    { icon: <RotateCcw size={16} />, label: 'Rotate Left', action: () => {
      if (selectedObject) {
        selectedObject.rotate((selectedObject.angle || 0) - 15);
        canvas.renderAll();
        saveHistory(canvas);
      }
    }},
    { icon: <RotateCw size={16} />, label: 'Rotate Right', action: () => {
      if (selectedObject) {
        selectedObject.rotate((selectedObject.angle || 0) + 15);
        canvas.renderAll();
        saveHistory(canvas);
      }
    }},
    { icon: <Copy size={16} />, label: 'Duplicate', action: handleDuplicate, shortcut: 'Ctrl+D' },
    { icon: <Scissors size={16} />, label: 'Delete', action: handleDelete, shortcut: 'Del' },
    { icon: <Grid size={16} />, label: 'Toggle Grid', action: toggleGrid, shortcut: 'Ctrl+G' },
    { icon: <Maximize size={16} />, label: 'Fullscreen', action: toggleFullscreen, shortcut: 'F11' },
    { icon: <Download size={16} />, label: 'Export PNG', action: () => handleExport('png') },
    { icon: <Download size={16} />, label: 'Export JPEG', action: () => handleExport('jpeg') },
    { icon: <Download size={16} />, label: 'Export JSON', action: () => handleExport('json') },
    { icon: <Printer size={16} />, label: 'Print', action: handlePrint, shortcut: 'Ctrl+P' },
  ];

  return (
    <div className={`enhanced-editor-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <button onClick={onClose} className="btn-icon" title="Close">
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className="document-title-input"
            placeholder="Document Title"
          />
        </div>
        
        <div className="header-center">
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          {collaborators.length > 0 && (
            <div className="collaborators">
              {collaborators.map((c, i) => (
                <span key={i} className="collaborator-avatar" title={c.name}>
                  {c.name[0]}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="zoom-controls">
            <button onClick={handleZoomOut} className="btn-icon" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-indicator">{zoom}%</span>
            <button onClick={handleZoomIn} className="btn-icon" title="Zoom In">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleZoomReset} className="btn-icon" title="Reset Zoom">
              <Minimize size={16} />
            </button>
          </div>
          
          <div className="history-controls">
            <button onClick={handleUndo} disabled={historyStep <= 0} className="btn-icon" title="Undo (Ctrl+Z)">
              <Undo2 size={16} />
            </button>
            <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="btn-icon" title="Redo (Ctrl+Y)">
              <Redo2 size={16} />
            </button>
          </div>
          
          <div className="quick-actions-menu">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="btn-icon"
              title="Quick Actions"
            >
              <Menu size={18} />
            </button>
            {showQuickActions && (
              <div className="quick-actions-dropdown">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    className="quick-action-item"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                    {action.shortcut && <span className="shortcut">{action.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button onClick={handleSaveDocument} disabled={isSaving} className="btn btn-primary">
            {isSaving ? 'Saving...' : <><Save size={16} /> Save</>}
          </button>
          
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Left Toolbar */}
        <div className="editor-toolbar">
          <div className="tool-group">
            <h4>Tools</h4>
            <button 
              onClick={() => setActiveTool('select')}
              className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
              title="Select (V)"
            >
              <ArrowLeft size={18} />
            </button>
            <button 
              onClick={() => setActiveTool('draw')}
              className={`tool-btn ${activeTool === 'draw' ? 'active' : ''}`}
              title="Draw (P)"
            >
              <Eraser size={18} />
            </button>
          </div>

          <div className="tool-group">
            <h4>Add</h4>
            <button onClick={() => addText('Text')} className="tool-btn" title="Add Text">
              <Type size={18} />
            </button>
            <button onClick={() => addShape('rectangle')} className="tool-btn" title="Add Rectangle">
              <Square size={18} />
            </button>
            <button onClick={() => addShape('circle')} className="tool-btn" title="Add Circle">
              <Circle size={18} />
            </button>
            <label className="tool-btn" title="Add Image">
              <Image size={18} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="tool-group">
            <h4>Style</h4>
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)}
              className="color-picker"
              title="Color"
            />
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushSize} 
              onChange={(e) => setBrushSize(e.target.value)}
              className="size-slider"
              title="Brush Size"
            />
          </div>

          <div className="tool-group">
            <h4>View</h4>
            <button 
              onClick={toggleGrid}
              className={`tool-btn ${showGrid ? 'active' : ''}`}
              title="Toggle Grid (Ctrl+G)"
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="tool-btn"
              title="Fullscreen (F11)"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-area">
          <canvas ref={canvasRef} className="fabric-canvas" />
        </div>

        {/* Right Panel - Fields */}
        <div className={`fields-panel ${showFieldsPanel ? 'open' : ''}`}>
          <div className="fields-header" onClick={() => setShowFieldsPanel(!showFieldsPanel)}>
            <h4>📋 Document Fields</h4>
            {showFieldsPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {showFieldsPanel && (
            <div className="fields-content">
              {fields.length === 0 ? (
                <p className="no-fields">No fields in this document</p>
              ) : (
                fields.map(field => (
                  <div key={field.id} className="field-item">
                    <label>{field.field_label || field.field_key}</label>
                    {field.field_type === 'select' ? (
                      <select 
                        value={fieldValues[field.field_key] || ''}
                        onChange={(e) => setFieldValues({
                          ...fieldValues,
                          [field.field_key]: e.target.value
                        })}
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.field_type === 'textarea' ? (
                      <textarea 
                        value={fieldValues[field.field_key] || ''}
                        onChange={(e) => setFieldValues({
                          ...fieldValues,
                          [field.field_key]: e.target.value
                        })}
                        rows="3"
                      />
                    ) : (
                      <input 
                        type={field.field_type || 'text'}
                        value={fieldValues[field.field_key] || ''}
                        onChange={(e) => setFieldValues({
                          ...fieldValues,
                          [field.field_key]: e.target.value
                        })}
                        placeholder={field.placeholder || `Enter ${field.field_label}`}
                      />
                    )}
                  </div>
                ))
              )}
              <button onClick={autofillFields} className="btn btn-secondary w-full">
                🔄 Auto-fill Fields
              </button>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {showProperties && selectedObject && (
          <div className="properties-panel">
            <div className="properties-header">
              <h4>Object Properties</h4>
              <button onClick={() => setShowProperties(false)} className="btn-icon">
                <X size={14} />
              </button>
            </div>
            
            <div className="property-item">
              <label>Fill Color:</label>
              <input 
                type="color" 
                value={selectedObject.fill || '#000000'}
                onChange={(e) => updateObject('fill', e.target.value)}
              />
            </div>

            <div className="property-item">
              <label>Stroke Color:</label>
              <input 
                type="color" 
                value={selectedObject.stroke || '#000000'}
                onChange={(e) => updateObject('stroke', e.target.value)}
              />
            </div>

            <div className="property-item">
              <label>Opacity:</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={selectedObject.opacity || 1}
                onChange={(e) => updateObject('opacity', parseFloat(e.target.value))}
              />
              <span>{Math.round((selectedObject.opacity || 1) * 100)}%</span>
            </div>

            <div className="property-item">
              <label>Angle:</label>
              <input 
                type="range" 
                min="0" 
                max="360" 
                value={selectedObject.angle || 0}
                onChange={(e) => updateObject('angle', parseFloat(e.target.value))}
              />
              <span>{Math.round(selectedObject.angle || 0)}°</span>
            </div>

            {selectedObject.type === 'i-text' && (
              <>
                <div className="property-item">
                  <label>Font Size:</label>
                  <input 
                    type="number" 
                    value={selectedObject.fontSize || 14}
                    onChange={(e) => updateObject('fontSize', parseFloat(e.target.value))}
                  />
                </div>
                <div className="property-item">
                  <label>Font Family:</label>
                  <select 
                    value={selectedObject.fontFamily || 'Arial'}
                    onChange={(e) => updateObject('fontFamily', e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                <div className="property-item">
                  <label>Text Align:</label>
                  <div className="align-buttons">
                    <button 
                      onClick={() => updateObject('textAlign', 'left')}
                      className={selectedObject.textAlign === 'left' ? 'active' : ''}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button 
                      onClick={() => updateObject('textAlign', 'center')}
                      className={selectedObject.textAlign === 'center' ? 'active' : ''}
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button 
                      onClick={() => updateObject('textAlign', 'right')}
                      className={selectedObject.textAlign === 'right' ? 'active' : ''}
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>
                <div className="property-item">
                  <label>Style:</label>
                  <div className="style-buttons">
                    <button 
                      onClick={() => updateObject('fontWeight', selectedObject.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={selectedObject.fontWeight === 'bold' ? 'active' : ''}
                    >
                      <Bold size={14} />
                    </button>
                    <button 
                      onClick={() => updateObject('fontStyle', selectedObject.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className={selectedObject.fontStyle === 'italic' ? 'active' : ''}
                    >
                      <Italic size={14} />
                    </button>
                    <button 
                      onClick={() => updateObject('underline', !selectedObject.underline)}
                      className={selectedObject.underline ? 'active' : ''}
                    >
                      <Underline size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="editor-statusbar">
        <div className="status-left">
          <span>Objects: {canvas ? canvas.getObjects().length : 0}</span>
          <span>|</span>
          <span>History: {historyStep + 1}/{history.length}</span>
        </div>
        <div className="status-right">
          <span>Canvas: 800 × 1200</span>
          <span>|</span>
          <span>Ctrl+S to save, Ctrl+Z to undo, Del to delete</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDocumentEditor;