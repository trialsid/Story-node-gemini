import React, { useEffect } from 'react';
import { GalleryItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { X } from 'lucide-react';

interface GalleryPreviewModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

const formatTimestamp = (timestamp: number | undefined) => {
  if (!timestamp) return 'Unknown';
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    console.warn('Failed to format timestamp', error);
    return 'Unknown';
  }
};

const GalleryPreviewModal: React.FC<GalleryPreviewModalProps> = ({ item, onClose }) => {
  const { styles } = useTheme();

  useEffect(() => {
    if (!item) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const { url, type, prompt, fileName, createdAt, nodeType, mimeType } = item;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gallery preview"
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-200`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] flex ${styles.modal.bg} border ${styles.modal.border} rounded-2xl shadow-2xl overflow-hidden`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full text-gray-300 hover:text-white hover:bg-black/40 transition"
          aria-label="Close gallery preview"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 bg-black/40 flex items-center justify-center p-4">
          {type === 'video' ? (
            <video
              src={url}
              controls
              autoPlay
              loop
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          ) : (
            <img
              src={url}
              alt={fileName}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          )}
        </div>
        <aside className={`w-72 border-l ${styles.modal.border} p-6 space-y-4 overflow-y-auto custom-scrollbar`}>
          <div>
            <h2 className="text-lg font-semibold">Details</h2>
            <p className="text-xs text-gray-400 mt-1">Information about this generation.</p>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Type</p>
              <p className="text-sm font-semibold text-gray-100 capitalize">{type}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-100">{formatTimestamp(createdAt)}</p>
            </div>
            {prompt && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Prompt</p>
                <p className="text-sm text-gray-100 whitespace-pre-wrap break-words">{prompt}</p>
              </div>
            )}
            {nodeType && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">Node</p>
                <p className="text-sm text-gray-100">{nodeType.replace(/_/g, ' ').toLowerCase()}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">File</p>
              <p className="text-sm text-gray-100 break-all">{fileName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">MIME</p>
              <p className="text-sm text-gray-100 break-all">{mimeType}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Link</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-300 hover:text-cyan-200 break-all"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GalleryPreviewModal;
