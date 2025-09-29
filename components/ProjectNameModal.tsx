import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ProjectNameModalProps {
  isOpen: boolean;
  title: string;
  label?: string;
  initialValue?: string;
  confirmText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const ProjectNameModal: React.FC<ProjectNameModalProps> = ({
  isOpen,
  title,
  label = 'Project Name',
  initialValue = '',
  confirmText = 'Save',
  onConfirm,
  onCancel,
}) => {
  const { styles, theme } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setTouched(false);
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  const trimmed = value.trim();
  const showError = touched && trimmed.length === 0;

  const handleSubmit = () => {
    if (trimmed.length === 0) {
      setTouched(true);
      return;
    }
    onConfirm(trimmed);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-name-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onCancel}
    >
      <div
        className={`relative w-full max-w-md ${styles.modal.bg} border ${styles.modal.border} rounded-xl shadow-2xl p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="project-name-modal-title" className={`text-xl font-semibold ${styles.modal.text} mb-4`}>
          {title}
        </h2>
        <label htmlFor="project-name-input" className={`block text-sm font-medium mb-2 ${styles.modal.text}`}>
          {label}
        </label>
        <input
          id="project-name-input"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${showError ? 'border-red-500' : styles.modal.border} ${theme === 'modern' ? 'bg-white text-gray-900' : 'bg-black/20 text-white'}`}
          placeholder="Enter project name"
        />
        {showError && (
          <p className="mt-2 text-sm text-red-400">Name is required.</p>
        )}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${styles.modal.cancelButton}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md font-medium transition-colors bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={trimmed.length === 0}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectNameModal;
