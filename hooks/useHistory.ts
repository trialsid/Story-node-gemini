import { useState, useCallback } from 'react';

const MAX_HISTORY_SIZE = 50;

interface HistoryState<T> {
  history: T[];
  currentIndex: number;
}

interface SetOptions {
  skipHistory?: boolean;
}

export const useHistory = <T>(initialState: T) => {
  const [historyState, setHistoryState] = useState<HistoryState<T>>({
    history: [initialState],
    currentIndex: 0,
  });

  const state = historyState.history[historyState.currentIndex];

  const set = useCallback((value: T | ((prevState: T) => T), options: SetOptions = {}) => {
    setHistoryState(prev => {
      const currentState = prev.history[prev.currentIndex];
      const newState = typeof value === 'function'
        ? (value as (prevState: T) => T)(currentState)
        : value;

      // Avoid spamming history when nothing changed.
      if (JSON.stringify(newState) === JSON.stringify(currentState)) {
        return prev;
      }

      if (options.skipHistory) {
        const newHistory = [...prev.history];
        newHistory[prev.currentIndex] = newState;
        return { ...prev, history: newHistory };
      }

      let newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(newState);

      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_SIZE);
      }

      const newIndex = newHistory.length - 1;
      return { history: newHistory, currentIndex: newIndex };
    });
  }, []);

  const undo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.currentIndex > 0) {
        return { ...prev, currentIndex: prev.currentIndex - 1 };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.currentIndex < prev.history.length - 1) {
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      }
      return prev;
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setHistoryState({ history: [newState], currentIndex: 0 });
  }, []);

  const canUndo = historyState.currentIndex > 0;
  const canRedo = historyState.currentIndex < historyState.history.length - 1;

  return { state, set, undo, redo, reset, canUndo, canRedo };
};
