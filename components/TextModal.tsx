import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X } from 'lucide-react';

interface TextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
}

const TextModal: React.FC<TextModalProps> = ({ isOpen, onClose, title, text }) => {
  const { styles } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="text-modal-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl max-h-[85vh] flex flex-col ${styles.modal.bg} border ${styles.modal.border} rounded-xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between p-5 border-b ${styles.modal.border} flex-shrink-0`}>
          <div>
            <h2 id="text-modal-title" className={`text-xl font-semibold ${styles.modal.text}`}>
              {title}
            </h2>
            <p className={`mt-1 text-xs uppercase tracking-wide ${styles.modal.messageText}`}>
              Text Output Preview
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyText}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 ${styles.modal.cancelButton} ${styles.modal.text} ${styles.modal.focusRingOffset} ${styles.modal.cancelFocusRing}`}
              title="Copy text"
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full text-gray-400 hover:text-white hover:bg-black/40 transition-colors focus:outline-none focus:ring-2 ${styles.modal.focusRingOffset} focus:ring-red-500`}
              title="Close"
              aria-label="Close text modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto min-h-0 custom-scrollbar">
          <div className={`${styles.modal.text} text-sm leading-relaxed whitespace-pre-wrap font-mono`}>
            {text || 'No content available.'}
          </div>
        </div>

        <div className={`p-4 border-t ${styles.modal.border} flex justify-between text-xs ${styles.modal.messageText} flex-shrink-0`}>
          <span>{text.length} characters</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

export default TextModal;
