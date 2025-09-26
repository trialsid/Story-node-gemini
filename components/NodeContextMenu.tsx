import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Copy, RotateCcw, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NodeContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onDuplicate: () => void;
  onReset: () => void;
  onDelete: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ position, onClose, onDuplicate, onReset, onDelete }) => {
  const { styles } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState(position);

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
        onClick={onDelete}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-red-400 hover:text-red-200 ${styles.toolbar.buttonHoverBg} transition-colors`}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};

export default NodeContextMenu;
