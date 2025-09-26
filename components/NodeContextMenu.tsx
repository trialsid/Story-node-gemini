import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Copy, RotateCcw, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NodeContextMenuProps {
  position: { x: number; y: number };
  nodeId: string;
  onClose: () => void;
  onDuplicate: () => void;
  onReset: () => void;
  onDeleteDirectly: (nodeId: string) => void;
  startWithDeleteConfirmation?: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ position, nodeId, onClose, onDuplicate, onReset, onDeleteDirectly, startWithDeleteConfirmation = false }) => {
  const { styles } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(startWithDeleteConfirmation);

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = () => {
    onDeleteDirectly(nodeId);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  useLayoutEffect(() => {
    if (!menuRef.current) {
      setMenuPosition(position);
      return;
    }

    const { width, height } = menuRef.current.getBoundingClientRect();
    const padding = 12;
    const adjustedX = Math.min(Math.max(padding, position.x), Math.max(padding, window.innerWidth - width - padding));
    const adjustedY = Math.min(Math.max(padding, position.y), Math.max(padding, window.innerHeight - height - padding));
    setMenuPosition({ x: adjustedX, y: adjustedY });
  }, [position]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      data-node-context-menu
      className={`fixed z-40 min-w-[180px] ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-md shadow-lg p-1`}
      style={{
        top: menuPosition.y,
        left: menuPosition.x,
      }}
      role="menu"
      aria-label="Node actions"
    >
      {!showDeleteConfirmation ? (
        <>
          <button
            type="button"
            onClick={onDuplicate}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded ${styles.toolbar.buttonHoverBg} transition-colors`}
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onReset}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded ${styles.toolbar.buttonHoverBg} transition-colors`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <div className="h-px bg-gray-500/20 my-1" aria-hidden="true" />
          <button
            type="button"
            onClick={handleDeleteClick}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-red-400 hover:text-red-200 ${styles.toolbar.buttonHoverBg} transition-colors`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </>
      ) : (
        <>
          <div className="px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Delete Node?</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleDeleteCancel}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded ${styles.toolbar.buttonHoverBg} transition-colors`}
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeContextMenu;
