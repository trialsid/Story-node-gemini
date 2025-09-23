import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CloseIcon from './icons/CloseIcon';
import SettingsIcon from './icons/SettingsIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { styles } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.modal.bg} rounded-lg shadow-2xl w-full max-w-2xl border ${styles.modal.border} flex flex-col overflow-hidden`}
        style={{ height: 'min(500px, 80vh)' }}
      >
        <header className={`flex items-center justify-between p-4 border-b ${styles.modal.border}`}>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6" />
            <h1 id="settings-title" className={`text-xl font-bold ${styles.modal.text}`}>Settings</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <main className="flex-grow p-6 flex items-center justify-center text-center">
            <div>
                <p className={`${styles.modal.messageText} text-lg`}>Settings will be available here soon.</p>
                <p className={`${styles.node.labelText} mt-2`}>Stay tuned for future updates!</p>
            </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsModal;