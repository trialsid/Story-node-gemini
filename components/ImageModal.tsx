
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const { styles } = useTheme();
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
      <img
        src={imageUrl}
        alt="Generated image full size"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        // Prevent closing modal when clicking on the image itself
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImageModal;
