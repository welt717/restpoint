// Custom Hook for Undo/Redo Management

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasState } from '../types/index';
import UndoRedoManager from '../utils/UndoRedoManager';

export const useUndoRedo = (initialState: CanvasState) => {
  const managerRef = useRef(new UndoRedoManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [state, setState] = useState<CanvasState>(initialState);

  // Subscribe to manager changes
  useEffect(() => {
    const unsubscribe = managerRef.current.subscribe((undo, redo) => {
      setCanUndo(undo);
      setCanRedo(redo);
    });
    return unsubscribe;
  }, []);

  const push = useCallback(
    (newState: CanvasState, action: string, description: string) => {
      setState(newState);
      managerRef.current.addEntry(newState, action as any, description);
    },
    []
  );

  const undo = useCallback(() => {
    const undoState = managerRef.current.undo();
    if (undoState) {
      setState(undoState);
    }
  }, []);

  const redo = useCallback(() => {
    const redoState = managerRef.current.redo();
    if (redoState) {
      setState(redoState);
    }
  }, []);

  const clear = useCallback(() => {
    managerRef.current.clear();
    setState(initialState);
  }, [initialState]);

  return {
    state,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    manager: managerRef.current,
  };
};

export default useUndoRedo;
