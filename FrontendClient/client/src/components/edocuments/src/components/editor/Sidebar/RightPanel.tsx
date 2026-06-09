// Right Properties Panel - Field Properties Editor

import React, { useState, useEffect } from 'react';
import type { CanvasField } from '../../types/index';
import './RightPanel.css';

interface RightPanelProps {
  selectedField: CanvasField | CanvasField[] | null;
  onPropertyChange: (fieldId: string, property: string, value: any) => void;
  onDelete?: (fieldId: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedField,
  onPropertyChange,
  onDelete,
}) => {
  const [isMultiSelect, setIsMultiSelect] = useState(false);

  useEffect(() => {
    setIsMultiSelect(Array.isArray(selectedField));
  }, [selectedField]);

  if (!selectedField) {
    return (
      <div className="right-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>Select a field to edit properties</p>
        </div>
      </div>
    );
  }

  const field = isMultiSelect ? (selectedField as CanvasField[])[0] : (selectedField as CanvasField);
  const selectionCount = isMultiSelect ? (selectedField as CanvasField[]).length : 1;

  const handleChange = (property: string, value: any) => {
    if (isMultiSelect) {
      (selectedField as CanvasField[]).forEach((f) => {
        onPropertyChange(f.id, property, value);
      });
    } else {
      onPropertyChange(field.id, property, value);
    }
  };

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        {selectionCount > 1 && (
          <span className="selection-count">{selectionCount} selected</span>
        )}
      </div>

      <div className="panel-content">
        {/* Basic Properties */}
        <div className="property-group">
          <h4 className="group-title">Basic</h4>

          <div className="property-item">
            <label>Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="property-input"
              placeholder="Field label"
            />
          </div>

          <div className="property-item">
            <label>Type</label>
            <input
              type="text"
              value={field.type}
              disabled
              className="property-input"
              placeholder="Field type"
            />
          </div>

          <div className="property-item">
            <label>ID</label>
            <input
              type="text"
              value={field.id}
              disabled
              className="property-input text-monospace"
            />
          </div>
        </div>

        {/* Position & Size */}
        <div className="property-group">
          <h4 className="group-title">Position & Size</h4>

          <div className="property-row">
            <div className="property-item">
              <label>X</label>
              <input
                type="number"
                value={field.x}
                onChange={(e) => handleChange('x', parseInt(e.target.value))}
                className="property-input"
              />
            </div>
            <div className="property-item">
              <label>Y</label>
              <input
                type="number"
                value={field.y}
                onChange={(e) => handleChange('y', parseInt(e.target.value))}
                className="property-input"
              />
            </div>
          </div>

          <div className="property-row">
            <div className="property-item">
              <label>Width</label>
              <input
                type="number"
                value={field.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                className="property-input"
              />
            </div>
            <div className="property-item">
              <label>Height</label>
              <input
                type="number"
                value={field.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="property-input"
              />
            </div>
          </div>

          <div className="property-item">
            <label>Rotation (°)</label>
            <input
              type="number"
              value={field.rotation}
              onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
              min="0"
              max="360"
              className="property-input"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="property-group">
          <h4 className="group-title">Appearance</h4>

          <div className="property-row">
            <div className="property-item">
              <label>Font Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={field.fontColor || '#000000'}
                  onChange={(e) => handleChange('fontColor', e.target.value)}
                  className="color-picker"
                />
                <span className="color-value">{field.fontColor}</span>
              </div>
            </div>
            <div className="property-item">
              <label>Font Size</label>
              <input
                type="number"
                value={field.fontSize || 12}
                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                min="8"
                max="72"
                className="property-input"
              />
            </div>
          </div>

          <div className="property-item">
            <label>Font Family</label>
            <select
              value={field.fontFamily || 'Arial'}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              className="property-select"
            >
              <option>Arial</option>
              <option>Helvetica</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
              <option>Georgia</option>
              <option>Verdana</option>
            </select>
          </div>

          <div className="property-row">
            <div className="property-item">
              <label>Background</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={field.backgroundColor || '#ffffff'}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>
            <div className="property-item">
              <label>Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={(field.opacity || 1) * 100}
                onChange={(e) =>
                  handleChange('opacity', parseInt(e.target.value) / 100)
                }
                className="property-range"
              />
            </div>
          </div>
        </div>

        {/* Border */}
        <div className="property-group">
          <h4 className="group-title">Border</h4>

          <div className="property-row">
            <div className="property-item">
              <label>Color</label>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={field.borderColor || '#cccccc'}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>
            <div className="property-item">
              <label>Width (px)</label>
              <input
                type="number"
                value={field.borderWidth || 1}
                onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                min="0"
                max="10"
                className="property-input"
              />
            </div>
          </div>
        </div>

        {/* Field Settings */}
        <div className="property-group">
          <h4 className="group-title">Field Settings</h4>

          <div className="property-checkbox">
            <input
              type="checkbox"
              id="required"
              checked={field.required}
              onChange={(e) => handleChange('required', e.target.checked)}
            />
            <label htmlFor="required">Required field</label>
          </div>

          <div className="property-checkbox">
            <input
              type="checkbox"
              id="readonly"
              checked={field.readOnly}
              onChange={(e) => handleChange('readOnly', e.target.checked)}
            />
            <label htmlFor="readonly">Read-only</label>
          </div>

          <div className="property-checkbox">
            <input
              type="checkbox"
              id="locked"
              checked={field.locked || false}
              onChange={(e) => handleChange('locked', e.target.checked)}
            />
            <label htmlFor="locked">Lock position</label>
          </div>
        </div>

        {/* Default Value */}
        {field.defaultValue !== undefined && (
          <div className="property-group">
            <h4 className="group-title">Default Value</h4>
            <textarea
              value={field.defaultValue}
              onChange={(e) => handleChange('defaultValue', e.target.value)}
              className="property-textarea"
              placeholder="Enter default value"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Delete Button */}
      {onDelete && (
        <div className="panel-footer">
          <button
            className="btn-delete"
            onClick={() => {
              if (isMultiSelect) {
                (selectedField as CanvasField[]).forEach((f) => onDelete(f.id));
              } else {
                onDelete(field.id);
              }
            }}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default RightPanel;
