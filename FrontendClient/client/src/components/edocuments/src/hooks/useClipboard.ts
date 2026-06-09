// Custom Hook for Clipboard Management

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasField } from '../types/index';
import ClipboardManager from '../utils/ClipboardManager';

export const useClipboard = () => {
  const managerRef = useRef(new ClipboardManager());
  const [hasData, setHasData] = useState(false);

  // Subscribe to clipboard changes
  useEffect(() => {
    const unsubscribe = managerRef.current.subscribe((has) => {
      setHasData(has);
    });
    return unsubscribe;
  }, []);

  const copy = useCallback((fields: CanvasField[]) => {
    managerRef.current.copy(fields);
  }, []);

  const cut = useCallback((fields: CanvasField[]) => {
    return managerRef.current.cut(fields);
  }, []);

  const paste = useCallback((x: number, y: number): CanvasField[] => {
    return managerRef.current.paste(x, y);
  }, []);

  const clear = useCallback(() => {
    managerRef.current.clear();
  }, []);

  return {
    copy,
    cut,
    paste,
    clear,
    hasData,
    manager: managerRef.current,
  };
};

export default useClipboard;
