import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface HomeNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onDiscard: () => void | Promise<void>;
  isProcessing?: boolean;
  hasExistingProject: boolean;
}

const HomeNavigationModal: React.FC<HomeNavigationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  isProcessing = false,
  hasExistingProject,
}) => {
  const { styles, theme } = useTheme();

  if (!isOpen) {
    return null;
  }

  const primaryActionLabel = hasExistingProject ? 'Save' : 'Create Project & Save';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-navigation-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={() => {
        if (!isProcessing) {
          onClose();
        }
      }}
    >
      <div
        className={`${styles.modal.bg} rounded-lg shadow-2xl p-6 w-full max-w-md border ${styles.modal.border}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="home-navigation-title" className={`text-xl font-bold ${styles.modal.text} mb-4`}>
          Unsaved Changes
        </h2>
        <p className={`${styles.modal.messageText} mb-6`}>
          You have unsaved work. Would you like to save your changes before returning to the launcher?
        </p>
        {isProcessing && (
          <div className={`text-xs ${styles.modal.messageText} mb-4`}>Saving project…</div>
        )}
        <div className="flex flex-col space-y-3">
          <button
            onClick={onSave}
            disabled={isProcessing}
            className={`w-full px-4 py-2 ${styles.modal.saveButton} text-sm font-semibold rounded-md transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} ${styles.modal.saveFocusRing}`}
          >
            {primaryActionLabel}
          </button>
          <button
            onClick={onDiscard}
            disabled={isProcessing}
            className={`w-full px-4 py-2 ${styles.modal.discardButton} text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} ${styles.modal.discardFocusRing}`}
          >
            Don't Save
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`w-full px-4 py-2 ${styles.modal.cancelButton} ${theme === 'modern' ? 'text-gray-800' : 'text-white'} text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} ${styles.modal.cancelFocusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Keep Editing
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeNavigationModal;
