// Main Document Editor Component

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FabricCanvas } from './Canvas/FabricCanvas';
import { LeftPanel } from './Sidebar/LeftPanel';
import { RightPanel } from './Sidebar/RightPanel';
import useUndoRedo from '../../hooks/useUndoRedo';
import useClipboard from '../../hooks/useClipboard';
import FieldFactory from '../../utils/fieldFactory';
import type { CanvasField, CanvasState } from '../../types/index';
import './DocumentEditor.css';

interface DocumentEditorProps {
  templateId?: string;
  onSave?: (state: CanvasState) => void;
  onClose?: () => void;
  initialState?: CanvasState;
}

const initialCanvasState: CanvasState = {
  version: 1,
  pageCount: 1,
  currentPage: 1,
  fields: [],
};

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  templateId,
  onSave,
  onClose,
  initialState,
}) => {
  const fabricCanvasRef = useRef<any>(null);
  const [fields, setFields] = useState<CanvasField[]>(initialState?.fields || []);
  const [selectedField, setSelectedField] = useState<CanvasField | CanvasField[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { state, push, undo, redo, canUndo, canRedo, clear: clearHistory } = useUndoRedo(
    initialState || initialCanvasState
  );
  const { copy, cut, paste, hasData, clear: clearClipboard } = useClipboard();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (canUndo) undo();
          break;
        case 'y':
          e.preventDefault();
          if (canRedo) redo();
          break;
        case 'c':
          e.preventDefault();
          if (Array.isArray(selectedField)) {
            copy(selectedField);
          } else if (selectedField) {
            copy([selectedField]);
          }
          break;
        case 'x':
          e.preventDefault();
          if (Array.isArray(selectedField)) {
            cut(selectedField);
            handleDeleteField((selectedField as CanvasField[])[0].id);
          } else if (selectedField) {
            cut([selectedField]);
            handleDeleteField(selectedField.id);
          }
          break;
        case 'v':
          e.preventDefault();
          if (hasData && fabricCanvasRef.current) {
            const pastedFields = paste(100, 100);
            pastedFields.forEach((f) => handleAddField(f));
          }
          break;
        case 'a':
          e.preventDefault();
          setSelectedField([...fields]);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, fields, canUndo, canRedo, hasData, undo, redo, copy, cut, paste]);

  const handleAddField = useCallback(
    (field: CanvasField) => {
      const newFields = [...fields, field];
      setFields(newFields);

      const newState: CanvasState = {
        ...state,
        fields: newFields,
      };
      push(newState, 'add', `Added ${field.type} field`);
    },
    [fields, state, push]
  );

  const handleDeleteField = useCallback(
    (fieldId: string) => {
      const newFields = fields.filter((f) => f.id !== fieldId);
      setFields(newFields);
      setSelectedField(null);

      const newState: CanvasState = {
        ...state,
        fields: newFields,
      };
      push(newState, 'delete', 'Deleted field');
    },
    [fields, state, push]
  );

  const handlePropertyChange = useCallback(
    (fieldId: string, property: string, value: any) => {
      const newFields = fields.map((f) =>
        f.id === fieldId ? { ...f, [property]: value } : f
      );
      setFields(newFields);

      const newState: CanvasState = {
        ...state,
        fields: newFields,
      };
      push(newState, 'property', `Updated ${property}`);

      // Update selection if it's the selected field
      if (selectedField && !Array.isArray(selectedField) && selectedField.id === fieldId) {
        setSelectedField({ ...selectedField, [property]: value });
      }
    },
    [fields, state, push, selectedField]
  );

  const handleCanvasFieldsChange = (newFields: CanvasField[]) => {
    setFields(newFields);
  };

  const handleCanvasStateChange = (newState: CanvasState) => {
    // Handle canvas state changes if needed
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvasState: CanvasState = {
        ...state,
        fields,
      };

      if (onSave) {
        await onSave(canvasState);
      }

      // Optionally show success message
      console.log('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      setFields([]);
      setSelectedField(null);
      clearHistory();
      clearClipboard();
    }
  };

  const handleExport = () => {
    const canvasState: CanvasState = {
      ...state,
      fields,
    };
    const json = JSON.stringify(canvasState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="document-editor">
      {/* Top Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <h2 className="editor-title">Document Template Editor</h2>
        </div>

        <div className="toolbar-middle">
          <button
            className="toolbar-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            className="toolbar-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            Redo ↷
          </button>
        </div>

        <div className="toolbar-right">
          <button
            className="toolbar-btn secondary"
            onClick={handleExport}
            title="Export template as JSON"
          >
            ↓ Export
          </button>
          <button
            className="toolbar-btn primary"
            onClick={handleSave}
            disabled={isSaving}
            title="Save template"
          >
            {isSaving ? 'Saving...' : '💾 Save'}
          </button>
          {onClose && (
            <button className="toolbar-btn" onClick={onClose} title="Close editor">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="editor-content">
        {/* Left Sidebar */}
        <LeftPanel onAddField={handleAddField} onClear={handleClear} />

        {/* Canvas Area */}
        <div className="editor-center">
          <FabricCanvas
            ref={fabricCanvasRef}
            onFieldsChange={handleCanvasFieldsChange}
            onStateChange={handleCanvasStateChange}
            onSelectionChange={setSelectedField}
            initialState={state}
          />
        </div>

        {/* Right Sidebar */}
        <RightPanel
          selectedField={selectedField}
          onPropertyChange={handlePropertyChange}
          onDelete={handleDeleteField}
        />
      </div>

      {/* Status Bar */}
      <div className="editor-statusbar">
        <div className="status-item">
          <span className="status-label">Fields:</span>
          <span className="status-value">{fields.length}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Selected:</span>
          <span className="status-value">
            {Array.isArray(selectedField)
              ? `${selectedField.length} fields`
              : selectedField
                ? '1 field'
                : 'None'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">History:</span>
          <span className="status-value">{canUndo ? '✓' : '—'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Clipboard:</span>
          <span className="status-value">{hasData ? '✓' : '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
