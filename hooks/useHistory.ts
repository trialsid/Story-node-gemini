import { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 50;

export const useHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const set = useCallback((value: T | ((prevState: T) => T)) => {
    const newState = typeof value === 'function' ? (value as (prevState: T) => T)(state) : value;

    // Don't add to history if state is unchanged. A simple stringify is good enough here.
    if (JSON.stringify(newState) === JSON.stringify(state)) {
      return;
    }

    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift(); // remove the oldest entry
    }
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history, state]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);
  
  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state, set, undo, redo, reset, canUndo, canRedo };
};
