
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement>;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, returnFocusRef }) => {
  const { styles } = useTheme();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (imageUrl) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageUrl, onClose]);

  // Focus management: restore focus on close
  useEffect(() => {
    // Return focus to trigger element on unmount
    return () => {
      if (returnFocusRef?.current) {
        returnFocusRef.current.focus();
      }
    };
  }, [returnFocusRef]);

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full size image view"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm cursor-zoom-out transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div className="relative">
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close image viewer"
          className="absolute top-3 right-3 p-2 rounded-full text-gray-300 hover:text-white hover:bg-black/40 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 z-10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={imageUrl}
          alt="Generated image full size"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          // Prevent closing modal when clicking on the image itself
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageModal;
