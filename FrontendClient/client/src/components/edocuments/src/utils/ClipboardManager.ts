// Clipboard Manager for Copy/Paste/Cut Operations

import type { CanvasField, ClipboardData } from '../types/index';

export class ClipboardManager {
  private clipboard: ClipboardData | null = null;
  private listeners: Array<(hasData: boolean) => void> = [];

  copy(fields: CanvasField[]): void {
    if (!fields.length) return;

    // Calculate bounds
    const xs = fields.map((f) => f.x);
    const ys = fields.map((f) => f.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    this.clipboard = {
      fields: JSON.parse(JSON.stringify(fields)), // Deep copy
      offset: { x: minX, y: minY },
      timestamp: Date.now(),
    };

    this.notifyListeners();
  }

  cut(fields: CanvasField[]): CanvasField[] {
    this.copy(fields);
    return fields; // Caller handles deletion
  }

  paste(pasteX: number, pasteY: number): CanvasField[] {
    if (!this.clipboard?.fields.length) return [];

    const offsetX = pasteX - this.clipboard.offset.x;
    const offsetY = pasteY - this.clipboard.offset.y;

    // Create new fields with updated positions and unique IDs
    return this.clipboard.fields.map((field) => ({
      ...JSON.parse(JSON.stringify(field)), // Deep copy
      id: this.generateId(),
      x: field.x + offsetX,
      y: field.y + offsetY,
    }));
  }

  hasData(): boolean {
    return this.clipboard?.fields.length ? true : false;
  }

  clear(): void {
    this.clipboard = null;
    this.notifyListeners();
  }

  getClipboardData(): ClipboardData | null {
    return this.clipboard;
  }

  // Subscribe to clipboard changes
  subscribe(listener: (hasData: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const hasData = this.hasData();
    this.listeners.forEach((listener) => listener(hasData));
  }

  private generateId(): string {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ClipboardManager;
