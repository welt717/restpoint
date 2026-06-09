// Undo/Redo History Manager

import type { CanvasState, HistoryEntry } from '../types/index';

export class UndoRedoManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxSize: number = 100; // Unlimited practical size
  private listeners: Array<(canUndo: boolean, canRedo: boolean) => void> = [];

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  addEntry(
    state: CanvasState,
    action: HistoryEntry['action'],
    description: string
  ): void {
    // Remove any entries after current index (if we've undone and now make a new change)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new entry
    this.history.push({
      action,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      description,
    });

    this.currentIndex++;

    // Keep history size manageable
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
      this.currentIndex = this.history.length - 1;
    }

    this.notifyListeners();
  }

  undo(): CanvasState | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    this.notifyListeners();
    return this.history[this.currentIndex]?.state || null;
  }

  redo(): CanvasState | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    this.notifyListeners();
    return this.history[this.currentIndex]?.state || null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners();
  }

  getCurrentState(): CanvasState | null {
    return this.history[this.currentIndex]?.state || null;
  }

  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  getHistorySize(): number {
    return this.history.length;
  }

  // Subscribe to history changes
  subscribe(listener: (canUndo: boolean, canRedo: boolean) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const canUndo = this.canUndo();
    const canRedo = this.canRedo();
    this.listeners.forEach((listener) => listener(canUndo, canRedo));
  }
}

export default UndoRedoManager;
