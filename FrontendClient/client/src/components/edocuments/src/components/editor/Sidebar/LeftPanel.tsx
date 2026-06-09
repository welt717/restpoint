// Left Sidebar - Draggable Field Controls

import React, { useState } from 'react';
import type { FieldType, CanvasField } from '../../types/index';
import FieldFactory from '../../utils/fieldFactory';
import './LeftPanel.css';

interface LeftPanelProps {
  onAddField: (field: CanvasField) => void;
  onClear?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ onAddField, onClear }) => {
  const [draggedType, setDraggedType] = useState<FieldType | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('basic');

  const fieldGroups = {
    basic: [
      { type: 'text' as FieldType, icon: 'T', label: 'Text Field' },
      { type: 'multiline' as FieldType, icon: '¶', label: 'Multiline' },
      { type: 'date' as FieldType, icon: '📅', label: 'Date' },
      { type: 'number' as FieldType, icon: '#', label: 'Number' },
    ],
    selection: [
      { type: 'dropdown' as FieldType, icon: '▼', label: 'Dropdown' },
      { type: 'checkbox' as FieldType, icon: '☑', label: 'Checkbox' },
      { type: 'radio' as FieldType, icon: '◉', label: 'Radio' },
    ],
    advanced: [
      { type: 'image' as FieldType, icon: '🖼', label: 'Image' },
      { type: 'qrcode' as FieldType, icon: '█', label: 'QR Code' },
      { type: 'barcode' as FieldType, icon: '|||', label: 'Barcode' },
    ],
    signature: [
      { type: 'signature' as FieldType, icon: '✍', label: 'Signature' },
      { type: 'initials' as FieldType, icon: '◻', label: 'Initials' },
    ],
  };

  const handleDragStart = (e: React.DragEvent, fieldType: FieldType) => {
    setDraggedType(fieldType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('fieldType', fieldType);
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? '' : sectionId);
  };

  const renderFieldGroup = (groupId: string, fields: any[]) => {
    const isExpanded = expandedSection === groupId;

    return (
      <div key={groupId} className="field-group">
        <button
          className="group-header"
          onClick={() => toggleSection(groupId)}
          aria-expanded={isExpanded}
        >
          <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="group-title">
            {groupId.charAt(0).toUpperCase() + groupId.slice(1)}
          </span>
        </button>

        {isExpanded && (
          <div className="group-fields">
            {fields.map((field) => (
              <div
                key={field.type}
                className={`field-item ${draggedType === field.type ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, field.type)}
                onDragEnd={handleDragEnd}
                title={`Drag to canvas: ${field.label}`}
              >
                <div className="field-icon">{field.icon}</div>
                <div className="field-label">{field.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h3>Fields</h3>
        <span className="field-count">{Object.values(fieldGroups).flat().length}</span>
      </div>

      <div className="panel-content">
        {Object.entries(fieldGroups).map(([groupId, fields]) =>
          renderFieldGroup(groupId, fields)
        )}
      </div>

      {onClear && (
        <div className="panel-footer">
          <button className="btn-clear" onClick={onClear} title="Clear all fields">
            Clear Canvas
          </button>
        </div>
      )}

      <div className="panel-help">
        <p className="help-text">
          💡 Drag fields onto the canvas to add them to your template.
        </p>
      </div>
    </div>
  );
};

export default LeftPanel;
