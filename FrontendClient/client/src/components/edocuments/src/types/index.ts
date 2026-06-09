// Document Editor Types

export type FieldType =
  | 'text'
  | 'multiline'
  | 'date'
  | 'number'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'image'
  | 'qrcode'
  | 'barcode'
  | 'signature'
  | 'initials';

export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  readOnly: boolean;
  defaultValue?: string;
  placeholder?: string;
  validation?: ValidationRule;
  dataSource?: string;
}

export interface ValidationRule {
  type: 'email' | 'phone' | 'number' | 'date' | 'regex' | 'custom';
  pattern?: string;
  message?: string;
}

export interface CanvasField extends FieldDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  locked?: boolean;
  grouped?: boolean;
  groupId?: string;
}

export interface CanvasState {
  version: 1;
  pageCount: number;
  currentPage: number;
  fields: CanvasField[];
  pdf?: {
    url: string;
    pages: number;
  };
  metadata?: {
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface HistoryEntry {
  action: 'add' | 'delete' | 'move' | 'resize' | 'rotate' | 'property' | 'multi';
  timestamp: number;
  state: CanvasState;
  description: string;
}

export interface ClipboardData {
  fields: CanvasField[];
  offset: { x: number; y: number };
  timestamp: number;
}

export interface EditorPosition {
  x: number;
  y: number;
}

export interface SelectionBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}
