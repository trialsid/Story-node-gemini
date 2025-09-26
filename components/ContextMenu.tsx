import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { NodeMenuCategory } from '../utils/nodeMenuConfig';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  categories: NodeMenuCategory[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, position, categories, onClose }) => {
  const { styles } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Use timeout to prevent the same click event that opened the menu from closing it
    const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`absolute z-30 w-56 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg p-1`}
      style={{
        top: position.y,
        left: position.x,
      }}
      role="menu"
      aria-orientation="vertical"
    >
      {categories.map((category, categoryIndex) => (
        <div key={category.title}>
          <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400/80">
            {category.title}
          </div>
          {category.items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.action();
                onClose();
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium text-left`}
              role="menuitem"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          {categoryIndex < categories.length - 1 && (
            <div className="h-px bg-gray-500/20 my-1" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
