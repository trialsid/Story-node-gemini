
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title, message }) => {
  const { styles, theme } = useTheme();
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onCancel}
    >
      <div
        className={`${styles.modal.bg} rounded-lg shadow-2xl p-6 w-full max-w-md border ${styles.modal.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirmation-title" className={`text-xl font-bold ${styles.modal.text} mb-4`}>{title}</h2>
        <p className={`${styles.modal.messageText} mb-6`}>{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className={`px-4 py-2 ${styles.modal.cancelButton} ${theme === 'modern' ? 'text-gray-800' : 'text-white'} font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} ${styles.modal.cancelFocusRing}`}
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} focus:ring-red-500`}
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
